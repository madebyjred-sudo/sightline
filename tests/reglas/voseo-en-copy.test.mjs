import { test } from 'node:test';
import assert from 'node:assert/strict';
import check from '../../reglas/checks/voseo-en-copy.mjs';

const correr = (archivos) => check.run({ raiz: '/x', archivos });

test('voseo-en-copy: encuentra el caso mal', () => {
  const h = correr([{"ruta": "v.tsx", "contenido": "export const V = () => <Button>Entrá a tu panel</Button>;"}]);
  assert.ok(h.length > 0, 'debe encontrar al menos un hallazgo');
  for (const x of h) {
    assert.equal(x.regla, 'voseo-en-copy');
    assert.ok(x.archivo && x.linea >= 1 && x.mensaje && x.severidad && x.tier);
  }
});

test('voseo-en-copy: no marca el caso bien', () => {
  assert.deepEqual(correr([{"ruta": "v.tsx", "contenido": "export const V = () => <Button>Entra a tu panel</Button>;"}]), []);
});
