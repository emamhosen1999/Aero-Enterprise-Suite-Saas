#!/bin/bash

# Aero AI Assistant - Quick Setup Script
# This script automates the setup of training pipeline and AI server

set -e

echo "========================================="
echo "Aero AI Assistant - Quick Setup"
echo "========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Python version
echo "Checking Python version..."
PYTHON_VERSION=$(python3 --version 2>&1 | awk '{print $2}')
REQUIRED_VERSION="3.10"

if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$PYTHON_VERSION" | sort -V | head -n1)" != "$REQUIRED_VERSION" ]; then
    echo -e "${RED}Error: Python 3.10 or higher is required${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Python $PYTHON_VERSION detected${NC}"

# Ask what to set up
echo ""
echo "What would you like to set up?"
echo "1) Training Pipeline"
echo "2) AI Server"
echo "3) Both"
read -p "Enter choice [1-3]: " CHOICE

case $CHOICE in
    1|3)
        echo ""
        echo "========================================="
        echo "Setting up Training Pipeline"
        echo "========================================="
        
        cd training
        
        echo "Creating virtual environment..."
        python3 -m venv venv
        source venv/bin/activate
        
        echo "Installing dependencies..."
        pip install --upgrade pip
        pip install -r requirements.txt
        
        echo "Creating directories..."
        mkdir -p data/raw data/processed models logs cache
        
        echo -e "${GREEN}✓ Training pipeline setup complete!${NC}"
        echo ""
        echo "Next steps:"
        echo "  1. Activate environment: source training/venv/bin/activate"
        echo "  2. Extract data: python extract_training_data.py --repo-path /path/to/repo --output data/raw/training_data.jsonl"
        echo "  3. Prepare dataset: python prepare_dataset.py --input data/raw/training_data.jsonl --output data/processed/instruction_dataset.jsonl"
        echo "  4. Train model: python train.py --base-model meta-llama/Llama-2-7b-chat-hf --dataset data/processed/instruction_dataset.jsonl --output-dir models/aero-assistant-v1 --use-lora"
        
        deactivate
        cd ..
        ;;
esac

case $CHOICE in
    2|3)
        echo ""
        echo "========================================="
        echo "Setting up AI Server"
        echo "========================================="
        
        cd ai-server
        
        echo "Creating virtual environment..."
        python3 -m venv venv
        source venv/bin/activate
        
        echo "Installing dependencies..."
        pip install --upgrade pip
        pip install -r requirements.txt
        
        echo "Creating directories..."
        mkdir -p models logs
        
        # Create .env if it doesn't exist
        if [ ! -f .env ]; then
            echo "Creating .env file..."
            cp .env.example .env
            
            # Generate random API key
            API_KEY=$(openssl rand -hex 32)
            sed -i "s/your-secure-api-key-change-in-production/$API_KEY/" .env
            
            echo -e "${YELLOW}Generated API key: $API_KEY${NC}"
            echo -e "${YELLOW}Saved to .env file${NC}"
        fi
        
        echo -e "${GREEN}✓ AI Server setup complete!${NC}"
        echo ""
        echo "Next steps:"
        echo "  1. Copy trained model to ai-server/models/aero-assistant-v1"
        echo "  2. Edit ai-server/.env and configure settings"
        echo "  3. Start server: uvicorn main:app --host 0.0.0.0 --port 8000"
        echo "  4. Test: curl http://localhost:8000/health"
        
        deactivate
        cd ..
        ;;
esac

echo ""
echo "========================================="
echo "Setup Complete!"
echo "========================================="
echo ""
echo "For detailed instructions, see:"
echo "  - Training: training/README.md"
echo "  - AI Server: ai-server/README.md"
echo "  - Deployment: DEPLOYMENT.md"
echo ""
