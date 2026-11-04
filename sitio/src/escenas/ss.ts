// The kit is copied as is (without kit/brands); scenes import its parts from
// here instead of kit/index.ts, which re-exports the brand registry.
export { Stage } from '../kit/stage'
export type { Act } from '../kit/act'
export type { Layout } from '../kit/looks'
export type { Rect } from '../kit/measure'
export { Window, Bar, Text, Prompt, Caret } from '../kit/window'
export { Count, Collapse, States } from '../kit/motion'
export { Segmented } from '../kit/controls'
export { Phone } from '../kit/phone'
export { Check } from '../kit/parts/Check'

/** The demos' accent for the kit (selection, focus): grafito, PANTONE Cool
 * Gray 11 C. The kit takes a color string, so it can't read paleta.css. */
export const ACENTO = '#53565a'
