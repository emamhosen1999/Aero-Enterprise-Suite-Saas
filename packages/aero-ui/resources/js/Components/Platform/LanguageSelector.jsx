import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Button } from "@heroui/react";
import { GlobeAltIcon } from '@heroicons/react/24/outline';

// Default translations (English)
const defaultTranslations = {
  en: {
    common: {
      next: 'Next',
      back: 'Back',
      cancel: 'Cancel',
      save: 'Save',
      submit: 'Submit',
      loading: 'Loading...',
      error: 'Error',
      success: 'Success',
      required: 'Required',
    },
    registration: {
      step1Title: 'Who is this workspace for?',
      step1Description: 'Every workspace starts with a trial. You will only add a card when you are ready.',
      companyWorkspace: 'Company workspace',
      companyDescription: 'Best for teams rolling out across multiple departments.',
      soloWorkspace: 'Solo or consultant',
      soloDescription: 'Perfect for individual operators validating processes.',
      
      step2Title: 'Company Information',
      companyName: 'Company Name',
      email: 'Email Address',
      phone: 'Phone Number',
      subdomain: 'Workspace URL',
      
      step3Title: 'Set up your admin account',
      fullName: 'Full Name',
      password: 'Password',
      confirmPassword: 'Confirm Password',
      
      step4Title: 'Choose Your Plan & Products',
      choosePlan: 'Choose a Plan',
      billing: 'Billing cadence',
      monthly: 'Monthly',
      yearly: 'Yearly',
      yearlyDiscount: '2 months free',
      
      provisioning: 'Setting up your workspace...',
      provisioningDescription: 'This usually takes 1-2 minutes.',
      notifyMe: 'Notify me when ready',
    },
    validation: {
      emailRequired: 'Email is required',
      emailInvalid: 'Please enter a valid email',
      passwordMin: 'Password must be at least 8 characters',
      passwordMatch: 'Passwords must match',
      required: 'This field is required',
    },
  },
  es: {
    common: {
      next: 'Siguiente',
      back: 'Atrás',
      cancel: 'Cancelar',
      save: 'Guardar',
      submit: 'Enviar',
      loading: 'Cargando...',
      error: 'Error',
      success: 'Éxito',
      required: 'Requerido',
    },
    registration: {
      step1Title: '¿Para quién es este espacio de trabajo?',
      step1Description: 'Cada espacio de trabajo comienza con una prueba gratuita.',
      companyWorkspace: 'Espacio de trabajo empresarial',
      companyDescription: 'Ideal para equipos que se expanden en múltiples departamentos.',
      soloWorkspace: 'Individual o consultor',
      soloDescription: 'Perfecto para operadores individuales validando procesos.',
      
      step2Title: 'Cuéntanos sobre tu empresa',
      companyName: 'Nombre de la empresa',
      email: 'Correo electrónico',
      phone: 'Teléfono',
      subdomain: 'URL del espacio de trabajo',
      
      step3Title: 'Configura tu cuenta de administrador',
      fullName: 'Nombre completo',
      password: 'Contraseña',
      confirmPassword: 'Confirmar contraseña',
      
      step4Title: 'Elige tu plan y productos',
      choosePlan: 'Elegir un plan',
      billing: 'Ciclo de facturación',
      monthly: 'Mensual',
      yearly: 'Anual',
      yearlyDiscount: '2 meses gratis',
      
      provisioning: 'Configurando tu espacio de trabajo...',
      provisioningDescription: 'Esto normalmente toma 1-2 minutos.',
      notifyMe: 'Notificarme cuando esté listo',
    },
    validation: {
      emailRequired: 'El correo electrónico es requerido',
      emailInvalid: 'Por favor ingrese un correo válido',
      passwordMin: 'La contraseña debe tener al menos 8 caracteres',
      passwordMatch: 'Las contraseñas deben coincidir',
      required: 'Este campo es requerido',
    },
  },
  fr: {
    common: {
      next: 'Suivant',
      back: 'Retour',
      cancel: 'Annuler',
      save: 'Enregistrer',
      submit: 'Soumettre',
      loading: 'Chargement...',
      error: 'Erreur',
      success: 'Succès',
      required: 'Requis',
    },
    registration: {
      step1Title: 'À qui est destiné cet espace de travail?',
      step1Description: 'Chaque espace de travail commence par un essai gratuit.',
      companyWorkspace: 'Espace de travail entreprise',
      companyDescription: 'Idéal pour les équipes déployées sur plusieurs départements.',
      soloWorkspace: 'Solo ou consultant',
      soloDescription: 'Parfait pour les opérateurs individuels validant des processus.',
      
      step2Title: 'Parlez-nous de votre entreprise',
      companyName: 'Nom de l\'entreprise',
      email: 'Adresse e-mail',
      phone: 'Téléphone',
      subdomain: 'URL de l\'espace de travail',
      
      step3Title: 'Configurez votre compte administrateur',
      fullName: 'Nom complet',
      password: 'Mot de passe',
      confirmPassword: 'Confirmer le mot de passe',
      
      step4Title: 'Choisissez votre plan et produits',
      choosePlan: 'Choisir un plan',
      billing: 'Cycle de facturation',
      monthly: 'Mensuel',
      yearly: 'Annuel',
      yearlyDiscount: '2 mois gratuits',
      
      provisioning: 'Configuration de votre espace de travail...',
      provisioningDescription: 'Cela prend généralement 1-2 minutes.',
      notifyMe: 'Me prévenir quand c\'est prêt',
    },
    validation: {
      emailRequired: 'L\'e-mail est requis',
      emailInvalid: 'Veuillez entrer un e-mail valide',
      passwordMin: 'Le mot de passe doit contenir au moins 8 caractères',
      passwordMatch: 'Les mots de passe doivent correspondre',
      required: 'Ce champ est requis',
    },
  },
};

// Available languages
const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
];

// Context
const LanguageContext = createContext(null);

/**
 * Language Provider Component
 * Provides language context to the application
 */
export function LanguageProvider({ children, defaultLanguage = 'en' }) {
  const [language, setLanguageState] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('registration_language');
      if (stored && languages.some(l => l.code === stored)) {
        return stored;
      }
      // Try to detect browser language
      const browserLang = navigator.language?.split('-')[0];
      if (languages.some(l => l.code === browserLang)) {
        return browserLang;
      }
    }
    return defaultLanguage;
  });

  const [translations, setTranslations] = useState(defaultTranslations);

  const setLanguage = useCallback((langCode) => {
    if (languages.some(l => l.code === langCode)) {
      setLanguageState(langCode);
      if (typeof window !== 'undefined') {
        localStorage.setItem('registration_language', langCode);
        document.documentElement.lang = langCode;
      }
    }
  }, []);

  // Get translation by key path (e.g., 'registration.step1Title')
  const t = useCallback((keyPath, fallback = '') => {
    const keys = keyPath.split('.');
    let value = translations[language];
    
    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        // Fallback to English
        value = translations.en;
        for (const k of keys) {
          if (value && typeof value === 'object' && k in value) {
            value = value[k];
          } else {
            return fallback || keyPath;
          }
        }
        break;
      }
    }
    
    return typeof value === 'string' ? value : fallback || keyPath;
  }, [language, translations]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.documentElement.lang = language;
    }
  }, [language]);

  const value = {
    language,
    setLanguage,
    t,
    languages,
    currentLanguage: languages.find(l => l.code === language) || languages[0],
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

/**
 * Hook to use language context
 */
export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    // Return a default context if provider not found
    return {
      language: 'en',
      setLanguage: () => {},
      t: (key, fallback) => fallback || key,
      languages,
      currentLanguage: languages[0],
    };
  }
  return context;
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
              <span>{lang.name}</span>
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
