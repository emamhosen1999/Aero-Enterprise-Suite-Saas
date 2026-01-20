import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Card, CardBody, Button, Tooltip, Chip } from "@heroui/react";
import {
    DocumentDuplicateIcon,
    CheckIcon,
    CodeBracketIcon,
} from "@heroicons/react/24/outline";

/**
 * CodeBlock Component
 * 
 * Displays formatted code snippets with syntax highlighting colors,
 * line numbers, and copy functionality.
 */
const CodeBlock = ({ content = {} }) => {
    const {
        code = '',
        language = 'javascript',
        title = '',
        showLineNumbers = true,
        showCopyButton = true,
        highlightLines = [], // Array of line numbers to highlight
        maxHeight = 400,
        theme = 'dark', // 'dark', 'light'
    } = content;

    const [copied, setCopied] = useState(false);

    // Copy to clipboard
    const handleCopy = useCallback(async () => {
        try {
            await navigator.clipboard.writeText(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    }, [code]);

    // Language display names
    const languageLabels = {
        javascript: 'JavaScript',
        typescript: 'TypeScript',
        jsx: 'JSX',
        tsx: 'TSX',
        python: 'Python',
        php: 'PHP',
        ruby: 'Ruby',
        java: 'Java',
        csharp: 'C#',
        cpp: 'C++',
        c: 'C',
        go: 'Go',
        rust: 'Rust',
        swift: 'Swift',
        kotlin: 'Kotlin',
        html: 'HTML',
        css: 'CSS',
        scss: 'SCSS',
        json: 'JSON',
        yaml: 'YAML',
        xml: 'XML',
        sql: 'SQL',
        bash: 'Bash',
        shell: 'Shell',
        powershell: 'PowerShell',
        markdown: 'Markdown',
        graphql: 'GraphQL',
        dockerfile: 'Dockerfile',
    };

    // Language colors for the badge
    const languageColors = {
        javascript: '#F7DF1E',
        typescript: '#3178C6',
        jsx: '#61DAFB',
        tsx: '#3178C6',
        python: '#3776AB',
        php: '#777BB4',
        ruby: '#CC342D',
        java: '#007396',
        csharp: '#239120',
        cpp: '#00599C',
        go: '#00ADD8',
        rust: '#DEA584',
        swift: '#FA7343',
        kotlin: '#7F52FF',
        html: '#E34F26',
        css: '#1572B6',
        scss: '#CC6699',
        json: '#000000',
        yaml: '#CB171E',
        sql: '#4479A1',
        bash: '#4EAA25',
        graphql: '#E10098',
    };

    // Theme colors
    const themes = {
        dark: {
            bg: '#1E1E2E',
            headerBg: '#181825',
            text: '#CDD6F4',
            lineNumber: '#6C7086',
            highlightBg: '#45475A',
            border: '#313244',
        },
        light: {
            bg: '#FAFAFA',
            headerBg: '#F4F4F5',
            text: '#3F3F46',
            lineNumber: '#A1A1AA',
            highlightBg: '#E4E4E7',
            border: '#E4E4E7',
        },
    };

    const currentTheme = themes[theme] || themes.dark;

    // Split code into lines
    const lines = code.split('\n');

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
        >
            <Card
                className="overflow-hidden shadow-lg"
                style={{
                    backgroundColor: currentTheme.bg,
                    borderColor: currentTheme.border,
                }}
            >
                {/* Header */}
                <div
                    className="flex items-center justify-between px-4 py-2 border-b"
                    style={{
                        backgroundColor: currentTheme.headerBg,
                        borderColor: currentTheme.border,
                    }}
                >
                    <div className="flex items-center gap-3">
                        {/* Window Controls */}
                        <div className="flex gap-1.5">
                            <div className="w-3 h-3 rounded-full bg-[#FF5F56]" />
                            <div className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
                            <div className="w-3 h-3 rounded-full bg-[#27C93F]" />
                        </div>

                        {/* Title or Language */}
                        {title ? (
                            <span
                                className="text-sm font-medium"
                                style={{ color: currentTheme.text }}
                            >
                                {title}
                            </span>
                        ) : (
                            <div className="flex items-center gap-2">
                                <CodeBracketIcon
                                    className="w-4 h-4"
                                    style={{ color: currentTheme.lineNumber }}
                                />
                                <span
                                    className="text-sm"
                                    style={{ color: currentTheme.lineNumber }}
                                >
                                    {languageLabels[language] || language}
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Language Badge */}
                        <Chip
                            size="sm"
                            variant="flat"
                            className="text-xs"
                            style={{
                                backgroundColor: (languageColors[language] || '#666') + '20',
                                color: languageColors[language] || currentTheme.text,
                            }}
                        >
                            {languageLabels[language] || language}
                        </Chip>

                        {/* Copy Button */}
                        {showCopyButton && (
                            <Tooltip content={copied ? 'Copied!' : 'Copy code'}>
                                <Button
                                    isIconOnly
                                    size="sm"
                                    variant="light"
                                    onPress={handleCopy}
                                    className="min-w-8 h-8"
                                >
                                    {copied ? (
                                        <CheckIcon className="w-4 h-4 text-success" />
                                    ) : (
                                        <DocumentDuplicateIcon
                                            className="w-4 h-4"
                                            style={{ color: currentTheme.lineNumber }}
                                        />
                                    )}
                                </Button>
                            </Tooltip>
                        )}
                    </div>
                </div>

                {/* Code Content */}
                <CardBody
                    className="p-0 overflow-auto font-mono text-sm"
                    style={{ maxHeight }}
                >
                    <pre className="m-0 p-4">
                        <code>
                            {lines.map((line, index) => {
                                const lineNumber = index + 1;
                                const isHighlighted = highlightLines.includes(lineNumber);

                                return (
                                    <div
                                        key={index}
                                        className="flex"
                                        style={{
                                            backgroundColor: isHighlighted
                                                ? currentTheme.highlightBg
                                                : 'transparent',
                                            marginLeft: isHighlighted ? '-1rem' : 0,
                                            marginRight: isHighlighted ? '-1rem' : 0,
                                            paddingLeft: isHighlighted ? '1rem' : 0,
                                            paddingRight: isHighlighted ? '1rem' : 0,
                                        }}
                                    >
                                        {/* Line Number */}
                                        {showLineNumbers && (
                                            <span
                                                className="select-none pr-4 text-right"
                                                style={{
                                                    color: currentTheme.lineNumber,
                                                    minWidth: `${String(lines.length).length + 1}ch`,
                                                }}
                                            >
                                                {lineNumber}
                                            </span>
                                        )}

                                        {/* Code Line */}
                                        <span
                                            style={{ color: currentTheme.text }}
                                            dangerouslySetInnerHTML={{
                                                __html: escapeHtml(line) || ' ',
                                            }}
                                        />
                                    </div>
                                );
                            })}
                        </code>
                    </pre>
                </CardBody>
            </Card>
        </motion.div>
    );
};

// Helper to escape HTML
const escapeHtml = (str) => {
    const htmlEscapes = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
    };
    return str.replace(/[&<>"']/g, (char) => htmlEscapes[char]);
};

export default CodeBlock;
