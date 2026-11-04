import { test } from 'node:test';
import assert from 'node:assert/strict';
import check from '../../reglas/checks/italica-de-acento-en-titulares.mjs';

const correr = (archivos) => check.run({ raiz: '/x', archivos });

test('italica-de-acento-en-titulares: encuentra el caso mal', () => {
  const h = correr([{"ruta": "h.tsx", "contenido": "export const H = () => <h1 className=\"text-5xl\">Tus <em>pedidos</em></h1>;"}]);
  assert.ok(h.length > 0, 'debe encontrar al menos un hallazgo');
  for (const x of h) {
    assert.equal(x.regla, 'italica-de-acento-en-titulares');
    assert.ok(x.archivo && x.linea >= 1 && x.mensaje && x.severidad && x.tier);
  }
});

test('italica-de-acento-en-titulares: no marca el caso bien', () => {
  assert.deepEqual(correr([{"ruta": "h.tsx", "contenido": "export const H = () => <h1 className=\"text-5xl\">Tus pedidos</h1>;"}]), []);
});
