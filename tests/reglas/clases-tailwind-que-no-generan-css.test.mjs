import { test } from 'node:test';
import assert from 'node:assert/strict';
import check from '../../reglas/checks/clases-tailwind-que-no-generan-css.mjs';

const correr = (archivos) => check.run({ raiz: '/x', archivos });

test('clases-tailwind-que-no-generan-css: encuentra el caso mal', () => {
  const h = correr([{"ruta": "c.tsx", "contenido": "export const C = () => <div className=\"shadow-[0_4px_20px_rgba(35, 31, 31,0.04)]\" />;"}]);
  assert.ok(h.length > 0, 'debe encontrar al menos un hallazgo');
  for (const x of h) {
    assert.equal(x.regla, 'clases-tailwind-que-no-generan-css');
    assert.ok(x.archivo && x.linea >= 1 && x.mensaje && x.severidad && x.tier);
  }
});

test('clases-tailwind-que-no-generan-css: no marca el caso bien', () => {
  assert.deepEqual(correr([{"ruta": "c.tsx", "contenido": "export const C = () => <div className=\"shadow-[0_4px_20px_rgba(35,31,31,0.04)] bg-primary/70\" />;"}]), []);
});
