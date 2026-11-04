import { test } from 'node:test'
import assert from 'node:assert/strict'
import { revisarPuntaje } from '../src/guardas.mjs'

const h = (vista, n, fuente = 'impeccable') => Array.from({ length: n }, (_, i) => ({ id: `x${vista}${i}`, regla: `impeccable:r${i % 3}`, fuente, severidad: 'warn', tier: 'AA', vista }))
const vistas = [{ id: 'a', tipo: 'pagina' }, { id: 'b', tipo: 'pagina' }]

test('una pagina que antes no se escaneo no baja el puntaje', () => {
  const antes = { vistas, hallazgos: h('a', 2), cobertura: { impeccable_vivo: ['a'] } }
  const despues = { vistas, hallazgos: [...h('a', 2), ...h('b', 40)], cobertura: { impeccable_vivo: ['a', 'b'] } }
  const r = revisarPuntaje(antes, despues, 'AA')
  assert.equal(r.motivos.length, 0)
  assert.deepEqual(r.comparables, ['a'])
})

test('un empeoramiento real en una pagina escaneada en las dos si se rechaza', () => {
  const antes = { vistas, hallazgos: h('a', 1), cobertura: { impeccable_vivo: ['a', 'b'] } }
  const despues = { vistas, hallazgos: h('a', 9), cobertura: { impeccable_vivo: ['a', 'b'] } }
  assert.equal(revisarPuntaje(antes, despues, 'AA').motivos.length, 1)
})
