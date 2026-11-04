import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { armarPaquetes, carpetasBiblioteca, reglasQueAplican, REGLA_MADRE } from '../src/criterio/paquete.mjs'
import { validar } from '../src/criterio/criterios.mjs'
import { htmlInforme, escribirInforme } from '../src/informe/informe.mjs'
import { esLecturaPermitida } from '../src/recorrido/navegar.mjs'

const tmp = () => mkdtempSync(join(tmpdir(), 'sightline-c4-'))
const linea = (o) => JSON.stringify(o) + '\n'

function bibliotecaFalsa() {
  const d = tmp()
  for (const m of ['externa', 'personal', 'shift']) mkdirSync(join(d, m), { recursive: true })
  writeFileSync(join(d, 'externa', 'componentes.jsonl'), linea({ id: 'ext-chat', patron: 'chat', mundo: 'externa', ruta: 'x' }))
  writeFileSync(join(d, 'externa', 'inspo.jsonl'), linea({ id: 'chat-linear', patron: 'chat', archivo: 'inspo/chat/a.png', mundo: 'externa', por_que: 'hilo limpio' }))
  writeFileSync(join(d, 'personal', 'componentes.jsonl'), linea({ id: 'per-chat', patron: 'chat', mundo: 'personal', ruta: 'p' }))
  writeFileSync(join(d, 'shift', 'componentes.jsonl'), linea({ id: 'shi-chat', patron: 'chat', mundo: 'shift', ruta: 's' }))
  return { externa: join(d, 'externa'), personal: join(d, 'personal'), shift: join(d, 'shift') }
}

const REGLAS = [
  { id: 'r-libre-limpieza', tier: 'AA', perfiles: ['libre'], modos: ['limpieza'], capa: 'copy', regla: 'quita', fuente: { archivo: 'f', linea: 1 } },
  { id: 'r-estricto', tier: 'A', perfiles: ['estricto'], modos: ['limpieza'], capa: 'copy', regla: 'x', fuente: { archivo: 'f', linea: 2 } },
  { id: 'r-solo-mejora', tier: 'A', perfiles: ['libre', 'estricto'], modos: ['mejora'], capa: 'copy', regla: 'x', fuente: { archivo: 'f', linea: 3 } },
  { id: 'r-aaa', tier: 'AAA', perfiles: ['libre'], modos: ['limpieza'], capa: 'copy', regla: 'x', fuente: { archivo: 'f', linea: 4 } },
]

function corridaFalsa(mundo, perfil = 'libre') {
  return { repo: 'X', ruta_repo: null, mundo, perfil, tier: 'AA', stack: { framework: 'html' },
    vistas: [{ id: 'inicio--chat', ruta: '/', nombre: 'Chat', tipo: 'hoja', padre: 'inicio', pasos: [], capturas: { escritorio: 'capturas/antes/a.png', movil: null }, error: null }],
    hallazgos: [{ id: 'h-0001', regla: 'sightline:voseo', severidad: 'warn', tier: 'AA', archivo: 'app/page.tsx', linea: 3, vista: 'inicio--chat', mensaje: 'voseo' }] }
}

test('reglas: filtra por perfil, modo y tier', () => {
  assert.deepEqual(reglasQueAplican(REGLAS, { perfil: 'libre', modo: 'limpieza', tier: 'AA' }).map((r) => r.id), ['r-libre-limpieza'])
  assert.deepEqual(reglasQueAplican(REGLAS, { perfil: 'estricto', modo: 'limpieza', tier: 'AA' }).map((r) => r.id), ['r-estricto'])
})

test('paquete: un repo shift nunca recibe componentes personales y al reves', () => {
  const bib = bibliotecaFalsa()
  assert.equal(carpetasBiblioteca('shift', bib).includes(bib.personal), false)
  for (const [mundo, propio, ajeno] of [['shift', 'shi-chat', 'per-chat'], ['personal', 'per-chat', 'shi-chat']]) {
    const d = tmp()
    const r = armarPaquetes(corridaFalsa(mundo), d, { modo: 'limpieza', reglas: REGLAS, biblioteca: bib })
    const md = readFileSync(join(d, r[0].archivo), 'utf8')
    assert.ok(md.includes(propio), `${mundo} incluye ${propio}`)
    assert.ok(md.includes('ext-chat'))
    assert.ok(!md.includes(ajeno), `${mundo} no incluye ${ajeno}`)
    assert.ok(md.includes('inspo:chat-linear'))
    assert.ok(md.includes(REGLA_MADRE))
    assert.ok(md.includes('h-0001 · app/page.tsx:3'))
    assert.ok(md.includes('r-libre-limpieza') && !md.includes('r-estricto') && !md.includes('r-aaa'))
    assert.equal(r[0].patrones[0], 'chat')
  }
})

const base = { id: 'c-0001', vista: 'inicio', hallazgos: ['h-0001'], regla: 'voseo-en-copy', criterio: 'Pasa a tuteo.', por_que: 'SOUL.md:12',
  ux: 'mejora: copy coherente', dx: 'igual: sin cambio de codigo', ax: 'igual: sin efecto', accion: 'cambiar', componente: null, archivos: ['app/page.tsx'], estado: 'aplicado', motivo_descarte: null }

test('criterios: si ux, dx o ax empeora se descarta solo', () => {
  const { criterios, errores } = validar([base, { ...base, id: 'c-0002', dx: 'empeora: duplica logica en dos sitios' }], { vistas: ['inicio'] })
  assert.deepEqual(errores, [])
  assert.equal(criterios[0].estado, 'aplicado')
  assert.equal(criterios[1].estado, 'descartado')
  assert.match(criterios[1].motivo_descarte, /dx empeora/)
})

test('criterios: limpieza no aplica nada que agregue; formato invalido se reporta', () => {
  const { criterios } = validar([{ ...base, accion: 'agregar' }], { modo: 'limpieza' })
  assert.equal(criterios[0].estado, 'propuesto')
  const { errores } = validar([{ id: 'x' }])
  assert.ok(errores.length > 5)
})

test('perfil: lecturas_permitidas deja pasar solo las POST declaradas del mismo origen', () => {
  const l = [{ metodo: 'POST', ruta: '^/api/agents/[^/]+/history$' }]
  assert.equal(esLecturaPermitida('GET', 'http://a/x', 'http://a', []), true)
  assert.equal(esLecturaPermitida('POST', 'http://a/api/agents/1/history', 'http://a', l), true)
  assert.equal(esLecturaPermitida('POST', 'http://a/api/agents/1/message', 'http://a', l), false)
  assert.equal(esLecturaPermitida('POST', 'http://b/api/agents/1/history', 'http://a', l), false)
  assert.equal(esLecturaPermitida('DELETE', 'http://a/api/agents/1/history', 'http://a', l), false)
})

test('informe: html con 2 vistas falsas, imagenes relativas y sin em-dash', () => {
  const d = tmp()
  mkdirSync(join(d, 'capturas', 'antes'), { recursive: true }); mkdirSync(join(d, 'capturas', 'despues'), { recursive: true })
  for (const s of ['antes', 'despues']) for (const v of ['a', 'b']) writeFileSync(join(d, 'capturas', s, `${v}-escritorio.png`), '')
  const vista = (id, s) => ({ id, ruta: '/' + id, tipo: 'pagina', capturas: { escritorio: `capturas/${s}/${id}-escritorio.png`, movil: null }, error: null })
  const antes = { repo: 'Falso', rama: 'main', sha: 'abc', tier: 'AA', vistas: [vista('a', 'antes'), vista('b', 'antes')], puntaje: { A: 50, AA: 40, AAA: 30, por_vista: { a: { A: 50, AA: 40, AAA: 30 }, b: { A: 60, AA: 60, AAA: 60 } } } }
  const despues = { ...antes, vistas: [vista('a', 'despues'), vista('b', 'despues')], puntaje: { A: 55, AA: 48, AAA: 30, por_vista: { a: { A: 60, AA: 52, AAA: 30 }, b: { A: 60, AA: 60, AAA: 60 } } } }
  const f = escribirInforme({ dir: d, antes, despues, criterios: [{ ...base, vista: 'a', criterio: 'Quita el eslogan \u2014 sobra.' }], guardas: { ok: true, motivos: ['guardas sin construir'], build: 'sin-build' }, propuesta: { modo: 'limpieza', tier: 'AA', rama: 'sightline/x' } })
  const html = readFileSync(f, 'utf8')
  assert.ok(existsSync(f))
  assert.equal((html.match(/<section /g) || []).length, 2)
  assert.ok(html.includes('src="capturas/antes/a-escritorio.png"') && html.includes('src="capturas/despues/b-escritorio.png"'))
  assert.ok(html.includes('href="#a"') && html.includes('+12'))
  assert.ok(!html.includes('\u2014'))
  assert.ok(!/monospace/.test(html))
  assert.ok(html.includes('voseo-en-copy') && html.includes('SOUL.md:12'))
  assert.equal(htmlInforme({ dir: d, antes, despues }).includes('Sin criterios.'), true)
})
