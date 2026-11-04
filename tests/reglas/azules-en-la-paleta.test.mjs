import { test } from 'node:test';
import assert from 'node:assert/strict';
import check from '../../reglas/checks/azules-en-la-paleta.mjs';

const correr = (archivos) => check.run({ raiz: '/x', archivos });

test('azules-en-la-paleta: encuentra el caso mal', () => {
  const h = correr([{"ruta": "az.tsx", "contenido": "export const A = () => <a className=\"text-blue-600 underline\">Ver</a>;"}]);
  assert.ok(h.length > 0, 'debe encontrar al menos un hallazgo');
  for (const x of h) {
    assert.equal(x.regla, 'azules-en-la-paleta');
    assert.ok(x.archivo && x.linea >= 1 && x.mensaje && x.severidad && x.tier);
  }
});

test('azules-en-la-paleta: no marca el caso bien', () => {
  assert.deepEqual(correr([{"ruta": "az.tsx", "contenido": "export const A = () => <a className=\"text-foreground underline\">Ver</a>;"}]), []);
});
