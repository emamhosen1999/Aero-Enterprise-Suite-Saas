import { useState, useCallback, useRef } from 'react';
import axios from 'axios';

/**
 * @typedef {Object} UploadProgress
 * @property {number} progress - Overall progress percentage (0-100)
 * @property {number} uploadedChunks - Number of chunks uploaded
 * @property {number} totalChunks - Total chunks to upload
 * @property {number} uploadedSize - Bytes uploaded
 * @property {number} totalSize - Total file size in bytes
 * @property {'idle'|'initializing'|'uploading'|'assembling'|'completed'|'error'|'paused'} status
 * @property {string|null} error - Error message if any
 */

/**
 * @typedef {Object} ChunkedUploadOptions
 * @property {number} [chunkSize=1048576] - Chunk size in bytes (default 1MB)
 * @property {number} [maxConcurrent=3] - Maximum concurrent uploads
 * @property {number} [maxRetries=3] - Maximum retries per chunk
 * @property {(progress: UploadProgress) => void} [onProgress] - Progress callback
 * @property {(result: object) => void} [onComplete] - Completion callback
 * @property {(error: Error) => void} [onError] - Error callback
 */

const DEFAULT_CHUNK_SIZE = 1024 * 1024; // 1MB
const MAX_CONCURRENT = 3;
const MAX_RETRIES = 3;

/**
 * Hook for handling chunked file uploads with resume capability.
 * @param {ChunkedUploadOptions} options
 */
export function useChunkedUpload(options = {}) {
    const {
        chunkSize = DEFAULT_CHUNK_SIZE,
        maxConcurrent = MAX_CONCURRENT,
        maxRetries = MAX_RETRIES,
        onProgress,
        onComplete,
        onError,
    } = options;

    const [progress, setProgress] = useState({
        progress: 0,
        uploadedChunks: 0,
        totalChunks: 0,
        uploadedSize: 0,
        totalSize: 0,
        status: 'idle',
        error: null,
    });

    const uploadIdRef = useRef(null);
    const isPausedRef = useRef(false);
    const abortControllerRef = useRef(null);

    const updateProgress = useCallback((updates) => {
        setProgress(prev => {
            const newProgress = { ...prev, ...updates };
            onProgress?.(newProgress);
            return newProgress;
        });
    }, [onProgress]);

    /**
     * Upload a single chunk with retry logic.
     */
    const uploadChunk = async (file, uploadId, chunkIndex, retriesLeft = maxRetries) => {
        if (isPausedRef.current) {
            throw new Error('Upload paused');
        }

        const start = chunkIndex * chunkSize;
        const end = Math.min(start + chunkSize, file.size);
        const chunk = file.slice(start, end);

        const formData = new FormData();
        formData.append('upload_id', uploadId);
        formData.append('chunk_index', chunkIndex);
        formData.append('chunk', chunk);

        try {
            const response = await axios.post(route('dms.upload.chunk'), formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                signal: abortControllerRef.current?.signal,
            });

            return response.data;
        } catch (error) {
            if (axios.isCancel(error)) {
                throw error;
            }

            if (retriesLeft > 0) {
                // Exponential backoff
                const delay = Math.pow(2, maxRetries - retriesLeft) * 1000;
                await new Promise(resolve => setTimeout(resolve, delay));
                return uploadChunk(file, uploadId, chunkIndex, retriesLeft - 1);
            }

            throw error;
        }
    };

    /**
     * Upload a file with chunking support.
     * @param {File} file - The file to upload
     * @param {Object} [metadata] - Optional metadata
     * @returns {Promise<Object>} - Upload result
     */
    const upload = useCallback(async (file, metadata = {}) => {
        if (progress.status === 'uploading') {
            throw new Error('Upload already in progress');
        }

        isPausedRef.current = false;
        abortControllerRef.current = new AbortController();

        const totalChunks = Math.ceil(file.size / chunkSize);
        
        updateProgress({
            status: 'initializing',
            progress: 0,
            uploadedChunks: 0,
            totalChunks,
            uploadedSize: 0,
            totalSize: file.size,
            error: null,
        });

        try {
            // Initialize upload
            const initResponse = await axios.post(route('dms.upload.init'), {
                filename: file.name,
                total_size: file.size,
                total_chunks: totalChunks,
                mime_type: file.type,
                ...metadata,
            });

            if (!initResponse.data.success) {
                throw new Error(initResponse.data.message || 'Failed to initialize upload');
            }

            const uploadId = initResponse.data.data.upload_id;
            uploadIdRef.current = uploadId;

            updateProgress({ status: 'uploading' });

            // Upload chunks with concurrency control
            const chunkIndices = Array.from({ length: totalChunks }, (_, i) => i);
            let uploadedChunks = 0;
            let uploadedSize = 0;

            // Process chunks in batches
            for (let i = 0; i < chunkIndices.length; i += maxConcurrent) {
                if (isPausedRef.current) {
                    break;
                }

                const batch = chunkIndices.slice(i, i + maxConcurrent);
                const promises = batch.map(async (chunkIndex) => {
                    const result = await uploadChunk(file, uploadId, chunkIndex);
                    
                    uploadedChunks++;
                    const chunkStart = chunkIndex * chunkSize;
                    const chunkEnd = Math.min(chunkStart + chunkSize, file.size);
                    uploadedSize += (chunkEnd - chunkStart);

                    updateProgress({
                        progress: Math.round((uploadedChunks / totalChunks) * 100),
                        uploadedChunks,
                        uploadedSize,
                    });

                    return result;
                });

                await Promise.all(promises);
            }

            if (isPausedRef.current) {
                updateProgress({ status: 'paused' });
                return { status: 'paused', uploadId };
            }

            // Assemble chunks
            updateProgress({ status: 'assembling' });

            const assembleResponse = await axios.post(route('dms.upload.assemble'), {
                upload_id: uploadId,
            });

            if (!assembleResponse.data.success) {
                throw new Error(assembleResponse.data.message || 'Failed to assemble file');
            }

            const result = {
                status: 'completed',
                ...assembleResponse.data.data,
            };

            updateProgress({
                status: 'completed',
                progress: 100,
            });

            onComplete?.(result);
            return result;

        } catch (error) {
            if (axios.isCancel(error)) {
                return { status: 'cancelled' };
            }

            const errorMessage = error.response?.data?.message || error.message;
            updateProgress({
                status: 'error',
                error: errorMessage,
            });
            onError?.(error);
            throw error;
        }
    }, [chunkSize, maxConcurrent, updateProgress, onComplete, onError]);

    /**
     * Pause an active upload.
     */
    const pause = useCallback(() => {
        isPausedRef.current = true;
        updateProgress({ status: 'paused' });
    }, [updateProgress]);

    /**
     * Resume a paused upload.
     * @param {File} file - The original file
     */
    const resume = useCallback(async (file) => {
        const uploadId = uploadIdRef.current;
        
        if (!uploadId) {
            throw new Error('No upload to resume');
        }

        isPausedRef.current = false;
        abortControllerRef.current = new AbortController();

        try {
            // Get upload status to find missing chunks
            const statusResponse = await axios.get(route('dms.upload.resume', { uploadId }));
            
            if (!statusResponse.data.success) {
                throw new Error(statusResponse.data.message || 'Failed to get upload status');
            }

            const { missing_chunks: missingChunks, progress: currentProgress } = statusResponse.data.data;

            if (missingChunks.length === 0) {
                // All chunks uploaded, just assemble
                updateProgress({ status: 'assembling' });

                const assembleResponse = await axios.post(route('dms.upload.assemble'), {
                    upload_id: uploadId,
                });

                if (!assembleResponse.data.success) {
                    throw new Error(assembleResponse.data.message || 'Failed to assemble file');
                }

                const result = {
                    status: 'completed',
                    ...assembleResponse.data.data,
                };

                updateProgress({ status: 'completed', progress: 100 });
                onComplete?.(result);
                return result;
            }

            updateProgress({
                status: 'uploading',
                progress: currentProgress,
            });

            // Upload missing chunks
            const totalChunks = progress.totalChunks;
            let uploadedChunks = totalChunks - missingChunks.length;

            for (let i = 0; i < missingChunks.length; i += maxConcurrent) {
                if (isPausedRef.current) {
                    break;
                }

                const batch = missingChunks.slice(i, i + maxConcurrent);
                const promises = batch.map(async (chunkIndex) => {
                    await uploadChunk(file, uploadId, chunkIndex);
                    uploadedChunks++;
                    updateProgress({
                        progress: Math.round((uploadedChunks / totalChunks) * 100),
                        uploadedChunks,
                    });
                });

                await Promise.all(promises);
            }

            if (isPausedRef.current) {
                updateProgress({ status: 'paused' });
                return { status: 'paused', uploadId };
            }

            // Assemble
            updateProgress({ status: 'assembling' });

            const assembleResponse = await axios.post(route('dms.upload.assemble'), {
                upload_id: uploadId,
            });

            if (!assembleResponse.data.success) {
                throw new Error(assembleResponse.data.message || 'Failed to assemble file');
            }

            const result = {
                status: 'completed',
                ...assembleResponse.data.data,
            };

            updateProgress({ status: 'completed', progress: 100 });
            onComplete?.(result);
            return result;

        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message;
            updateProgress({ status: 'error', error: errorMessage });
            onError?.(error);
            throw error;
        }
    }, [progress.totalChunks, maxConcurrent, updateProgress, onComplete, onError]);

    /**
     * Cancel an active upload.
     */
    const cancel = useCallback(async () => {
        abortControllerRef.current?.abort();
        isPausedRef.current = false;

        const uploadId = uploadIdRef.current;
        
        if (uploadId) {
            try {
                await axios.delete(route('dms.upload.cancel', { uploadId }));
            } catch (e) {
                // Ignore cleanup errors
            }
        }

        uploadIdRef.current = null;
        updateProgress({
            status: 'idle',
            progress: 0,
            uploadedChunks: 0,
            totalChunks: 0,
            uploadedSize: 0,
            totalSize: 0,
            error: null,
        });
    }, [updateProgress]);

    /**
     * Reset the upload state.
     */
    const reset = useCallback(() => {
        isPausedRef.current = false;
        uploadIdRef.current = null;
        abortControllerRef.current = null;
        setProgress({
            progress: 0,
            uploadedChunks: 0,
            totalChunks: 0,
            uploadedSize: 0,
            totalSize: 0,
            status: 'idle',
            error: null,
        });
    }, []);

    return {
        progress,
        upload,
        pause,
        resume,
        cancel,
        reset,
        uploadId: uploadIdRef.current,
    };
}

export default useChunkedUpload;
