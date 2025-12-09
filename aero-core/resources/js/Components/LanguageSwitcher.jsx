import React, { useState, useCallback, memo } from 'react';
import { useTranslation } from '@/Context/TranslationContext';
import {
    Popover,
    PopoverTrigger,
    PopoverContent,
    Button,
} from '@heroui/react';
import { GlobeAltIcon, CheckIcon } from '@heroicons/react/24/outline';

/**
 * Flag component using circle-flags CDN
 */
const FlagIcon = memo(({ code, className = "w-6 h-6" }) => {
    const flagMap = {
        en: 'us',
        bn: 'bd',
        ar: 'sa',
        es: 'es',
        fr: 'fr',
        de: 'de',
        hi: 'in',
        'zh-CN': 'cn',
        'zh-TW': 'tw',
    };
    
    const countryCode = flagMap[code] || 'us';
    
    return (
        <img 
            src={`https://hatscripts.github.io/circle-flags/flags/${countryCode}.svg`} 
            alt=""
            className={`${className} rounded-full object-cover`}
            loading="lazy"
        />
    );
});

/**
 * Language configuration with native names
 */
const languageConfig = {
    en: {
        name: 'English',
        nativeName: 'English',
        dir: 'ltr',
    },
    bn: {
        name: 'Bengali',
        nativeName: 'বাংলা',
        dir: 'ltr',
    },
    ar: {
        name: 'Arabic',
        nativeName: 'العربية',
        dir: 'rtl',
    },
    es: {
        name: 'Spanish',
        nativeName: 'Español',
        dir: 'ltr',
    },
    fr: {
        name: 'French',
        nativeName: 'Français',
        dir: 'ltr',
    },
    de: {
        name: 'German',
        nativeName: 'Deutsch',
        dir: 'ltr',
    },
    hi: {
        name: 'Hindi',
        nativeName: 'हिन्दी',
        dir: 'ltr',
    },
    'zh-CN': {
        name: 'Chinese (Simplified)',
        nativeName: '简体中文',
        dir: 'ltr',
    },
    'zh-TW': {
        name: 'Chinese (Traditional)',
        nativeName: '繁體中文',
        dir: 'ltr',
    },
};

/**
 * Language Item Component
 */
const LanguageItem = memo(({ code, lang, isActive, onSelect }) => (
    <button
        type="button"
        onClick={() => onSelect(code)}
        className={`
            w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left
            transition-colors duration-150
            ${isActive 
                ? 'bg-primary-50 dark:bg-primary-900/20' 
                : 'hover:bg-default-100 dark:hover:bg-default-50/10'
            }
        `}
    >
        <FlagIcon code={code} className="w-6 h-6 flex-shrink-0" />
        <div className="flex flex-col flex-1 min-w-0">
            <span className={`font-medium text-sm ${isActive ? 'text-primary' : 'text-foreground'}`}>
                {lang.nativeName}
            </span>
            {lang.name !== lang.nativeName && (
                <span className="text-xs text-default-400 truncate">
                    {lang.name}
                </span>
            )}
        </div>
        {isActive && (
            <CheckIcon className="w-4 h-4 text-primary flex-shrink-0" />
        )}
    </button>
));

/**
 * Language Switcher Component
 * Dropdown for switching application language
 */
const LanguageSwitcher = memo(function LanguageSwitcher({
    variant = 'dropdown',
    showFlag = true,
    showNativeName = true,
    size = 'md',
    className = '',
}) {
    const { locale, setLocale, supportedLocales } = useTranslation();
    const [isChanging, setIsChanging] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    const availableLocales = supportedLocales.length > 0 
        ? supportedLocales 
        : ['en', 'bn'];

    const handleLocaleChange = useCallback((newLocale) => {
        if (newLocale === locale || isChanging) return;
        
        setIsChanging(true);
        setIsOpen(false);
        
        // Update context (this triggers the GlobalAutoTranslator to re-translate)
        setLocale(newLocale);
        
        // Reset changing state after a short delay
        setTimeout(() => {
            setIsChanging(false);
        }, 500);
    }, [locale, setLocale, isChanging]);

    const currentLang = languageConfig[locale] || languageConfig.en;

    // Minimal variant - just a flag button
    if (variant === 'minimal') {
        return (
            <Popover 
                placement="bottom-end" 
                isOpen={isOpen} 
                onOpenChange={setIsOpen}
                offset={10}
            >
                <PopoverTrigger>
                    <Button
                        isIconOnly
                        variant="light"
                        size={size}
                        className={`min-w-unit-10 ${className}`}
                        isLoading={isChanging}
                        aria-label="Change language"
                    >
                        {showFlag ? (
                            <FlagIcon code={locale} className="w-5 h-5" />
                        ) : (
                            <GlobeAltIcon className="w-5 h-5" />
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="p-1.5 min-w-[220px]">
                    <div className="flex flex-col gap-0.5">
                        {availableLocales.map((code) => {
                            const lang = languageConfig[code];
                            if (!lang) return null;
                            
                            return (
                                <LanguageItem
                                    key={code}
                                    code={code}
                                    lang={lang}
                                    isActive={locale === code}
                                    onSelect={handleLocaleChange}
                                />
                            );
                        })}
                    </div>
                </PopoverContent>
            </Popover>
        );
    }

    // Buttons variant - horizontal button group
    if (variant === 'buttons') {
        return (
            <div className={`flex gap-2 ${className}`}>
                {availableLocales.map((code) => {
                    const lang = languageConfig[code];
                    if (!lang) return null;
                    
                    const isActive = locale === code;
                    
                    return (
                        <Button
                            key={code}
                            size={size}
                            variant={isActive ? 'solid' : 'bordered'}
                            color={isActive ? 'primary' : 'default'}
                            isLoading={isChanging && locale !== code}
                            onPress={() => handleLocaleChange(code)}
                            startContent={showFlag && <FlagIcon code={code} className="w-5 h-5" />}
                        >
                            {showNativeName ? lang.nativeName : lang.name}
                        </Button>
                    );
                })}
            </div>
        );
    }

    // Default dropdown variant
    return (
        <Popover 
            placement="bottom-end" 
            isOpen={isOpen} 
            onOpenChange={setIsOpen}
            offset={10}
        >
            <PopoverTrigger>
                <Button
                    variant="flat"
                    size={size}
                    className={`gap-2 ${className}`}
                    isLoading={isChanging}
                    startContent={showFlag && <FlagIcon code={locale} className="w-5 h-5" />}
                    endContent={
                        <svg
                            className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 9l-7 7-7-7"
                            />
                        </svg>
                    }
                >
                    {showNativeName ? currentLang.nativeName : currentLang.name}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="p-1.5 min-w-[220px]">
                <div className="flex flex-col gap-0.5">
                    {availableLocales.map((code) => {
                        const lang = languageConfig[code];
                        if (!lang) return null;
                        
                        return (
                            <LanguageItem
                                key={code}
                                code={code}
                                lang={lang}
                                isActive={locale === code}
                                onSelect={handleLocaleChange}
                            />
                        );
                    })}
                </div>
            </PopoverContent>
        </Popover>
    );
});

export default LanguageSwitcher;
export { languageConfig };
