# Aero AI Model Training Pipeline

Training pipeline for fine-tuning the AI model on Aero codebase and documentation.

## Overview

This pipeline trains a custom AI model specifically for the Aero platform by:
1. Extracting training data from codebase and documentation
2. Preparing datasets in instruction format
3. Fine-tuning a base LLM (Llama-2, Mistral, etc.)
4. Evaluating and validating the model
5. Exporting for deployment

## Requirements

- Python 3.10+
- PyTorch 2.0+ with CUDA support (recommended)
- Transformers
- Datasets
- PEFT (for LoRA training)
- bitsandbytes (for quantization)
- 16GB+ GPU RAM (24GB recommended)

## Installation

```bash
cd packages/aero-assistant/training

# Create virtual environment
python -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

## Pipeline Steps

### 1. Data Extraction

Extract training data from the Aero codebase:

```bash
python extract_training_data.py \
  --repo-path /path/to/Aero-Enterprise-Suite-Saas \
  --output data/raw/training_data.jsonl
```

This extracts:
- Documentation (Markdown files)
- Code comments and PHPDoc
- Function/class definitions
- API endpoints
- Configuration examples

### 2. Dataset Preparation

Convert raw data to instruction format:

```bash
python prepare_dataset.py \
  --input data/raw/training_data.jsonl \
  --output data/processed/instruction_dataset.jsonl \
  --format instruction
```

Output format:
```json
{
  "instruction": "How do I create a new employee in the HRM module?",
  "context": "The HRM module provides employee management...",
  "response": "To create a new employee, navigate to..."
}
```

### 3. Fine-Tuning

Fine-tune the base model:

```bash
python train.py \
  --base-model meta-llama/Llama-2-7b-chat-hf \
  --dataset data/processed/instruction_dataset.jsonl \
  --output-dir models/aero-assistant-v1 \
  --epochs 3 \
  --batch-size 4 \
  --learning-rate 2e-4 \
  --use-lora \
  --lora-r 16 \
  --lora-alpha 32
```

**Training Options:**
- `--use-lora`: Use LoRA for parameter-efficient training
- `--load-in-8bit`: Enable 8-bit quantization
- `--gradient-checkpointing`: Save memory
- `--use-flash-attention`: Speed up training (requires compatible GPU)

### 4. Evaluation

Evaluate the fine-tuned model:

```bash
python evaluate.py \
  --model models/aero-assistant-v1 \
  --test-data data/test/test_set.jsonl \
  --output results/evaluation.json
```

Metrics:
- Perplexity
- BLEU score
- Response accuracy
- Context relevance

### 5. Export

Export model for deployment:

```bash
python export_model.py \
  --model models/aero-assistant-v1 \
  --output-dir ../ai-server/models/aero-assistant-v1 \
  --format huggingface
```

## Configuration

Edit `config.yaml` to customize training:

```yaml
base_model:
  name: "meta-llama/Llama-2-7b-chat-hf"
  cache_dir: "./cache"

training:
  num_epochs: 3
  batch_size: 4
  gradient_accumulation_steps: 4
  learning_rate: 2e-4
  warmup_steps: 100
  max_seq_length: 2048
  
lora:
  enabled: true
  r: 16
  alpha: 32
  dropout: 0.05
  target_modules: ["q_proj", "v_proj"]

quantization:
  load_in_8bit: false
  load_in_4bit: false

output:
  checkpoint_dir: "./checkpoints"
  final_model_dir: "./models"
  save_steps: 500
  eval_steps: 500
```

## Training on Custom Data

### Add Custom Instructions

Create a file `data/custom/instructions.jsonl`:

```json
{"instruction": "How do I...", "context": "...", "response": "..."}
{"instruction": "What is...", "context": "...", "response": "..."}
```

Then merge with extracted data:

```bash
python merge_datasets.py \
  --inputs data/processed/instruction_dataset.jsonl data/custom/instructions.jsonl \
  --output data/final/combined_dataset.jsonl
```

## Distributed Training

For multi-GPU training:

```bash
torchrun --nproc_per_node=4 train.py \
  --base-model meta-llama/Llama-2-7b-chat-hf \
  --dataset data/processed/instruction_dataset.jsonl \
  --output-dir models/aero-assistant-v1 \
  --distributed
```

## Tips for Better Results

1. **Data Quality**: More diverse, high-quality examples produce better results
2. **Context**: Include relevant context in training examples
3. **Epochs**: 3-5 epochs typically sufficient; more can cause overfitting
4. **Learning Rate**: 2e-4 to 5e-4 works well for most cases
5. **Validation**: Always validate on held-out test set
6. **Quantization**: Use 8-bit for faster training with minimal quality loss

## Monitoring

Training progress is logged to:
- `logs/training.log` - Detailed logs
- `tensorboard/` - TensorBoard metrics

View TensorBoard:
```bash
tensorboard --logdir tensorboard/
```

## Troubleshooting

### CUDA Out of Memory
- Reduce `batch_size`
- Enable `gradient_checkpointing`
- Use `load_in_8bit` or `load_in_4bit`
- Reduce `max_seq_length`

### Poor Performance
- Increase training data
- Train for more epochs
- Adjust learning rate
- Try different base model

### Slow Training
- Use `use_flash_attention`
- Increase `batch_size` if memory allows
- Use mixed precision training
- Enable gradient accumulation

## Model Updates

To update the model with new data:

1. Extract new data
2. Merge with existing dataset
3. Fine-tune from last checkpoint:
   ```bash
   python train.py \
     --base-model models/aero-assistant-v1 \
     --dataset data/new/additional_data.jsonl \
     --output-dir models/aero-assistant-v1.1 \
     --epochs 1
   ```

## License

MIT License - See root LICENSE file
