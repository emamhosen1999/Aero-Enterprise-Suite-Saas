"""
Fine-tune LLM on Aero codebase
Supports LoRA, quantization, and distributed training
"""

import torch
from transformers import (
    AutoModelForCausalLM,
    AutoTokenizer,
    TrainingArguments,
    Trainer,
    DataCollatorForLanguageModeling
)
from datasets import load_dataset
from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training
import argparse
import logging
from pathlib import Path
import json

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def load_config(config_path: str = 'config.yaml'):
    """Load training configuration"""
    import yaml
    
    if Path(config_path).exists():
        with open(config_path) as f:
            return yaml.safe_load(f)
    
    # Default config
    return {
        'base_model': {
            'name': 'meta-llama/Llama-2-7b-chat-hf',
        },
        'training': {
            'num_epochs': 3,
            'batch_size': 4,
            'gradient_accumulation_steps': 4,
            'learning_rate': 2e-4,
            'max_seq_length': 2048,
        },
        'lora': {
            'enabled': True,
            'r': 16,
            'alpha': 32,
            'dropout': 0.05,
        }
    }

def prepare_model_and_tokenizer(args, config):
    """Load and prepare model"""
    logger.info(f"Loading model: {args.base_model}")
    
    # Load tokenizer
    tokenizer = AutoTokenizer.from_pretrained(args.base_model)
    tokenizer.pad_token = tokenizer.eos_token
    tokenizer.padding_side = "right"
    
    # Load model
    model_kwargs = {
        'pretrained_model_name_or_path': args.base_model,
        'torch_dtype': torch.float16 if torch.cuda.is_available() else torch.float32,
        'device_map': 'auto' if torch.cuda.is_available() else None,
    }
    
    if args.load_in_8bit:
        model_kwargs['load_in_8bit'] = True
    elif args.load_in_4bit:
        model_kwargs['load_in_4bit'] = True
    
    model = AutoModelForCausalLM.from_pretrained(**model_kwargs)
    
    # Enable gradient checkpointing
    if args.gradient_checkpointing:
        model.gradient_checkpointing_enable()
    
    # Apply LoRA
    if args.use_lora:
        logger.info("Applying LoRA configuration")
        
        if args.load_in_8bit or args.load_in_4bit:
            model = prepare_model_for_kbit_training(model)
        
        lora_config = LoraConfig(
            r=config['lora'].get('r', 16),
            lora_alpha=config['lora'].get('alpha', 32),
            target_modules=["q_proj", "v_proj"],
            lora_dropout=config['lora'].get('dropout', 0.05),
            bias="none",
            task_type="CAUSAL_LM"
        )
        
        model = get_peft_model(model, lora_config)
        model.print_trainable_parameters()
    
    return model, tokenizer

def load_and_tokenize_dataset(args, tokenizer):
    """Load and tokenize dataset"""
    logger.info(f"Loading dataset from {args.dataset}")
    
    # Load dataset
    dataset = load_dataset('json', data_files=args.dataset, split='train')
    
    def tokenize_function(examples):
        # Format: instruction + input + output
        texts = []
        for i in range(len(examples['instruction'])):
            instruction = examples['instruction'][i]
            input_text = examples.get('input', [''] * len(examples['instruction']))[i]
            output = examples['output'][i]
            
            # Alpaca format
            if input_text:
                text = f"### Instruction:\n{instruction}\n\n### Input:\n{input_text}\n\n### Response:\n{output}"
            else:
                text = f"### Instruction:\n{instruction}\n\n### Response:\n{output}"
            
            texts.append(text)
        
        return tokenizer(
            texts,
            truncation=True,
            max_length=args.max_seq_length,
            padding='max_length',
        )
    
    tokenized_dataset = dataset.map(
        tokenize_function,
        batched=True,
        remove_columns=dataset.column_names,
        desc="Tokenizing dataset"
    )
    
    return tokenized_dataset

def main():
    parser = argparse.ArgumentParser(description='Fine-tune LLM on Aero codebase')
    
    # Model arguments
    parser.add_argument('--base-model', required=True, help='Base model name or path')
    parser.add_argument('--dataset', required=True, help='Training dataset (JSONL)')
    parser.add_argument('--output-dir', required=True, help='Output directory')
    
    # Training arguments
    parser.add_argument('--epochs', type=int, default=3, help='Number of epochs')
    parser.add_argument('--batch-size', type=int, default=4, help='Batch size')
    parser.add_argument('--learning-rate', type=float, default=2e-4, help='Learning rate')
    parser.add_argument('--max-seq-length', type=int, default=2048, help='Max sequence length')
    parser.add_argument('--gradient-accumulation-steps', type=int, default=4)
    
    # Optimization arguments
    parser.add_argument('--use-lora', action='store_true', help='Use LoRA')
    parser.add_argument('--lora-r', type=int, default=16)
    parser.add_argument('--lora-alpha', type=int, default=32)
    parser.add_argument('--load-in-8bit', action='store_true')
    parser.add_argument('--load-in-4bit', action='store_true')
    parser.add_argument('--gradient-checkpointing', action='store_true')
    
    # Other
    parser.add_argument('--distributed', action='store_true', help='Use distributed training')
    
    args = parser.parse_args()
    
    # Load config
    config = load_config()
    
    # Prepare model and tokenizer
    model, tokenizer = prepare_model_and_tokenizer(args, config)
    
    # Load and tokenize dataset
    train_dataset = load_and_tokenize_dataset(args, tokenizer)
    
    # Training arguments
    training_args = TrainingArguments(
        output_dir=args.output_dir,
        num_train_epochs=args.epochs,
        per_device_train_batch_size=args.batch_size,
        gradient_accumulation_steps=args.gradient_accumulation_steps,
        learning_rate=args.learning_rate,
        warmup_steps=100,
        logging_steps=10,
        save_steps=500,
        eval_steps=500 if Path(args.dataset).parent / f"test_{Path(args.dataset).name}" else None,
        save_total_limit=3,
        fp16=torch.cuda.is_available(),
        report_to="tensorboard",
        logging_dir=f"{args.output_dir}/logs",
        remove_unused_columns=False,
        ddp_find_unused_parameters=False if args.distributed else None,
    )
    
    # Data collator
    data_collator = DataCollatorForLanguageModeling(
        tokenizer=tokenizer,
        mlm=False
    )
    
    # Initialize trainer
    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=train_dataset,
        data_collator=data_collator,
    )
    
    # Train
    logger.info("Starting training...")
    trainer.train()
    
    # Save final model
    logger.info(f"Saving model to {args.output_dir}")
    trainer.save_model()
    tokenizer.save_pretrained(args.output_dir)
    
    # Save training info
    with open(Path(args.output_dir) / 'training_info.json', 'w') as f:
        json.dump({
            'base_model': args.base_model,
            'dataset': args.dataset,
            'epochs': args.epochs,
            'batch_size': args.batch_size,
            'learning_rate': args.learning_rate,
            'use_lora': args.use_lora,
            'lora_r': args.lora_r if args.use_lora else None,
            'lora_alpha': args.lora_alpha if args.use_lora else None,
        }, f, indent=2)
    
    logger.info("Training complete!")

if __name__ == '__main__':
    main()
