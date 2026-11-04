// The page comes in two languages, one HTML entry each: index.html (es) and
// en/index.html (en). Each sets <html lang>, and everything reads it from there.
export type Lang = 'es' | 'en'

export const LANG: Lang = document.documentElement.lang === 'en' ? 'en' : 'es'

/** The string (or list, or node) for the page's language. */
export const t = <T,>(es: T, en: T): T => (LANG === 'en' ? en : es)

/** One decimal, with the language's separator: 81,4 or 81.4. */
export const decimal = (n: number) => t(n.toFixed(1).replace('.', ','), n.toFixed(1))
