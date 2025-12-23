import React, { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { Card, CardBody, CardHeader, Button, Chip, Skeleton } from '@heroui/react';
import { SparklesIcon, ClockIcon, ChatBubbleLeftRightIcon, ArchiveBoxIcon, TrashIcon } from '@heroicons/react/24/outline';
import { showToast } from '@/utils/toastUtils';
import ChatWindow from '../Components/ChatWindow';
import axios from 'axios';

/**
 * Assistant Index Page
 * Full page interface for the AI Assistant with conversation history
 */
export default function Index({ auth, title = 'AI Assistant' }) {
    const [conversations, setConversations] = useState([]);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Get theme radius
    const getThemeRadius = () => {
        const rootStyles = getComputedStyle(document.documentElement);
        const borderRadius = rootStyles.getPropertyValue('--borderRadius')?.trim() || '12px';
        const radiusValue = parseInt(borderRadius);
        if (radiusValue === 0) return 'none';
        if (radiusValue <= 4) return 'sm';
        if (radiusValue <= 8) return 'md';
        if (radiusValue <= 12) return 'lg';
        return 'xl';
    };

    const themeRadius = getThemeRadius();

    useEffect(() => {
        loadConversations();
    }, []);

    const loadConversations = async () => {
        setIsLoading(true);
        try {
            const response = await axios.get(route('assistant.conversations'));
            if (response.data.success) {
                setConversations(response.data.conversations);
            }
        } catch (error) {
            console.error('Failed to load conversations:', error);
            showToast.error('Failed to load conversations');
        } finally {
            setIsLoading(false);
        }
    };

    const handleNewConversation = () => {
        setSelectedConversation(null);
        setIsChatOpen(true);
    };

    const handleOpenConversation = (conversationId) => {
        setSelectedConversation(conversationId);
        setIsChatOpen(true);
    };

    const handleArchiveConversation = async (conversationId) => {
        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.post(route('assistant.archive', conversationId));
                if (response.data.success) {
                    await loadConversations();
                    resolve([response.data.message]);
                } else {
                    reject([response.data.error]);
                }
            } catch (error) {
                reject([error.response?.data?.error || 'Failed to archive conversation']);
            }
        });

        showToast.promise(promise, {
            loading: 'Archiving conversation...',
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
        });
    };

    const handleDeleteConversation = async (conversationId) => {
        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.delete(route('assistant.delete', conversationId));
                if (response.data.success) {
                    await loadConversations();
                    resolve([response.data.message]);
                } else {
                    reject([response.data.error]);
                }
            } catch (error) {
                reject([error.response?.data?.error || 'Failed to delete conversation']);
            }
        });

        showToast.promise(promise, {
            loading: 'Deleting conversation...',
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
        });
    };

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title={title} />

            <div className="py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-3 rounded-lg bg-primary/10">
                                <SparklesIcon className="w-8 h-8 text-primary" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-foreground">AI Assistant</h1>
                                <p className="text-sm text-default-500">Get help and guidance across the platform</p>
                            </div>
                        </div>
                        <Button
                            color="primary"
                            onPress={handleNewConversation}
                            startContent={<ChatBubbleLeftRightIcon className="w-5 h-5" />}
                            radius={themeRadius}
                        >
                            New Conversation
                        </Button>
                    </div>

                    {/* Conversations List */}
                    <Card className="aero-card">
                        <CardHeader className="border-b border-divider p-4">
                            <h2 className="text-lg font-semibold">Your Conversations</h2>
                        </CardHeader>
                        <CardBody className="p-4">
                            {isLoading ? (
                                <div className="space-y-3">
                                    {Array.from({ length: 3 }).map((_, i) => (
                                        <div key={i} className="flex gap-4">
                                            <Skeleton className="h-12 w-12 rounded-lg" />
                                            <div className="flex-1 space-y-2">
                                                <Skeleton className="h-4 w-3/4 rounded" />
                                                <Skeleton className="h-3 w-1/2 rounded" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : conversations.length === 0 ? (
                                <div className="text-center py-12">
                                    <ChatBubbleLeftRightIcon className="w-16 h-16 text-default-300 mx-auto mb-4" />
                                    <h3 className="text-lg font-semibold mb-2">No conversations yet</h3>
                                    <p className="text-default-500 mb-4">Start a new conversation with the AI assistant</p>
                                    <Button
                                        color="primary"
                                        onPress={handleNewConversation}
                                        radius={themeRadius}
                                    >
                                        Start Chatting
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {conversations.map((conversation) => (
                                        <div
                                            key={conversation.id}
                                            className="flex items-center gap-3 p-3 rounded-lg hover:bg-default-100 dark:hover:bg-default-50 transition-colors cursor-pointer"
                                            onClick={() => handleOpenConversation(conversation.id)}
                                        >
                                            <div className="p-2 rounded-lg bg-primary/10">
                                                <ChatBubbleLeftRightIcon className="w-5 h-5 text-primary" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-medium truncate">{conversation.title}</h3>
                                                <div className="flex items-center gap-2 text-sm text-default-500">
                                                    <ClockIcon className="w-4 h-4" />
                                                    <span>{conversation.last_message_at}</span>
                                                    <span>•</span>
                                                    <span>{conversation.message_count} messages</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {conversation.is_archived && (
                                                    <Chip size="sm" variant="flat" color="warning">
                                                        Archived
                                                    </Chip>
                                                )}
                                                <Button
                                                    isIconOnly
                                                    size="sm"
                                                    variant="light"
                                                    onPress={(e) => {
                                                        e.stopPropagation();
                                                        handleArchiveConversation(conversation.id);
                                                    }}
                                                >
                                                    <ArchiveBoxIcon className="w-5 h-5" />
                                                </Button>
                                                <Button
                                                    isIconOnly
                                                    size="sm"
                                                    variant="light"
                                                    color="danger"
                                                    onPress={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteConversation(conversation.id);
                                                    }}
                                                >
                                                    <TrashIcon className="w-5 h-5" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardBody>
                    </Card>
                </div>
            </div>

            {/* Chat Window */}
            <ChatWindow
                isOpen={isChatOpen}
                onClose={() => {
                    setIsChatOpen(false);
                    loadConversations(); // Refresh list when closing
                }}
                conversationId={selectedConversation}
            />
        </AuthenticatedLayout>
    );
}
