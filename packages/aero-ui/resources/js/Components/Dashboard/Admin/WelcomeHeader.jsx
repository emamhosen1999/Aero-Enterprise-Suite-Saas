import React from 'react';
import { motion } from 'framer-motion';
import { HandRaisedIcon, UserGroupIcon, ClockIcon } from '@heroicons/react/24/outline';
import { Chip } from '@heroui/react';

const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
};

const WelcomeHeader = ({ user, stats = {} }) => {
    const firstName = user?.name?.split(' ')[0] || '';
    const today = new Date().toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
        >
            <div className="flex items-center gap-3">
                <HandRaisedIcon className="w-7 h-7 text-warning" />
                <div>
                    <h2 className="text-2xl font-bold">
                        {getGreeting()}{firstName ? `, ${firstName}` : ''}
                    </h2>
                    <p className="text-sm text-default-500 flex items-center gap-2">
                        <ClockIcon className="w-3.5 h-3.5" />
                        {today}
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
                {stats.onlineUsers > 0 && (
                    <Chip size="sm" color="success" variant="flat" startContent={<UserGroupIcon className="w-3.5 h-3.5" />}>
                        {stats.onlineUsers} online
                    </Chip>
                )}
            </div>
        </motion.div>
    );
};

export default WelcomeHeader;
