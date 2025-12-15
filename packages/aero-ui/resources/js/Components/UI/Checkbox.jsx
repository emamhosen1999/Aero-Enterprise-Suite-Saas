import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { CheckIcon } from '@heroicons/react/24/solid';
import { clsx } from 'clsx';
import { useTheme } from '@/Context/ThemeContext.jsx';

const Checkbox = forwardRef(({ 
    label, 
    description,
    error,
    checked = false,
    className = '',
    ...props 
}, ref) => {
    const { themeSettings } = useTheme();
    const isDarkMode = themeSettings?.mode === 'dark';

    const glassTheme = {
        palette: {
            primary: {
                main: '#3b82f6',
                contrastText: '#ffffff'
            },
            secondary: {
                main: '#64748b'
            },
            error: {
                main: '#ef4444'
            },
            text: {
                primary: isDarkMode ? '#ffffff' : '#0f172a',
                secondary: isDarkMode ? '#94a3b8' : '#475569'
            }
        },
        mode: isDarkMode ? 'dark' : 'light'
    };
    
    return (
        <div className={clsx('space-y-1', className)}>
            <div className="flex items-start">
                <div className="flex items-center h-6">
                    <div className="relative">
                        <input
                            ref={ref}
                            type="checkbox"
                            checked={checked}
                            className="sr-only"
                            {...props}
                        />
                        
                        <motion.div
                            className="w-5 h-5 rounded-lg cursor-pointer transition-all duration-300 flex items-center justify-center relative overflow-hidden"
                            style={{
                                background: checked
                                    ? `linear-gradient(135deg, ${glassTheme.palette.primary.main}, ${glassTheme.palette.secondary.main})`
                                    : glassTheme.mode === 'dark'
                                    ? 'rgba(255, 255, 255, 0.05)'
                                    : 'rgba(255, 255, 255, 0.8)',
                                backdropFilter: 'blur(10px) saturate(180%)',
                                border: checked
                                    ? `2px solid ${glassTheme.palette.primary.main}`
                                    : error
                                    ? `2px solid ${glassTheme.palette.error.main}40`
                                    : `2px solid ${glassTheme.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                                boxShadow: checked
                                    ? `0 2px 8px ${glassTheme.palette.primary.main}30, 0 0 0 3px ${glassTheme.palette.primary.main}15`
                                    : '0 2px 4px rgba(0, 0, 0, 0.05)',
                            }}
                            whileHover={{ 
                                scale: 1.05,
                                boxShadow: checked
                                    ? `0 4px 12px ${glassTheme.palette.primary.main}40, 0 0 0 4px ${glassTheme.palette.primary.main}20`
                                    : `0 4px 8px rgba(0, 0, 0, 0.1), 0 0 0 3px ${glassTheme.palette.primary.main}15`
                            }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                                if (props.onChange) {
                                    props.onChange({ target: { checked: !checked } });
                                }
                            }}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.3 }}
                        >
                            {/* Animated checkmark */}
                            <motion.div
                                initial={false}
                                animate={{
                                    scale: checked ? 1 : 0,
                                    opacity: checked ? 1 : 0,
                                    rotate: checked ? 0 : 180,
                                }}
                                transition={{ 
                                    duration: 0.3, 
                                    type: "spring", 
                                    stiffness: 500,
                                    damping: 30 
                                }}
                            >
                                <CheckIcon 
                                    className="w-3 h-3" 
                                    style={{ color: glassTheme.palette.primary.contrastText }}
                                />
                            </motion.div>
                            
                            {/* Shimmer effect when checked */}
                            {checked && (
                                <motion.div
                                    className="absolute inset-0 bg-linear-to-r from-transparent via-white/30 to-transparent rounded-lg"
                                    initial={{ x: '-100%' }}
                                    animate={{ x: '100%' }}
                                    transition={{
                                        duration: 1,
                                        repeat: Infinity,
                                        repeatDelay: 2,
                                        ease: "easeInOut"
                                    }}
                                />
                            )}
                        </motion.div>
                    </div>
                </div>
                
                {(label || description) && (
                    <motion.div 
                        className="ml-3"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: 0.1 }}
                    >
                        {label && (
                            <label 
                                className="text-sm font-medium cursor-pointer transition-colors duration-200"
                                style={{ 
                                    color: glassTheme.palette.text.primary,
                                }}
                                onClick={() => {
                                    if (props.onChange) {
                                        props.onChange({ target: { checked: !checked } });
                                    }
                                }}
                            >
                                {label}
                            </label>
                        )}
                        {description && (
                            <motion.p 
                                className="text-sm mt-1"
                                style={{ color: glassTheme.palette.text.secondary }}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.3, delay: 0.2 }}
                            >
                                {description}
                            </motion.p>
                        )}
                    </motion.div>
                )}
            </div>
            
            {error && (
                <motion.p
                    className="text-sm ml-8 flex items-center gap-2"
                    style={{ color: glassTheme.palette.error.main }}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {error}
                </motion.p>
            )}
        </div>
    );
});

Checkbox.displayName = 'Checkbox';

export default Checkbox;
