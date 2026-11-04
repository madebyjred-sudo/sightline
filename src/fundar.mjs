// taste fundar: los criterios de diseño de un repo antes de auditarlo (docs/COMPOSICION.md §1).
// Deduce el tipo de producto, el peso de cada capa de la pila y que capa decide cada pieza.
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { join, extname, resolve } from 'node:path'

const RAIZ = resolve(new URL('..', import.meta.url).pathname)

export const CAPAS = {
  shadcn: 'Código y accesibilidad de componentes: foco, estados, ARIA. La base del repo, nunca la norma visual.',
  hig: 'macOS / iOS: leyes de interacción y sensación. 44 pt, hojas inferiores, resortes, teclado, tres columnas.',
  m3: 'Material 3: sistema y estructura. Roles de color, escala tipográfica, elevación tonal, estados como capas, layouts por clase de ventana.',
  marca: 'Dirección artística: tipografía, paleta, foto y tono. Lo único que se ve.',
}

export const METODO = [
  'Se usan las cuatro capas a la vez, cada una en su dominio.',
  'Cuando dos chocan, gana la del dominio del choque: una hoja en móvil la decide macOS/iOS; un color, la marca sobre los roles de Material 3; el foco, shadcn.',
  'Se importan las leyes, nunca el look literal: si una pantalla «se ve Apple» o «se ve Google», falló la marca.',
]

export const CHOQUES_MOVIL = [
  ['Dialog o Sheet lateral', 'hoja inferior con agarre'],
  ['DropdownMenu', 'hoja de acciones'],
  ['zona táctil de 32 a 36 px', '44 pt'],
  ['input de 14 px', '16 px'],
  ['barra fija arriba', 'acciones al alcance del pulgar'],
  ['fade', 'resorte'],
]

const PESOS = {
  herramienta: { manda: 'hig', orden: ['hig', 'm3', 'shadcn', 'marca'], razon: 'En una herramienta de trabajo diario la experiencia es la interacción.' },
  vitrina: { manda: 'marca', orden: ['marca', 'hig', 'm3', 'shadcn'], razon: 'En una vitrina manda la dirección artística; macOS/iOS solo pone las leyes táctiles.' },
  mixto: { manda: 'por vista', orden: ['hig', 'marca', 'm3', 'shadcn'], razon: 'Cada vista se decide por su tipo: las de trabajo como herramienta, las de presentación como vitrina.' },
}

// Pieza -> capa que decide, por tipo de producto.
export function decisiones(tipo) {
  const vit = tipo === 'vitrina'
  return [
    { pieza: 'Navegación', capa: vit ? 'marca' : 'hig', regla: vit ? 'Una barra, la de la marca; sin segunda barra superior.' : 'Tres columnas: fuentes, lista, detalle; inspector derecho plegable.' },
    { pieza: 'Hojas, menús y diálogos en móvil', capa: 'hig', regla: 'Hoja inferior con agarre; menú como hoja de acciones; nada de pop-ups salvo la paleta de comandos.' },
    { pieza: 'Botones y controles', capa: 'shadcn', regla: 'Código y estados de shadcn; forma y color de la marca; 44 pt de zona táctil aunque se vean más chicos.' },
    { pieza: 'Formularios', capa: 'shadcn', regla: 'Accesibilidad de shadcn; inputs de 16 px en móvil (iOS); edición en el sitio en vez de pantallas de editar.' },
    { pieza: 'Color', capa: 'marca', regla: 'Roles de Material 3 (fondo, superficie, acento, estados) llenados con la paleta de la marca: neutros más su acento.' },
    { pieza: 'Tipografía', capa: 'm3', regla: 'Escala de Material 3; familia de la marca.' },
    { pieza: 'Elevación y estados', capa: 'm3', regla: 'Capas tonales y estados como capas (hover, pressed, focus); un contenedor, un tono.' },
    { pieza: 'Movimiento', capa: 'hig', regla: 'Resortes con causa (iOS) y propósito (Material 3); cifras que se mueven con el dato; nada sin reduced-motion.' },
    { pieza: 'Layout', capa: 'm3', regla: vit ? 'Una columna con ritmo de golpe y condensado.' : 'Clases de ventana compacto, medio y expandido; teléfono primero.' },
    { pieza: 'Teclado', capa: 'hig', regla: vit ? 'Lo básico: foco visible y Esc.' : '⌘K, flechas en las listas, atajos visibles, ⌘Z en vez de confirmar.' },
  ]
}

// Señales del código: archivos de interfaz del repo (sin node_modules ni build).
function archivos(repo, max = 1500) {
  const out = []
  const pila = [repo]
  while (pila.length && out.length < max) {
    const d = pila.pop()
    let ents = []
    try { ents = readdirSync(d) } catch { continue }
    for (const e of ents) {
      // Fuera: dependencias, builds, y lo que dibuja interfaces de mentira (kits de ilustración,
      // ejemplos, historias, pruebas), que no dice nada del producto.
      if (/^(node_modules|\.next|dist|build|\.git|coverage|vendor|kit|examples|stories|storybook|playground|fixtures?|__tests__|tests?)$/.test(e)) continue
      const p = join(d, e)
      let st; try { st = statSync(p) } catch { continue }
      if (st.isDirectory()) pila.push(p)
      else if (['.tsx', '.jsx', '.vue', '.svelte', '.html'].includes(extname(e))) out.push(p)
    }
  }
  return out
}

export function senales(repo) {
  const s = { tablas: 0, formularios: 0, barraLateral: 0, sesion: 0, heroes: 0, imagenesGrandes: 0, marketing: 0, archivos: 0 }
  for (const f of archivos(repo)) {
    let t = ''
    try { t = readFileSync(f, 'utf8') } catch { continue }
    s.archivos++
    s.tablas += (t.match(/<table\b|<Table\b|DataTable|useReactTable/g) || []).length
    s.formularios += (t.match(/<form\b|<Form\b|<input\b|<Input\b|<Textarea\b|<select\b/g) || []).length
    s.barraLateral += /Sidebar|<aside\b|barra-?lateral/i.test(t) ? 1 : 0
    s.sesion += /signIn|signin|login|useSession|auth\(|RequireAuth|iniciar sesi/i.test(t) ? 1 : 0
    s.heroes += (t.match(/\bhero\b|Hero[A-Z]?\w*|className="[^"]*\bhero/g) || []).length
    s.imagenesGrandes += (t.match(/<Image\b[^>]*(fill|priority)|object-cover|aspect-video/g) || []).length
    s.marketing += (t.match(/pricing|precios|testimoni|newsletter|cta\b|landing|portafolio|portfolio/gi) || []).length
  }
  return s
}

/** Tipo de producto con sus razones. vistas (opcional) es corrida.vistas con mapa vertical. */
export function tipoDeProducto(s, vistas = []) {
  const trabajo = s.tablas * 2 + s.formularios + s.barraLateral * 3 + s.sesion * 2
  const vitrina = s.heroes * 2 + s.imagenesGrandes + s.marketing
  const razones = [
    `trabajo ${trabajo} (tablas ${s.tablas}, formularios ${s.formularios}, barra lateral ${s.barraLateral}, sesión ${s.sesion})`,
    `vitrina ${vitrina} (hero ${s.heroes}, imágenes grandes ${s.imagenesGrandes}, palabras de marketing ${s.marketing})`,
  ]
  const conMapa = vistas.filter((v) => v.mapa?.secciones?.length)
  if (conMapa.length) {
    const roles = conMapa.flatMap((v) => v.mapa.secciones.map((x) => x.rol))
    const densas = roles.filter((r) => /condensado|saturado/.test(r)).length / roles.length
    razones.push(`secciones densas en el recorrido: ${Math.round(densas * 100)} %`)
  }
  let tipo = 'mixto'
  if (trabajo >= 2 * Math.max(1, vitrina)) tipo = 'herramienta'
  else if (vitrina >= 2 * Math.max(1, trabajo)) tipo = 'vitrina'
  return { tipo, razones }
}

export function armarCriterios({ repo, nombre, tipo, razones, origen }) {
  const p = PESOS[tipo]
  return {
    version: 1, repo: nombre, tipo, origen, razones,
    capas: CAPAS, manda: p.manda, orden: p.orden, razon: p.razon,
    metodo: METODO, choques_movil: CHOQUES_MOVIL, decisiones: decisiones(tipo),
    fuente: 'docs/COMPOSICION.md',
  }
}

export function criteriosMd(c) {
  const L = [`# Criterios de diseño · ${c.repo}`, '', `Tipo de producto: **${c.tipo}** (${c.origen}). ${c.razon}`, '']
  for (const r of c.razones) L.push(`- ${r}`)
  L.push('', '## La pila', '', `Manda: ${c.manda}. Orden de peso: ${c.orden.join(' > ')}.`, '')
  for (const [k, v] of Object.entries(c.capas)) L.push(`- **${k}**: ${v}`)
  L.push('', '## Cómo se combinan', '')
  for (const m of c.metodo) L.push(`- ${m}`)
  L.push('', '## Qué capa decide cada pieza', '', '| Pieza | Decide | Regla |', '|---|---|---|')
  for (const d of c.decisiones) L.push(`| ${d.pieza} | ${d.capa} | ${d.regla} |`)
  L.push('', '## Choques típicos en móvil (shadcn → iOS)', '')
  for (const [a, b] of c.choques_movil) L.push(`- ${a} → ${b}`)
  L.push('')
  return L.join('\n')
}

export const archivoCriterios = (nombre) => join(RAIZ, 'perfiles', `${nombre}.criterios.json`)

/** Criterios guardados del repo, o deducidos al vuelo (sin escribir) si no existen. */
export function criteriosDe(info, vistas = []) {
  const f = archivoCriterios(info.repo)
  if (existsSync(f)) { try { return JSON.parse(readFileSync(f, 'utf8')) } catch {} }
  const { tipo, razones } = tipoDeProducto(senales(info.ruta_repo), vistas)
  return armarCriterios({ repo: info.ruta_repo, nombre: info.repo, tipo, razones, origen: 'deducido: corre taste fundar para fijarlo' })
}

export function fundar(info, { tipo: forzado = null, vistas = [] } = {}) {
  const s = senales(info.ruta_repo)
  const t = tipoDeProducto(s, vistas)
  const tipo = forzado || t.tipo
  const c = armarCriterios({ repo: info.ruta_repo, nombre: info.repo, tipo, razones: t.razones, origen: forzado ? 'fijado a mano' : 'deducido por taste fundar' })
  const f = archivoCriterios(info.repo)
  writeFileSync(f, JSON.stringify(c, null, 2) + '\n')
  writeFileSync(f.replace(/\.json$/, '.md'), criteriosMd(c))
  return { criterios: c, archivo: f }
}
