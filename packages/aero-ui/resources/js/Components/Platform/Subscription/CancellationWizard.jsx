import React, { useState } from 'react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Checkbox, Textarea, Card, CardBody, Chip } from '@heroui/react';
import { showToast } from '@/utils/toastUtils';
import { ExclamationTriangleIcon, GiftIcon, PauseIcon, ArrowDownIcon } from '@heroicons/react/24/outline';

export default function CancellationWizard({ isOpen, onClose, currentPlan, onConfirm }) {
    const [step, setStep] = useState(1);
    const [selectedReasons, setSelectedReasons] = useState([]);
    const [additionalComments, setAdditionalComments] = useState('');
    const [selectedOffer, setSelectedOffer] = useState(null);
    const [confirmationChecks, setConfirmationChecks] = useState({
        understand: false,
        dataLoss: false,
        noRefund: false
    });
    const [isProcessing, setIsProcessing] = useState(false);

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

    const cancellationReasons = [
        'Too expensive',
        'Missing features I need',
        'Switching to a competitor',
        'Not using it enough',
        'Technical issues',
        'Poor customer support',
        'Business closing',
        'Other'
    ];

    const retentionOffers = [
        {
            id: 'discount',
            icon: GiftIcon,
            title: '25% Discount for 3 Months',
            description: 'Stay with us and save 25% on your subscription for the next 3 months',
            color: 'success'
        },
        {
            id: 'pause',
            icon: PauseIcon,
            title: 'Pause Subscription',
            description: 'Keep your data and resume anytime. No charges while paused.',
            color: 'warning'
        },
        {
            id: 'downgrade',
            icon: ArrowDownIcon,
            title: 'Downgrade to Lower Plan',
            description: 'Switch to a more affordable plan that fits your budget',
            color: 'primary'
        }
    ];

    const toggleReason = (reason) => {
        setSelectedReasons(prev =>
            prev.includes(reason)
                ? prev.filter(r => r !== reason)
                : [...prev, reason]
        );
    };

    const toggleConfirmation = (key) => {
        setConfirmationChecks(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    const handleNext = () => {
        if (step === 1 && selectedReasons.length === 0) {
            showToast.error('Please select at least one reason');
            return;
        }
        if (step < 3) {
            setStep(step + 1);
        }
    };

    const handleBack = () => {
        if (step > 1) {
            setStep(step - 1);
        }
    };

    const handleAcceptOffer = () => {
        if (!selectedOffer) {
            showToast.error('Please select an offer or continue with cancellation');
            return;
        }

        showToast.success(`${selectedOffer === 'discount' ? 'Discount applied!' : selectedOffer === 'pause' ? 'Subscription paused' : 'Downgrade initiated'}`);
        onClose();
    };

    const handleConfirmCancellation = async () => {
        if (!confirmationChecks.understand || !confirmationChecks.dataLoss || !confirmationChecks.noRefund) {
            showToast.error('Please confirm all items to proceed');
            return;
        }

        setIsProcessing(true);

        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.post(route('subscription.cancel'), {
                    reasons: selectedReasons,
                    comments: additionalComments
                });
                if (response.status === 200) {
                    resolve([response.data.message || 'Subscription cancelled successfully']);
                    setTimeout(() => {
                        onConfirm && onConfirm();
                        onClose();
                    }, 1000);
                }
            } catch (error) {
                reject(error.response?.data?.errors || ['Failed to cancel subscription']);
            } finally {
                setIsProcessing(false);
            }
        });

        showToast.promise(promise, {
            loading: 'Cancelling subscription...',
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
        });
    };

    const renderStepContent = () => {
        switch (step) {
            case 1:
                return (
                    <div className="space-y-4">
                        <h3 className="font-semibold text-lg">Why are you cancelling?</h3>
                        <p className="text-sm text-default-500">Select all that apply (required)</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {cancellationReasons.map((reason) => (
                                <Card
                                    key={reason}
                                    isPressable
                                    onPress={() => toggleReason(reason)}
                                    className={`cursor-pointer transition-all ${
                                        selectedReasons.includes(reason)
                                            ? 'border-2 border-primary bg-primary-50 dark:bg-primary-900/20'
                                            : 'border border-divider'
                                    }`}
                                >
                                    <CardBody className="py-3">
                                        <div className="flex items-center gap-3">
                                            <Checkbox
                                                isSelected={selectedReasons.includes(reason)}
                                                onValueChange={() => toggleReason(reason)}
                                                size="sm"
                                            />
                                            <span className="text-sm">{reason}</span>
                                        </div>
                                    </CardBody>
                                </Card>
                            ))}
                        </div>
                        <Textarea
                            label="Additional Comments (optional)"
                            placeholder="Tell us more about your experience..."
                            value={additionalComments}
                            onValueChange={setAdditionalComments}
                            minRows={3}
                            radius={themeRadius}
                            classNames={{ inputWrapper: "bg-default-100" }}
                        />
                    </div>
                );

            case 2:
                return (
                    <div className="space-y-4">
                        <h3 className="font-semibold text-lg">Before you go...</h3>
                        <p className="text-sm text-default-500">We'd like to offer you some alternatives</p>
                        <div className="space-y-3">
                            {retentionOffers.map((offer) => {
                                const Icon = offer.icon;
                                return (
                                    <Card
                                        key={offer.id}
                                        isPressable
                                        onPress={() => setSelectedOffer(offer.id)}
                                        className={`cursor-pointer transition-all ${
                                            selectedOffer === offer.id
                                                ? 'border-2 border-primary'
                                                : 'border border-divider'
                                        }`}
                                    >
                                        <CardBody className="flex flex-row items-start gap-4 p-4">
                                            <div className={`p-3 rounded-lg bg-${offer.color}-100 dark:bg-${offer.color}-900/20`}>
                                                <Icon className={`w-6 h-6 text-${offer.color}`} />
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-semibold">{offer.title}</h4>
                                                <p className="text-sm text-default-500 mt-1">{offer.description}</p>
                                            </div>
                                            {selectedOffer === offer.id && (
                                                <Chip color="primary" size="sm">Selected</Chip>
                                            )}
                                        </CardBody>
                                    </Card>
                                );
                            })}
                        </div>
                        <div className="bg-default-100 p-4 rounded-lg">
                            <p className="text-sm text-default-600">
                                Not interested in these offers? You can continue with the cancellation process.
                            </p>
                        </div>
                    </div>
                );

            case 3:
                return (
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 p-4 bg-danger-50 dark:bg-danger-900/20 rounded-lg">
                            <ExclamationTriangleIcon className="w-6 h-6 text-danger flex-shrink-0" />
                            <div>
                                <h3 className="font-semibold text-danger">Final Confirmation</h3>
                                <p className="text-sm text-danger-700 dark:text-danger-300">
                                    This action cannot be undone
                                </p>
                            </div>
                        </div>
                        
                        <Card>
                            <CardBody className="space-y-4">
                                <div>
                                    <p className="font-semibold mb-2">What happens when you cancel:</p>
                                    <ul className="space-y-2 text-sm text-default-600">
                                        <li>• Your subscription will be cancelled immediately</li>
                                        <li>• You'll have access until the end of your billing period</li>
                                        <li>• Your data will be retained for 30 days</li>
                                        <li>• After 30 days, all data will be permanently deleted</li>
                                        <li>• No refunds will be provided for unused time</li>
                                    </ul>
                                </div>
                            </CardBody>
                        </Card>

                        <div className="space-y-3">
                            <Checkbox
                                isSelected={confirmationChecks.understand}
                                onValueChange={() => toggleConfirmation('understand')}
                                size="sm"
                            >
                                <span className="text-sm">I understand my subscription will be cancelled</span>
                            </Checkbox>
                            <Checkbox
                                isSelected={confirmationChecks.dataLoss}
                                onValueChange={() => toggleConfirmation('dataLoss')}
                                size="sm"
                            >
                                <span className="text-sm">I understand my data will be deleted after 30 days</span>
                            </Checkbox>
                            <Checkbox
                                isSelected={confirmationChecks.noRefund}
                                onValueChange={() => toggleConfirmation('noRefund')}
                                size="sm"
                            >
                                <span className="text-sm">I understand no refunds will be issued</span>
                            </Checkbox>
                        </div>

                        <Button
                            variant="flat"
                            color="primary"
                            fullWidth
                            radius={themeRadius}
                            as="a"
                            href={route('export.data')}
                            download
                        >
                            Download My Data
                        </Button>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            size="2xl"
            scrollBehavior="inside"
            isDismissable={!isProcessing}
            classNames={{
                base: "bg-content1",
                header: "border-b border-divider",
                body: "py-6",
                footer: "border-t border-divider"
            }}
        >
            <ModalContent>
                <ModalHeader className="flex flex-col gap-1">
                    <h2 className="text-lg font-semibold">Cancel Subscription</h2>
                    <div className="flex gap-2 mt-2">
                        {[1, 2, 3].map((s) => (
                            <div
                                key={s}
                                className={`h-1 flex-1 rounded-full ${s <= step ? 'bg-danger' : 'bg-default-200'}`}
                            />
                        ))}
                    </div>
                    <span className="text-xs text-default-500 font-normal mt-1">
                        Step {step} of 3
                    </span>
                </ModalHeader>
                <ModalBody>
                    {renderStepContent()}
                </ModalBody>
                <ModalFooter>
                    <Button
                        variant="flat"
                        onPress={step === 1 ? onClose : handleBack}
                        isDisabled={isProcessing}
                        radius={themeRadius}
                    >
                        {step === 1 ? 'Keep Subscription' : 'Back'}
                    </Button>
                    {step === 2 ? (
                        <>
                            <Button
                                color="success"
                                onPress={handleAcceptOffer}
                                isDisabled={!selectedOffer}
                                radius={themeRadius}
                            >
                                Accept Offer
                            </Button>
                            <Button
                                color="danger"
                                variant="flat"
                                onPress={handleNext}
                                radius={themeRadius}
                            >
                                Continue Cancelling
                            </Button>
                        </>
                    ) : step < 3 ? (
                        <Button
                            color="danger"
                            variant="flat"
                            onPress={handleNext}
                            radius={themeRadius}
                        >
                            Next
                        </Button>
                    ) : (
                        <Button
                            color="danger"
                            onPress={handleConfirmCancellation}
                            isLoading={isProcessing}
                            isDisabled={!confirmationChecks.understand || !confirmationChecks.dataLoss || !confirmationChecks.noRefund}
                            radius={themeRadius}
                        >
                            Confirm Cancellation
                        </Button>
                    )}
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}
