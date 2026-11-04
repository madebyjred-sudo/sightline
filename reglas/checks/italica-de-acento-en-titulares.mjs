import { esPrueba, esMarcado, esCss, esCodigo, ext, sinComentarios, textosVisibles, cadenasDeClases, etiquetas, hallazgo, hexAHsl, rgbAHsl, lineaDe } from '../lib/fuente.mjs';

// Sin italicas de acento en titulares. SOUL.md: Frontend sin direccion de marca.
const ID = 'italica-de-acento-en-titulares';
const SEV = 'warn';
const TIER = 'AA';

export default {
  id: ID,
  run(ctx) {
    const out = [];
    for (const { ruta, contenido } of ctx.archivos) {
      if (esPrueba(ruta) || !esMarcado(ruta)) continue;
      const s = sinComentarios(contenido, ruta);
      for (const m of s.matchAll(/<(h[1-6])\b[^>]*>([\s\S]{0,800}?)<\/\1>/g)) {
        const cuerpo = m[0];
        const it = cuerpo.match(/<(em|i)[\s>]|\bitalic\b/);
        if (it) out.push(hallazgo(ID, ruta, s, m.index + it.index, cuerpo, 'Itálica de acento dentro de un titular; quítala si la marca no la pide', SEV, TIER));
      }
      // titular grande en itálica fuera de h1-h6 (display serif en itálica)
      for (const c of cadenasDeClases(contenido, ruta)) {
        const tk = new Set(c.toks.map((t) => t.replace(/^(?:[\w-]+:)+/, '')));
        if (tk.has('italic') && [...tk].some((t) => /^text-(?:4xl|5xl|6xl|7xl|8xl|9xl)$/.test(t)))
          out.push(hallazgo(ID, ruta, contenido, c.idx, c.valor, 'Titular de display en itálica; quítala si la marca no la pide', SEV, TIER));
      }
    }
    return out;
  },
};
