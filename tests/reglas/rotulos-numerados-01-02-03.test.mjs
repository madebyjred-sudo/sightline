import { test } from 'node:test';
import assert from 'node:assert/strict';
import check from '../../reglas/checks/rotulos-numerados-01-02-03.mjs';

const correr = (archivos) => check.run({ raiz: '/x', archivos });

test('rotulos-numerados-01-02-03: encuentra el caso mal', () => {
  const h = correr([{"ruta": "r.tsx", "contenido": "export const R = () => (<section><span className=\"text-xs\">01</span><h2>Cómo funciona</h2></section>);"}]);
  assert.ok(h.length > 0, 'debe encontrar al menos un hallazgo');
  for (const x of h) {
    assert.equal(x.regla, 'rotulos-numerados-01-02-03');
    assert.ok(x.archivo && x.linea >= 1 && x.mensaje && x.severidad && x.tier);
  }
});

test('rotulos-numerados-01-02-03: no marca el caso bien', () => {
  assert.deepEqual(correr([{"ruta": "r.tsx", "contenido": "export const R = () => (<section><h2>Cómo funciona</h2><p>01/02/2026</p></section>);"}]), []);
});
