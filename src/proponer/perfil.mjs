import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

const RAIZ = resolve(new URL('../..', import.meta.url).pathname)

// perfiles/REPO.json tal cual (lecturas_permitidas incluida). null si no existe.
export function leerPerfil(repo) {
  try { return JSON.parse(readFileSync(join(RAIZ, 'perfiles', `${repo}.json`), 'utf8')) } catch { return null }
}
