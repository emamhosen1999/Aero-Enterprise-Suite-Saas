import React, { useMemo } from 'react';
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Button } from '@heroui/react';
import { GlobeAltIcon } from '@heroicons/react/24/outline';
import { useTranslation } from '@/Context/TranslationContext';

const FALLBACK_FLAGS = {
  en: '🇺🇸',
  bn: '🇧🇩',
  ar: '🇸🇦',
  es: '🇪🇸',
  fr: '🇫🇷',
  de: '🇩🇪',
  hi: '🇮🇳',
  'zh-CN': '🇨🇳',
  'zh-TW': '🇹🇼',
};

const FALLBACK_LANGUAGE = {
  code: 'en',
  name: 'English',
  native: 'English',
  flag: '🇺🇸',
};

export function LanguageProvider({ children }) {
  return children;
}

export function useLanguage() {
  const { locale, setLocale, supportedLocales, localeMeta, t } = useTranslation();

  const languages = useMemo(() => {
    const localeCodes = supportedLocales?.length ? supportedLocales : ['en'];

    return localeCodes.map((code) => {
      const meta = localeMeta?.[code] || {};

      return {
        code,
        name: meta.name || code,
        native: meta.native || meta.name || code,
        flag: meta.flag ? String.fromCodePoint(...meta.flag.toUpperCase().split('').map((char) => 127397 + char.charCodeAt(0))) : (FALLBACK_FLAGS[code] || '🌐'),
      };
    });
  }, [localeMeta, supportedLocales]);

  return {
    language: locale,
    setLanguage: setLocale,
    t,
    languages,
    currentLanguage: languages.find((lang) => lang.code === locale) || FALLBACK_LANGUAGE,
  };
}

/**
 * Language Selector Component
 * Dropdown to switch between languages
 */
export function LanguageSelector({ 
  variant = 'flat', 
  size = 'sm',
  showLabel = true,
  className = '' 
}) {
  const { language, setLanguage, currentLanguage, languages: availableLanguages } = useLanguage();

  return (
    <Dropdown placement="bottom-end">
      <DropdownTrigger>
        <Button 
          variant={variant} 
          size={size}
          className={className}
          startContent={<GlobeAltIcon className="w-4 h-4" />}
          aria-label="Select language"
        >
          {showLabel ? (
            <>
              <span className="hidden sm:inline">{currentLanguage.name}</span>
              <span className="sm:hidden">{currentLanguage.flag}</span>
            </>
          ) : (
            currentLanguage.flag
          )}
        </Button>
      </DropdownTrigger>
      <DropdownMenu 
        aria-label="Language selection"
        selectedKeys={[language]}
        selectionMode="single"
        onSelectionChange={(keys) => {
          const selected = Array.from(keys)[0];
          if (selected) setLanguage(selected);
        }}
      >
        {availableLanguages.map((lang) => (
          <DropdownItem key={lang.code} textValue={lang.name}>
            <div className="flex items-center gap-2">
              <span className="text-lg">{lang.flag}</span>
              <span>{lang.native}</span>
            </div>
          </DropdownItem>
        ))}
      </DropdownMenu>
    </Dropdown>
  );
}

export default {
  LanguageProvider,
  LanguageSelector,
  useLanguage,
};
