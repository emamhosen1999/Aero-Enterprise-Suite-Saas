import { useEffect, useState } from 'react';
import { router, Link } from '@inertiajs/react';
import { 
    Modal, 
    ModalContent, 
    ModalHeader, 
    ModalBody, 
    ModalFooter, 
    Button,
    Card,
    CardBody,
    Progress,
    Chip
} from '@heroui/react';
import { 
    ExclamationTriangleIcon,
    ClockIcon,
    ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';
import { useTheme } from '@/Context/ThemeContext.jsx';

export default function SessionExpiredModal({ setSessionExpired }) {
    const [countdown, setCountdown] = useState(10);
    const [isVisible, setIsVisible] = useState(true);
    const { theme } = useTheme();

    // Helper function to convert theme borderRadius to HeroUI radius values
    const getThemeRadius = () => {
        if (typeof window === 'undefined') return 'lg';
        
        const rootStyles = getComputedStyle(document.documentElement);
        const borderRadius = rootStyles.getPropertyValue('--borderRadius')?.trim() || '12px';
        
        const radiusValue = parseInt(borderRadius);
        if (radiusValue === 0) return 'none';
        if (radiusValue <= 4) return 'sm';
        if (radiusValue <= 8) return 'md';
        if (radiusValue <= 16) return 'lg';
        return 'full';
    };

    useEffect(() => {
        if (countdown === 0) {
            handleRedirect();
            return;
        }

        const timer = setInterval(() => {
            setCountdown(prev => prev - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [countdown]);

    const handleRedirect = () => {
        setIsVisible(false);
        setSessionExpired(false);
        router.visit('/login', {
            method: 'get',
            preserveState: false,
            preserveScroll: false,
        });
    };

    const handleManualRedirect = () => {
        handleRedirect();
    };

    const progressValue = ((10 - countdown) / 10) * 100;

    return (
        <Modal
            isOpen={isVisible}
            onClose={() => {}} // Prevent closing
            placement="center"
            backdrop="blur"
            hideCloseButton
            isDismissable={false}
            isKeyboardDismissDisabled
            radius={getThemeRadius()}
            classNames={{
                base: "border-0",
                backdrop: "bg-gradient-to-t from-zinc-900 to-zinc-900/10 backdrop-opacity-20",
                wrapper: "z-[99999]",
            }}
            style={{
                fontFamily: `var(--fontFamily, "Inter")`,
            }}
        >
            <ModalContent>
                <ModalHeader className="flex flex-col gap-1">
                    <div className="flex items-center gap-3">
                        <div 
                            className="p-2 rounded-full"
                            style={{
                                background: `color-mix(in srgb, var(--theme-warning) 15%, transparent)`,
                                borderColor: `color-mix(in srgb, var(--theme-warning) 25%, transparent)`,
                                borderWidth: `var(--borderWidth, 2px)`,
                                borderRadius: `var(--borderRadius, 12px)`,
                            }}
                        >
                            <ExclamationTriangleIcon 
                                className="w-6 h-6"
                                style={{ color: 'var(--theme-warning)' }}
                            />
                        </div>
                        <div>
                            <h2 
                                className="text-xl font-bold"
                                style={{
                                    color: 'var(--theme-foreground)',
                                    fontFamily: `var(--fontFamily, "Inter")`,
                                }}
                            >
                                Session Expired
                            </h2>
                            <p 
                                className="text-sm font-normal"
                                style={{
                                    color: 'var(--theme-default-500)',
                                    fontFamily: `var(--fontFamily, "Inter")`,
                                }}
                            >
                                Authentication required
                            </p>
                        </div>
                    </div>
                </ModalHeader>

                <ModalBody>
                    <Card 
                        className="border-0"
                        style={{
                            background: `color-mix(in srgb, var(--theme-content2) 50%, transparent)`,
                            borderRadius: `var(--borderRadius, 12px)`,
                        }}
                    >
                        <CardBody className="gap-4">
                            <div className="flex items-center gap-3">
                                <ClockIcon 
                                    className="w-5 h-5"
                                    style={{ color: 'var(--theme-primary)' }}
                                />
                                <div className="flex-1">
                                    <p 
                                        className="text-sm font-medium mb-1"
                                        style={{
                                            color: 'var(--theme-foreground)',
                                            fontFamily: `var(--fontFamily, "Inter")`,
                                        }}
                                    >
                                        Auto-redirect in {countdown} seconds
                                    </p>
                                    <Progress
                                        value={progressValue}
                                        color="primary"
                                        size="sm"
                                        radius={getThemeRadius()}
                                        classNames={{
                                            track: "drop-shadow-md border border-default",
                                            indicator: "bg-gradient-to-r from-primary-500 to-primary-600",
                                            label: "tracking-wider font-medium text-default-600",
                                            value: "text-foreground/60",
                                        }}
                                    />
                                </div>
                                <Chip
                                    color="primary"
                                    variant="flat"
                                    size="sm"
                                    radius={getThemeRadius()}
                                    style={{
                                        fontFamily: `var(--fontFamily, "Inter")`,
                                    }}
                                >
                                    {countdown}s
                                </Chip>
                            </div>

                            <div 
                                className="p-4 rounded-lg border"
                                style={{
                                    background: `color-mix(in srgb, var(--theme-warning) 10%, transparent)`,
                                    borderColor: `color-mix(in srgb, var(--theme-warning) 25%, transparent)`,
                                    borderWidth: `var(--borderWidth, 1px)`,
                                    borderRadius: `var(--borderRadius, 8px)`,
                                }}
                            >
                                <p 
                                    className="text-sm text-center"
                                    style={{
                                        color: 'var(--theme-default-600)',
                                        fontFamily: `var(--fontFamily, "Inter")`,
                                    }}
                                >
                                    Your session has expired for security reasons. Please log in again to continue using the application.
                                </p>
                            </div>
                        </CardBody>
                    </Card>
                </ModalBody>

                <ModalFooter>
                    <Button
                        color="primary"
                        variant="solid"
                        size="lg"
                        radius={getThemeRadius()}
                        startContent={
                            <ArrowRightOnRectangleIcon className="w-4 h-4" />
                        }
                        onPress={handleManualRedirect}
                        className="w-full font-semibold"
                        style={{
                            fontFamily: `var(--fontFamily, "Inter")`,
                            transform: `scale(var(--scale, 1))`,
                        }}
                    >
                        Login Now
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}
