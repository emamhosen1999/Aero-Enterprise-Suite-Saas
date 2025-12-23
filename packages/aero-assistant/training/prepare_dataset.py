"""
Prepare instruction dataset for fine-tuning
Converts extracted data to instruction-response format
"""

import json
import argparse
from pathlib import Path
from typing import List, Dict
import logging
import random

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DatasetPreparer:
    def __init__(self):
        self.instruction_templates = {
            'documentation': [
                "What is {title}?",
                "Explain {title}",
                "How does {title} work?",
                "Tell me about {title}",
                "What do I need to know about {title}?"
            ],
            'code_documentation': [
                "What does this code do in the {module} module?",
                "Explain this {language} code from {module}",
                "How does this work in {module}?",
                "What is this {language} function for?"
            ]
        }
    
    def prepare_dataset(self, raw_data: List[Dict]) -> List[Dict]:
        """Convert raw data to instruction format"""
        logger.info("Preparing instruction dataset...")
        
        instructions = []
        
        for item in raw_data:
            item_type = item['type']
            
            if item_type == 'documentation':
                instructions.extend(self._prepare_doc_instruction(item))
            elif item_type == 'code_documentation':
                instructions.extend(self._prepare_code_instruction(item))
        
        logger.info(f"Prepared {len(instructions)} instructions")
        return instructions
    
    def _prepare_doc_instruction(self, item: Dict) -> List[Dict]:
        """Prepare documentation instruction"""
        results = []
        
        # Generate multiple questions for same content
        for template in random.sample(self.instruction_templates['documentation'], 2):
            instruction = template.format(title=item['title'])
            
            results.append({
                'instruction': instruction,
                'context': item['context'],
                'response': item['content'],
                'source': item['source']
            })
        
        return results
    
    def _prepare_code_instruction(self, item: Dict) -> List[Dict]:
        """Prepare code documentation instruction"""
        results = []
        
        for template in random.sample(self.instruction_templates['code_documentation'], 1):
            instruction = template.format(
                module=item.get('module', 'core'),
                language=item.get('language', 'code')
            )
            
            results.append({
                'instruction': instruction,
                'context': item['context'],
                'response': item['content'],
                'source': item['source']
            })
        
        return results
    
    def format_for_training(self, instructions: List[Dict], format_type: str = 'alpaca') -> List[Dict]:
        """Format instructions for specific training format"""
        
        if format_type == 'alpaca':
            return [self._format_alpaca(inst) for inst in instructions]
        elif format_type == 'sharegpt':
            return [self._format_sharegpt(inst) for inst in instructions]
        else:
            return instructions
    
    def _format_alpaca(self, instruction: Dict) -> Dict:
        """Format in Alpaca style"""
        return {
            'instruction': instruction['instruction'],
            'input': instruction.get('context', ''),
            'output': instruction['response']
        }
    
    def _format_sharegpt(self, instruction: Dict) -> Dict:
        """Format in ShareGPT style"""
        return {
            'conversations': [
                {
                    'from': 'system',
                    'value': 'You are Aero Assistant, an AI assistant for the aeos365 platform.'
                },
                {
                    'from': 'human',
                    'value': instruction['instruction'] + '\n\nContext: ' + instruction.get('context', '')
                },
                {
                    'from': 'gpt',
                    'value': instruction['response']
                }
            ]
        }

def main():
    parser = argparse.ArgumentParser(description='Prepare instruction dataset')
    parser.add_argument('--input', required=True, help='Input JSONL file')
    parser.add_argument('--output', required=True, help='Output JSONL file')
    parser.add_argument('--format', default='alpaca', choices=['alpaca', 'sharegpt', 'instruction'],
                       help='Output format')
    parser.add_argument('--split', type=float, default=0.9, help='Train/test split ratio')
    args = parser.parse_args()
    
    # Load raw data
    logger.info(f"Loading data from {args.input}")
    raw_data = []
    with open(args.input, 'r', encoding='utf-8') as f:
        for line in f:
            raw_data.append(json.loads(line))
    
    logger.info(f"Loaded {len(raw_data)} raw examples")
    
    # Prepare dataset
    preparer = DatasetPreparer()
    instructions = preparer.prepare_dataset(raw_data)
    
    # Format for training
    formatted_data = preparer.format_for_training(instructions, args.format)
    
    # Shuffle
    random.shuffle(formatted_data)
    
    # Split train/test
    split_idx = int(len(formatted_data) * args.split)
    train_data = formatted_data[:split_idx]
    test_data = formatted_data[split_idx:]
    
    # Save train set
    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    with open(output_path, 'w', encoding='utf-8') as f:
        for item in train_data:
            f.write(json.dumps(item, ensure_ascii=False) + '\n')
    
    logger.info(f"Saved {len(train_data)} training examples to {output_path}")
    
    # Save test set
    test_path = output_path.parent / f"test_{output_path.name}"
    with open(test_path, 'w', encoding='utf-8') as f:
        for item in test_data:
            f.write(json.dumps(item, ensure_ascii=False) + '\n')
    
    logger.info(f"Saved {len(test_data)} test examples to {test_path}")

if __name__ == '__main__':
    main()
