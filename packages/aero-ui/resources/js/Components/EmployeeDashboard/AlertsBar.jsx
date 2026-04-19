import React, { useState } from 'react';
import { Chip } from '@heroui/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ExclamationTriangleIcon,
    InformationCircleIcon,
    CheckCircleIcon,
} from '@heroicons/react/24/outline';

const severityIcon = {
    danger: ExclamationTriangleIcon,
    warning: ExclamationTriangleIcon,
    primary: InformationCircleIcon,
    success: CheckCircleIcon,
};

const AlertsBar = ({ alerts = [] }) => {
    const [dismissed, setDismissed] = useState(new Set());

    const visible = alerts.filter((_, i) => !dismissed.has(i));

    if (visible.length === 0) {
        return null;
    }

    const dismiss = (index) => {
        setDismissed((prev) => new Set(prev).add(index));
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex gap-2 overflow-x-auto pb-2"
        >
            <AnimatePresence>
                {alerts.map((alert, index) => {
                    if (dismissed.has(index)) return null;

                    const Icon = severityIcon[alert.severity] || InformationCircleIcon;

                    return (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            transition={{ duration: 0.2 }}
                            className="shrink-0"
                        >
                            <Chip
                                color={alert.severity || 'primary'}
                                variant="flat"
                                startContent={<Icon className="w-4 h-4" />}
                                onClose={() => dismiss(index)}
                                classNames={{ base: 'max-w-xs', content: 'text-xs font-medium' }}
                            >
                                {alert.title || alert.message}
                            </Chip>
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </motion.div>
    );
};

export default AlertsBar;
