import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { medirEnPagina } from '../composicion/medir.mjs'

export const ESCRITORIO = { viewport: { width: 1440, height: 900 } }
export const MOVIL = { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 }
const TOPE_VISTAS = 25
const TOPE_PROFUNDIDAD = 2
const TOPE_CLICS = 40
const ESPERA_RED = 8000

// Verbos de accion: nunca se clican (es + en).
export const PELIGRO = /\b(enviar|env[ií]a|guardar|guarda|borrar|borra|eliminar|elimina|crear|crea|conectar|conecta|desconectar|pagar|paga|publicar|publica|solicitar|solicita|aceptar|acepta|confirmar|confirma|aprobar|rechazar|invitar|comprar|subir|cargar archivo|generar|genera|ejecutar|ejecuta|archivar|restablecer|reiniciar|cerrar sesi[oó]n|salir|submit|send|save|delete|remove|create|connect|pay|publish|accept|confirm|approve|reject|invite|buy|upload|generate|run|reset|logout|sign ?out|log ?out)\b/i

// Corre en el navegador: candidatos seguros + selector unico para cada uno.
function candidatosEnPagina({ peligro, rutas }) {
  const re = new RegExp(peligro, 'i')
  const visible = (el) => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' }
  const selector = (el) => {
    if (el.id && /^[A-Za-z][\w-]*$/.test(el.id) && document.querySelectorAll('#' + el.id).length === 1) return '#' + el.id
    const partes = []
    let n = el
    while (n && n.nodeType === 1 && n !== document.body) {
      if (n.id && /^[A-Za-z][\w-]*$/.test(n.id) && document.querySelectorAll('#' + n.id).length === 1) { partes.unshift('#' + n.id); break }
      let i = 1, h = n
      while ((h = h.previousElementSibling)) if (h.tagName === n.tagName) i++
      partes.unshift(`${n.tagName.toLowerCase()}:nth-of-type(${i})`)
      n = n.parentElement
    }
    if (!partes[0]?.startsWith('#')) partes.unshift('body')
    return partes.join(' > ')
  }
  const els = [...document.querySelectorAll('[role=tab], [role=tablist] > *, [aria-controls], [aria-expanded], a[href]')]
  const out = []
  const vistos = new Set()
  for (const el of els) {
    if (vistos.has(el) || !visible(el)) continue
    vistos.add(el)
    if (el.closest('[contenteditable=true], input, textarea, select')) continue
    if (el.matches('input, textarea, select, [type=submit], [type=reset]')) continue
    if (el.tagName === 'BUTTON' && el.closest('form') && (!el.getAttribute('type') || el.getAttribute('type') === 'submit')) continue
    if (el.disabled || el.getAttribute('aria-disabled') === 'true') continue
    const texto = [el.innerText, el.getAttribute('aria-label'), el.getAttribute('title'), el.value].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim().slice(0, 80)
    if (re.test(texto)) continue
    let tipo = 'disparador'
    if (el.tagName === 'A') {
      const href = el.getAttribute('href') || ''
      if (el.target === '_blank' || el.hasAttribute('download') || /^(mailto:|tel:|javascript:)/i.test(href)) continue
      const u = new URL(href, location.href)
      if (u.origin !== location.origin) continue
      if (u.pathname === location.pathname && !u.hash && u.search === location.search) continue
      if (u.pathname !== location.pathname && !rutas.includes(u.pathname)) continue
      tipo = 'link'
    } else if (el.getAttribute('role') === 'tab' || el.parentElement?.getAttribute('role') === 'tablist') tipo = 'tab'
    out.push({ selector: selector(el), texto, tipo })
  }
  return out.filter((c) => document.querySelectorAll(c.selector).length === 1)
}

// Firma estructural de lo visible (estable frente a relojes y animaciones).
function firmaEnPagina() {
  const visible = (el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden' }
  const txt = (el) => (el.getAttribute('aria-label') || el.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 40)
  const parte = (sel) => [...document.querySelectorAll(sel)].filter(visible).map(txt).join('|')
  const panels = [...document.querySelectorAll('[role=tabpanel]')].filter(visible).map((e) => e.id || txt(e)).join('|')
  return [location.pathname + location.search + location.hash,
    parte('[role=tab][aria-selected=true]'), panels,
    parte('[role=dialog], [role=alertdialog], dialog[open], [aria-modal=true]'),
    [...document.querySelectorAll('[aria-expanded=true]')].filter(visible).length,
    parte('h1, h2, h3'),
  ].join('§')
}

function slug(s) { return (s || 'vista').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase().slice(0, 30) || 'vista' }

async function nuevaPagina(ctx, errores) {
  const p = await ctx.newPage()
  p.on('console', (m) => { if (m.type() === 'error') errores.push('consola: ' + m.text().slice(0, 200)) })
  p.on('pageerror', (e) => errores.push('pagina: ' + String(e.message).slice(0, 200)))
  return p
}

async function abrir(p, url) {
  await p.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 })
  await p.waitForLoadState('networkidle', { timeout: ESPERA_RED }).catch(() => {})
}

// Abre la ruta sin el estado guardado por clics anteriores del mismo recorrido.
async function abrirLimpio(p, url) {
  await abrir(p, url)
  await p.evaluate(() => { try { localStorage.clear(); sessionStorage.clear() } catch {} })
  await abrir(p, url)
}

// Un paso cuyo control no se ve en este tamano (un indice lateral oculto en movil) no es un error de
// la app: la vista no existe en ese tamano.
export class PasoInvisible extends Error {}

async function reproducir(p, pasos) {
  for (const paso of pasos) {
    const loc = p.locator(paso.selector).first()
    if (!(await loc.isVisible().catch(() => false))) throw new PasoInvisible(`paso invisible: ${paso.texto || paso.selector}`)
    await loc.click({ timeout: 4000 })
    await p.waitForLoadState('networkidle', { timeout: 3000 }).catch(() => {})
    await p.waitForTimeout(350)
  }
}

// lecturas: [{ metodo: 'POST', ruta: '^/api/x$' }] del perfil. Solo peticiones del mismo origen.
export function esLecturaPermitida(metodo, url, origen, lecturas = []) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(metodo)) return true
  let u
  try { u = new URL(url) } catch { return false }
  if (u.origin !== origen) return false
  return lecturas.some((l) => l.metodo.toUpperCase() === metodo && new RegExp(l.ruta).test(u.pathname))
}

async function contexto(nav, opciones, { origen, lecturas = [], bloqueadas }) {
  const ctx = await nav.newContext({ ...opciones, reducedMotion: 'reduce' })
  // Seguridad dura: nada que no sea lectura sale del navegador, salvo lecturas_permitidas del perfil.
  await ctx.route('**/*', (r) => {
    const q = r.request()
    if (esLecturaPermitida(q.method(), q.url(), origen, lecturas)) return r.continue()
    try { bloqueadas?.add(`${q.method()} ${new URL(q.url()).pathname}`) } catch {}
    return r.abort()
  })
  return ctx
}

function tipoVista(cand, firmaAntes, firmaDespues) {
  const dlg = (f) => f.split('§')[3]
  if (dlg(firmaDespues) && dlg(firmaDespues) !== dlg(firmaAntes)) return 'dialogo'
  if (cand.tipo === 'tab') return 'pestana'
  if (cand.tipo === 'link') return 'estado'
  return 'hoja'
}

/**
 * Recorre rutas: captura cada pagina en escritorio y movil y descubre vistas internas.
 * rutas: [{id, ruta, nombre, dinamica}] ; devuelve vistas con la forma de corrida.json.
 */
export async function recorrer({ url, rutas, dirCorrida, log = () => {}, lecturas = [], subdir = 'antes', fijas = null }) {
  const dirCap = join(dirCorrida, 'capturas', subdir)
  mkdirSync(dirCap, { recursive: true })
  const nav = await chromium.launch()
  const bloqueadas = new Set()
  const origen = new URL(url).origin
  // Cada captura y cada recorrido de ruta usan un contexto nuevo: el estado que deja un clic
  // (barra lateral plegada en localStorage, por ejemplo) no se arrastra a la vista siguiente,
  // y la repeticion de comparar parte del mismo estado que el antes.
  const nuevoCtx = (op) => contexto(nav, op, { origen, lecturas, bloqueadas })
  // Calentar: next dev compila cada ruta la primera vez que se pide; se pide una vez antes de capturar.
  const porCalentar = [...new Set([...(rutas || []).filter((r) => !r.dinamica).map((r) => r.ruta), ...(fijas || []).map((v) => v.ruta)])]
  for (const r of porCalentar) {
    try { await fetch(url + r, { signal: AbortSignal.timeout(120000), redirect: 'manual' }) } catch {}
  }
  const conocidas = rutas.map((r) => r.ruta)
  const vistas = []
  const ids = new Set()
  const idUnico = (base) => { let id = base, i = 2; while (ids.has(id)) id = `${base}-${i++}`; ids.add(id); return id }

  async function capturar(vista, pasos) {
    const errores = []
    bloqueadas.clear()
    for (const [tam, op] of [['escritorio', ESCRITORIO], ['movil', MOVIL]]) {
      // Un reintento: next dev en frio o una red lenta no deben dejar una vista sin captura.
      for (let intento = 1; intento <= 2 && !vista.capturas[tam]; intento++) {
        const errs = intento === 1 ? errores : []
        const ctx = await nuevoCtx(op)
        const p = await nuevaPagina(ctx, errs)
        try {
          // Tope duro por intento: una pagina que no responde no congela la corrida entera.
          let reloj
          const tope = new Promise((_, no) => { reloj = setTimeout(() => no(new Error('tope de 90 s por captura')), 90000) })
          const rel = `capturas/${subdir}/${vista.id}-${tam}.png`
          await Promise.race([(async () => {
            await abrir(p, url + vista.ruta)
            await reproducir(p, pasos)
            await p.screenshot({ path: join(dirCorrida, rel), timeout: 30000 })
            // Mapa vertical (docs/COMPOSICION.md): se mide en escritorio, sobre la misma pagina capturada.
            if (tam === 'escritorio') vista.medida = await p.evaluate(medirEnPagina).catch((e) => ({ error: String(e.message).split('\n')[0].slice(0, 160) }))
          })(), tope]).finally(() => clearTimeout(reloj))
          vista.capturas[tam] = rel
        } catch (e) {
          if (e instanceof PasoInvisible) { (vista.no_aplica ||= []).push(tam); break }
          if (intento === 2) errores.push(`${tam}: ${String(e.message).split('\n')[0].slice(0, 200)} (2 intentos)`)
        }
        finally { await p.close(); await ctx.close() }
      }
    }
    for (const b of bloqueadas) errores.push(`bloqueada ${b}`)
    const unicos = [...new Set(errores)]
    vista.error = unicos.length ? unicos.slice(0, 6).join(' ; ') : null
  }

  // Repeticion exacta (comparar): mismas vistas, mismos pasos, sin descubrir.
  if (fijas) {
    const out = []
    for (const f of fijas) {
      const v = { ...f, capturas: { escritorio: null, movil: null }, error: null }
      if (f.tipo === 'pagina' && !f.capturas?.escritorio && f.error) { v.error = f.error; out.push(v); continue }
      log(`repite ${v.id}`)
      await capturar(v, f.pasos || [])
      out.push(v)
    }
    await nav.close()
    return out
  }

  for (const r of rutas) {
    const base = { id: idUnico(r.id), ruta: r.ruta, nombre: r.nombre, tipo: 'pagina', padre: null, origen: 'router', pasos: [], capturas: { escritorio: null, movil: null }, error: null }
    vistas.push(base)
    if (r.dinamica) { base.error = 'ruta dinamica sin ejemplo: saltada'; continue }
    log(`ruta ${r.ruta}`)
    await capturar(base, [])
    if (!base.capturas.escritorio) continue

    // Descubrimiento BFS con un navegador de escritorio.
    const errs = []
    const ctxR = await nuevoCtx(ESCRITORIO)
    const p = await nuevaPagina(ctxR, errs)
    const firmas = new Set()
    const cola = [{ pasos: [], padre: base.id, prof: 0 }]
    let internas = 0, clics = 0
    try {
      await abrir(p, url + r.ruta)
      firmas.add(await p.evaluate(firmaEnPagina))
      while (cola.length && internas < TOPE_VISTAS && clics < TOPE_CLICS) {
        const estado = cola.shift()
        if (estado.prof >= TOPE_PROFUNDIDAD) continue
        await abrirLimpio(p, url + r.ruta); await reproducir(p, estado.pasos)
        const firmaEstado = await p.evaluate(firmaEnPagina)
        const cands = await p.evaluate(candidatosEnPagina, { peligro: PELIGRO.source, rutas: conocidas })
        let sucio = false
        for (const c of cands) {
          if (internas >= TOPE_VISTAS || clics >= TOPE_CLICS) break
          if (estado.pasos.some((s) => s.selector === c.selector)) continue
          try {
            if (sucio) { await abrirLimpio(p, url + r.ruta); await reproducir(p, estado.pasos) }
            clics++
            const antes = await p.evaluate(firmaEnPagina)
            await p.locator(c.selector).first().click({ timeout: 3000 })
            await p.waitForLoadState('networkidle', { timeout: 3000 }).catch(() => {})
            await p.waitForTimeout(350)
            const ahora = new URL(p.url())
            if (ahora.origin !== new URL(url).origin || ahora.pathname !== r.ruta) { sucio = true; continue } // otra ruta: ya cubierta
            const firma = await p.evaluate(firmaEnPagina)
            sucio = firma !== antes
            // Una pestana es una vista aunque sea la seleccionada por defecto.
            const nueva = !firmas.has(firma) || (c.tipo === 'tab' && firma === firmaEstado && !firmas.has('tab:' + firma))
            if (!nueva) continue
            firmas.add(firma); if (c.tipo === 'tab') firmas.add('tab:' + firma)
            const pasos = [...estado.pasos, { accion: 'clic', selector: c.selector, texto: c.texto }]
            const v = { id: idUnico(`${base.id}--${slug(c.texto)}`), ruta: r.ruta, nombre: c.texto || c.selector, tipo: tipoVista(c, antes, firma), padre: estado.padre, origen: 'recorrido', pasos, capturas: { escritorio: null, movil: null }, error: null }
            internas++
            vistas.push(v)
            log(`  vista ${v.id} (${v.tipo})`)
            await capturar(v, pasos)
            cola.push({ pasos, padre: v.id, prof: estado.prof + 1 })
          } catch (e) { sucio = true }
        }
      }
    } catch (e) { errs.push('recorrido: ' + String(e.message).split('\n')[0].slice(0, 200)) }
    finally { await p.close(); await ctxR.close() }
    if (internas >= TOPE_VISTAS || clics >= TOPE_CLICS) errs.push(`tope alcanzado (vistas ${internas}/${TOPE_VISTAS}, clics ${clics}/${TOPE_CLICS})`)
    const extra = [...new Set(errs)].filter((e) => !e.startsWith('consola') && !e.startsWith('pagina'))
    if (extra.length) base.error = [base.error, ...extra].filter(Boolean).join(' ; ')
  }
  await nav.close()
  return vistas
}
