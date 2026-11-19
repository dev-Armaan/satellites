/**
 * The languages the app speaks (api/_lib/i18n/locales.ts on the translation branch), and the ones the last beat cuts
 * through, in order: scripts alternate so every cut changes the shape of the headline, and the run ends where it
 * began. Arabic is spoken but not shown (owner): its page is mirrored, so the globe would jump sides for one cut.
 * scripts/capture-product.cjs makes one shot per code.
 */
export const LANGUAGES = ['en', 'ja', 'es', 'ko', 'fr', 'uk', 'de', 'zh-Hans', 'pt-BR', 'it', 'tr', 'zh-Hant', 'nl', 'pl', 'id'] as const

/** How many the app speaks: the fifteen above, and Arabic. */
export const LANGUAGE_COUNT = 16
