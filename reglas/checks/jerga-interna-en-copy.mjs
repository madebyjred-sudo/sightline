import { esPrueba, esServidor, esMarcado, esCss, esCodigo, ext, sinComentarios, textosVisibles, cadenasDeClases, etiquetas, hallazgo, hexAHsl, rgbAHsl, lineaDe } from '../lib/fuente.mjs';

// Cero jerga interna en pantalla. copy-sin-jerga-en-el-panel.md.
const ID = 'jerga-interna-en-copy';
const SEV = 'minor';
const TIER = 'AA';

const JERGA = /(?<!\p{L})(tenants?|payloads?|templates?|endpoints?|tiers?)(?!\p{L})|(?<![\p{L}/.])(API|CRM|GMV)(?![\p{L}/.])/iu;

export default {
  id: ID,
  run(ctx) {
    const out = [];
    for (const { ruta, contenido } of ctx.archivos) {
      if (esServidor(ruta) || esPrueba(ruta) || !esCodigo(ruta)) continue;
      for (const t of textosVisibles(contenido, ruta)) {
        if (/[{}<>=]|^\s*[\w.-]+\s*$/.test(t.texto) && !/\s/.test(t.texto.trim())) continue; // identificadores sueltos
        const m = t.texto.match(JERGA);
        if (!m) continue;
        const pal = m[1] || m[2];
        if (m[2] && m[2] !== m[2].toUpperCase()) continue; // API/CRM solo en mayúsculas
        out.push(hallazgo(ID, ruta, contenido, t.idx, t.texto, `Jerga interna «${pal}» en copy visible`, SEV, TIER));
      }
    }
    return out;
  },
};
