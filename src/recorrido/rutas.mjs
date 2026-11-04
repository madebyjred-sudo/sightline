import { readdirSync, existsSync } from 'node:fs'
import { join, relative, sep } from 'node:path'

const IGNORAR = new Set(['node_modules', '.next', 'dist', 'build', '.git', 'vendor'])

function listar(dir, filtro, acc = []) {
  let ents = []
  try { ents = readdirSync(dir, { withFileTypes: true }) } catch { return acc }
  for (const e of ents) {
    if (IGNORAR.has(e.name)) continue
    const p = join(dir, e.name)
    if (e.isDirectory()) listar(p, filtro, acc)
    else if (filtro(e.name)) acc.push(p)
  }
  return acc
}

export function idDeRuta(ruta) {
  if (ruta === '/') return 'inicio'
  return ruta.replace(/^\//, '').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase()
}

function nombreDeRuta(ruta) {
  if (ruta === '/') return 'Inicio'
  const u = ruta.split('/').filter(Boolean).pop()
  return u.charAt(0).toUpperCase() + u.slice(1).replace(/-/g, ' ')
}

// Devuelve [{ruta, dinamica, archivo}] ; las dinamicas sin ejemplo se marcan para saltarlas.
function desdeSegmentos(segs) {
  const limpios = segs.filter((s) => !/^\(.*\)$/.test(s) && !s.startsWith('@'))
  const ruta = '/' + limpios.join('/')
  const dinamica = limpios.some((s) => /^\[.*\]$/.test(s))
  return { ruta, dinamica }
}

export function rutasNextApp(raiz) {
  const app = existsSync(join(raiz, 'app')) ? join(raiz, 'app') : join(raiz, 'src', 'app')
  return listar(app, (n) => /^page\.(tsx|jsx|ts|js|mdx)$/.test(n)).map((f) => {
    const segs = relative(app, f).split(sep).slice(0, -1)
    return { ...desdeSegmentos(segs), archivo: relative(raiz, f) }
  })
}

export function rutasNextPages(raiz) {
  const pages = existsSync(join(raiz, 'pages')) ? join(raiz, 'pages') : join(raiz, 'src', 'pages')
  return listar(pages, (n) => /\.(tsx|jsx|ts|js)$/.test(n))
    .filter((f) => !relative(pages, f).startsWith('api' + sep) && !/^_(app|document|error)\./.test(f.split(sep).pop()))
    .map((f) => {
      const segs = relative(pages, f).replace(/\.(tsx|jsx|ts|js)$/, '').split(sep)
      if (segs.at(-1) === 'index') segs.pop()
      return { ...desdeSegmentos(segs), archivo: relative(raiz, f) }
    })
}

export function rutasHtml(raiz) {
  return listar(raiz, (n) => n.endsWith('.html')).map((f) => {
    const rel = relative(raiz, f).split(sep).join('/')
    const ruta = rel === 'index.html' ? '/' : '/' + rel.replace(/(^|\/)index\.html$/, '$1').replace(/\/$/, '')
    return { ruta: ruta || '/', dinamica: false, archivo: rel }
  })
}

export function descubrirRutas(raiz, framework) {
  let rutas
  if (framework === 'next-app') rutas = rutasNextApp(raiz)
  else if (framework === 'next-pages') rutas = rutasNextPages(raiz)
  else if (framework === 'html') rutas = rutasHtml(raiz)
  else rutas = [{ ruta: '/', dinamica: false, archivo: null, nota: `${framework}: router no estatico, solo /` }]
  const vistos = new Set()
  return rutas
    .filter((r) => (vistos.has(r.ruta) ? false : vistos.add(r.ruta)))
    .sort((a, b) => a.ruta.localeCompare(b.ruta))
    .map((r) => ({ ...r, id: idDeRuta(r.ruta), nombre: nombreDeRuta(r.ruta) }))
}
