import { test } from 'node:test';
import assert from 'node:assert/strict';
import check from '../../reglas/checks/texto-de-ayuda-y-eslogan.mjs';

const correr = (archivos) => check.run({ raiz: '/x', archivos });

test('texto-de-ayuda-y-eslogan: encuentra el caso mal', () => {
  const h = correr([{"ruta": "t.tsx", "contenido": "export const T = () => (<div><h1>Pedidos</h1><p className=\"text-muted-foreground\">Aquí puedes ver y gestionar todos tus pedidos de forma sencilla</p></div>);"}]);
  assert.ok(h.length > 0, 'debe encontrar al menos un hallazgo');
  for (const x of h) {
    assert.equal(x.regla, 'texto-de-ayuda-y-eslogan');
    assert.ok(x.archivo && x.linea >= 1 && x.mensaje && x.severidad && x.tier);
  }
});

test('texto-de-ayuda-y-eslogan: no marca el caso bien', () => {
  assert.deepEqual(correr([{"ruta": "t.tsx", "contenido": "export const T = () => (<div><h1>Pedidos</h1><p className=\"text-muted-foreground\">12 pendientes</p></div>);"}]), []);
});
