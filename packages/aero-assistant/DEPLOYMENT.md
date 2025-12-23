# Aero AI Assistant - Complete Setup Guide

This guide covers the complete setup of the AI Assistant, from model training to production deployment.

## Table of Contents

1. [Training the Model](#training-the-model)
2. [Setting Up the AI Server](#setting-up-the-ai-server)
3. [Deploying to Production](#deploying-to-production)
4. [Integration with Laravel](#integration-with-laravel)
5. [Monitoring and Maintenance](#monitoring-and-maintenance)

---

## 1. Training the Model

### Prerequisites

- Python 3.10+
- NVIDIA GPU with 16GB+ VRAM (24GB recommended)
- CUDA 11.8+
- 50GB+ free disk space

### Step 1.1: Set Up Training Environment

```bash
cd packages/aero-assistant/training

# Create virtual environment
python -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### Step 1.2: Extract Training Data

```bash
# Extract data from codebase
python extract_training_data.py \
  --repo-path /path/to/Aero-Enterprise-Suite-Saas \
  --output data/raw/training_data.jsonl

# This will extract:
# - Documentation from docs/
# - PHP code and comments from packages/
# - React components and JSDoc from packages/
```

Expected output: 500-2000+ training examples depending on codebase size.

### Step 1.3: Prepare Dataset

```bash
# Convert to instruction format
python prepare_dataset.py \
  --input data/raw/training_data.jsonl \
  --output data/processed/instruction_dataset.jsonl \
  --format alpaca \
  --split 0.9

# This creates:
# - instruction_dataset.jsonl (90% for training)
# - test_instruction_dataset.jsonl (10% for validation)
```

### Step 1.4: Fine-Tune the Model

**Option A: With LoRA (Recommended - Lower VRAM)**

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
  --lora-alpha 32 \
  --gradient-checkpointing
```

Training time: ~4-8 hours on RTX 3090 / A100

**Option B: Full Fine-Tuning (Higher Quality)**

```bash
python train.py \
  --base-model meta-llama/Llama-2-7b-chat-hf \
  --dataset data/processed/instruction_dataset.jsonl \
  --output-dir models/aero-assistant-v1 \
  --epochs 3 \
  --batch-size 2 \
  --learning-rate 1e-5 \
  --gradient-checkpointing
```

Training time: ~12-24 hours on A100

**Option C: Quantized Training (Lowest VRAM - 8GB+)**

```bash
python train.py \
  --base-model meta-llama/Llama-2-7b-chat-hf \
  --dataset data/processed/instruction_dataset.jsonl \
  --output-dir models/aero-assistant-v1 \
  --epochs 3 \
  --batch-size 4 \
  --load-in-8bit \
  --use-lora \
  --gradient-checkpointing
```

### Step 1.5: Monitor Training

View TensorBoard:
```bash
tensorboard --logdir models/aero-assistant-v1/logs
```

Open browser: http://localhost:6006

---

## 2. Setting Up the AI Server

### Step 2.1: Prepare Server Environment

```bash
cd packages/aero-assistant/ai-server

# Create virtual environment
python -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### Step 2.2: Copy Trained Model

```bash
# Copy from training directory
cp -r ../training/models/aero-assistant-v1 ./models/

# Or download pre-trained model
# wget https://models.aeos365.com/aero-assistant-v1.tar.gz
# tar -xzf aero-assistant-v1.tar.gz -C models/
```

### Step 2.3: Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env
nano .env
```

Required settings:
```env
MODEL_NAME=aero-assistant-v1
FINETUNED_MODEL_PATH=./models/aero-assistant-v1
DEVICE=cuda
API_KEY=your-secure-random-key-here
CORS_ORIGINS=https://aeos365.com,https://admin.aeos365.com
```

### Step 2.4: Test Server Locally

```bash
# Start development server
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Test health endpoint
curl http://localhost:8000/health

# Test chat endpoint
curl -X POST http://localhost:8000/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-api-key" \
  -d '{
    "model": "aero-assistant-v1",
    "messages": [
      {"role": "user", "content": "How do I create an employee?"}
    ],
    "max_tokens": 500
  }'
```

---

## 3. Deploying to Production

### Option A: Docker Deployment (Recommended)

#### Step 3A.1: Build Docker Image

```bash
cd packages/aero-assistant/ai-server

# Build image
docker build -t aero-ai-server:latest .

# Or with GPU support
docker build -t aero-ai-server:latest-gpu -f Dockerfile.gpu .
```

#### Step 3A.2: Deploy with Docker Compose

```bash
# Set environment variables
cp .env.example .env
nano .env

# Start services
docker-compose up -d

# Check logs
docker-compose logs -f aero-ai-server

# Check health
curl http://localhost:8000/health
```

#### Step 3A.3: Set Up Nginx Reverse Proxy

```nginx
# /etc/nginx/sites-available/ai.aeos365.com

server {
    listen 80;
    server_name ai.aeos365.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name ai.aeos365.com;

    ssl_certificate /etc/letsencrypt/live/ai.aeos365.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ai.aeos365.com/privkey.pem;

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Increase timeout for long responses
        proxy_read_timeout 300s;
        proxy_connect_timeout 300s;
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/ai.aeos365.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Option B: Systemd Service (Linux)

#### Step 3B.1: Create Service File

```bash
sudo nano /etc/systemd/system/aero-ai-server.service
```

```ini
[Unit]
Description=Aero AI Model Server
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/aero-assistant/ai-server
Environment="PATH=/var/www/aero-assistant/ai-server/venv/bin"
ExecStart=/var/www/aero-assistant/ai-server/venv/bin/gunicorn main:app \
    --workers 4 \
    --worker-class uvicorn.workers.UvicornWorker \
    --bind 0.0.0.0:8000 \
    --timeout 120 \
    --access-logfile /var/log/aero-ai/access.log \
    --error-logfile /var/log/aero-ai/error.log
Restart=always

[Install]
WantedBy=multi-user.target
```

#### Step 3B.2: Start Service

```bash
# Create log directory
sudo mkdir -p /var/log/aero-ai
sudo chown www-data:www-data /var/log/aero-ai

# Enable and start service
sudo systemctl daemon-reload
sudo systemctl enable aero-ai-server
sudo systemctl start aero-ai-server

# Check status
sudo systemctl status aero-ai-server

# View logs
sudo journalctl -u aero-ai-server -f
```

---

## 4. Integration with Laravel

### Step 4.1: Configure Laravel Environment

Add to your Laravel `.env`:

```env
ASSISTANT_MODEL_ENDPOINT=https://ai.aeos365.com/api
ASSISTANT_MODEL_NAME=aero-assistant-v1
ASSISTANT_MODEL_TIMEOUT=30
```

Note: Remove `/api` from URL since routes are at root level in our server.

### Step 4.2: Test Integration

```bash
# Run assistant:stats to verify connection
php artisan assistant:stats

# Index knowledge base
php artisan assistant:index

# Test chat
php artisan tinker
```

```php
$service = app(\Aero\Assistant\Services\AssistantService::class);
$result = $service->sendMessage('How do I create an employee?');
dd($result);
```

---

## 5. Monitoring and Maintenance

### Health Monitoring

Set up health checks:

```bash
# Add to crontab
*/5 * * * * curl -f https://ai.aeos365.com/health || echo "AI Server Down" | mail -s "Alert" admin@aeos365.com
```

### Log Monitoring

```bash
# View server logs
tail -f /var/log/aero-ai/error.log

# Or with Docker
docker-compose logs -f aero-ai-server
```

### Performance Monitoring

Use Prometheus + Grafana:

```yaml
# docker-compose.monitoring.yml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    ports:
      - "9090:9090"

  grafana:
    image: grafana/grafana
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
```

### Model Updates

To update the model with new training data:

```bash
# 1. Extract new data
cd training
python extract_training_data.py \
  --repo-path /path/to/Aero-Enterprise-Suite-Saas \
  --output data/new/new_data.jsonl

# 2. Prepare dataset
python prepare_dataset.py \
  --input data/new/new_data.jsonl \
  --output data/new/new_instructions.jsonl

# 3. Continue training from checkpoint
python train.py \
  --base-model models/aero-assistant-v1 \
  --dataset data/new/new_instructions.jsonl \
  --output-dir models/aero-assistant-v1.1 \
  --epochs 1

# 4. Deploy new version
cp -r models/aero-assistant-v1.1 ../ai-server/models/
docker-compose restart aero-ai-server
```

### Backup

```bash
# Backup model
tar -czf aero-assistant-v1-$(date +%Y%m%d).tar.gz models/aero-assistant-v1

# Upload to S3
aws s3 cp aero-assistant-v1-$(date +%Y%m%d).tar.gz s3://backups/models/
```

---

## Troubleshooting

### Issue: CUDA Out of Memory

Solution:
```bash
# Use 8-bit quantization
python train.py --load-in-8bit ...

# Or reduce batch size
python train.py --batch-size 2 ...
```

### Issue: Slow Inference

Solutions:
1. Use GPU: `DEVICE=cuda`
2. Enable quantization: `LOAD_IN_8BIT=true`
3. Add more workers: `WORKERS=8`
4. Use model caching

### Issue: Poor Response Quality

Solutions:
1. Train for more epochs
2. Add more training data
3. Adjust learning rate
4. Use a larger base model

---

## Production Checklist

- [ ] Model trained and validated
- [ ] AI server deployed with HTTPS
- [ ] API key configured and secure
- [ ] CORS origins properly set
- [ ] Health monitoring enabled
- [ ] Log rotation configured
- [ ] Backup system in place
- [ ] Laravel integration tested
- [ ] Knowledge base indexed
- [ ] Performance benchmarked
- [ ] Documentation updated

---

## Support

For issues or questions:
- Check logs: `/var/log/aero-ai/`
- Test health: `curl https://ai.aeos365.com/health`
- Review documentation
- Contact: support@aerosuite.com
