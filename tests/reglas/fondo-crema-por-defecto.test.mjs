import { test } from 'node:test';
import assert from 'node:assert/strict';
import check from '../../reglas/checks/fondo-crema-por-defecto.mjs';

const correr = (archivos) => check.run({ raiz: '/x', archivos });

test('fondo-crema-por-defecto: encuentra el caso mal', () => {
  const h = correr([{"ruta": "g.css", "contenido": ":root { --background: #faf5ec; }\nbody { background: #fdf6e3; }"}]);
  assert.ok(h.length > 0, 'debe encontrar al menos un hallazgo');
  for (const x of h) {
    assert.equal(x.regla, 'fondo-crema-por-defecto');
    assert.ok(x.archivo && x.linea >= 1 && x.mensaje && x.severidad && x.tier);
  }
});

test('fondo-crema-por-defecto: no marca el caso bien', () => {
  assert.deepEqual(correr([{"ruta": "g.css", "contenido": ":root { --background: #ffffff; }\nbody { background-color: #0a0a0a; }"}]), []);
});
