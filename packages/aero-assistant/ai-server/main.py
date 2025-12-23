"""
Aero AI Model Server - Main Application
FastAPI server providing OpenAI-compatible API for chat and embeddings
"""

from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer, AutoModel
import uvicorn
import logging
from datetime import datetime
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=os.getenv('LOG_LEVEL', 'INFO'),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Aero AI Model Server",
    description="Self-hosted AI model API for Aero Assistant",
    version="1.0.0"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv('CORS_ORIGINS', '*').split(','),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global model instances
chat_model = None
chat_tokenizer = None
embedding_model = None
embedding_tokenizer = None

# Configuration
CONFIG = {
    'model_name': os.getenv('MODEL_NAME', 'aero-assistant-v1'),
    'base_model': os.getenv('BASE_MODEL', 'meta-llama/Llama-2-7b-chat-hf'),
    'finetuned_path': os.getenv('FINETUNED_MODEL_PATH', './models/aero-assistant-v1'),
    'embedding_model': os.getenv('EMBEDDING_MODEL', 'sentence-transformers/all-MiniLM-L6-v2'),
    'device': os.getenv('DEVICE', 'cuda' if torch.cuda.is_available() else 'cpu'),
    'max_tokens': int(os.getenv('MAX_TOKENS', '2048')),
    'api_key': os.getenv('API_KEY', 'dev-key-change-in-production'),
}

# Request/Response Models
class Message(BaseModel):
    role: str = Field(..., description="Role: system, user, or assistant")
    content: str = Field(..., description="Message content")

class ChatCompletionRequest(BaseModel):
    model: str = Field(default=CONFIG['model_name'])
    messages: List[Message]
    max_tokens: Optional[int] = Field(default=1000)
    temperature: Optional[float] = Field(default=0.7, ge=0.0, le=2.0)
    top_p: Optional[float] = Field(default=1.0, ge=0.0, le=1.0)
    stream: Optional[bool] = Field(default=False)

class ChatCompletionResponse(BaseModel):
    id: str
    object: str = "chat.completion"
    created: int
    model: str
    choices: List[Dict[str, Any]]
    usage: Dict[str, int]

class EmbeddingRequest(BaseModel):
    model: str = Field(default=CONFIG['model_name'])
    input: List[str] | str
    encoding_format: Optional[str] = Field(default="float")

class EmbeddingResponse(BaseModel):
    object: str = "list"
    data: List[Dict[str, Any]]
    model: str
    usage: Dict[str, int]

# Security: API Key validation
async def verify_api_key(authorization: str = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing Authorization header")
    
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid Authorization format")
    
    token = authorization.replace("Bearer ", "")
    if token != CONFIG['api_key']:
        raise HTTPException(status_code=401, detail="Invalid API key")
    
    return token

# Startup: Load models
@app.on_event("startup")
async def load_models():
    global chat_model, chat_tokenizer, embedding_model, embedding_tokenizer
    
    logger.info("Loading models...")
    
    try:
        # Load chat model (fine-tuned if available, else base model)
        model_path = CONFIG['finetuned_path'] if os.path.exists(CONFIG['finetuned_path']) else CONFIG['base_model']
        logger.info(f"Loading chat model from: {model_path}")
        
        chat_tokenizer = AutoTokenizer.from_pretrained(model_path)
        chat_model = AutoModelForCausalLM.from_pretrained(
            model_path,
            torch_dtype=torch.float16 if CONFIG['device'] == 'cuda' else torch.float32,
            device_map=CONFIG['device'],
            load_in_8bit=os.getenv('LOAD_IN_8BIT', 'false').lower() == 'true',
        )
        chat_model.eval()
        logger.info("Chat model loaded successfully")
        
        # Load embedding model
        logger.info(f"Loading embedding model: {CONFIG['embedding_model']}")
        embedding_tokenizer = AutoTokenizer.from_pretrained(CONFIG['embedding_model'])
        embedding_model = AutoModel.from_pretrained(CONFIG['embedding_model']).to(CONFIG['device'])
        embedding_model.eval()
        logger.info("Embedding model loaded successfully")
        
    except Exception as e:
        logger.error(f"Failed to load models: {e}")
        raise

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "model": CONFIG['model_name'],
        "device": CONFIG['device'],
        "models_loaded": chat_model is not None and embedding_model is not None
    }

# Chat completions endpoint
@app.post("/chat/completions", response_model=ChatCompletionResponse)
async def create_chat_completion(
    request: ChatCompletionRequest,
    api_key: str = Depends(verify_api_key)
):
    """Create chat completion (OpenAI-compatible)"""
    
    if chat_model is None or chat_tokenizer is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    try:
        # Format conversation for the model
        conversation = ""
        for msg in request.messages:
            if msg.role == "system":
                conversation += f"System: {msg.content}\n\n"
            elif msg.role == "user":
                conversation += f"User: {msg.content}\n\n"
            elif msg.role == "assistant":
                conversation += f"Assistant: {msg.content}\n\n"
        
        conversation += "Assistant:"
        
        # Tokenize
        inputs = chat_tokenizer(conversation, return_tensors="pt").to(CONFIG['device'])
        
        # Generate response
        with torch.no_grad():
            outputs = chat_model.generate(
                inputs.input_ids,
                max_new_tokens=request.max_tokens,
                temperature=request.temperature,
                top_p=request.top_p,
                do_sample=request.temperature > 0,
                pad_token_id=chat_tokenizer.eos_token_id,
            )
        
        # Decode response
        response_text = chat_tokenizer.decode(outputs[0][inputs.input_ids.shape[1]:], skip_special_tokens=True)
        
        # Calculate token usage
        prompt_tokens = inputs.input_ids.shape[1]
        completion_tokens = outputs.shape[1] - prompt_tokens
        
        return ChatCompletionResponse(
            id=f"chatcmpl-{datetime.now().timestamp()}",
            created=int(datetime.now().timestamp()),
            model=request.model,
            choices=[{
                "index": 0,
                "message": {
                    "role": "assistant",
                    "content": response_text.strip()
                },
                "finish_reason": "stop"
            }],
            usage={
                "prompt_tokens": prompt_tokens,
                "completion_tokens": completion_tokens,
                "total_tokens": prompt_tokens + completion_tokens
            }
        )
        
    except Exception as e:
        logger.error(f"Error generating completion: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Embeddings endpoint
@app.post("/embeddings", response_model=EmbeddingResponse)
async def create_embeddings(
    request: EmbeddingRequest,
    api_key: str = Depends(verify_api_key)
):
    """Create embeddings (OpenAI-compatible)"""
    
    if embedding_model is None or embedding_tokenizer is None:
        raise HTTPException(status_code=503, detail="Embedding model not loaded")
    
    try:
        # Handle single string or list of strings
        texts = [request.input] if isinstance(request.input, str) else request.input
        
        # Tokenize
        inputs = embedding_tokenizer(
            texts,
            padding=True,
            truncation=True,
            return_tensors="pt"
        ).to(CONFIG['device'])
        
        # Generate embeddings
        with torch.no_grad():
            outputs = embedding_model(**inputs)
            # Mean pooling
            embeddings = outputs.last_hidden_state.mean(dim=1)
            # Normalize
            embeddings = torch.nn.functional.normalize(embeddings, p=2, dim=1)
        
        # Convert to list
        embeddings_list = embeddings.cpu().numpy().tolist()
        
        # Format response
        data = [
            {
                "object": "embedding",
                "embedding": emb,
                "index": idx
            }
            for idx, emb in enumerate(embeddings_list)
        ]
        
        return EmbeddingResponse(
            data=data,
            model=request.model,
            usage={
                "prompt_tokens": inputs.input_ids.shape[1],
                "total_tokens": inputs.input_ids.shape[1]
            }
        )
        
    except Exception as e:
        logger.error(f"Error generating embeddings: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Model info endpoint
@app.get("/models/{model_name}")
async def get_model_info(model_name: str):
    """Get model information"""
    
    if model_name != CONFIG['model_name']:
        raise HTTPException(status_code=404, detail="Model not found")
    
    return {
        "id": model_name,
        "object": "model",
        "created": int(datetime.now().timestamp()),
        "owned_by": "aero",
        "permission": [],
        "root": CONFIG['base_model'],
        "parent": None,
    }

# List models endpoint
@app.get("/models")
async def list_models():
    """List available models"""
    return {
        "object": "list",
        "data": [{
            "id": CONFIG['model_name'],
            "object": "model",
            "created": int(datetime.now().timestamp()),
            "owned_by": "aero",
        }]
    }

# Run server
if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=os.getenv('HOST', '0.0.0.0'),
        port=int(os.getenv('PORT', 8000)),
        workers=int(os.getenv('WORKERS', 1)),
        reload=False
    )
