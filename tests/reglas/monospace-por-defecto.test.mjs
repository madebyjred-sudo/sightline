import { test } from 'node:test';
import assert from 'node:assert/strict';
import check from '../../reglas/checks/monospace-por-defecto.mjs';

const correr = (archivos) => check.run({ raiz: '/x', archivos });

test('monospace-por-defecto: encuentra el caso mal', () => {
  const h = correr([{"ruta": "m.tsx", "contenido": "export const M = () => <p className=\"font-mono text-sm\">Bienvenido</p>;"}]);
  assert.ok(h.length > 0, 'debe encontrar al menos un hallazgo');
  for (const x of h) {
    assert.equal(x.regla, 'monospace-por-defecto');
    assert.ok(x.archivo && x.linea >= 1 && x.mensaje && x.severidad && x.tier);
  }
});

test('monospace-por-defecto: no marca el caso bien', () => {
  assert.deepEqual(correr([{"ruta": "m.tsx", "contenido": "export const M = () => <code className=\"font-mono\">npm i</code>;"}]), []);
});
