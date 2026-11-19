/**
 * The languages the app speaks (api/_lib/i18n/locales.ts on the translation branch), in the order the last beat cuts
 * through them: scripts alternate so every cut changes the shape of the headline, Arabic mirrors the whole page in
 * the middle, and the run ends where it began. scripts/capture-product.cjs makes one shot per code.
 */
export const LANGUAGES = ['en', 'ja', 'es', 'ko', 'fr', 'uk', 'de', 'zh-Hans', 'pt-BR', 'ar', 'it', 'tr', 'zh-Hant', 'nl', 'pl', 'id'] as const

export const LANGUAGE_COUNT = LANGUAGES.length
