import { test } from 'node:test';
import assert from 'node:assert/strict';
import check from '../../reglas/checks/pop-ups-modales.mjs';

const correr = (archivos) => check.run({ raiz: '/x', archivos });

test('pop-ups-modales: encuentra el caso mal', () => {
  const h = correr([{"ruta": "p.tsx", "contenido": "export function P(){ const borrar = () => { if (window.confirm(\"¿Seguro?\")) go(); };\n return <Dialog open><DialogContent/></Dialog>; }"}]);
  assert.ok(h.length > 0, 'debe encontrar al menos un hallazgo');
  for (const x of h) {
    assert.equal(x.regla, 'pop-ups-modales');
    assert.ok(x.archivo && x.linea >= 1 && x.mensaje && x.severidad && x.tier);
  }
});

test('pop-ups-modales: no marca el caso bien', () => {
  assert.deepEqual(correr([{"ruta": "p.tsx", "contenido": "export function P(){ return <CommandDialog open><Sheet><SheetContent/></Sheet></CommandDialog>; }"}]), []);
});
