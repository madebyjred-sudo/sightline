import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { fuerza, densidad, cine, rol, puntajeComponente, mapaVertical, hallazgosDeComposicion, componerVistas } from '../src/composicion/analizar.mjs'
import { tipoDeProducto, senales, armarCriterios, criteriosMd, decisiones } from '../src/fundar.mjs'

// Medidas tipo, como las devuelve medir.mjs.
const caja = (y, h, w = 550) => ({ x: 0, y, w, h })
const titular = { caja: caja(0, 420), chars: 40, controles: 1, escala: 3.6, peso: 700, contraste_mayor: 14, contraste_min: 14, texto_min: 16, tinta: 0.08, medios: 0, masa: 0, sangre: false, movimiento: 0 }
const escena = { caja: caja(0, 440), chars: 200, controles: 2, escala: 1.4, peso: 600, contraste_mayor: 12, contraste_min: 7, texto_min: 12, tinta: 0.1, medios: 0, masa: 0.9, sangre: false, movimiento: 0 }
const tabla = { caja: caja(0, 300), chars: 1400, controles: 30, escala: 1.1, peso: 600, contraste_mayor: 12, contraste_min: 6, texto_min: 13, tinta: 0.45, medios: 0, masa: 0, sangre: false, movimiento: 0 }
const tibio = { caja: caja(0, 260), chars: 300, controles: 2, escala: 1.5, peso: 500, contraste_mayor: 8, contraste_min: 6, texto_min: 14, tinta: 0.2, medios: 0.05, masa: 0.1, sangre: false, movimiento: 0 }

test('roles: un titular y una escena golpean, una tabla condensa, lo tibio queda sin decidir', () => {
  assert.equal(rol(fuerza(titular), densidad(titular)), 'golpe')
  assert.equal(rol(fuerza(escena), densidad(escena)), 'golpe')
  assert.equal(rol(fuerza(tabla), densidad(tabla)), 'condensado')
  assert.equal(rol(fuerza(tibio), densidad(tibio)), 'sin decidir')
  assert.ok(cine(escena) > cine(tabla))
})

test('puntaje por componente: mitad calidad, mitad composicion; el contraste bajo resta', () => {
  const bien = puntajeComponente(escena, 'golpe')
  const gris = puntajeComponente({ ...escena, contraste_min: 2.5 }, 'golpe')
  assert.equal(bien.puntaje, Math.round(0.5 * bien.calidad + 0.5 * bien.composicion))
  assert.ok(gris.puntaje < bien.puntaje)
  assert.equal(puntajeComponente(tibio, 'saturado').composicion, 35)
})

const vista = (secciones) => ({ id: 'v', tipo: 'pagina', mapa: null, medida: { base: 16, ancho: 1440, alto: 2000, secciones: secciones.map((s, i) => ({ id: `s${i + 1}`, etiqueta: `s${i + 1}`, componentes: [], ...s })) } })

test('mapa vertical: sin decidir con techo 60, golpes seguidos y apertura segun el producto', () => {
  const v = vista([{ ...tibio, caja: caja(0, 260) }, { ...titular, caja: caja(260, 420) }, { ...escena, caja: caja(680, 440) }, { ...tabla, caja: caja(1120, 300) }])
  const m = mapaVertical(v.medida)
  assert.deepEqual(m.secciones.map((s) => s.rol), ['sin decidir', 'golpe', 'golpe', 'condensado'])
  assert.ok(m.secciones[0].puntaje <= 60)
  const reglas = hallazgosDeComposicion(v, m, 'vitrina').map((h) => h.regla)
  assert.ok(reglas.includes('seccion-sin-decidir'))
  assert.ok(reglas.includes('golpes-seguidos'))
  assert.ok(reglas.includes('apertura-segun-el-producto'), 'la vitrina abre con lo tibio')
  assert.ok(!hallazgosDeComposicion(v, m, 'herramienta').some((h) => h.regla === 'apertura-segun-el-producto' && /vitrina/.test(h.mensaje)))
})

test('componerVistas: una vista interna igual a su padre no repite hallazgos', () => {
  const padre = vista([{ ...tibio, caja: caja(0, 260) }])
  const hija = { ...vista([{ ...tibio, caja: caja(0, 260) }]), id: 'v--ancla', tipo: 'estado', padre: 'v' }
  const hs = componerVistas([padre, hija], 'mixto')
  assert.equal(hija.mapa.igual_a, 'v')
  assert.equal(hs.filter((h) => h.vista === 'v--ancla').length, 0)
  assert.ok(hs.some((h) => h.vista === 'v' && h.regla === 'seccion-sin-decidir'))
  assert.equal(padre.medida, undefined, 'la medida cruda no queda en la corrida')
})

test('fundar: tipo de producto por señales del codigo y criterios por pieza', () => {
  const dir = mkdtempSync(join(tmpdir(), 'taste-fundar-'))
  try {
    mkdirSync(join(dir, 'app'))
    writeFileSync(join(dir, 'app', 'page.tsx'), '<Sidebar/><Table/><Table/><form><Input/><Input/></form> useSession()')
    const h = tipoDeProducto(senales(dir))
    assert.equal(h.tipo, 'herramienta')
    writeFileSync(join(dir, 'app', 'page.tsx'), '<section className="hero"><Image fill priority/></section> pricing testimonials landing')
    assert.equal(tipoDeProducto(senales(dir)).tipo, 'vitrina')
  } finally { rmSync(dir, { recursive: true }) }
  const c = armarCriterios({ repo: '/x', nombre: 'x', tipo: 'herramienta', razones: [], origen: 'prueba' })
  assert.equal(c.manda, 'hig')
  assert.equal(c.decisiones.find((d) => d.pieza === 'Navegación').capa, 'hig')
  assert.equal(decisiones('vitrina').find((d) => d.pieza === 'Navegación').capa, 'marca')
  assert.match(criteriosMd(c), /Qué capa decide cada pieza/)
})
