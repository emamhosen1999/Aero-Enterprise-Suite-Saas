# Aero AI Model Server

Self-hosted AI model API server for the Aero Assistant package.

## Features

- OpenAI-compatible API endpoints
- Chat completions with context
- Text embeddings generation
- Model fine-tuning support
- Health monitoring
- Request logging and analytics

## Requirements

- Python 3.10+
- PyTorch 2.0+
- Transformers (HuggingFace)
- FastAPI
- PostgreSQL (for logging)

## Installation

```bash
cd packages/aero-assistant/ai-server

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

## Configuration

Copy `.env.example` to `.env` and configure:

```env
# Server Configuration
HOST=0.0.0.0
PORT=8000
WORKERS=4

# Model Configuration
MODEL_NAME=aero-assistant-v1
BASE_MODEL=meta-llama/Llama-2-7b-chat-hf
DEVICE=cuda  # or cpu

# Database (for logging)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=aero_ai
DB_USER=postgres
DB_PASSWORD=your_password

# Security
API_KEY=your-secure-api-key
CORS_ORIGINS=https://aeos365.com,https://admin.aeos365.com
```

## Running the Server

### Development

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Production

```bash
# Using Gunicorn with Uvicorn workers
gunicorn main:app \
  --workers 4 \
  --worker-class uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:8000 \
  --timeout 120 \
  --access-logfile - \
  --error-logfile -
```

### Using Docker

```bash
docker build -t aero-ai-server .
docker run -p 8000:8000 --env-file .env aero-ai-server
```

## API Endpoints

### Health Check
```
GET /health
```

### Chat Completions
```
POST /chat/completions
Content-Type: application/json

{
  "model": "aero-assistant-v1",
  "messages": [
    {"role": "system", "content": "You are Aero Assistant..."},
    {"role": "user", "content": "How do I create an employee?"}
  ],
  "max_tokens": 1000,
  "temperature": 0.7
}
```

### Embeddings
```
POST /embeddings
Content-Type: application/json

{
  "model": "aero-assistant-v1",
  "input": ["Text to embed", "Another text"]
}
```

### Model Information
```
GET /models/{model_name}
```

## Monitoring

Access metrics at `/metrics` (Prometheus format)

## Load Testing

```bash
# Install locust
pip install locust

# Run load test
locust -f tests/load_test.py --host http://localhost:8000
```

## Security

- Always use HTTPS in production
- Set strong API keys
- Configure CORS properly
- Rate limit requests
- Monitor for abuse

## Scaling

For high traffic:

1. Use multiple workers
2. Deploy behind a load balancer
3. Use GPU acceleration
4. Consider model quantization
5. Implement caching

## Troubleshooting

### Out of Memory
- Reduce batch size
- Use model quantization
- Switch to smaller model
- Add more RAM/VRAM

### Slow Responses
- Enable GPU acceleration
- Use model quantization
- Implement response caching
- Scale horizontally

### CUDA Errors
- Update NVIDIA drivers
- Check CUDA compatibility
- Verify PyTorch CUDA build

## License

MIT License - See root LICENSE file
