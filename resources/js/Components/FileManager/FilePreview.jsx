import React from 'react';
import { 
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    Chip
} from '@heroui/react';
import { 
    ArrowDownTrayIcon,
    XMarkIcon,
    DocumentIcon,
    ArrowLeftIcon,
    ArrowRightIcon
} from '@heroicons/react/24/outline';

/**
 * Format file size
 */
const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
};

/**
 * File Preview Modal
 * 
 * A modal component for previewing various file types including
 * images, videos, audio, PDFs, and documents.
 */
export default function FilePreview({ 
    file,
    isOpen,
    onClose,
    onDownload,
    onPrevious,
    onNext,
    hasPrevious = false,
    hasNext = false
}) {
    if (!file) return null;

    const mimeType = file.mime_type || '';
    const isImage = mimeType.startsWith('image/');
    const isVideo = mimeType.startsWith('video/');
    const isAudio = mimeType.startsWith('audio/');
    const isPdf = mimeType.includes('pdf');
    const isPreviewable = isImage || isVideo || isAudio || isPdf;

    const renderPreview = () => {
        if (isImage) {
            return (
                <div className="flex items-center justify-center bg-black/5 dark:bg-white/5 rounded-lg p-4 min-h-[400px]">
                    <img
                        src={file.url}
                        alt={file.name}
                        className="max-w-full max-h-[60vh] object-contain rounded-lg shadow-lg"
                    />
                </div>
            );
        }

        if (isVideo) {
            return (
                <div className="flex items-center justify-center bg-black rounded-lg overflow-hidden min-h-[400px]">
                    <video
                        src={file.url}
                        controls
                        autoPlay
                        className="max-w-full max-h-[60vh]"
                    >
                        Your browser does not support the video tag.
                    </video>
                </div>
            );
        }

        if (isAudio) {
            return (
                <div className="flex flex-col items-center justify-center bg-gradient-to-br from-primary-100 to-secondary-100 dark:from-primary-900/30 dark:to-secondary-900/30 rounded-lg p-8 min-h-[300px]">
                    <div className="w-32 h-32 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center shadow-lg mb-6">
                        <svg className="w-16 h-16 text-primary" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                        </svg>
                    </div>
                    <audio
                        src={file.url}
                        controls
                        autoPlay
                        className="w-full max-w-md"
                    >
                        Your browser does not support the audio element.
                    </audio>
                </div>
            );
        }

        if (isPdf) {
            return (
                <div className="rounded-lg overflow-hidden min-h-[600px]">
                    <iframe
                        src={`${file.url}#toolbar=1&navpanes=0`}
                        title={file.name}
                        className="w-full h-[60vh] border-0"
                    />
                </div>
            );
        }

        // Non-previewable file
        return (
            <div className="flex flex-col items-center justify-center bg-default-50 dark:bg-default-100 rounded-lg p-12 min-h-[300px]">
                <DocumentIcon className="w-24 h-24 text-default-300 mb-4" />
                <p className="text-lg font-medium text-default-700 mb-2">
                    Preview not available
                </p>
                <p className="text-sm text-default-500 mb-6">
                    This file type cannot be previewed in the browser.
                </p>
                <Button
                    color="primary"
                    startContent={<ArrowDownTrayIcon className="w-4 h-4" />}
                    onPress={() => onDownload?.(file)}
                >
                    Download File
                </Button>
            </div>
        );
    };

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose}
            size="5xl"
            scrollBehavior="inside"
            classNames={{
                backdrop: "bg-black/80",
            }}
        >
            <ModalContent>
                <ModalHeader className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold truncate">{file.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                            <Chip size="sm" variant="flat">
                                {mimeType || 'Unknown type'}
                            </Chip>
                            <Chip size="sm" variant="flat">
                                {formatFileSize(file.size)}
                            </Chip>
                            {file.created_at && (
                                <span className="text-xs text-default-400">
                                    {new Date(file.created_at).toLocaleDateString()}
                                </span>
                            )}
                        </div>
                    </div>
                </ModalHeader>
                
                <ModalBody className="py-4">
                    {renderPreview()}
                </ModalBody>

                <ModalFooter className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {hasPrevious && (
                            <Button
                                isIconOnly
                                variant="flat"
                                onPress={onPrevious}
                            >
                                <ArrowLeftIcon className="w-4 h-4" />
                            </Button>
                        )}
                        {hasNext && (
                            <Button
                                isIconOnly
                                variant="flat"
                                onPress={onNext}
                            >
                                <ArrowRightIcon className="w-4 h-4" />
                            </Button>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="flat"
                            startContent={<ArrowDownTrayIcon className="w-4 h-4" />}
                            onPress={() => onDownload?.(file)}
                        >
                            Download
                        </Button>
                        <Button
                            variant="light"
                            onPress={onClose}
                        >
                            Close
                        </Button>
                    </div>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}
