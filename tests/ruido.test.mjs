import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { PNG } from 'pngjs'
import { revisarVisual } from '../src/guardas.mjs'
import { puertoAbierto, abrirPrevio } from '../src/previo.mjs'

function png(ruta, distintos) {
  const p = new PNG({ width: 100, height: 100 })
  p.data.fill(255)
  for (let i = 0; i < distintos; i++) { p.data[i * 4] = 0; p.data[i * 4 + 1] = 0 }
  writeFileSync(ruta, PNG.sync.write(p))
}

test('el ruido base medido se suma al tope de las vistas no tocadas', () => {
  const d = mkdtempSync(join(tmpdir(), 'sightline-ruido-'))
  png(join(d, 'a.png'), 0); png(join(d, 'b.png'), 300) // 3 % distinto
  const vista = (ruido) => ({ vistas: [{ id: 'v', capturas: { escritorio: 'a.png' }, ruido }] })
  const despues = { vistas: [{ id: 'v', capturas: { escritorio: 'b.png' } }] }
  const sinRuido = revisarVisual(vista({}), despues, 'libre', { dirAntes: d, dirDespues: d })
  assert.equal(sinRuido.motivos.length, 1)
  const conRuido = revisarVisual(vista({ escritorio: 4 }), despues, 'libre', { dirAntes: d, dirDespues: d })
  assert.equal(conRuido.motivos.length, 0)
  const ruidoChico = revisarVisual(vista({ escritorio: 1 }), despues, 'libre', { dirAntes: d, dirDespues: d })
  assert.equal(ruidoChico.motivos.length, 1)
})

test('previo sin configurar no hace nada, y un puerto cerrado se detecta', async () => {
  const r = await abrirPrevio(null)
  assert.equal(r.nota, null)
  assert.equal(await puertoAbierto(1, 300), false)
})
