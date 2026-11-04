import { test } from 'node:test';
import assert from 'node:assert/strict';
import check from '../../reglas/checks/clases-tailwind-que-no-generan-css.mjs';

test('clases-tailwind: /NN sobre token con alfa propio', () => {
  const h = check.run({ raiz: '/x', archivos: [
    { ruta: 'tokens.css', contenido: '@theme { --color-outline-variant: rgba(255, 255, 255, 0.08); }' },
    { ruta: 'a.tsx', contenido: 'export const A = () => <div className="border border-outline-variant/60" />;' },
  ] });
  assert.equal(h.length, 1);
});

test('clases-tailwind: /NN sobre var hex mapeada plana en v3', () => {
  const h = check.run({ raiz: '/x', archivos: [
    { ruta: 'g.css', contenido: ':root { --brand: #ff0066; }' },
    { ruta: 'tailwind.config.js', contenido: "module.exports = { theme: { colors: { brand: 'var(--brand)' } } }" },
    { ruta: 'a.tsx', contenido: 'export const A = () => <div className="bg-brand/70" />;' },
  ] });
  assert.equal(h.length, 1);
});
