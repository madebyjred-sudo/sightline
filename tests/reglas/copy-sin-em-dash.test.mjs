import { test } from 'node:test';
import assert from 'node:assert/strict';
import check from '../../reglas/checks/copy-sin-em-dash.mjs';

const correr = (archivos) => check.run({ raiz: '/x', archivos });

test('copy-sin-em-dash: encuentra el caso mal', () => {
  const h = correr([{"ruta": "a.tsx", "contenido": "export const A = () => <p title=\"Uno — dos\">Ventas — 34 de 46</p>;"}]);
  assert.ok(h.length > 0, 'debe encontrar al menos un hallazgo');
  for (const x of h) {
    assert.equal(x.regla, 'copy-sin-em-dash');
    assert.ok(x.archivo && x.linea >= 1 && x.mensaje && x.severidad && x.tier);
  }
});

test('copy-sin-em-dash: no marca el caso bien', () => {
  assert.deepEqual(correr([{"ruta": "a.tsx", "contenido": "export const A = () => {\n  // comentario — con raya\n  const x = \"id—interno\";\n  return <p title=\"Uno · dos\">Ventas · 34 de 46</p>;\n};"}]), []);
});
