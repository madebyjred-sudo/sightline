import { test } from 'node:test';
import assert from 'node:assert/strict';
import check from '../../reglas/checks/zona-tactil-menor-a-44.mjs';

const correr = (archivos) => check.run({ raiz: '/x', archivos });

test('zona-tactil-menor-a-44: encuentra el caso mal', () => {
  const h = correr([{"ruta": "z.tsx", "contenido": "export const Z = () => <button className=\"h-7 w-7\" aria-label=\"Cerrar\"><X/></button>;"}]);
  assert.ok(h.length > 0, 'debe encontrar al menos un hallazgo');
  for (const x of h) {
    assert.equal(x.regla, 'zona-tactil-menor-a-44');
    assert.ok(x.archivo && x.linea >= 1 && x.mensaje && x.severidad && x.tier);
  }
});

test('zona-tactil-menor-a-44: no marca el caso bien', () => {
  assert.deepEqual(correr([{"ruta": "z.tsx", "contenido": "export const Z = () => (<><button className=\"h-11 px-4\">Guardar</button><button className=\"h-7 w-7 hit-44\" aria-label=\"Cerrar\"><X/></button></>);"}]), []);
});
