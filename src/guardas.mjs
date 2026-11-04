// Guardas (C5): aprueban o rechazan una contrapropuesta. Interfaz de la ESPEC v1:
// revisar(antes, despues, perfil, opciones) -> { ok, motivos, por_vista, build, ... }
// opciones: { arbol, base, tocadas, subcarpeta?, tier?, dirAntes?, dirDespues?, corrida?, build? }
import { execFileSync, spawnSync } from 'node:child_process'
import { existsSync, readFileSync, mkdtempSync, rmSync, symlinkSync } from 'node:fs'
import { join, resolve, isAbsolute } from 'node:path'
import { tmpdir } from 'node:os'
import { PNG } from 'pngjs'
import pixelmatch from 'pixelmatch'
import { puntajeDeCorrida } from './puntaje.mjs'
import { PRESUPUESTOS } from './perfil.mjs'

const BUILD_MS = 5 * 60 * 1000
const pct = (x) => Math.round(x * 10000) / 100 // fraccion -> porcentaje con 2 decimales

function git(dir, args) {
  return execFileSync('git', ['-C', dir, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 64 << 20 })
}

// ---------- (a) build ----------
function leerJson(f) { try { return JSON.parse(readFileSync(f, 'utf8')) } catch { return null } }

export function elegirChequeo(dir) {
  const tsc = ['tsconfig.app.json', 'tsconfig.json'].find((f) => existsSync(join(dir, f)))
  if (tsc) return { tipo: 'tsc', proyecto: tsc }
  if (leerJson(join(dir, 'package.json'))?.scripts?.build) return { tipo: 'build' }
  return { tipo: 'sin-build' }
}

// Errores de tsc normalizados sin linea ni columna, para comparar contra la base aunque el codigo se mueva.
export function erroresTsc(salida) {
  return String(salida).split('\n').map((l) => /^(.+?)\(\d+,\d+\): error (TS\d+): (.*)$/.exec(l.trim()))
    .filter(Boolean).map((m) => `${m[1]}: ${m[2]} ${m[3]}`)
}

function binTsc(dir, respaldo) {
  for (const d of [dir, respaldo].filter(Boolean)) { const b = join(d, 'node_modules/.bin/tsc'); if (existsSync(b)) return [b, []] }
  return ['npx', ['--no-install', 'tsc']]
}

export function correrChequeo(dir, chequeo, { respaldo } = {}) {
  if (chequeo.tipo === 'tsc') {
    const [cmd, pre] = binTsc(dir, respaldo)
    const r = spawnSync(cmd, [...pre, '--noEmit', '-p', chequeo.proyecto], { cwd: dir, encoding: 'utf8', timeout: BUILD_MS, maxBuffer: 64 << 20 })
    if (r.error && r.error.code === 'ETIMEDOUT') return { ok: null, errores: [], nota: 'tsc pasó de 5 min' }
    const errores = erroresTsc(r.stdout + r.stderr)
    return { ok: r.status === 0, errores, codigo: r.status }
  }
  if (chequeo.tipo === 'build') {
    const r = spawnSync('npm', ['run', 'build'], { cwd: dir, encoding: 'utf8', timeout: BUILD_MS, maxBuffer: 64 << 20 })
    if (r.error && r.error.code === 'ETIMEDOUT') return { ok: null, errores: [], nota: 'build pasó de 5 min' }
    return { ok: r.status === 0, errores: r.status === 0 ? [] : ['npm run build falla'], codigo: r.status }
  }
  return { ok: null, errores: [] }
}

function enlazarNodeModules(origen, destino) {
  const nm = join(origen, 'node_modules')
  if (existsSync(nm) && !existsSync(join(destino, 'node_modules'))) symlinkSync(resolve(nm), join(destino, 'node_modules'))
}

export function revisarBuild(arbol, base, sub = '') {
  const dir = join(arbol, sub)
  const chequeo = elegirChequeo(dir)
  if (chequeo.tipo === 'sin-build') return { build: 'sin-build', chequeo: 'sin-build', nuevos: [], heredados: 0 }
  const despues = correrChequeo(dir, chequeo)
  if (despues.ok === null && despues.nota) return { build: 'sin-build', chequeo: chequeo.tipo, nuevos: [], heredados: 0, nota: despues.nota }
  if (despues.ok) return { build: 'ok', chequeo: chequeo.tipo, nuevos: [], heredados: 0 }
  // Falla en la rama: se corre el mismo chequeo en la base para no culpar errores heredados.
  let antes = { ok: null, errores: [] }
  let wt = null
  if (base) {
    wt = join(mkdtempSync(join(tmpdir(), 'taste-base-')), 'wt')
    try {
      git(arbol, ['worktree', 'add', '--detach', wt, base])
      // node_modules: del arbol (que a su vez enlaza al original) en cada nivel que lo tenga.
      enlazarNodeModules(arbol, wt)
      if (sub) enlazarNodeModules(join(arbol, sub), join(wt, sub))
      antes = correrChequeo(join(wt, sub), chequeo, { respaldo: dir })
    } finally {
      try { git(arbol, ['worktree', 'remove', '--force', wt]) } catch {}
      rmSync(resolve(wt, '..'), { recursive: true, force: true })
    }
  }
  const resto = [...antes.errores]
  const nuevos = []
  for (const e of despues.errores) { const i = resto.indexOf(e); if (i >= 0) resto.splice(i, 1); else nuevos.push(e) }
  if (chequeo.tipo === 'build') {
    const culpa = antes.ok !== false // la base compilaba (o no se pudo saber): la falla es de la rama
    return { build: culpa ? 'falla' : 'ok', chequeo: 'build', nuevos: culpa ? despues.errores : [], heredados: culpa ? 0 : 1 }
  }
  return { build: nuevos.length ? 'falla' : 'ok', chequeo: 'tsc', nuevos, heredados: despues.errores.length - nuevos.length }
}

// ---------- (b) diff de codigo ----------
const NO_INTERFAZ = [
  /(^|\/)(api|db|database|server|servidor|migrations?|supabase|prisma|drizzle|nginx|scripts)\//i,
  /(^|\/)\.env(\.|$)/, /\.sql$/i, /(^|\/)(Dockerfile|docker-compose[^/]*|Procfile|vercel\.json|netlify\.toml|fly\.toml)$/,
  /(^|\/)(next|vite|nuxt|astro|svelte|remix)\.config\.[cm]?[jt]s$/, /(^|\/)middleware\.[jt]s$/,
  /(^|\/)(package(-lock)?\.json|bun\.lockb?|pnpm-lock\.yaml|yarn\.lock)$/,
]
const TOKENS = /(^|\/)(design-)?tokens?(\/|\.|$)/i
const TEMA = /(^|\/)(tailwind\.config\.[cm]?[jt]s|theme\.[cm]?[jt]sx?|theme\/|themes?\.css$|components\.json$)/i
const LINEA_TEMA = /(--[\w-]*(color|colour|primary|secondary|accent|brand|marca|background|foreground|font|radius|ring|border|muted|destructive|card|popover|sidebar|chart|input)[\w-]*\s*:)|font-family|@font-face/i
const LINEA_FUENTE = /fonts\.googleapis|fonts\.gstatic|@fontsource|next\/font|use\.typekit|\.woff2?\b/i
const COMPONENTE = /\.(tsx|jsx|vue|svelte)$/i

export function archivosCambiados(arbol, base) {
  const out = new Map()
  for (const l of git(arbol, ['diff', '--name-status', '--no-renames', base]).split('\n').filter(Boolean)) {
    const [st, ...r] = l.split('\t'); out.set(r.join('\t'), st[0])
  }
  for (const f of git(arbol, ['ls-files', '--others', '--exclude-standard']).split('\n').filter(Boolean)) out.set(f, 'A')
  return [...out].map(([ruta, estado]) => ({ ruta, estado }))
}

function lineasCambiadas(arbol, base, ruta, estado) {
  if (estado === 'A' && !git(arbol, ['ls-files', ruta]).trim()) {
    try { return readFileSync(join(arbol, ruta), 'utf8').split('\n') } catch { return [] }
  }
  return git(arbol, ['diff', '-U0', base, '--', ruta]).split('\n')
    .filter((l) => /^[+-]/.test(l) && !/^(\+\+\+|---)/.test(l)).map((l) => l.slice(1))
}

export function revisarCodigo(arbol, base, perfil, { tokens = [] } = {}) {
  const motivos = []
  const archivos = archivosCambiados(arbol, base)
  const estricto = perfil === 'estricto'
  const esToken = (r) => TOKENS.test(r) || tokens.some((t) => r === t || r.startsWith(t.replace(/\/$/, '') + '/'))
  for (const { ruta, estado } of archivos) {
    if (NO_INTERFAZ.some((re) => re.test(ruta))) { motivos.push(`Tocas ${ruta}, que no es interfaz: una propuesta solo cambia archivos de interfaz.`); continue }
    if (!estricto) continue
    if (esToken(ruta)) { motivos.push(`Tocas tokens en ${ruta}: en estricto la marca está congelada.`); continue }
    if (TEMA.test(ruta)) { motivos.push(`Tocas el tema en ${ruta}: en estricto la marca está congelada.`); continue }
    if (estado === 'A' && COMPONENTE.test(ruta)) { motivos.push(`Agregas un componente nuevo (${ruta}): en estricto no hay piezas nuevas.`); continue }
    const lineas = lineasCambiadas(arbol, base, ruta, estado)
    if (/\.(css|scss|sass|less)$/i.test(ruta) && lineas.some((l) => LINEA_TEMA.test(l))) { motivos.push(`Cambias variables de color, tipografía o radios en ${ruta}: en estricto la marca está congelada.`); continue }
    if (lineas.some((l) => LINEA_FUENTE.test(l))) motivos.push(`Cambias la carga de fuentes en ${ruta}: en estricto la tipografía está congelada.`)
  }
  return { archivos, motivos }
}

// ---------- (c) diff visual ----------
export function diferencia(a, b) {
  if (!a || !b || !existsSync(a) || !existsSync(b)) return 1
  const x = PNG.sync.read(readFileSync(a)), y = PNG.sync.read(readFileSync(b))
  if (x.width !== y.width || x.height !== y.height) return 1
  const n = pixelmatch(x.data, y.data, null, x.width, x.height, { threshold: 0.1 })
  return n / (x.width * x.height)
}

function ruta(dir, p) { return !p ? null : isAbsolute(p) ? p : dir ? join(dir, p) : p }

export function revisarVisual(antes, despues, perfil, { tocadas = [], dirAntes, dirDespues } = {}) {
  const pres = PRESUPUESTOS[perfil]
  const motivos = []
  const por_vista = {}
  const ids = new Set([...(antes?.vistas || []), ...(despues?.vistas || [])].map((v) => v.id))
  const buscar = (c, id) => (c?.vistas || []).find((v) => v.id === id)
  for (const id of ids) {
    const va = buscar(antes, id), vd = buscar(despues, id)
    const r = {}
    for (const d of ['escritorio', 'movil']) {
      const pa = va?.capturas?.[d], pd = vd?.capturas?.[d]
      if (!pa && !pd) continue
      r[d] = pct(diferencia(ruta(dirAntes, pa), ruta(dirDespues, pd)))
    }
    if (!Object.keys(r).length) continue
    por_vista[id] = r
    const peor = Math.max(...Object.values(r)) / 100
    const tocada = tocadas.includes(id)
    // Ruido base medido en la auditoria (dos capturas del mismo arbol): se suma al tope.
    const ruido = Math.max(0, ...Object.values(va?.ruido || {})) / 100
    const tope = pres.no_tocadas + ruido
    r.ruido = pct(ruido)
    if (!tocada && peor >= tope) motivos.push(`La vista ${id} cambia ${pct(peor)} % y no estaba entre las tocadas (tope ${pct(tope)} %${ruido ? `, con ${pct(ruido)} % de ruido base` : ''}).`)
    if (tocada && pres.tocadas != null && peor > pres.tocadas) motivos.push(`La vista ${id} cambia ${pct(peor)} %: pasa el presupuesto de estricto (${pct(pres.tocadas)} %).`)
  }
  return { por_vista, motivos }
}

// ---------- (d) puntaje ----------
// Solo se compara lo medido en las dos corridas: un hallazgo de impeccable sobre la pagina viva cuenta si esa
// vista se escaneo antes y despues. Sin esto, una pagina que antes no rindio y despues si baja el puntaje
// aunque la propuesta no haya empeorado nada (caso real: 7 hallazgos vivos antes, 304 despues).
export function mismaCobertura(antes, despues) {
  const ca = antes?.cobertura?.impeccable_vivo, cd = despues?.cobertura?.impeccable_vivo
  const ambas = ca && cd ? new Set(ca.filter((v) => cd.includes(v))) : null
  const filtrar = (c) => {
    if (!ambas) return c
    const hallazgos = (c.hallazgos || []).filter((h) => !(h.fuente === 'impeccable' && h.vista) || ambas.has(h.vista))
    return { ...c, hallazgos }
  }
  return { antes: filtrar(antes), despues: filtrar(despues), comparables: ambas ? [...ambas] : null }
}

export function revisarPuntaje(antes, despues, tier) {
  if (!antes || !despues) return { motivos: [] }
  const m = mismaCobertura(antes, despues)
  const a = puntajeDeCorrida(m.antes)[tier], d = puntajeDeCorrida(m.despues)[tier]
  const nota = m.comparables ? '' : ' (sin registro de cobertura en alguna corrida: comparacion completa)'
  return { antes: a, despues: d, comparables: m.comparables, motivos: d < a ? [`El puntaje ${tier} baja de ${a} a ${d}${nota}.`] : [] }
}

// ---------- entrada ----------
export async function revisar(antes, despues, perfil, opciones = {}) {
  const p = typeof perfil === 'string' ? perfil : perfil?.perfil
  const nivel = p === 'libre' ? 'libre' : 'estricto' // desconocido = estricto
  const { arbol, base, tocadas = [], subcarpeta = '' } = opciones
  const dirAntes = opciones.dirAntes ?? opciones.corrida
  const dirDespues = opciones.dirDespues ?? opciones.corrida
  const tier = opciones.tier || despues?.tier || antes?.tier || 'AA'
  const motivos = []
  let build = { build: 'sin-build' }, codigo = { archivos: [] }
  if (arbol && base) {
    codigo = revisarCodigo(arbol, base, nivel, { tokens: (antes?.stack?.tokens || []).map((t) => (subcarpeta ? join(subcarpeta, t) : t)) })
    motivos.push(...codigo.motivos)
    if (opciones.build !== false) {
      build = revisarBuild(arbol, base, subcarpeta)
      if (build.build === 'falla') motivos.push(`El chequeo de ${build.chequeo} falla con ${build.nuevos.length} errores nuevos: ${build.nuevos.slice(0, 2).join('; ')}`)
    }
  }
  const vis = revisarVisual(antes, despues, nivel, { tocadas, dirAntes, dirDespues })
  motivos.push(...vis.motivos)
  const pun = revisarPuntaje(antes, despues, tier)
  motivos.push(...pun.motivos)
  return {
    ok: motivos.length === 0, motivos, por_vista: vis.por_vista, build: build.build,
    perfil: nivel, tier, detalle_build: build, archivos: codigo.archivos,
    puntaje: { antes: pun.antes ?? null, despues: pun.despues ?? null },
    notas: arbol && base ? [] : ['sin arbol o base: no se revisaron build ni diff de codigo'],
  }
}
