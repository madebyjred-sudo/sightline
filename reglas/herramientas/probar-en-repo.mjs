// Corre todos los checks en memoria sobre un repo (solo lectura) y escribe un resumen JSON.
// Uso: node reglas/herramientas/probar-en-repo.mjs RAIZ SALIDA.json dir1 dir2 ...
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const [raiz, salida, ...dirs] = process.argv.slice(2);
const EXT = /\.(tsx|jsx|ts|js|css|scss|html|vue|svelte)$/;
const archivos = [];
const recorrer = (d) => {
  for (const n of readdirSync(d)) {
    if (n === 'node_modules' || n.startsWith('.') || n === 'dist' || n === 'build') continue;
    const p = join(d, n);
    const st = statSync(p);
    if (st.isDirectory()) recorrer(p);
    else if (EXT.test(n) && st.size < 400000) archivos.push({ ruta: relative(raiz, p), contenido: readFileSync(p, 'utf8') });
  }
};
for (const d of dirs) recorrer(join(raiz, d));
// archivos de config de raiz que algunos checks leen
for (const n of readdirSync(raiz)) if (/^tailwind\.config\./.test(n)) archivos.push({ ruta: n, contenido: readFileSync(join(raiz, n), 'utf8') });

const dirChecks = new URL('../checks/', import.meta.url);
const res = {};
for (const f of readdirSync(dirChecks).filter((x) => x.endsWith('.mjs')).sort()) {
  const { default: c } = await import(new URL(f, dirChecks));
  const t = Date.now();
  const h = c.run({ raiz, archivos });
  res[c.id] = { n: h.length, ms: Date.now() - t, muestra: h };
}
writeFileSync(salida, JSON.stringify({ archivos: archivos.length, res }, null, 1));
for (const [id, r] of Object.entries(res)) console.log(String(r.n).padStart(5), id, `${r.ms}ms`);
console.log('archivos', archivos.length);
