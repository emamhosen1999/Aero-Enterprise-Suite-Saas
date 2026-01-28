<?php

declare(strict_types=1);

namespace Aero\Core\Services\Auth;

use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Log;

/**
 * Session Encryption Service
 *
 * Provides encryption/decryption for session payloads at rest.
 * Ensures sensitive session data is encrypted in cache/database storage.
 */
class SessionEncryptionService
{
    /**
     * Encrypt session payload data.
     *
     * @param array $data Session data to encrypt
     * @return string Encrypted payload
     */
    public function encryptSessionPayload(array $data): string
    {
        try {
            // Remove sensitive keys that shouldn't be encrypted (for performance)
            $sensitiveData = $this->extractSensitiveData($data);
            
            // Only encrypt if there's sensitive data
            if (empty($sensitiveData)) {
                return serialize($data);
            }

            // Encrypt sensitive data
            $encryptedSensitive = Crypt::encryptString(serialize($sensitiveData));
            
            // Replace sensitive data with encrypted version
            $safeData = array_diff_key($data, $sensitiveData);
            $safeData['_encrypted_payload'] = $encryptedSensitive;

            return serialize($safeData);
        } catch (\Exception $e) {
            Log::error('Session encryption failed', [
                'error' => $e->getMessage(),
                'data_keys' => array_keys($data)
            ]);
            
            // Fallback to unencrypted for stability
            return serialize($data);
        }
    }

    /**
     * Decrypt session payload data.
     *
     * @param string $encryptedPayload Encrypted session payload
     * @return array Decrypted session data
     */
    public function decryptSessionPayload(string $encryptedPayload): array
    {
        try {
            $data = unserialize($encryptedPayload);
            
            if (!is_array($data)) {
                return [];
            }

            // Check if there's encrypted sensitive data
            if (isset($data['_encrypted_payload'])) {
                $encryptedSensitive = $data['_encrypted_payload'];
                unset($data['_encrypted_payload']);

                // Decrypt sensitive data
                $sensitiveData = unserialize(Crypt::decryptString($encryptedSensitive));
                
                // Merge back with safe data
                return array_merge($data, $sensitiveData);
            }

            return $data;
        } catch (\Exception $e) {
            Log::error('Session decryption failed', [
                'error' => $e->getMessage(),
                'payload_length' => strlen($encryptedPayload)
            ]);
            
            // Return empty array on decryption failure
            return [];
        }
    }

    /**
     * Extract sensitive data that should be encrypted.
     *
     * @param array $data Original session data
     * @return array Sensitive data to encrypt
     */
    protected function extractSensitiveData(array $data): array
    {
        $sensitiveKeys = [
            'password',
            'password_confirmation', 
            'current_password',
            'two_factor_secret',
            'recovery_codes',
            'personal_access_token',
            'oauth_token',
            'oauth_refresh_token',
            'api_token',
            'remember_token',
            '_token',
            'csrf_token',
            'user_permissions',
            'role_permissions',
            'impersonation_data',
            'sensitive_user_data'
        ];

        $sensitive = [];
        foreach ($sensitiveKeys as $key) {
            if (array_key_exists($key, $data)) {
                $sensitive[$key] = $data[$key];
            }
        }

        return $sensitive;
    }

    /**
     * Check if session payload contains encrypted data.
     *
     * @param string $payload Session payload
     * @return bool True if payload is encrypted
     */
    public function isEncrypted(string $payload): bool
    {
        try {
            $data = unserialize($payload);
            return is_array($data) && isset($data['_encrypted_payload']);
        } catch (\Exception $e) {
            return false;
        }
    }

    /**
     * Encrypt specific session value.
     *
     * @param mixed $value Value to encrypt
     * @return string Encrypted value
     */
    public function encryptValue($value): string
    {
        return Crypt::encryptString(serialize($value));
    }

    /**
     * Decrypt specific session value.
     *
     * @param string $encrypted Encrypted value
     * @return mixed Decrypted value
     */
    public function decryptValue(string $encrypted)
    {
        return unserialize(Crypt::decryptString($encrypted));
    }
}