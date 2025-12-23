# Aero Assistant Module

AI-powered assistant with RAG (Retrieval-Augmented Generation) capabilities for intelligent user guidance, task automation, and contextual help across the Aero platform.

## Complete Solution

This package includes everything needed for a self-hosted AI assistant:

1. **Laravel Package** - Backend integration with RAG system
2. **Training Pipeline** - Scripts to train custom models on your codebase
3. **AI Server** - FastAPI server for model inference (OpenAI-compatible API)
4. **React Components** - Pre-built UI components for chat interface

## Features

- **RAG-Powered Responses**: Context-aware answers using knowledge base from documentation and code
- **Self-Hosted Model**: Train and deploy your own AI model (no external API dependencies)
- **Conversational Interface**: Natural language chat interface with conversation history
- **Floating Assistant Button**: Quick access from any page in the application
- **Dedicated Assistant Page**: Full-page interface for managing conversation history
- **Multi-Plan Support**: Feature access based on subscription tier (SaaS) or module installation (Standalone)
- **Knowledge Base Management**: Dynamic indexing of documentation, code comments, and module content
- **Usage Analytics**: Track AI usage, token consumption, and response quality
- **Training Pipeline**: Complete tooling to fine-tune LLMs on your codebase

## Installation

### 1. Add Package to Composer

The package is already configured in the monorepo. If installing in a host app:

```json
{
    "repositories": [
        {
            "type": "path",
            "url": "../../packages/aero-assistant"
        }
    ],
    "require": {
        "aero/assistant": "*"
    }
}
```

### 2. Install Dependencies

```bash
composer install
```

### 3. Configuration

Publish the configuration file:

```bash
php artisan vendor:publish --tag=assistant-config
```

### 4. Environment Variables

Add these variables to your `.env` file:

```env
# AI Model Configuration
ASSISTANT_MODEL_ENDPOINT=https://ai.aeos365.com/api
ASSISTANT_MODEL_NAME=aero-assistant-v1
ASSISTANT_MODEL_TIMEOUT=30
ASSISTANT_MODEL_MAX_TOKENS=1000
ASSISTANT_MODEL_TEMPERATURE=0.7

# Vector Search (requires PostgreSQL with pgvector extension)
ASSISTANT_VECTOR_ENABLED=true
ASSISTANT_VECTOR_DIMENSIONS=1536
ASSISTANT_VECTOR_TOP_K=5
ASSISTANT_VECTOR_SIMILARITY_THRESHOLD=0.7

# Knowledge Base
ASSISTANT_INDEX_DOCS=true
ASSISTANT_INDEX_CODE=true
ASSISTANT_DYNAMIC_INDEXING=true
ASSISTANT_CHUNK_SIZE=1000
ASSISTANT_CHUNK_OVERLAP=200

# Interface
ASSISTANT_FLOATING_BUTTON=true
ASSISTANT_DEDICATED_PAGE=true
ASSISTANT_SHOW_ALL_PAGES=true
```

### 5. Database Setup

#### For PostgreSQL (Recommended)

Install the pgvector extension:

```bash
# Connect to your database
psql -U postgres -d your_database

# Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;
```

Run migrations:

```bash
php artisan migrate
```


### 6. Set Up AI Model Server

**Option A: Quick Start (Development)**

```bash
# Run setup script
cd packages/aero-assistant
./setup.sh

# Choose option 2 or 3 to set up AI server
```

**Option B: Manual Setup**

See detailed instructions in:
- **Training**: [`training/README.md`](training/README.md) - Train custom model on your codebase
- **AI Server**: [`ai-server/README.md`](ai-server/README.md) - Deploy model inference server
- **Deployment**: [`DEPLOYMENT.md`](DEPLOYMENT.md) - Complete production deployment guide

**Quick Deploy with Docker:**

```bash
cd ai-server

# Configure environment
cp .env.example .env
nano .env  # Set MODEL_NAME, API_KEY, etc.

# Start server
docker-compose up -d

# Test
curl http://localhost:8000/health
```

### 7. Index Knowledge Base

After installation, index your documentation and code:

```bash
# Index all sources
php artisan assistant:index

# Index specific module
php artisan assistant:index --module=hrm

# Re-index (clear and rebuild)
php artisan assistant:index --fresh
```

## Usage

### Frontend Integration

#### Add Floating Assistant Button

Add to your main layout (e.g., `AuthenticatedLayout.jsx`):

```jsx
import FloatingAssistantButton from '@/../../packages/aero-assistant/resources/js/Components/FloatingAssistantButton';

export default function AuthenticatedLayout({ user, children }) {
    return (
        <div>
            {/* Your layout content */}
            {children}
            
            {/* Floating Assistant Button */}
            <FloatingAssistantButton />
        </div>
    );
}
```

#### Use Chat Window Directly

```jsx
import ChatWindow from '@/../../packages/aero-assistant/resources/js/Components/ChatWindow';

function MyComponent() {
    const [isChatOpen, setIsChatOpen] = useState(false);
    
    return (
        <>
            <button onClick={() => setIsChatOpen(true)}>
                Open Assistant
            </button>
            
            <ChatWindow 
                isOpen={isChatOpen} 
                onClose={() => setIsChatOpen(false)} 
            />
        </>
    );
}
```

### API Endpoints

#### Send Message

```javascript
POST /assistant/message
{
    "message": "How do I create a new employee?",
    "conversation_id": 123, // optional, omit for new conversation
    "context": {
        "page": "/hrm/employees",
        "module": "hrm"
    }
}
```

#### Get Conversations

```javascript
GET /assistant/conversations?include_archived=false
```

#### Get Specific Conversation

```javascript
GET /assistant/conversations/{id}
```

#### Archive Conversation

```javascript
POST /assistant/conversations/{id}/archive
```

#### Delete Conversation

```javascript
DELETE /assistant/conversations/{id}
```

## Architecture

### Services

- **`AiModelService`**: Communicates with self-hosted AI model API
- **`RagService`**: Handles context retrieval and RAG-enhanced response generation
- **`AssistantService`**: Main orchestration service for conversations and message handling
- **`IndexingService`**: Manages knowledge base indexing (docs, code, modules)

### Database Tables

- **`assistant_conversations`**: User conversations
- **`assistant_messages`**: Messages in conversations
- **`assistant_embeddings`**: Vector embeddings for RAG
- **`assistant_usage_logs`**: Analytics and usage tracking

### Configuration

Feature access is controlled by plan tier in `config/assistant.php`:

```php
'features' => [
    'basic' => [
        'basic_chat' => true,
        'conversation_history' => false,
        'rag_powered' => false,
        'perform_actions' => false,
        'max_messages_per_day' => 50,
    ],
    'professional' => [
        'basic_chat' => true,
        'conversation_history' => true,
        'rag_powered' => true,
        'perform_actions' => false,
        'max_messages_per_day' => 200,
    ],
    'enterprise' => [
        'basic_chat' => true,
        'conversation_history' => true,
        'rag_powered' => true,
        'perform_actions' => true,
        'max_messages_per_day' => -1, // unlimited
    ],
],
```

## Self-Hosted AI Model

The assistant expects a compatible AI model API at `ASSISTANT_MODEL_ENDPOINT`. The API should support:

### Chat Completions Endpoint

```
POST /chat/completions
{
    "model": "aero-assistant-v1",
    "messages": [
        {"role": "system", "content": "You are Aero Assistant..."},
        {"role": "user", "content": "How do I..."}
    ],
    "max_tokens": 1000,
    "temperature": 0.7
}
```

### Embeddings Endpoint

```
POST /embeddings
{
    "model": "aero-assistant-v1",
    "input": ["Text to embed"]
}
```

### Health Check

```
GET /health
```

## Permissions

The module defines these permissions:

- `assistant.use` - Basic access to assistant
- `assistant.view_history` - View conversation history
- `assistant.perform_actions` - Allow assistant to perform actions
- `assistant.access_all_modules` - Access to all module knowledge
- `assistant.admin` - Manage knowledge base and settings

## Development

### Testing

```bash
php artisan test --filter=Assistant
```

### Debugging

Enable detailed logging in `.env`:

```env
LOG_LEVEL=debug
```

Check logs at `storage/logs/laravel.log` for AI model interactions and RAG retrieval.

## License

MIT License - See LICENSE file for details.

## Support

For issues and questions, contact support@aerosuite.com or open an issue on the repository.
