<?php

namespace Aero\Assistant\Services;

use Aero\Assistant\Models\Conversation;
use Aero\Assistant\Models\Message;
use Aero\Assistant\Models\UsageLog;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

/**
 * Main Assistant Service
 * Orchestrates conversations, message handling, and feature access.
 */
class AssistantService
{
    protected RagService $ragService;

    protected AiModelService $aiModelService;

    public function __construct(RagService $ragService, AiModelService $aiModelService)
    {
        $this->ragService = $ragService;
        $this->aiModelService = $aiModelService;
    }

    /**
     * Send a message and get a response.
     *
     * @param  string  $message  User's message
     * @param  int|null  $conversationId  Existing conversation ID or null for new
     * @param  array  $context  Additional context (page, module, etc.)
     * @return array Response with message, conversation details
     */
    public function sendMessage(string $message, ?int $conversationId = null, array $context = []): array
    {
        $user = Auth::user();

        if (! $user) {
            return [
                'success' => false,
                'error' => 'User not authenticated',
            ];
        }

        // Check usage limits
        if (! $this->checkUsageLimit($user)) {
            return [
                'success' => false,
                'error' => 'Daily message limit reached. Please upgrade your plan.',
            ];
        }

        // Get or create conversation
        if ($conversationId) {
            $conversation = Conversation::where('id', $conversationId)
                ->where('user_id', $user->id)
                ->first();

            if (! $conversation) {
                return [
                    'success' => false,
                    'error' => 'Conversation not found',
                ];
            }
        } else {
            $conversation = Conversation::create([
                'user_id' => $user->id,
                'context' => $context,
                'last_message_at' => now(),
            ]);
        }

        // Save user message
        $userMessage = Message::create([
            'conversation_id' => $conversation->id,
            'role' => 'user',
            'content' => $message,
        ]);

        // Get conversation history
        $history = $this->getConversationHistory($conversation, 10);

        // Check if RAG should be used (based on plan)
        $useRag = $this->canUseRag($user);

        // Generate response
        if ($useRag) {
            $response = $this->ragService->generateRagResponse($message, $history, [
                'module_name' => $context['module'] ?? null,
            ]);
        } else {
            $response = $this->aiModelService->generateResponse(
                array_merge($history, [
                    ['role' => 'user', 'content' => $message],
                ])
            );
        }

        // Save assistant response
        $assistantMessage = Message::create([
            'conversation_id' => $conversation->id,
            'role' => 'assistant',
            'content' => $response['content'] ?? '',
            'metadata' => [
                'model' => $response['model'] ?? null,
                'tokens_used' => $response['tokens_used'] ?? 0,
                'processing_time_ms' => $response['processing_time_ms'] ?? 0,
                'used_rag' => $response['used_rag'] ?? false,
            ],
            'has_error' => ! ($response['success'] ?? true),
            'error_message' => $response['error'] ?? null,
        ]);

        // Update conversation
        $conversation->update([
            'last_message_at' => now(),
        ]);

        // Generate title if this is the first exchange
        if ($conversation->messages()->count() === 2) {
            $conversation->generateTitle();
        }

        // Log usage
        $this->logUsage($user, $conversation, 'chat', $message, $response);

        return [
            'success' => true,
            'conversation_id' => $conversation->id,
            'message_id' => $assistantMessage->id,
            'content' => $assistantMessage->content,
            'metadata' => $assistantMessage->metadata,
            'has_error' => $assistantMessage->has_error,
        ];
    }

    /**
     * Get conversation history formatted for AI model.
     */
    protected function getConversationHistory(Conversation $conversation, int $limit = 10): array
    {
        $messages = $conversation->messages()
            ->latest()
            ->take($limit)
            ->get()
            ->reverse()
            ->map(fn ($msg) => [
                'role' => $msg->role,
                'content' => $msg->content,
            ])
            ->toArray();

        return $messages;
    }

    /**
     * Get all conversations for the current user.
     */
    public function getUserConversations(bool $includeArchived = false): array
    {
        $user = Auth::user();

        if (! $user) {
            return [];
        }

        $query = Conversation::where('user_id', $user->id)
            ->with(['latestMessage']);

        if (! $includeArchived) {
            $query->active();
        }

        $conversations = $query->orderBy('last_message_at', 'desc')->get();

        return $conversations->map(function ($conversation) {
            return [
                'id' => $conversation->id,
                'title' => $conversation->title ?? 'New Conversation',
                'last_message_at' => $conversation->last_message_at?->diffForHumans(),
                'is_archived' => $conversation->is_archived,
                'message_count' => $conversation->messages()->count(),
            ];
        })->toArray();
    }

    /**
     * Get a specific conversation with messages.
     */
    public function getConversation(int $conversationId): ?array
    {
        $user = Auth::user();

        if (! $user) {
            return null;
        }

        $conversation = Conversation::with('messages')
            ->where('id', $conversationId)
            ->where('user_id', $user->id)
            ->first();

        if (! $conversation) {
            return null;
        }

        return [
            'id' => $conversation->id,
            'title' => $conversation->title,
            'context' => $conversation->context,
            'is_archived' => $conversation->is_archived,
            'messages' => $conversation->messages->map(fn ($msg) => [
                'id' => $msg->id,
                'role' => $msg->role,
                'content' => $msg->content,
                'created_at' => $msg->created_at->toIso8601String(),
                'has_error' => $msg->has_error,
            ])->toArray(),
        ];
    }

    /**
     * Check if user can use RAG features.
     */
    protected function canUseRag($user): bool
    {
        $planTier = $this->getUserPlanTier($user);
        $features = config("assistant.features.{$planTier}", []);

        return $features['rag_powered'] ?? false;
    }

    /**
     * Check if user has reached usage limit.
     */
    protected function checkUsageLimit($user): bool
    {
        $planTier = $this->getUserPlanTier($user);
        $features = config("assistant.features.{$planTier}", []);
        $maxMessages = $features['max_messages_per_day'] ?? 50;

        if ($maxMessages === -1) {
            return true; // Unlimited
        }

        $todayCount = UsageLog::where('user_id', $user->id)
            ->whereDate('created_at', today())
            ->count();

        return $todayCount < $maxMessages;
    }

    /**
     * Get user's plan tier.
     */
    protected function getUserPlanTier($user): string
    {
        // Check if running in standalone mode
        if (! config('tenancy.enabled', false)) {
            return 'standalone';
        }

        // Get tenant's subscription plan
        // This would need integration with aero-platform
        // For now, default to 'professional'
        return $user->tenant?->subscription?->plan?->code ?? 'professional';
    }

    /**
     * Log usage for analytics.
     */
    protected function logUsage($user, Conversation $conversation, string $actionType, string $query, array $response): void
    {
        UsageLog::create([
            'user_id' => $user->id,
            'conversation_id' => $conversation->id,
            'action_type' => $actionType,
            'query' => $query,
            'response' => $response['content'] ?? null,
            'tokens_used' => $response['tokens_used'] ?? 0,
            'processing_time_ms' => $response['processing_time_ms'] ?? 0,
            'used_rag' => $response['used_rag'] ?? false,
            'rag_chunks_retrieved' => $response['rag_chunks_retrieved'] ?? null,
        ]);
    }

    /**
     * Archive a conversation.
     */
    public function archiveConversation(int $conversationId): bool
    {
        $user = Auth::user();

        if (! $user) {
            return false;
        }

        $conversation = Conversation::where('id', $conversationId)
            ->where('user_id', $user->id)
            ->first();

        if ($conversation) {
            $conversation->update(['is_archived' => true]);

            return true;
        }

        return false;
    }

    /**
     * Delete a conversation.
     */
    public function deleteConversation(int $conversationId): bool
    {
        $user = Auth::user();

        if (! $user) {
            return false;
        }

        $conversation = Conversation::where('id', $conversationId)
            ->where('user_id', $user->id)
            ->first();

        if ($conversation) {
            $conversation->delete();

            return true;
        }

        return false;
    }
}
