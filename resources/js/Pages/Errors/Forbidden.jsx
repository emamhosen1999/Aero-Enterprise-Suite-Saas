import { Head, Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import {
    ShieldExclamationIcon,
    ArrowLeftIcon,
    HomeIcon,
    LockClosedIcon,
} from '@heroicons/react/24/outline';
import App from "@/Layouts/App.jsx";

export default function Forbidden({ message, accessType, accessPath }) {
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                duration: 0.6,
                staggerChildren: 0.1,
            },
        },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.5 },
        },
    };

    return (
        <App>
            <Head title="Access Denied" />
            
            <motion.div
                className="min-h-[70vh] flex items-center justify-center p-6"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                <motion.div
                    className="max-w-lg w-full text-center"
                    variants={itemVariants}
                >
                    {/* Icon */}
                    <motion.div
                        className="mx-auto w-24 h-24 rounded-full bg-gradient-to-br from-red-500/20 to-orange-500/20 flex items-center justify-center mb-8"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                    >
                        <ShieldExclamationIcon className="w-12 h-12 text-red-400" />
                    </motion.div>

                    {/* Error Code */}
                    <motion.h1
                        className="text-8xl font-bold bg-gradient-to-r from-red-400 via-orange-400 to-yellow-400 bg-clip-text text-transparent mb-4"
                        variants={itemVariants}
                    >
                        403
                    </motion.h1>

                    {/* Title */}
                    <motion.h2
                        className="text-2xl font-semibold text-white mb-4"
                        variants={itemVariants}
                    >
                        Access Denied
                    </motion.h2>

                    {/* Message */}
                    <motion.p
                        className="text-gray-400 mb-4"
                        variants={itemVariants}
                    >
                        {message || "You don't have permission to access this resource."}
                    </motion.p>

                    {/* Access Details */}
                    {(accessType || accessPath) && (
                        <motion.div
                            className="bg-gray-800/50 rounded-lg p-4 mb-8 border border-gray-700"
                            variants={itemVariants}
                        >
                            <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
                                <LockClosedIcon className="w-4 h-4" />
                                <span>
                                    {accessType && <span className="capitalize">{accessType}</span>}
                                    {accessPath && <span className="text-gray-500 ml-1">({accessPath})</span>}
                                </span>
                            </div>
                        </motion.div>
                    )}

                    {/* Help Text */}
                    <motion.p
                        className="text-sm text-gray-500 mb-8"
                        variants={itemVariants}
                    >
                        If you believe you should have access to this resource, please contact your administrator.
                    </motion.p>

                    {/* Action Buttons */}
                    <motion.div
                        className="flex flex-col sm:flex-row items-center justify-center gap-4"
                        variants={itemVariants}
                    >
                        <button
                            onClick={() => window.history.back()}
                            className="flex items-center gap-2 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                        >
                            <ArrowLeftIcon className="w-5 h-5" />
                            Go Back
                        </button>
                        
                        <Link
                            href={route('dashboard')}
                            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-lg transition-all"
                        >
                            <HomeIcon className="w-5 h-5" />
                            Go to Dashboard
                        </Link>
                    </motion.div>
                </motion.div>
            </motion.div>
        </App>
    );
}
