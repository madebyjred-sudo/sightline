import { esPrueba, esMarcado, esCss, esCodigo, ext, sinComentarios, textosVisibles, cadenasDeClases, etiquetas, hallazgo, hexAHsl, rgbAHsl, lineaDe } from '../lib/fuente.mjs';

// Paleta neutros + acento, sin azules. pila-de-estilo.md.
const ID = 'azules-en-la-paleta';
const SEV = 'minor';
const TIER = 'AAA';

const RX = /^(?:bg|text|border|ring|from|via|to|fill|stroke|outline|decoration|divide|shadow|accent|caret|ring-offset)-(blue|sky|indigo|cyan)-\d{2,3}(?:\/\d+)?$/;

export default {
  id: ID,
  run(ctx) {
    const out = [];
    for (const { ruta, contenido } of ctx.archivos) {
      if (esPrueba(ruta) || !esCodigo(ruta)) continue;
      for (const c of cadenasDeClases(contenido, ruta)) {
        for (const t of c.toks) {
          if (RX.test(t.replace(/^!?(?:[\w-]+:)+/, '')))
            out.push(hallazgo(ID, ruta, contenido, c.idx, t, `Azul de sistema (${t}); usa tinta subrayada o el acento de la marca`, SEV, TIER));
        }
      }
    }
    return out;
  },
};
