// Resolucion de perfil por repo (C5). perfiles/NOMBRE.json manda; si no existe, se deduce por ruta.
import { existsSync, readFileSync } from 'node:fs'
import { basename, join, resolve } from 'node:path'

const RAIZ = resolve(new URL('..', import.meta.url).pathname)
export const MODOS = ['correccion', 'limpieza', 'mejora', 'edicion', 'creacion']
export const MODOS_POR_PERFIL = { libre: MODOS, estricto: ['correccion', 'limpieza', 'mejora'] }

// Presupuestos de cambio visual (fraccion de pixeles distintos, 0..1).
// no_tocadas 0,5 %: antialias y relojes; mas que eso es un efecto colateral.
// tocadas en estricto 15 %: quitar o corregir un texto reacomoda lo de abajo; mas de 15 % ya es redisenar.
export const PRESUPUESTOS = {
  libre: { no_tocadas: 0.005, tocadas: null },
  estricto: { no_tocadas: 0.005, tocadas: 0.15 },
}

// Perfiles deducidos por nombre de repo. Vacío en la versión pública: cada repo declara el suyo en
// perfiles/REPO.json; sin archivo, el perfil es estricto (conservador).
const DEDUCIDOS = []

function leer(f) { try { return JSON.parse(readFileSync(f, 'utf8')) } catch { return null } }

export function resolverPerfil(repo, { dirPerfiles = join(RAIZ, 'perfiles') } = {}) {
  const ruta = resolve(String(repo))
  const nombre = basename(ruta)
  const archivo = join(dirPerfiles, `${nombre}.json`)
  let base = existsSync(archivo) ? leer(archivo) : null
  let origen = base ? 'archivo' : 'deducido'
  if (!base) {
    const r = ruta.toLowerCase()
    const d = DEDUCIDOS.find((x) => x.m.some((s) => r.includes(s)))
    base = { repo: nombre, mundo: d?.mundo ?? 'personal', perfil: d?.perfil ?? 'estricto', notas: d ? '' : 'repo desconocido: estricto por conservador' }
    if (!d) origen = 'conservador'
  }
  const perfil = base.perfil === 'libre' ? 'libre' : 'estricto'
  return {
    ...base, repo: base.repo || nombre, perfil, origen,
    modos: MODOS_POR_PERFIL[perfil],
    presupuestos: PRESUPUESTOS[perfil],
    congelados: perfil === 'estricto' ? ['tokens', 'tema', 'fuentes', 'componentes-nuevos'] : [],
  }
}

export const permiteModo = (p, modo) => (typeof p === 'string' ? MODOS_POR_PERFIL[p] : p.modos).includes(modo)
