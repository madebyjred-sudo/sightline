import { test } from 'node:test';
import assert from 'node:assert/strict';
import check from '../../reglas/checks/hex-en-componentes.mjs';

const correr = (archivos) => check.run({ raiz: '/x', archivos });

test('hex-en-componentes: encuentra el caso mal', () => {
  const h = correr([{"ruta": "x.tsx", "contenido": "export const X = () => <div className=\"bg-[#1534dc]\" style={{ color: \"#0e1745\" }} />;"}]);
  assert.ok(h.length > 0, 'debe encontrar al menos un hallazgo');
  for (const x of h) {
    assert.equal(x.regla, 'hex-en-componentes');
    assert.ok(x.archivo && x.linea >= 1 && x.mensaje && x.severidad && x.tier);
  }
});

test('hex-en-componentes: no marca el caso bien', () => {
  assert.deepEqual(correr([{"ruta": "x.tsx", "contenido": "export const X = () => <a href=\"#add\" className=\"bg-primary text-foreground\" />;"}]), []);
});
