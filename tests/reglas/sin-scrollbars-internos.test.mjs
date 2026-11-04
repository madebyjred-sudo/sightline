import { test } from 'node:test';
import assert from 'node:assert/strict';
import check from '../../reglas/checks/sin-scrollbars-internos.mjs';

const correr = (archivos) => check.run({ raiz: '/x', archivos });

test('sin-scrollbars-internos: encuentra el caso mal', () => {
  const h = correr([{"ruta": "s.tsx", "contenido": "export const S = () => <div className=\"flex overflow-x-auto gap-2\" />;"}]);
  assert.ok(h.length > 0, 'debe encontrar al menos un hallazgo');
  for (const x of h) {
    assert.equal(x.regla, 'sin-scrollbars-internos');
    assert.ok(x.archivo && x.linea >= 1 && x.mensaje && x.severidad && x.tier);
  }
});

test('sin-scrollbars-internos: no marca el caso bien', () => {
  assert.deepEqual(correr([{"ruta": "s.tsx", "contenido": "export const S = () => <div className=\"flex overflow-x-auto no-scrollbar gap-2\" />;"}]), []);
});
