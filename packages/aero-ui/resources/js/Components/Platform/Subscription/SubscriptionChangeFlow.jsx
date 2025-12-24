import React, { useState } from 'react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Card, CardBody, Divider, Checkbox } from '@heroui/react';
import { showToast } from '@/utils/toastUtils';
import { ArrowRightIcon, CreditCardIcon } from '@heroicons/react/24/outline';

export default function SubscriptionChangeFlow({ isOpen, onClose, currentPlan, newPlan, onConfirm }) {
    const [step, setStep] = useState(1);
    const [acceptTerms, setAcceptTerms] = useState(false);
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

    const planPrices = {
        free: 0,
        starter: 29,
        professional: 99,
        enterprise: 299
    };

    const calculateProration = () => {
        const currentPrice = planPrices[currentPlan] || 0;
        const newPrice = planPrices[newPlan] || 0;
        const daysRemaining = 15; // Mock: days remaining in billing cycle
        const daysInMonth = 30;
        
        const unusedCredit = (currentPrice / daysInMonth) * daysRemaining;
        const newCharge = (newPrice / daysInMonth) * daysRemaining;
        const netCharge = newCharge - unusedCredit;

        return {
            unusedCredit: unusedCredit.toFixed(2),
            newCharge: newCharge.toFixed(2),
            netCharge: netCharge.toFixed(2),
            nextBilling: newPrice
        };
    };

    const proration = calculateProration();
    const isUpgrade = planPrices[newPlan] > planPrices[currentPlan];

    const handleNext = () => {
        if (step < 3) {
            setStep(step + 1);
        }
    };

    const handleBack = () => {
        if (step > 1) {
            setStep(step - 1);
        }
    };

    const handleConfirm = async () => {
        if (!acceptTerms) {
            showToast.error('Please accept the terms and conditions');
            return;
        }

        setIsProcessing(true);

        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.post(route('subscription.change'), {
                    new_plan: newPlan
                });
                if (response.status === 200) {
                    resolve([response.data.message || 'Subscription updated successfully']);
                    setTimeout(() => {
                        onConfirm && onConfirm();
                        onClose();
                    }, 1000);
                }
            } catch (error) {
                reject(error.response?.data?.errors || ['Failed to update subscription']);
            } finally {
                setIsProcessing(false);
            }
        });

        showToast.promise(promise, {
            loading: 'Updating subscription...',
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
        });
    };

    const renderStepContent = () => {
        switch (step) {
            case 1:
                return (
                    <div className="space-y-4">
                        <h3 className="font-semibold text-lg">Plan Comparison</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <Card>
                                <CardBody className="space-y-2">
                                    <span className="text-sm text-default-500">Current Plan</span>
                                    <h4 className="text-xl font-bold capitalize">{currentPlan}</h4>
                                    <span className="text-2xl font-bold text-default-700">${planPrices[currentPlan]}/mo</span>
                                </CardBody>
                            </Card>
                            <Card className="border-2 border-primary">
                                <CardBody className="space-y-2">
                                    <span className="text-sm text-primary">New Plan</span>
                                    <h4 className="text-xl font-bold capitalize text-primary">{newPlan}</h4>
                                    <span className="text-2xl font-bold text-primary">${planPrices[newPlan]}/mo</span>
                                </CardBody>
                            </Card>
                        </div>
                        <Divider />
                        <div className="bg-default-100 p-4 rounded-lg space-y-2">
                            <div className="flex justify-between">
                                <span className="text-sm text-default-600">Unused credit from current plan</span>
                                <span className="text-sm font-semibold text-success">${proration.unusedCredit}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-default-600">Charge for new plan (prorated)</span>
                                <span className="text-sm font-semibold">${proration.newCharge}</span>
                            </div>
                            <Divider />
                            <div className="flex justify-between">
                                <span className="font-semibold">Net {isUpgrade ? 'charge' : 'credit'} today</span>
                                <span className={`font-bold ${parseFloat(proration.netCharge) >= 0 ? 'text-warning' : 'text-success'}`}>
                                    ${Math.abs(parseFloat(proration.netCharge))}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-default-600">Next billing amount</span>
                                <span className="font-semibold">${proration.nextBilling}/month</span>
                            </div>
                        </div>
                    </div>
                );

            case 2:
                return (
                    <div className="space-y-4">
                        <h3 className="font-semibold text-lg">Payment Method</h3>
                        <Card>
                            <CardBody className="flex flex-row items-center gap-4">
                                <CreditCardIcon className="w-8 h-8 text-primary" />
                                <div className="flex-1">
                                    <p className="font-semibold">Visa ending in 4242</p>
                                    <p className="text-sm text-default-500">Expires 12/2025</p>
                                </div>
                                <Button size="sm" variant="flat" radius={themeRadius}>Change</Button>
                            </CardBody>
                        </Card>
                        <div className="bg-warning-50 dark:bg-warning-900/20 p-4 rounded-lg">
                            <p className="text-sm text-warning-700 dark:text-warning-300">
                                {isUpgrade ? (
                                    <>Your card will be charged ${Math.abs(parseFloat(proration.netCharge))} today for the prorated amount. Your next billing cycle will be on the 1st of next month.</>
                                ) : (
                                    <>A credit of ${Math.abs(parseFloat(proration.netCharge))} will be applied to your account. Your next billing cycle will be on the 1st of next month.</>
                                )}
                            </p>
                        </div>
                    </div>
                );

            case 3:
                return (
                    <div className="space-y-4">
                        <h3 className="font-semibold text-lg">Review & Confirm</h3>
                        <Card>
                            <CardBody className="space-y-4">
                                <div className="flex items-center gap-4">
                                    <div className="flex-1">
                                        <p className="text-sm text-default-500">Changing from</p>
                                        <p className="font-bold capitalize">{currentPlan} Plan</p>
                                    </div>
                                    <ArrowRightIcon className="w-6 h-6 text-default-400" />
                                    <div className="flex-1">
                                        <p className="text-sm text-primary">Changing to</p>
                                        <p className="font-bold capitalize text-primary">{newPlan} Plan</p>
                                    </div>
                                </div>
                                <Divider />
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span>Effective Date</span>
                                        <span className="font-semibold">Immediately</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span>Amount {isUpgrade ? 'Charged' : 'Credited'} Today</span>
                                        <span className="font-semibold">${Math.abs(parseFloat(proration.netCharge))}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span>Next Billing Date</span>
                                        <span className="font-semibold">1st of next month</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="font-semibold">Monthly Amount</span>
                                        <span className="font-bold text-primary">${proration.nextBilling}</span>
                                    </div>
                                </div>
                            </CardBody>
                        </Card>
                        <Checkbox
                            isSelected={acceptTerms}
                            onValueChange={setAcceptTerms}
                            size="sm"
                        >
                            <span className="text-sm">
                                I accept the <a href="#" className="text-primary underline">terms and conditions</a> for this plan change
                            </span>
                        </Checkbox>
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
                    <h2 className="text-lg font-semibold">{isUpgrade ? 'Upgrade' : 'Change'} Subscription</h2>
                    <div className="flex gap-2 mt-2">
                        {[1, 2, 3].map((s) => (
                            <div
                                key={s}
                                className={`h-1 flex-1 rounded-full ${s <= step ? 'bg-primary' : 'bg-default-200'}`}
                            />
                        ))}
                    </div>
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
                        {step === 1 ? 'Cancel' : 'Back'}
                    </Button>
                    {step < 3 ? (
                        <Button
                            color="primary"
                            onPress={handleNext}
                            radius={themeRadius}
                        >
                            Next
                        </Button>
                    ) : (
                        <Button
                            color="primary"
                            onPress={handleConfirm}
                            isLoading={isProcessing}
                            isDisabled={!acceptTerms}
                            radius={themeRadius}
                        >
                            Confirm Change
                        </Button>
                    )}
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}
