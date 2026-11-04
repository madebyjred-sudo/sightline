import { esPrueba, esMarcado, esCss, esCodigo, ext, sinComentarios, textosVisibles, cadenasDeClases, etiquetas, hallazgo, hexAHsl, rgbAHsl, lineaDe } from '../lib/fuente.mjs';

// Sin scrollbars internas visibles. correcciones-visuales-del-dueno.md.
const ID = 'sin-scrollbars-internos';
const SEV = 'minor';
const TIER = 'AA';

export default {
  id: ID,
  run(ctx) {
    const out = [];
    for (const { ruta, contenido } of ctx.archivos) {
      if (esPrueba(ruta) || !esMarcado(ruta)) continue;
      if (/(^|\/)ui\//.test(ruta)) continue; // librería ajena: se corrige en el uso
      for (const c of cadenasDeClases(contenido, ruta)) {
        const tk = c.toks.map((t) => t.replace(/^(?:[\w-]+:)+/, ''));
        if (!tk.some((t) => /^overflow-x-(?:auto|scroll)$/.test(t))) continue;
        if (tk.some((t) => /^(?:select-all|whitespace-pre(?:-wrap)?|font-mono)$|font-mono/.test(t))) continue; // bloque de código: el scroll es la lectura
        if (tk.some((t) => /no-scrollbar|scrollbar-none|scrollbar-hide|scrollbar-width:none|scrollbar-thin/.test(t))) continue;
        out.push(hallazgo(ID, ruta, contenido, c.idx, c.valor, 'Franja con overflow-x-auto sin no-scrollbar', SEV, TIER));
      }
    }
    return out;
  },
};
