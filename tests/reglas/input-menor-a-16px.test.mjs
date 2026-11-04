import { test } from 'node:test';
import assert from 'node:assert/strict';
import check from '../../reglas/checks/input-menor-a-16px.mjs';

const correr = (archivos) => check.run({ raiz: '/x', archivos });

test('input-menor-a-16px: encuentra el caso mal', () => {
  const h = correr([{"ruta": "i.tsx", "contenido": "export const I = () => <Input className=\"h-9 text-sm\" />;"}]);
  assert.ok(h.length > 0, 'debe encontrar al menos un hallazgo');
  for (const x of h) {
    assert.equal(x.regla, 'input-menor-a-16px');
    assert.ok(x.archivo && x.linea >= 1 && x.mensaje && x.severidad && x.tier);
  }
});

test('input-menor-a-16px: no marca el caso bien', () => {
  assert.deepEqual(correr([{"ruta": "i.tsx", "contenido": "export const I = () => (<><Input className=\"text-base md:text-sm\" /><input type=\"checkbox\" className=\"text-xs\" /></>);"}]), []);
});
