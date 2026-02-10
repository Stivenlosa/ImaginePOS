"use client";

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";

// Import translations
import en from "./translations/en.json";
import es from "./translations/es.json";

// Available languages configuration
export const LANGUAGES = {
    en: { name: "English", nativeName: "English", flag: "🇺🇸" },
    es: { name: "Spanish", nativeName: "Español", flag: "🇪🇸" },
} as const;

export type LanguageCode = keyof typeof LANGUAGES;

// Translation files mapped to language codes
const translations: Record<LanguageCode, typeof en> = {
    en,
    es,
};

// Get nested value from object using dot notation
function getNestedValue(obj: Record<string, unknown>, path: string): string {
    const keys = path.split(".");
    let result: unknown = obj;
    
    for (const key of keys) {
        if (result && typeof result === "object" && key in result) {
            result = (result as Record<string, unknown>)[key];
        } else {
            return path; // Return the key if translation not found
        }
    }
    
    return typeof result === "string" ? result : path;
}

// Context type
interface LanguageContextType {
    language: LanguageCode;
    setLanguage: (lang: LanguageCode) => void;
    t: (key: string, params?: Record<string, string | number>) => string;
    availableLanguages: typeof LANGUAGES;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

const STORAGE_KEY = "app-language";

interface LanguageProviderProps {
    children: ReactNode;
    defaultLanguage?: LanguageCode;
}

export function LanguageProvider({ children, defaultLanguage = "en" }: LanguageProviderProps) {
    const [language, setLanguageState] = useState<LanguageCode>(defaultLanguage);
    const [mounted, setMounted] = useState(false);

    // Load language from localStorage on mount
    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY) as LanguageCode | null;
        if (stored && stored in LANGUAGES) {
            setLanguageState(stored);
        }
        setMounted(true);
    }, []);

    // Save language to localStorage when it changes
    const setLanguage = useCallback((lang: LanguageCode) => {
        setLanguageState(lang);
        localStorage.setItem(STORAGE_KEY, lang);
    }, []);

    // Translation function with parameter interpolation
    const t = useCallback((key: string, params?: Record<string, string | number>): string => {
        let text = getNestedValue(translations[language] as Record<string, unknown>, key);
        
        // Handle parameter interpolation: {{paramName}}
        if (params) {
            Object.entries(params).forEach(([paramKey, value]) => {
                text = text.replace(new RegExp(`{{${paramKey}}}`, "g"), String(value));
            });
        }
        
        return text;
    }, [language]);

    // Prevent hydration mismatch by rendering children only after mount
    if (!mounted) {
        return null;
    }

    return (
        <LanguageContext.Provider
            value={{
                language,
                setLanguage,
                t,
                availableLanguages: LANGUAGES,
            }}
        >
            {children}
        </LanguageContext.Provider>
    );
}

// Custom hook to use language context
export function useLanguage() {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error("useLanguage must be used within a LanguageProvider");
    }
    return context;
}

// Shorthand hook for just the translation function
export function useTranslation() {
    const { t } = useLanguage();
    return { t };
}
