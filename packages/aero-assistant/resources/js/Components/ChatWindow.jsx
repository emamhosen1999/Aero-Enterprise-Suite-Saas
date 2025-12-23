import React, { useState, useEffect, useRef } from 'react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input, Spinner, Avatar, Chip } from '@heroui/react';
import { PaperAirplaneIcon, XMarkIcon, TrashIcon, ArchiveBoxIcon } from '@heroicons/react/24/outline';
import { SparklesIcon } from '@heroicons/react/24/solid';
import { router } from '@inertiajs/react';
import axios from 'axios';
import { showToast } from '@/utils/toastUtils';

/**
 * Chat Window Component
 * Main chat interface for the AI Assistant
 */
export default function ChatWindow({ isOpen, onClose, conversationId: initialConversationId = null }) {
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [conversationId, setConversationId] = useState(initialConversationId);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

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

    // Load existing conversation if provided
    useEffect(() => {
        if (isOpen && conversationId) {
            loadConversation(conversationId);
        }
    }, [isOpen, conversationId]);

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Focus input when modal opens
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const loadConversation = async (id) => {
        try {
            const response = await axios.get(route('assistant.conversation', id));
            if (response.data.success) {
                setMessages(response.data.conversation.messages);
            }
        } catch (error) {
            console.error('Failed to load conversation:', error);
            showToast.error('Failed to load conversation');
        }
    };

    const handleSendMessage = async () => {
        if (!inputMessage.trim() || isLoading) return;

        const userMessage = inputMessage;
        setInputMessage('');

        // Add user message to UI immediately
        const userMsg = {
            id: Date.now(),
            role: 'user',
            content: userMessage,
            created_at: new Date().toISOString(),
        };
        setMessages(prev => [...prev, userMsg]);

        setIsLoading(true);

        try {
            const response = await axios.post(route('assistant.send_message'), {
                message: userMessage,
                conversation_id: conversationId,
                context: {
                    page: window.location.pathname,
                    module: window.location.pathname.split('/')[1],
                },
            });

            if (response.data.success) {
                // Update conversation ID if this was a new conversation
                if (!conversationId) {
                    setConversationId(response.data.conversation_id);
                }

                // Add assistant response
                const assistantMsg = {
                    id: response.data.message_id,
                    role: 'assistant',
                    content: response.data.content,
                    created_at: new Date().toISOString(),
                    has_error: response.data.has_error,
                };
                setMessages(prev => [...prev, assistantMsg]);
            } else {
                showToast.error(response.data.error || 'Failed to send message');
            }
        } catch (error) {
            console.error('Failed to send message:', error);
            showToast.error(error.response?.data?.error || 'Failed to send message');
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const handleNewConversation = () => {
        setMessages([]);
        setConversationId(null);
        setInputMessage('');
        inputRef.current?.focus();
    };

    return (
        <Modal
            isOpen={isOpen}
            onOpenChange={onClose}
            size="3xl"
            scrollBehavior="inside"
            classNames={{
                base: "bg-content1",
                header: "border-b border-divider",
                body: "p-0",
                footer: "border-t border-divider"
            }}
        >
            <ModalContent>
                <ModalHeader className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <SparklesIcon className="w-6 h-6 text-primary" />
                        <h2 className="text-lg font-semibold">AI Assistant</h2>
                    </div>
                    <div className="flex items-center gap-2">
                        {conversationId && (
                            <Button
                                size="sm"
                                variant="flat"
                                onPress={handleNewConversation}
                                startContent={<PaperAirplaneIcon className="w-4 h-4" />}
                            >
                                New Chat
                            </Button>
                        )}
                    </div>
                </ModalHeader>

                <ModalBody>
                    <div className="flex flex-col h-[500px]">
                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {messages.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-center">
                                    <SparklesIcon className="w-16 h-16 text-primary/30 mb-4" />
                                    <h3 className="text-xl font-semibold mb-2">Welcome to Aero Assistant</h3>
                                    <p className="text-default-500 max-w-md">
                                        I'm here to help you navigate the platform, answer questions, and perform tasks.
                                        Try asking me about features, how to do something, or request assistance with your work.
                                    </p>
                                </div>
                            ) : (
                                messages.map((message) => (
                                    <div
                                        key={message.id}
                                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div className={`flex gap-3 max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                            <Avatar
                                                size="sm"
                                                icon={message.role === 'assistant' ? <SparklesIcon className="w-4 h-4" /> : undefined}
                                                className={message.role === 'assistant' ? 'bg-primary text-white' : 'bg-default-200'}
                                            />
                                            <div className={`rounded-lg p-3 ${
                                                message.role === 'user'
                                                    ? 'bg-primary text-white'
                                                    : message.has_error
                                                        ? 'bg-danger-50 dark:bg-danger-900/20 text-danger'
                                                        : 'bg-default-100 dark:bg-default-50'
                                            }`}>
                                                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                            {isLoading && (
                                <div className="flex justify-start">
                                    <div className="flex gap-3 max-w-[80%]">
                                        <Avatar
                                            size="sm"
                                            icon={<SparklesIcon className="w-4 h-4" />}
                                            className="bg-primary text-white"
                                        />
                                        <div className="rounded-lg p-3 bg-default-100 dark:bg-default-50">
                                            <div className="flex items-center gap-2">
                                                <Spinner size="sm" />
                                                <span className="text-sm text-default-500">Thinking...</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-4 border-t border-divider">
                            <div className="flex gap-2">
                                <Input
                                    ref={inputRef}
                                    placeholder="Ask me anything..."
                                    value={inputMessage}
                                    onValueChange={setInputMessage}
                                    onKeyPress={handleKeyPress}
                                    disabled={isLoading}
                                    radius={themeRadius}
                                    classNames={{
                                        inputWrapper: "bg-default-100"
                                    }}
                                />
                                <Button
                                    isIconOnly
                                    color="primary"
                                    onPress={handleSendMessage}
                                    isDisabled={!inputMessage.trim() || isLoading}
                                    radius={themeRadius}
                                >
                                    <PaperAirplaneIcon className="w-5 h-5" />
                                </Button>
                            </div>
                            <p className="text-xs text-default-400 mt-2">
                                Press Enter to send, Shift + Enter for new line
                            </p>
                        </div>
                    </div>
                </ModalBody>
            </ModalContent>
        </Modal>
    );
}
