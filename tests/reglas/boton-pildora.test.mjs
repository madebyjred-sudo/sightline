import { test } from 'node:test';
import assert from 'node:assert/strict';
import check from '../../reglas/checks/boton-pildora.mjs';

const correr = (archivos) => check.run({ raiz: '/x', archivos });

test('boton-pildora: encuentra el caso mal', () => {
  const h = correr([{"ruta": "b.tsx", "contenido": "export const B = () => <Button className=\"rounded-full px-6\">Empezar</Button>;"}]);
  assert.ok(h.length > 0, 'debe encontrar al menos un hallazgo');
  for (const x of h) {
    assert.equal(x.regla, 'boton-pildora');
    assert.ok(x.archivo && x.linea >= 1 && x.mensaje && x.severidad && x.tier);
  }
});

test('boton-pildora: no marca el caso bien', () => {
  assert.deepEqual(correr([{"ruta": "b.tsx", "contenido": "export const B = () => (<><Button className=\"rounded-control\">Empezar</Button><Button size=\"icon\" className=\"rounded-full\"><X/></Button></>);"}]), []);
});
