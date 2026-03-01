<?php

namespace Aero\Assistant\Http\Controllers;

use Aero\Assistant\Services\AssistantService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Validator;

class AssistantController extends Controller
{
    protected AssistantService $assistantService;

    public function __construct(AssistantService $assistantService)
    {
        $this->assistantService = $assistantService;
        $this->middleware('auth');
    }

    /**
     * Send a message to the assistant.
     */
    public function sendMessage(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'message' => 'required|string|max:2000',
            'conversation_id' => 'nullable|integer|exists:assistant_conversations,id',
            'context' => 'nullable|array',
            'context.page' => 'nullable|string',
            'context.module' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        $result = $this->assistantService->sendMessage(
            $request->input('message'),
            $request->input('conversation_id'),
            $request->input('context', [])
        );

        return response()->json($result, $result['success'] ? 200 : 400);
    }

    /**
     * Get all conversations for the current user.
     */
    public function getConversations(Request $request): JsonResponse
    {
        $includeArchived = $request->boolean('include_archived', false);
        $conversations = $this->assistantService->getUserConversations($includeArchived);

        return response()->json([
            'success' => true,
            'conversations' => $conversations,
        ]);
    }

    /**
     * Get a specific conversation with messages.
     */
    public function getConversation(int $conversationId): JsonResponse
    {
        $conversation = $this->assistantService->getConversation($conversationId);

        if (! $conversation) {
            return response()->json([
                'success' => false,
                'error' => 'Conversation not found',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'conversation' => $conversation,
        ]);
    }

    /**
     * Archive a conversation.
     */
    public function archiveConversation(int $conversationId): JsonResponse
    {
        $success = $this->assistantService->archiveConversation($conversationId);

        if (! $success) {
            return response()->json([
                'success' => false,
                'error' => 'Conversation not found',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'Conversation archived successfully',
        ]);
    }

    /**
     * Delete a conversation.
     */
    public function deleteConversation(int $conversationId): JsonResponse
    {
        $success = $this->assistantService->deleteConversation($conversationId);

        if (! $success) {
            return response()->json([
                'success' => false,
                'error' => 'Conversation not found',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'Conversation deleted successfully',
        ]);
    }
}
