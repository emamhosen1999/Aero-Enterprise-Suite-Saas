import React, { forwardRef, useState } from 'react';
import { Input as NextUIInput } from '@heroui/react';
import { motion } from 'framer-motion';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';


const Input = forwardRef(({ 
    type = 'text', 
    label, 
    error, 
    icon: Icon,
    className = '',
    showPasswordToggle = false,
    placeholder,
    ...props 
}, ref) => {
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);

    
    const inputType = showPasswordToggle && type === 'password' 
        ? (isPasswordVisible ? 'text' : 'password')
        : type;

    return (
        <motion.div 
            className="w-full"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
        >
            <NextUIInput
                ref={ref}
                type={inputType}
                label={label}
                placeholder={placeholder}
                variant="bordered"
                isInvalid={!!error}
                errorMessage={error}
                startContent={Icon && (
                    <Icon className="w-5 h-5 text-default-400 pointer-events-none flex-shrink-0" />
                )}
                endContent={showPasswordToggle && type === 'password' && (
                    <button
                        className="focus:outline-none"
                        type="button"
                        onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                    >
                        {isPasswordVisible ? (
                            <EyeSlashIcon className="w-5 h-5 text-default-400 pointer-events-none" />
                        ) : (
                            <EyeIcon className="w-5 h-5 text-default-400 pointer-events-none" />
                        )}
                    </button>
                )}
                classNames={{
                    base: className,
                    input: [
                        "bg-transparent",
                        "text-black/90 dark:text-white/90",
                        "placeholder:text-default-700/50 dark:placeholder:text-white/60",
                    ],
                    innerWrapper: "bg-transparent",
                    inputWrapper: [
                        "backdrop-blur-xl",
                        "backdrop-saturate-200",
                        "bg-white/20 dark:bg-default/60",
                        "border",
                        "border-default-200/50",
                        "!cursor-text",
                        "hover:bg-white/30 dark:hover:bg-default/70",
                        "focus-within:!bg-white/40 dark:focus-within:!bg-default/80",
                        "group-data-[focused=true]:bg-white/40 dark:group-data-[focused=true]:bg-default/80",
                    ],
                }}
                {...props}
            />
        </motion.div>
    );
});

Input.displayName = 'Input';

export default Input;
