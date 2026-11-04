// The kit is copied as is (without kit/brands); scenes import its parts from
// here instead of kit/index.ts, which re-exports the brand registry.
export { Stage } from '../kit/stage'
export type { Act } from '../kit/act'
export type { Layout } from '../kit/looks'
export type { Rect } from '../kit/measure'
export { Window, Bar, Text, Prompt, Caret } from '../kit/window'
export { Count, Collapse, States } from '../kit/motion'
export { Segmented } from '../kit/controls'

/** The demos' accent for the kit (selection, focus): pino, PANTONE 3435 C.
 * The kit takes a color string, so it can't read paleta.css's variable. */
export const ACENTO = '#154734'
