<?php

declare(strict_types=1);

namespace Aero\Core\Services\Auth;

use Illuminate\Session\DatabaseSessionHandler;
use Illuminate\Support\Facades\Log;

/**
 * Encrypted Session Handler
 *
 * Extends Laravel's DatabaseSessionHandler to encrypt session data at rest.
 * Uses SessionEncryptionService to encrypt/decrypt payloads transparently.
 */
class EncryptedSessionHandler extends DatabaseSessionHandler
{
    protected SessionEncryptionService $encryptionService;

    /**
     * Initialize with encryption service.
     */
    public function __construct($connection, $table, $lifetime, $app = null, $encryptionService = null)
    {
        parent::__construct($connection, $table, $lifetime, $app);
        $this->encryptionService = $encryptionService ?: app(SessionEncryptionService::class);
    }

    /**
     * {@inheritdoc}
     *
     * Encrypt the session payload before storing.
     */
    public function write($sessionId, $data): bool
    {
        try {
            // Parse session data
            $sessionData = $this->parseSessionData($data);

            // Encrypt the payload
            $encryptedData = $this->encryptionService->encryptSessionPayload($sessionData);

            return parent::write($sessionId, $encryptedData);
        } catch (\Exception $e) {
            Log::error('Session encryption write failed', [
                'session_id' => $sessionId,
                'error' => $e->getMessage(),
            ]);

            // Fallback to unencrypted write for stability
            return parent::write($sessionId, $data);
        }
    }

    /**
     * {@inheritdoc}
     *
     * Decrypt the session payload after reading.
     */
    public function read($sessionId): string
    {
        try {
            $encryptedData = parent::read($sessionId);

            if (empty($encryptedData)) {
                return '';
            }

            // Check if data is encrypted
            if ($this->encryptionService->isEncrypted($encryptedData)) {
                $decryptedData = $this->encryptionService->decryptSessionPayload($encryptedData);

                return $this->serializeSessionData($decryptedData);
            }

            // Return as-is if not encrypted (backwards compatibility)
            return $encryptedData;
        } catch (\Exception $e) {
            Log::error('Session decryption read failed', [
                'session_id' => $sessionId,
                'error' => $e->getMessage(),
            ]);

            // Return empty session on decryption failure
            return '';
        }
    }

    /**
     * Parse session data string into array.
     *
     * @param  string  $data  Session data string
     * @return array Parsed session data
     */
    protected function parseSessionData(string $data): array
    {
        if (empty($data)) {
            return [];
        }

        // Laravel session data format: key|serialized_value;key|serialized_value;...
        $parsed = [];
        $parts = explode(';', $data);

        foreach ($parts as $part) {
            if (empty($part)) {
                continue;
            }

            $keyValue = explode('|', $part, 2);
            if (count($keyValue) === 2) {
                [$key, $serializedValue] = $keyValue;
                try {
                    $parsed[$key] = unserialize($serializedValue);
                } catch (\Exception $e) {
                    // Keep as string if unserialization fails
                    $parsed[$key] = $serializedValue;
                }
            }
        }

        return $parsed;
    }

    /**
     * Serialize session data array back to string format.
     *
     * @param  array  $data  Session data array
     * @return string Serialized session data
     */
    protected function serializeSessionData(array $data): string
    {
        $parts = [];

        foreach ($data as $key => $value) {
            $serializedValue = serialize($value);
            $parts[] = $key.'|'.$serializedValue;
        }

        return implode(';', $parts);
    }
}
