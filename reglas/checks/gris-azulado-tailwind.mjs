import { esPrueba, esMarcado, esCss, esCodigo, ext, sinComentarios, textosVisibles, cadenasDeClases, etiquetas, hallazgo, hexAHsl, rgbAHsl, lineaDe } from '../lib/fuente.mjs';

// gray/slate/zinc tiran a azul: neutral-*. pila-de-estilo.md.
const ID = 'gris-azulado-tailwind';
const SEV = 'minor';
const TIER = 'AAA';

const RX = /^(?:bg|text|border|ring|from|via|to|fill|stroke|outline|decoration|divide|placeholder|ring-offset)-(gray|slate|zinc)-\d{2,3}(?:\/\d+)?$/;

export default {
  id: ID,
  run(ctx) {
    const out = [];
    for (const { ruta, contenido } of ctx.archivos) {
      if (esPrueba(ruta) || !esCodigo(ruta)) continue;
      for (const c of cadenasDeClases(contenido, ruta)) {
        for (const t of c.toks) {
          if (RX.test(t.replace(/^!?(?:[\w-]+:)+/, '')))
            out.push(hallazgo(ID, ruta, contenido, c.idx, t, `${t} tira a azul en Tailwind v4; usa neutral-*`, SEV, TIER));
        }
      }
    }
    return out;
  },
};
