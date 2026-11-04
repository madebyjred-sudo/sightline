// Paquete por vista: lo que el agente lee antes de escribir criterios.json.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { join, resolve, dirname } from 'node:path'
import { homedir } from 'node:os'

const RAIZ = resolve(new URL('../..', import.meta.url).pathname)
export const REGLA_MADRE = `I want this to be as perfect as Linear's website or Apple Notes: simple purpose, simple architecture, simple design, simple implementation. Cut taglines, helper text and secondary labels. If a screen needs them to make sense, fix the layout. Every decision should elevate UX, DX and AX at once, without breaking anything.`
export const INCLUYE = { A: ['A'], AA: ['A', 'AA'], AAA: ['A', 'AA', 'AAA'] }
const MAX = 6

// Carpeta de biblioteca por mundo (ESPEC: externa + la del mundo del repo, nunca la del otro).
export function carpetasBiblioteca(mundo, base = {}) {
  const externa = base.externa ?? join(RAIZ, 'biblioteca', 'externa')
  const propio = mundo === 'shift' ? (base.shift ?? process.env.TASTE_BIBLIOTECA_SHIFT ?? join(homedir(), '.taste', 'biblioteca', 'shift'))
    : mundo === 'personal' ? (base.personal ?? join(RAIZ, 'biblioteca', 'personal')) : null
  return [externa, propio].filter(Boolean)
}

function jsonl(f) {
  if (!existsSync(f)) return []
  return readFileSync(f, 'utf8').split('\n').filter((l) => l.trim()).map((l) => { try { return JSON.parse(l) } catch { return null } }).filter(Boolean)
}

export function cargarBiblioteca(mundo, base = {}) {
  const componentes = [], inspo = []
  for (const dir of carpetasBiblioteca(mundo, base)) {
    for (const c of jsonl(join(dir, 'componentes.jsonl'))) if (c.mundo === 'externa' || c.mundo === mundo) componentes.push(c)
    for (const i of jsonl(join(dir, 'inspo.jsonl'))) if (i.mundo === 'externa' || i.mundo === mundo) inspo.push({ ...i, ruta_abs: join(dir, i.archivo) })
  }
  return { componentes, inspo }
}

export function reglasQueAplican(reglas, { perfil, modo, tier }) {
  return reglas.filter((r) => r.perfiles.includes(perfil) && r.modos.includes(modo) && INCLUYE[tier].includes(r.tier))
}

// Palabras de la vista -> patron de la lista cerrada.
const PISTAS = [
  [/chat|mensaje|conversa/, 'chat'], [/taller|libro|editor|lienzo|canvas|doc/, 'editor'],
  [/conectar|solicitar|campo|formulario|acceso|registro/, 'formulario'], [/config|ajuste|preferencia/, 'configuracion'],
  [/buscar|busqueda/, 'busqueda'], [/filtro/, 'filtros'], [/tabla/, 'tabla'], [/lista|barrer|historial|recientes/, 'lista'],
  [/menu/, 'menu'], [/avatar|perfil|detalle|ficha/, 'detalle'], [/precio|plan/, 'precios'], [/inicio|panel|dashboard/, 'dashboard'],
]
const POR_TIPO = { pestana: 'pestanas', dialogo: 'panel-lateral', hoja: 'panel-lateral' }

export function patronesDeVista(vista, hallazgos, componentes) {
  const votos = new Map()
  const suma = (p, n) => p && votos.set(p, (votos.get(p) || 0) + n)
  const texto = `${vista.id} ${vista.nombre || ''}`.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  for (const [re, p] of PISTAS) if (re.test(texto)) suma(p, 10)
  suma(POR_TIPO[vista.tipo], 3)
  const archivos = new Set(hallazgos.map((h) => h.archivo).filter(Boolean))
  for (const c of componentes) if (archivos.has(c.ruta)) suma(c.patron, 1)
  if (!votos.size) suma('detalle', 1)
  return [...votos.entries()].sort((a, b) => b[1] - a[1]).map(([p]) => p)
}

// Archivos de una pagina next-app: su carpeta + imports @/ de un nivel.
export function archivosDePagina(raiz, ruta, framework) {
  if (!raiz || !ruta || !framework?.startsWith('next')) return []
  const base = framework === 'next-app' ? (ruta === '/' ? 'app' : 'app' + ruta) : (ruta === '/' ? 'pages/index' : 'pages' + ruta)
  const pagina = ['page.tsx', 'page.jsx', 'page.ts', 'page.js'].map((f) => framework === 'next-app' ? `${base}/${f}` : null).filter(Boolean)
    .concat(framework === 'next-pages' ? ['.tsx', '.jsx', '.js'].map((e) => base + e) : [])
    .find((f) => existsSync(join(raiz, f)))
  if (!pagina) return []
  const out = new Set([pagina])
  const src = readFileSync(join(raiz, pagina), 'utf8')
  for (const m of src.matchAll(/from\s+["']@\/([^"']+)["']/g)) {
    for (const e of ['.tsx', '.ts', '.jsx', '.js', '/index.tsx', '/index.ts']) if (existsSync(join(raiz, m[1] + e))) { out.add(m[1] + e); break }
  }
  return [...out]
}

export function hallazgosDeVista(corrida, vista, raiz) {
  const propios = corrida.hallazgos.filter((h) => h.vista === vista.id)
  if (vista.tipo !== 'pagina') return propios
  const archivos = new Set(archivosDePagina(raiz, vista.ruta, corrida.stack?.framework))
  const deCodigo = corrida.hallazgos.filter((h) => !h.vista && archivos.has(h.archivo))
  return [...propios, ...deCodigo]
}

function rel(a, b) { return a.startsWith(b + '/') ? a.slice(b.length + 1) : a }

export function textoPaquete({ corrida, vista, hallazgos, reglas, inspo, componentes, patrones, modo, tier }) {
  const L = []
  L.push(`# ${vista.id}`, '', '## Regla madre', '', `> ${REGLA_MADRE}`, '')
  L.push('## Vista', '', `- ruta: ${vista.ruta} · tipo: ${vista.tipo} · padre: ${vista.padre ?? '-'}`)
  if (vista.pasos?.length) L.push(`- pasos: ${vista.pasos.map((p) => `clic «${p.texto || p.selector}»`).join(' > ')}`)
  L.push(`- capturas: ${vista.capturas?.escritorio ?? 'sin captura'} · ${vista.capturas?.movil ?? 'sin captura'} (relativas a la corrida)`)
  if (vista.error) L.push(`- error al capturar: ${vista.error}`)
  L.push(`- modo ${modo} · tier ${tier} · perfil ${corrida.perfil} · mundo ${corrida.mundo}`, `- patrones: ${patrones.join(', ')}`, '')
  const porRegla = new Map()
  for (const h of hallazgos) { if (!porRegla.has(h.regla)) porRegla.set(h.regla, []); porRegla.get(h.regla).push(h) }
  L.push(`## Hallazgos (${hallazgos.length})`, '')
  if (!hallazgos.length) L.push(vista.tipo === 'pagina' ? 'Ninguno.' : `Sin hallazgos propios; los de código están en paquete/${vista.padre ?? 'padre'}.md.`)
  for (const [regla, hs] of [...porRegla.entries()].sort((a, b) => b[1].length - a[1].length)) {
    L.push(`### ${regla} (${hs.length}, ${hs[0].severidad}, tier ${hs[0].tier})`)
    for (const h of hs.slice(0, 25)) L.push(`- ${h.id} · ${h.archivo ?? '-'}:${h.linea ?? '-'} · ${(h.mensaje || '').slice(0, 140)}${h.fragmento ? ` · \`${String(h.fragmento).slice(0, 80).replace(/`/g, "'")}\`` : ''}`)
    if (hs.length > 25) L.push(`- y ${hs.length - 25} más con la misma regla`)
    L.push('')
  }
  L.push(`## Reglas que aplican (${reglas.length})`, '')
  for (const r of reglas) L.push(`- ${r.id} · ${r.tier} · ${r.capa} · ${r.regla} · fuente ${r.fuente.archivo}:${r.fuente.linea}`)
  L.push('', `## Inspo (${inspo.length})`, '')
  for (const i of inspo) L.push(`- inspo:${i.id} · ${i.patron} · ${i.ruta_abs} · ${i.por_que}`)
  L.push('', `## Componentes (${componentes.length})`, '')
  for (const c of componentes) L.push(`- ${c.id} · ${c.patron} · ${c.mundo} · ${c.ruta}`)
  L.push('')
  return L.join('\n')
}

export function elegirPorPatron(lista, patrones, n = MAX) {
  const out = []
  for (const p of patrones) for (const x of lista) { if (out.length >= n) return out; if (x.patron === p && !out.includes(x)) out.push(x) }
  return out
}

/**
 * Escribe paquete/VISTA_ID.md por vista. Devuelve [{ vista, archivo, hallazgos, patrones }].
 * opciones: { modo, tier, raiz (repo o arbol), reglas, biblioteca: {externa, personal, shift}, solo }
 */
export function armarPaquetes(corrida, dir, opciones) {
  const { modo, tier = corrida.tier, raiz = corrida.ruta_repo, solo = null } = opciones
  const reglas = reglasQueAplican(opciones.reglas ?? JSON.parse(readFileSync(join(RAIZ, 'reglas', 'reglas.json'), 'utf8')), { perfil: corrida.perfil, modo, tier })
  const bib = cargarBiblioteca(corrida.mundo, opciones.biblioteca)
  mkdirSync(join(dir, 'paquete'), { recursive: true })
  const out = []
  for (const vista of corrida.vistas) {
    if (solo && vista.id !== solo) continue
    const hs = hallazgosDeVista(corrida, vista, raiz).filter((h) => INCLUYE[tier].includes(h.tier))
    const patrones = patronesDeVista(vista, hs, bib.componentes)
    const archivo = join(dir, 'paquete', `${vista.id}.md`)
    writeFileSync(archivo, textoPaquete({ corrida, vista, hallazgos: hs, reglas, inspo: elegirPorPatron(bib.inspo, patrones), componentes: elegirPorPatron(bib.componentes, patrones), patrones, modo, tier }))
    out.push({ vista: vista.id, archivo: rel(archivo, dir), hallazgos: hs.length, patrones })
  }
  return out
}
