import { test } from 'node:test';
import assert from 'node:assert/strict';
import check from '../../reglas/checks/animaciones-sin-css.mjs';

const correr = (archivos) => check.run({ raiz: '/x', archivos });

test('animaciones-sin-css: encuentra el caso mal', () => {
  const h = correr([{ ruta: 'a.tsx', contenido: 'export const A = () => <div className="animate-in fade-in slide-in-from-top-2" />;' }, { ruta: 'globals.css', contenido: '@import "tailwindcss";' }]);
  assert.ok(h.length > 0, 'debe encontrar al menos un hallazgo');
  for (const x of h) {
    assert.equal(x.regla, 'animaciones-sin-css');
    assert.ok(x.archivo && x.linea >= 1 && x.mensaje && x.severidad && x.tier);
  }
});

test('animaciones-sin-css: no marca el caso bien', () => {
  assert.deepEqual(correr([{ ruta: 'a.tsx', contenido: 'export const A = () => <div className="animate-in fade-in" />;' }, { ruta: 'globals.css', contenido: '@import "tailwindcss";\n@import "tw-animate-css";' }]), []);
});
