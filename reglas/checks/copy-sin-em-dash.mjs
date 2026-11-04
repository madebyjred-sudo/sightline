import { esPrueba, esServidor, esMarcado, esCss, esCodigo, ext, sinComentarios, textosVisibles, cadenasDeClases, etiquetas, hallazgo, hexAHsl, rgbAHsl, lineaDe } from '../lib/fuente.mjs';

// Cero em-dash en copy visible. SOUL.md: Reglas de producto.
const ID = 'copy-sin-em-dash';
const SEV = 'warn';
const TIER = 'A';

export default {
  id: ID,
  run(ctx) {
    const out = [];
    for (const { ruta, contenido } of ctx.archivos) {
      if (esServidor(ruta) || esPrueba(ruta)) continue;
      if (esCss(ruta)) {
        const s = sinComentarios(contenido, ruta);
        for (const m of s.matchAll(/content\s*:\s*(["'])([^"'\n]*(?:\u2014|\\2014)[^"'\n]*)\1/g))
          out.push(hallazgo(ID, ruta, s, m.index, m[0], 'Em-dash en content de CSS; usa «·», coma o dos puntos', SEV, TIER));
        continue;
      }
      if (!esCodigo(ruta)) continue;
      for (const t of textosVisibles(contenido, ruta)) {
        if (/\u2014|&mdash;|&#8212;/.test(t.texto))
          out.push(hallazgo(ID, ruta, contenido, t.idx, t.texto, 'Em-dash en copy visible; usa «·», coma, punto o dos puntos (salvo cita textual)', SEV, TIER));
      }
    }
    return out;
  },
};
