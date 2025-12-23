# Aero Assistant - Quick Start Guide

This guide will help you get the AI Assistant up and running in your Aero platform.

## Prerequisites

- PostgreSQL database with pgvector extension
- Self-hosted AI model endpoint (e.g., at aeos365.com)
- Laravel 11+ with Aero Core package installed

## Step 1: Install the Package

The package is already in the monorepo. To use it in a host app, add to `composer.json`:

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

Then run:
```bash
composer install
```

## Step 2: Set Up Database

### Install pgvector Extension (PostgreSQL)

Connect to your database and run:
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

For installation instructions, visit: https://github.com/pgvector/pgvector#installation

### Run Migrations

```bash
php artisan migrate
```

This creates:
- `assistant_conversations` - User conversations
- `assistant_messages` - Chat messages
- `assistant_embeddings` - Vector embeddings
- `assistant_usage_logs` - Analytics

## Step 3: Configure Environment

Copy configuration from `packages/aero-assistant/.env.example` to your `.env` file:

```env
# AI Model Configuration
ASSISTANT_MODEL_ENDPOINT=https://ai.aeos365.com/api
ASSISTANT_MODEL_NAME=aero-assistant-v1

# Vector Search
ASSISTANT_VECTOR_ENABLED=true
ASSISTANT_VECTOR_DIMENSIONS=1536
ASSISTANT_VECTOR_TOP_K=5

# Knowledge Base
ASSISTANT_INDEX_DOCS=true
ASSISTANT_INDEX_CODE=true
ASSISTANT_DYNAMIC_INDEXING=true

# Interface
ASSISTANT_FLOATING_BUTTON=true
ASSISTANT_DEDICATED_PAGE=true
```

## Step 4: Index Knowledge Base

Index your documentation and code for RAG:

```bash
# Index everything
php artisan assistant:index

# Or re-index from scratch
php artisan assistant:index --fresh

# Index specific module
php artisan assistant:index --module=hrm
```

## Step 5: Add to Frontend

### Option A: Global Floating Button (Recommended)

Add to your main authenticated layout (e.g., `resources/js/Layouts/AuthenticatedLayout.jsx`):

```jsx
import FloatingAssistantButton from '@/../../packages/aero-assistant/resources/js/Components/FloatingAssistantButton';

export default function AuthenticatedLayout({ user, children }) {
    return (
        <div>
            {/* Your layout content */}
            {children}
            
            {/* Add floating assistant button */}
            <FloatingAssistantButton />
        </div>
    );
}
```

### Option B: Use Chat Window Component

```jsx
import ChatWindow from '@/../../packages/aero-assistant/resources/js/Components/ChatWindow';

function MyComponent() {
    const [isChatOpen, setIsChatOpen] = useState(false);
    
    return (
        <>
            <Button onPress={() => setIsChatOpen(true)}>
                Ask Assistant
            </Button>
            
            <ChatWindow 
                isOpen={isChatOpen} 
                onClose={() => setIsChatOpen(false)} 
            />
        </>
    );
}
```

## Step 6: Configure Navigation (Optional)

Add assistant to your navigation menu in `config/navigation.php` or module config:

```php
[
    'name' => 'AI Assistant',
    'icon' => 'SparklesIcon',
    'route' => 'assistant.index',
    'permission' => 'assistant.use',
]
```

## Step 7: Set Up Permissions

Assign permissions to roles:

```php
// Basic usage
'assistant.use' => 'Use AI Assistant'

// View conversation history
'assistant.view_history' => 'View Conversation History'

// Perform automated actions
'assistant.perform_actions' => 'Perform Actions via Assistant'

// Admin features
'assistant.admin' => 'Manage Assistant Settings'
```

## Step 8: Test the Integration

1. Log in to your application
2. You should see the floating assistant button (✨) in the bottom-right corner
3. Click to open the chat window
4. Ask a question like "How do I create a new employee?"
5. Visit `/assistant` for the full page with conversation history

## Verify Installation

Check statistics:
```bash
php artisan assistant:stats
```

Expected output:
```
🤖 AI Assistant Statistics

📚 Knowledge Base:
  Total Embeddings: 150
  By Type:
    - documentation: 80
    - code: 70
  By Module:
    - hrm: 40
    - crm: 30
    ...

📊 Usage Statistics:
  Today: 0 messages
  This Week: 0 messages
  This Month: 0 messages
```

## Troubleshooting

### pgvector Extension Error

If you see "extension vector does not exist":
```bash
# Install pgvector first (Ubuntu/Debian)
sudo apt install postgresql-15-pgvector

# Or follow: https://github.com/pgvector/pgvector#installation
```

### AI Model Connection Error

Check that `ASSISTANT_MODEL_ENDPOINT` is accessible:
```bash
curl https://ai.aeos365.com/api/health
```

### No Embeddings Created

Ensure you've run the indexing command:
```bash
php artisan assistant:index --fresh
```

### Routes Not Found

Clear cache:
```bash
php artisan route:clear
php artisan config:clear
php artisan cache:clear
```

## Next Steps

- Configure plan-based feature access in `config/assistant.php`
- Customize system prompts in `RagService.php`
- Set up automated indexing via cron/scheduler
- Monitor usage with `assistant:stats` command
- Extend capabilities by adding action handlers

## Support

For issues or questions:
- Check documentation: `packages/aero-assistant/README.md`
- Review code examples in frontend components
- Contact: support@aerosuite.com
