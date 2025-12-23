"""
Extract training data from Aero codebase
Processes PHP, JS, JSX files and documentation
"""

import os
import json
import re
import argparse
from pathlib import Path
from typing import List, Dict, Any
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class CodebaseExtractor:
    def __init__(self, repo_path: str):
        self.repo_path = Path(repo_path)
        self.training_data = []
        
    def extract_all(self) -> List[Dict[str, Any]]:
        """Extract all training data from codebase"""
        logger.info("Extracting training data from codebase...")
        
        # Extract documentation
        self.extract_documentation()
        
        # Extract PHP code
        self.extract_php_code()
        
        # Extract JavaScript/React code
        self.extract_js_code()
        
        logger.info(f"Extracted {len(self.training_data)} training examples")
        return self.training_data
    
    def extract_documentation(self):
        """Extract markdown documentation"""
        logger.info("Processing documentation files...")
        
        docs_path = self.repo_path / 'docs'
        if not docs_path.exists():
            logger.warning("Docs directory not found")
            return
        
        for md_file in docs_path.rglob('*.md'):
            try:
                content = md_file.read_text(encoding='utf-8')
                
                # Split by sections (## headers)
                sections = re.split(r'\n##\s+', content)
                
                for i, section in enumerate(sections):
                    if i == 0:
                        # First section is title/intro
                        continue
                    
                    lines = section.split('\n', 1)
                    if len(lines) < 2:
                        continue
                    
                    title = lines[0].strip()
                    body = lines[1].strip()
                    
                    if len(body) > 50:  # Skip very short sections
                        self.training_data.append({
                            'type': 'documentation',
                            'source': str(md_file.relative_to(self.repo_path)),
                            'title': title,
                            'content': body,
                            'context': f'Documentation from {md_file.name}'
                        })
                        
            except Exception as e:
                logger.error(f"Error processing {md_file}: {e}")
    
    def extract_php_code(self):
        """Extract PHP code documentation"""
        logger.info("Processing PHP files...")
        
        packages_path = self.repo_path / 'packages'
        if not packages_path.exists():
            return
        
        for php_file in packages_path.rglob('*.php'):
            # Skip vendor and tests
            if 'vendor' in php_file.parts or 'tests' in php_file.parts:
                continue
            
            try:
                content = php_file.read_text(encoding='utf-8')
                
                # Extract PHPDoc blocks
                phpdoc_pattern = r'/\*\*(.*?)\*/'
                phpdocs = re.findall(phpdoc_pattern, content, re.DOTALL)
                
                # Extract class/function definitions with their docs
                class_pattern = r'(class|interface|trait)\s+(\w+)'
                function_pattern = r'(public|protected|private)?\s*function\s+(\w+)\s*\('
                
                for doc in phpdocs:
                    # Clean up doc
                    cleaned_doc = re.sub(r'^\s*\*\s?', '', doc, flags=re.MULTILINE)
                    cleaned_doc = cleaned_doc.strip()
                    
                    if len(cleaned_doc) > 30:
                        # Get module name from path
                        module_match = re.search(r'aero-(\w+)', str(php_file))
                        module = module_match.group(1) if module_match else 'core'
                        
                        self.training_data.append({
                            'type': 'code_documentation',
                            'language': 'php',
                            'source': str(php_file.relative_to(self.repo_path)),
                            'module': module,
                            'content': cleaned_doc,
                            'context': f'PHP code from {module} module'
                        })
                        
            except Exception as e:
                logger.error(f"Error processing {php_file}: {e}")
    
    def extract_js_code(self):
        """Extract JavaScript/React code documentation"""
        logger.info("Processing JavaScript/React files...")
        
        packages_path = self.repo_path / 'packages'
        if not packages_path.exists():
            return
        
        for js_file in packages_path.rglob('*.{js,jsx}'):
            # Skip node_modules
            if 'node_modules' in js_file.parts:
                continue
            
            try:
                content = js_file.read_text(encoding='utf-8')
                
                # Extract JSDoc blocks
                jsdoc_pattern = r'/\*\*(.*?)\*/'
                jsdocs = re.findall(jsdoc_pattern, content, re.DOTALL)
                
                # Extract component descriptions
                component_pattern = r'export\s+(default\s+)?function\s+(\w+)'
                
                for doc in jsdocs:
                    cleaned_doc = re.sub(r'^\s*\*\s?', '', doc, flags=re.MULTILINE)
                    cleaned_doc = cleaned_doc.strip()
                    
                    if len(cleaned_doc) > 30:
                        module_match = re.search(r'aero-(\w+)', str(js_file))
                        module = module_match.group(1) if module_match else 'core'
                        
                        self.training_data.append({
                            'type': 'code_documentation',
                            'language': 'javascript',
                            'source': str(js_file.relative_to(self.repo_path)),
                            'module': module,
                            'content': cleaned_doc,
                            'context': f'React component from {module} module'
                        })
                        
            except Exception as e:
                logger.error(f"Error processing {js_file}: {e}")

def main():
    parser = argparse.ArgumentParser(description='Extract training data from Aero codebase')
    parser.add_argument('--repo-path', required=True, help='Path to repository')
    parser.add_argument('--output', required=True, help='Output JSONL file')
    args = parser.parse_args()
    
    # Create output directory
    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    # Extract data
    extractor = CodebaseExtractor(args.repo_path)
    data = extractor.extract_all()
    
    # Save to JSONL
    with open(output_path, 'w', encoding='utf-8') as f:
        for item in data:
            f.write(json.dumps(item, ensure_ascii=False) + '\n')
    
    logger.info(f"Saved {len(data)} examples to {output_path}")
    
    # Print statistics
    types = {}
    for item in data:
        item_type = item['type']
        types[item_type] = types.get(item_type, 0) + 1
    
    logger.info("Statistics:")
    for type_name, count in types.items():
        logger.info(f"  {type_name}: {count}")

if __name__ == '__main__':
    main()
