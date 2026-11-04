import { test } from 'node:test';
import assert from 'node:assert/strict';
import check from '../../reglas/checks/segunda-barra-superior.mjs';

const correr = (archivos) => check.run({ raiz: '/x', archivos });

test('segunda-barra-superior: encuentra el caso mal', () => {
  const h = correr([{ ruta: 'app/layout.tsx', contenido: 'export default () => <header className="fixed top-0 inset-x-0">A</header>;' }, { ruta: 'app/pedidos/page.tsx', contenido: 'export default () => <nav className="sticky top-0">B</nav>;' }]);
  assert.ok(h.length > 0, 'debe encontrar al menos un hallazgo');
  for (const x of h) {
    assert.equal(x.regla, 'segunda-barra-superior');
    assert.ok(x.archivo && x.linea >= 1 && x.mensaje && x.severidad && x.tier);
  }
});

test('segunda-barra-superior: no marca el caso bien', () => {
  assert.deepEqual(correr([{ ruta: 'app/layout.tsx', contenido: 'export default () => <header className="fixed top-0 inset-x-0">A</header>;' }, { ruta: 'app/pedidos/page.tsx', contenido: 'export default () => <nav className="flex gap-2">B</nav>;' }]), []);
});
