import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { tmpdir } from 'node:os'
import { createServer } from 'node:http'
import { fileURLToPath } from 'node:url'
import { rutasNextApp, descubrirRutas } from '../src/recorrido/rutas.mjs'
import { puntaje, puntuar } from '../src/puntaje.mjs'
import { mapearTransitions } from '../src/detectar/transitions.mjs'
import { mapearImpeccable } from '../src/detectar/impeccable.mjs'
import { recorrer } from '../src/recorrido/navegar.mjs'

const AQUI = dirname(fileURLToPath(import.meta.url))
const DOCS = join(AQUI, '..', 'docs')

test('rutas next app router desde un arbol falso', () => {
  const raiz = mkdtempSync(join(tmpdir(), 'taste-rutas-'))
  const pag = (p) => { mkdirSync(join(raiz, 'app', p), { recursive: true }); writeFileSync(join(raiz, 'app', p, 'page.tsx'), 'export default () => null') }
  for (const p of ['', 'conectar', '(marketing)/precios', 'blog/[slug]', 'node_modules/x']) pag(p)
  writeFileSync(join(raiz, 'package.json'), '{"dependencies":{"next":"15"}}')
  const r = descubrirRutas(raiz, 'next-app')
  assert.deepEqual(r.map((x) => x.ruta), ['/', '/blog/[slug]', '/conectar', '/precios'])
  assert.equal(r.find((x) => x.ruta === '/blog/[slug]').dinamica, true)
  assert.equal(r.find((x) => x.ruta === '/').id, 'inicio')
  assert.equal(rutasNextApp(raiz).length, 4)
  rmSync(raiz, { recursive: true })
})

test('puntaje: pesos, tope por regla y tiers', () => {
  const h = (regla, severidad, tier, vista = null) => ({ regla, severidad, tier, vista })
  const hs = [...Array(10)].map(() => h('a', 'major', 'A', 'inicio')) // 80 -> tope 20
  hs.push(h('b', 'warn', 'AA'), h('c', 'minor', 'AAA'), h('d', 'info', 'A'))
  // v0 (puntuar): 100 - penalidad con tope por regla.
  assert.equal(puntuar(hs.filter((x) => x.tier === 'A')), 80)
  assert.equal(puntuar(hs), 75)
  assert.equal(puntuar([]), 100)
  // v1 (C5, docs/PUNTAJE.md): valores declarados en docs/log-C5.md:11.
  const p = puntaje(hs, [{ id: 'inicio' }])
  assert.equal(p.A, 91.7)
  assert.equal(p.AA, 89.7)
  assert.equal(p.AAA, 89.3)
  assert.deepEqual(p.por_vista, { inicio: { A: 83.3, AA: 83.3, AAA: 83.3 } })
})

// transitions-agent 0.11.1 puntua con info=2 y topes distintos por regla (lib/scan.mjs) y da 19.
// La especificacion fija info=0 y tope 20 para todas: sobre los mismos 91 hallazgos eso da 28.
const MEDICION = (n) => join(DOCS, `medicion-inicial-${n}.json`)
const sinMedicion = (n) => !existsSync(MEDICION(n)) && 'medicion privada, no viene en el repo publico'

test('mapeo transitions desde una medicion real: 91 hallazgos, puntaje ESPEC 28 (transitions propio 19)', { skip: sinMedicion('one-transitions') }, () => {
  const crudo = JSON.parse(readFileSync(join(DOCS, 'medicion-inicial-one-transitions.json'), 'utf8'))
  const hs = mapearTransitions(crudo)
  assert.equal(hs.length, 91)
  assert.ok(hs.every((h) => h.fuente === 'transitions' && h.tier === 'A' && h.regla.startsWith('transitions:')))
  assert.equal(crudo.score, 19)
  assert.equal(puntuar(hs), 28)
})

test('mapeo impeccable desde una medicion real', { skip: sinMedicion('one-impeccable') }, () => {
  const crudo = JSON.parse(readFileSync(join(DOCS, 'medicion-inicial-one-impeccable.json'), 'utf8'))
  const hs = mapearImpeccable(crudo, { raiz: '/tmp/app' })
  assert.deepEqual(hs.map((h) => h.regla), ['impeccable:side-tab', 'impeccable:bounce-easing'])
  assert.deepEqual(hs.map((h) => h.severidad), ['warn', 'minor'])
  assert.deepEqual(hs.map((h) => h.tier), ['AA', 'AA'])
  assert.equal(hs[0].archivo, 'app/globals.css')
  assert.equal(hs[0].linea, 1594)
  assert.equal(mapearImpeccable([{ antipattern: 'low-contrast', category: 'a11y', severity: 'warning' }])[0].tier, 'A')
})

test('recorrido del fixture: 3 pestanas = 3 vistas internas con captura doble', { timeout: 120000 }, async () => {
  const html = readFileSync(join(AQUI, 'fixture', 'index.html'))
  const srv = createServer((req, res) => {
    if (req.method !== 'GET') { res.writeHead(405).end(); return }
    if (req.url === '/') { res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }).end(html); return }
    res.writeHead(404).end()
  })
  await new Promise((r) => srv.listen(0, '127.0.0.1', r))
  const url = `http://127.0.0.1:${srv.address().port}`
  const dir = mkdtempSync(join(tmpdir(), 'taste-recorrido-'))
  try {
    const vistas = await recorrer({ url, rutas: [{ id: 'inicio', ruta: '/', nombre: 'Inicio', dinamica: false }], dirCorrida: dir })
    const internas = vistas.filter((v) => v.origen === 'recorrido')
    assert.equal(vistas[0].tipo, 'pagina')
    assert.equal(internas.length, 3, JSON.stringify(internas.map((v) => v.nombre)))
    assert.deepEqual(internas.map((v) => v.tipo), ['pestana', 'pestana', 'pestana'])
    assert.deepEqual(internas.map((v) => v.nombre).sort(), ['Dos', 'Tres', 'Uno'])
    for (const v of vistas) {
      assert.ok(existsSync(join(dir, v.capturas.escritorio)), v.id)
      assert.ok(existsSync(join(dir, v.capturas.movil)), v.id)
      assert.equal(v.pasos.length, v.origen === 'router' ? 0 : 1)
    }
    assert.ok(!internas.some((v) => /Guardar|Fuera/.test(v.nombre)))
  } finally { srv.close(); rmSync(dir, { recursive: true }) }
})
