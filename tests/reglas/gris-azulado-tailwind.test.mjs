import { test } from 'node:test';
import assert from 'node:assert/strict';
import check from '../../reglas/checks/gris-azulado-tailwind.mjs';

const correr = (archivos) => check.run({ raiz: '/x', archivos });

test('gris-azulado-tailwind: encuentra el caso mal', () => {
  const h = correr([{"ruta": "gr.tsx", "contenido": "export const G = () => <div className=\"bg-slate-900 text-zinc-100\" />;"}]);
  assert.ok(h.length > 0, 'debe encontrar al menos un hallazgo');
  for (const x of h) {
    assert.equal(x.regla, 'gris-azulado-tailwind');
    assert.ok(x.archivo && x.linea >= 1 && x.mensaje && x.severidad && x.tier);
  }
});

test('gris-azulado-tailwind: no marca el caso bien', () => {
  assert.deepEqual(correr([{"ruta": "gr.tsx", "contenido": "export const G = () => <div className=\"bg-neutral-900 text-neutral-100\" />;"}]), []);
});
