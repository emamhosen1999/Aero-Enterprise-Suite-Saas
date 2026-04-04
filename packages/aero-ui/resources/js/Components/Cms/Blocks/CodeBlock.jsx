import React, { useState } from 'react';
import { Button } from '@heroui/react';
import { DocumentDuplicateIcon, CheckIcon } from '@heroicons/react/24/outline';

const CodeBlock = ({ data = {} }) => {
    const {
        title = '',
        code = '',
        language = 'javascript',
        showLineNumbers = true,
        copyable = true
    } = data;

    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const lines = code.split('\n');

    return (
        <div>
            {title && <h3 className="text-lg font-semibold mb-2">{title}</h3>}

            <div className="relative bg-slate-900 text-slate-100 rounded-lg overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-2 bg-slate-800 border-b border-slate-700">
                    <span className="text-xs font-mono text-slate-400 uppercase">{language}</span>
                    {copyable && (
                        <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            onPress={handleCopy}
                            className="text-slate-400 hover:text-white"
                        >
                            {copied ? <CheckIcon className="w-4 h-4" /> : <DocumentDuplicateIcon className="w-4 h-4" />}
                        </Button>
                    )}
                </div>

                {/* Code */}
                <pre className="p-4 overflow-x-auto text-sm font-mono">
                    {lines.map((line, idx) => (
                        <div key={idx} className="flex gap-4">
                            {showLineNumbers && (
                                <span className="text-slate-500 select-none min-w-[2rem] text-right">
                                    {idx + 1}
                                </span>
                            )}
                            <span>{line}</span>
                        </div>
                    ))}
                </pre>
            </div>
        </div>
    );
};

export default CodeBlock;
