import React, { useState } from 'react';
import { Button, Badge } from '@heroui/react';
import { SparklesIcon } from '@heroicons/react/24/solid';
import ChatWindow from './ChatWindow';

/**
 * Floating Assistant Button
 * Displays a fixed button in the bottom-right corner to open the assistant
 */
export default function FloatingAssistantButton({ className = '' }) {
    const [isChatOpen, setIsChatOpen] = useState(false);

    return (
        <>
            {/* Floating Button */}
            <div className={`fixed bottom-6 right-6 z-50 ${className}`}>
                <Button
                    isIconOnly
                    color="primary"
                    size="lg"
                    className="w-14 h-14 shadow-lg hover:shadow-xl transition-shadow"
                    onPress={() => setIsChatOpen(true)}
                    aria-label="Open AI Assistant"
                >
                    <SparklesIcon className="w-6 h-6" />
                </Button>
            </div>

            {/* Chat Window Modal */}
            <ChatWindow
                isOpen={isChatOpen}
                onClose={() => setIsChatOpen(false)}
            />
        </>
    );
}
