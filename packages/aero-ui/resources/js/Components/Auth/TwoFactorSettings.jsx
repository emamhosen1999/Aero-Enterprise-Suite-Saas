import React, { useState } from 'react';
import {
    Card,
    CardHeader,
    CardBody,
    Button,
    Input,
    Switch,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Chip,
    Divider,
} from '@heroui/react';
import {
    ShieldCheckIcon,
    KeyIcon,
    ExclamationTriangleIcon,
    ClipboardDocumentIcon,
    CheckIcon,
} from '@heroicons/react/24/outline';
import axios from 'axios';
import { showToast } from '@/utils/toastUtils';

/**
 * Two-Factor Authentication Settings Component
 *
 * Allows users to enable/disable 2FA, view QR code, and manage recovery codes.
 */
export default function TwoFactorSettings({ enabled = false, remainingCodes = 0 }) {
    const [isEnabled, setIsEnabled] = useState(enabled);
    const [showSetupModal, setShowSetupModal] = useState(false);
    const [showDisableModal, setShowDisableModal] = useState(false);
    const [showRecoveryModal, setShowRecoveryModal] = useState(false);

    const [setupStep, setSetupStep] = useState(1);
    const [qrUrl, setQrUrl] = useState('');
    const [secret, setSecret] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [recoveryCodes, setRecoveryCodes] = useState([]);
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [copiedCode, setCopiedCode] = useState(null);

    const handleEnableClick = async () => {
        setLoading(true);
        try {
            const response = await axios.post(route('auth.two-factor.setup'));
            setQrUrl(response.data.qr_url);
            setSecret(response.data.secret);
            setShowSetupModal(true);
            setSetupStep(1);
        } catch (error) {
            showToast.error(error.response?.data?.error || 'Failed to start 2FA setup');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyCode = async () => {
        if (verificationCode.length !== 6) {
            showToast.error('Please enter a 6-digit code');
            return;
        }

        setLoading(true);

        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.post(route('auth.two-factor.confirm'), {
                    code: verificationCode,
                });
                
                if (response.status === 200) {
                    setRecoveryCodes(response.data.recovery_codes);
                    setSetupStep(2);
                    setIsEnabled(true);
                    resolve([response.data.message || 'Two-factor authentication enabled!']);
                }
            } catch (error) {
                reject([error.response?.data?.error || 'Invalid verification code']);
            } finally {
                setLoading(false);
            }
        });

        showToast.promise(promise, {
            loading: 'Verifying code...',
            success: (data) => data[0],
            error: (data) => data[0],
        });
    };

    const handleDisable = async () => {
        if (!password) {
            showToast.error('Please enter your password');
            return;
        }

        setLoading(true);

        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.post(route('auth.two-factor.disable'), { password });
                
                if (response.status === 200) {
                    setIsEnabled(false);
                    setShowDisableModal(false);
                    setPassword('');
                    resolve([response.data.message || 'Two-factor authentication disabled']);
                }
            } catch (error) {
                reject([error.response?.data?.error || 'Failed to disable 2FA']);
            } finally {
                setLoading(false);
            }
        });

        showToast.promise(promise, {
            loading: 'Disabling 2FA...',
            success: (data) => data[0],
            error: (data) => data[0],
        });
    };

    const handleRegenerateCodes = async () => {
        if (!password) {
            showToast.error('Please enter your password');
            return;
        }

        setLoading(true);

        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.post(route('auth.two-factor.regenerate-codes'), {
                    password,
                });
                
                if (response.status === 200) {
                    setRecoveryCodes(response.data.recovery_codes);
                    setPassword('');
                    resolve([response.data.message || 'Recovery codes regenerated']);
                }
            } catch (error) {
                reject([error.response?.data?.error || 'Failed to regenerate codes']);
            } finally {
                setLoading(false);
            }
        });

        showToast.promise(promise, {
            loading: 'Regenerating codes...',
            success: (data) => data[0],
            error: (data) => data[0],
        });
    };

    const copyToClipboard = (text, index = null) => {
        navigator.clipboard.writeText(text);
        setCopiedCode(index);
        setTimeout(() => setCopiedCode(null), 2000);
    };

    const copyAllCodes = () => {
        const allCodes = recoveryCodes.join('\n');
        navigator.clipboard.writeText(allCodes);
        showToast.success('All recovery codes copied to clipboard');
    };

    return (
        <>
            <Card className="transition-all duration-200">
                <CardHeader className="border-b border-divider p-4">
                    <div className="flex items-center gap-3">
                        <ShieldCheckIcon className="w-6 h-6 text-primary" />
                        <div>
                            <h3 className="text-lg font-semibold">Two-Factor Authentication</h3>
                            <p className="text-sm text-default-500">
                                Add an extra layer of security to your account
                            </p>
                        </div>
                    </div>
                </CardHeader>
                <CardBody className="p-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div
                                className={`w-12 h-12 rounded-full flex items-center justify-center ${
                                    isEnabled ? 'bg-success/10' : 'bg-warning/10'
                                }`}
                            >
                                {isEnabled ? (
                                    <ShieldCheckIcon className="w-6 h-6 text-success" />
                                ) : (
                                    <ExclamationTriangleIcon className="w-6 h-6 text-warning" />
                                )}
                            </div>
                            <div>
                                <p className="font-medium">
                                    {isEnabled
                                        ? 'Two-factor authentication is enabled'
                                        : 'Two-factor authentication is disabled'}
                                </p>
                                {isEnabled && (
                                    <p className="text-sm text-default-500">
                                        {remainingCodes} recovery codes remaining
                                    </p>
                                )}
                            </div>
                        </div>

                        {isEnabled ? (
                            <div className="flex gap-2">
                                <Button
                                    variant="flat"
                                    color="primary"
                                    size="sm"
                                    startContent={<KeyIcon className="w-4 h-4" />}
                                    onPress={() => setShowRecoveryModal(true)}
                                >
                                    Recovery Codes
                                </Button>
                                <Button
                                    variant="flat"
                                    color="danger"
                                    size="sm"
                                    onPress={() => setShowDisableModal(true)}
                                >
                                    Disable
                                </Button>
                            </div>
                        ) : (
                            <Button
                                color="primary"
                                isLoading={loading}
                                onPress={handleEnableClick}
                            >
                                Enable 2FA
                            </Button>
                        )}
                    </div>
                </CardBody>
            </Card>

            {/* Setup Modal */}
            <Modal
                isOpen={showSetupModal}
                onOpenChange={setShowSetupModal}
                size="lg"
                isDismissable={false}
            >
                <ModalContent>
                    <ModalHeader className="border-b border-divider">
                        {setupStep === 1
                            ? 'Set Up Two-Factor Authentication'
                            : 'Save Your Recovery Codes'}
                    </ModalHeader>
                    <ModalBody className="py-6">
                        {setupStep === 1 ? (
                            <div className="space-y-6">
                                <p className="text-default-600">
                                    Scan the QR code below with your authenticator app (like Google
                                    Authenticator or Authy), then enter the 6-digit code to verify.
                                </p>

                                <div className="flex justify-center p-4 bg-white rounded-lg">
                                    {/* QR Code - would use a QR code library in production */}
                                    <img
                                        src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                                            qrUrl
                                        )}`}
                                        alt="2FA QR Code"
                                        className="w-48 h-48"
                                    />
                                </div>

                                <div className="bg-default-100 p-4 rounded-lg">
                                    <p className="text-sm text-default-500 mb-2">
                                        Can't scan? Enter this code manually:
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <code className="text-sm font-mono bg-default-200 px-3 py-1 rounded">
                                            {secret}
                                        </code>
                                        <Button
                                            isIconOnly
                                            size="sm"
                                            variant="light"
                                            onPress={() => copyToClipboard(secret)}
                                        >
                                            <ClipboardDocumentIcon className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>

                                <Divider />

                                <Input
                                    label="Verification Code"
                                    placeholder="Enter 6-digit code"
                                    value={verificationCode}
                                    onValueChange={setVerificationCode}
                                    maxLength={6}
                                    classNames={{
                                        input: 'text-center text-lg tracking-widest font-mono',
                                    }}
                                />
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
                                    <div className="flex gap-3">
                                        <ExclamationTriangleIcon className="w-6 h-6 text-warning shrink-0" />
                                        <div>
                                            <p className="font-medium text-warning-600">
                                                Save these recovery codes
                                            </p>
                                            <p className="text-sm text-default-600 mt-1">
                                                Store these codes in a safe place. You can use them to
                                                access your account if you lose your authenticator device.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    {recoveryCodes.map((code, index) => (
                                        <div
                                            key={index}
                                            className="flex items-center justify-between bg-default-100 px-3 py-2 rounded font-mono text-sm"
                                        >
                                            <span>{code}</span>
                                            <Button
                                                isIconOnly
                                                size="sm"
                                                variant="light"
                                                onPress={() => copyToClipboard(code, index)}
                                            >
                                                {copiedCode === index ? (
                                                    <CheckIcon className="w-4 h-4 text-success" />
                                                ) : (
                                                    <ClipboardDocumentIcon className="w-4 h-4" />
                                                )}
                                            </Button>
                                        </div>
                                    ))}
                                </div>

                                <Button
                                    fullWidth
                                    variant="flat"
                                    startContent={<ClipboardDocumentIcon className="w-4 h-4" />}
                                    onPress={copyAllCodes}
                                >
                                    Copy All Codes
                                </Button>
                            </div>
                        )}
                    </ModalBody>
                    <ModalFooter className="border-t border-divider">
                        {setupStep === 1 ? (
                            <>
                                <Button
                                    variant="flat"
                                    onPress={() => setShowSetupModal(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    color="primary"
                                    isLoading={loading}
                                    onPress={handleVerifyCode}
                                >
                                    Verify & Enable
                                </Button>
                            </>
                        ) : (
                            <Button
                                color="primary"
                                onPress={() => setShowSetupModal(false)}
                            >
                                Done
                            </Button>
                        )}
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* Disable Modal */}
            <Modal isOpen={showDisableModal} onOpenChange={setShowDisableModal}>
                <ModalContent>
                    <ModalHeader className="border-b border-divider">
                        Disable Two-Factor Authentication
                    </ModalHeader>
                    <ModalBody className="py-6">
                        <div className="bg-danger/10 border border-danger/20 rounded-lg p-4 mb-4">
                            <p className="text-sm text-danger-600">
                                This will remove the extra security from your account. You will only
                                need your password to sign in.
                            </p>
                        </div>
                        <Input
                            type="password"
                            label="Confirm Password"
                            placeholder="Enter your password"
                            value={password}
                            onValueChange={setPassword}
                        />
                    </ModalBody>
                    <ModalFooter className="border-t border-divider">
                        <Button variant="flat" onPress={() => setShowDisableModal(false)}>
                            Cancel
                        </Button>
                        <Button color="danger" isLoading={loading} onPress={handleDisable}>
                            Disable 2FA
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* Recovery Codes Modal */}
            <Modal isOpen={showRecoveryModal} onOpenChange={setShowRecoveryModal} size="lg">
                <ModalContent>
                    <ModalHeader className="border-b border-divider">Recovery Codes</ModalHeader>
                    <ModalBody className="py-6">
                        <p className="text-default-600 mb-4">
                            You have {remainingCodes} recovery codes remaining. Generate new codes
                            if you're running low.
                        </p>

                        {recoveryCodes.length > 0 && (
                            <div className="grid grid-cols-2 gap-2 mb-4">
                                {recoveryCodes.map((code, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between bg-default-100 px-3 py-2 rounded font-mono text-sm"
                                    >
                                        <span>{code}</span>
                                        <Button
                                            isIconOnly
                                            size="sm"
                                            variant="light"
                                            onPress={() => copyToClipboard(code, index)}
                                        >
                                            {copiedCode === index ? (
                                                <CheckIcon className="w-4 h-4 text-success" />
                                            ) : (
                                                <ClipboardDocumentIcon className="w-4 h-4" />
                                            )}
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <Divider className="my-4" />

                        <p className="text-sm text-default-500 mb-2">
                            Enter your password to generate new recovery codes:
                        </p>
                        <Input
                            type="password"
                            placeholder="Enter your password"
                            value={password}
                            onValueChange={setPassword}
                        />
                    </ModalBody>
                    <ModalFooter className="border-t border-divider">
                        <Button variant="flat" onPress={() => setShowRecoveryModal(false)}>
                            Close
                        </Button>
                        <Button
                            color="primary"
                            isLoading={loading}
                            onPress={handleRegenerateCodes}
                        >
                            Generate New Codes
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </>
    );
}
