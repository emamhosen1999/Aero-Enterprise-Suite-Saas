import React, { useState, useCallback, useMemo } from 'react';
import { Button, Tooltip, Divider } from "@heroui/react";
import {
    BoldIcon,
    ItalicIcon,
    UnderlineIcon,
    ListBulletIcon,
    CodeBracketIcon,
    LinkIcon,
    PhotoIcon,
} from "@heroicons/react/24/outline";

/**
 * Simple Rich Text Editor using contentEditable
 * For production, consider using TipTap, Slate, or Quill
 */
const RichTextEditor = ({
    value = '',
    onChange,
    label,
    placeholder = 'Start typing...',
    required = false,
    minHeight = 200,
    maxHeight = 500,
    toolbar = ['bold', 'italic', 'underline', 'divider', 'ul', 'ol', 'divider', 'link', 'code'],
}) => {
    const [isFocused, setIsFocused] = useState(false);

    // Execute formatting command
    const execCommand = useCallback((command, value = null) => {
        document.execCommand(command, false, value);
    }, []);

    // Handle content change
    const handleInput = useCallback((e) => {
        const html = e.target.innerHTML;
        onChange(html);
    }, [onChange]);

    // Handle paste - strip formatting if shift not held
    const handlePaste = useCallback((e) => {
        e.preventDefault();
        const text = e.clipboardData.getData('text/plain');
        document.execCommand('insertText', false, text);
    }, []);

    // Insert link
    const handleLink = useCallback(() => {
        const url = prompt('Enter URL:');
        if (url) {
            execCommand('createLink', url);
        }
    }, [execCommand]);

    // Toolbar buttons configuration
    const toolbarButtons = useMemo(() => ({
        bold: {
            icon: <BoldIcon className="w-4 h-4" />,
            label: 'Bold',
            command: () => execCommand('bold'),
            shortcut: 'Ctrl+B',
        },
        italic: {
            icon: <ItalicIcon className="w-4 h-4" />,
            label: 'Italic',
            command: () => execCommand('italic'),
            shortcut: 'Ctrl+I',
        },
        underline: {
            icon: <UnderlineIcon className="w-4 h-4" />,
            label: 'Underline',
            command: () => execCommand('underline'),
            shortcut: 'Ctrl+U',
        },
        ul: {
            icon: <ListBulletIcon className="w-4 h-4" />,
            label: 'Bullet List',
            command: () => execCommand('insertUnorderedList'),
        },
        ol: {
            icon: (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
                    <text x="1" y="8" fontSize="6" fill="currentColor">1</text>
                    <text x="1" y="14" fontSize="6" fill="currentColor">2</text>
                    <text x="1" y="20" fontSize="6" fill="currentColor">3</text>
                </svg>
            ),
            label: 'Numbered List',
            command: () => execCommand('insertOrderedList'),
        },
        link: {
            icon: <LinkIcon className="w-4 h-4" />,
            label: 'Insert Link',
            command: handleLink,
            shortcut: 'Ctrl+K',
        },
        code: {
            icon: <CodeBracketIcon className="w-4 h-4" />,
            label: 'Code',
            command: () => {
                const selection = window.getSelection();
                if (selection.rangeCount > 0) {
                    const range = selection.getRangeAt(0);
                    const code = document.createElement('code');
                    code.className = 'bg-default-200 px-1 rounded font-mono text-sm';
                    range.surroundContents(code);
                }
            },
        },
        h1: {
            icon: <span className="font-bold text-sm">H1</span>,
            label: 'Heading 1',
            command: () => execCommand('formatBlock', 'h1'),
        },
        h2: {
            icon: <span className="font-bold text-sm">H2</span>,
            label: 'Heading 2',
            command: () => execCommand('formatBlock', 'h2'),
        },
        h3: {
            icon: <span className="font-bold text-sm">H3</span>,
            label: 'Heading 3',
            command: () => execCommand('formatBlock', 'h3'),
        },
        paragraph: {
            icon: <span className="text-sm">¶</span>,
            label: 'Paragraph',
            command: () => execCommand('formatBlock', 'p'),
        },
        blockquote: {
            icon: (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
            ),
            label: 'Quote',
            command: () => execCommand('formatBlock', 'blockquote'),
        },
        clear: {
            icon: (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
            ),
            label: 'Clear Formatting',
            command: () => execCommand('removeFormat'),
        },
    }), [execCommand, handleLink]);

    return (
        <div className="space-y-2">
            {label && (
                <label className="text-sm font-medium text-default-700">
                    {label}
                    {required && <span className="text-danger ml-1">*</span>}
                </label>
            )}

            <div
                className={`border-2 rounded-lg overflow-hidden transition-colors ${
                    isFocused ? 'border-primary' : 'border-default-200'
                }`}
            >
                {/* Toolbar */}
                <div className="flex items-center gap-1 p-2 bg-default-100 border-b border-default-200 flex-wrap">
                    {toolbar.map((item, index) => {
                        if (item === 'divider') {
                            return (
                                <Divider
                                    key={`divider-${index}`}
                                    orientation="vertical"
                                    className="h-6 mx-1"
                                />
                            );
                        }

                        const button = toolbarButtons[item];
                        if (!button) return null;

                        return (
                            <Tooltip
                                key={item}
                                content={
                                    <span>
                                        {button.label}
                                        {button.shortcut && (
                                            <span className="text-default-400 ml-2">
                                                {button.shortcut}
                                            </span>
                                        )}
                                    </span>
                                }
                                delay={500}
                            >
                                <Button
                                    isIconOnly
                                    size="sm"
                                    variant="light"
                                    onPress={button.command}
                                    className="min-w-8 h-8"
                                >
                                    {button.icon}
                                </Button>
                            </Tooltip>
                        );
                    })}
                </div>

                {/* Editor */}
                <div
                    contentEditable
                    suppressContentEditableWarning
                    className="p-4 outline-none prose prose-sm max-w-none"
                    style={{ minHeight, maxHeight, overflowY: 'auto' }}
                    onInput={handleInput}
                    onPaste={handlePaste}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    dangerouslySetInnerHTML={{ __html: value }}
                    data-placeholder={placeholder}
                />
            </div>

            <style>{`
                [contenteditable]:empty:before {
                    content: attr(data-placeholder);
                    color: var(--heroui-default-400);
                    pointer-events: none;
                }

                [contenteditable] h1 {
                    font-size: 1.5rem;
                    font-weight: 700;
                    margin: 0.5em 0;
                }

                [contenteditable] h2 {
                    font-size: 1.25rem;
                    font-weight: 600;
                    margin: 0.5em 0;
                }

                [contenteditable] h3 {
                    font-size: 1.1rem;
                    font-weight: 600;
                    margin: 0.5em 0;
                }

                [contenteditable] p {
                    margin: 0.5em 0;
                }

                [contenteditable] ul,
                [contenteditable] ol {
                    margin: 0.5em 0;
                    padding-left: 1.5em;
                }

                [contenteditable] li {
                    margin: 0.25em 0;
                }

                [contenteditable] blockquote {
                    border-left: 3px solid var(--heroui-default-300);
                    padding-left: 1em;
                    margin: 0.5em 0;
                    color: var(--heroui-default-600);
                    font-style: italic;
                }

                [contenteditable] a {
                    color: var(--heroui-primary);
                    text-decoration: underline;
                }

                [contenteditable] code {
                    background: var(--heroui-default-200);
                    padding: 0.1em 0.3em;
                    border-radius: 0.25em;
                    font-family: monospace;
                    font-size: 0.9em;
                }
            `}</style>
        </div>
    );
};

export default RichTextEditor;
