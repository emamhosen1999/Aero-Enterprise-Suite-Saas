import React from 'react';
import { Head, router } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Card, CardBody, CardHeader, Button } from "@heroui/react";
import { ClipboardDocumentCheckIcon, ArrowLeftIcon } from "@heroicons/react/24/outline";
import App from '@/Layouts/App.jsx';
import { useThemeRadius } from '@/Hooks/useThemeRadius.js';

const SafetyInspectionsCreate = ({ title }) => {
    const themeRadius = useThemeRadius();

    return (
        <>
            <Head title={title ?? 'New Inspection'} />

            <div className="flex flex-col w-full h-full p-4" role="main" aria-label="New Inspection">
                <div className="space-y-4">
                    <div className="w-full">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.5 }}
                        >
                            <Card
                                className="transition-all duration-200"
                                style={{
                                    border: `var(--borderWidth, 2px) solid transparent`,
                                    borderRadius: `var(--borderRadius, 12px)`,
                                    fontFamily: `var(--fontFamily, "Inter")`,
                                    transform: `scale(var(--scale, 1))`,
                                    background: `linear-gradient(135deg,
                                        var(--theme-content1, #FAFAFA) 20%,
                                        var(--theme-content2, #F4F4F5) 10%,
                                        var(--theme-content3, #F1F3F4) 20%)`,
                                    color: `var(--theme-foreground)`,
                                }}
                            >
                                <CardHeader
                                    className="border-b p-0"
                                    style={{
                                        borderColor: `var(--theme-divider, #E4E4E7)`,
                                        background: `linear-gradient(135deg,
                                            color-mix(in srgb, var(--theme-content1) 50%, transparent) 20%,
                                            color-mix(in srgb, var(--theme-content2) 30%, transparent) 10%)`,
                                    }}
                                >
                                    <div className="p-6 w-full">
                                        <div className="flex items-center justify-between gap-4">
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className="p-3 rounded-xl"
                                                    style={{
                                                        background: `color-mix(in srgb, var(--theme-primary) 15%, transparent)`,
                                                        borderRadius: `var(--borderRadius, 12px)`,
                                                    }}
                                                >
                                                    <ClipboardDocumentCheckIcon
                                                        className="w-8 h-8"
                                                        style={{ color: 'var(--theme-primary)' }}
                                                    />
                                                </div>
                                                <div>
                                                    <h4 className="text-2xl font-bold">New Inspection</h4>
                                                    <p className="text-sm text-default-500">Create a safety inspection</p>
                                                </div>
                                            </div>
                                            <Button
                                                variant="flat"
                                                startContent={<ArrowLeftIcon className="w-4 h-4" />}
                                                onPress={() => router.visit(route('hrm.safety.inspections.index'))}
                                                radius={themeRadius}
                                            >
                                                Back
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardBody className="p-6">
                                    <div className="flex flex-col items-center justify-center py-16 text-center">
                                        <ClipboardDocumentCheckIcon className="w-16 h-16 text-default-300 mb-4" />
                                        <h3 className="text-lg font-semibold text-default-600 mb-2">
                                            Inspection creation — full form coming soon
                                        </h3>
                                        <p className="text-default-400 mb-6">
                                            Use the Inspections list to manage inspections for now.
                                        </p>
                                        <Button
                                            color="primary"
                                            variant="flat"
                                            onPress={() => router.visit(route('hrm.safety.inspections.index'))}
                                            radius={themeRadius}
                                        >
                                            Go to Inspections List
                                        </Button>
                                    </div>
                                </CardBody>
                            </Card>
                        </motion.div>
                    </div>
                </div>
            </div>
        </>
    );
};

SafetyInspectionsCreate.layout = (page) => <App children={page} />;
export default SafetyInspectionsCreate;
