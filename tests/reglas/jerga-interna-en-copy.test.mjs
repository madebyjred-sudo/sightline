import { test } from 'node:test';
import assert from 'node:assert/strict';
import check from '../../reglas/checks/jerga-interna-en-copy.mjs';

const correr = (archivos) => check.run({ raiz: '/x', archivos });

test('jerga-interna-en-copy: encuentra el caso mal', () => {
  const h = correr([{"ruta": "j.tsx", "contenido": "export const J = () => <p>Métricas reales del tenant activo, directo de la API</p>;"}]);
  assert.ok(h.length > 0, 'debe encontrar al menos un hallazgo');
  for (const x of h) {
    assert.equal(x.regla, 'jerga-interna-en-copy');
    assert.ok(x.archivo && x.linea >= 1 && x.mensaje && x.severidad && x.tier);
  }
});

test('jerga-interna-en-copy: no marca el caso bien', () => {
  assert.deepEqual(correr([{"ruta": "j.tsx", "contenido": "export const J = () => <p>Cómo van tus ventas</p>;"}]), []);
});
