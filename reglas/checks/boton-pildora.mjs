import { esPrueba, esMarcado, esCss, esCodigo, ext, sinComentarios, textosVisibles, cadenasDeClases, etiquetas, hallazgo, hexAHsl, rgbAHsl, lineaDe } from '../lib/fuente.mjs';

// Sin botones pildora si la marca no los pide. SOUL.md: Frontend sin direccion de marca.
const ID = 'boton-pildora';
const SEV = 'minor';
const TIER = 'AA';

const CIRCULAR = /\bsize=["']icon|(?:^|[\s"'`])(?:size-\d|aspect-square|rounded-full\s+p-\d)|\bh-(\d+(?:\.5)?)\b[^"'`]*\bw-\1\b|\bw-(\d+(?:\.5)?)\b[^"'`]*\bh-\2\b/;

export default {
  id: ID,
  run(ctx) {
    const out = [];
    for (const { ruta, contenido } of ctx.archivos) {
      if (esPrueba(ruta) || !esMarcado(ruta)) continue;
      for (const e of etiquetas(contenido, ruta, 'Button|button')) {
        if (!/(?:^|[\s"'`])rounded-full(?=[\s"'`]|$)/.test(e.texto)) continue;
        if (CIRCULAR.test(e.texto)) continue;
        out.push(hallazgo(ID, ruta, contenido, e.idx, e.texto, 'Botón píldora (rounded-full); confirmar que la marca lo pide', SEV, TIER));
      }
      // variante base del botón de la casa (cva) en píldora
      if (/(^|\/)button\.(t|j)sx$/.test(ruta)) {
        const s = sinComentarios(contenido, ruta);
        const m = s.match(/cva\(\s*(["'`])([^"'`]*\brounded-full\b[^"'`]*)\1/);
        if (m) out.push(hallazgo(ID, ruta, s, m.index, m[2], 'El botón base del sistema es píldora; confirmar que la marca lo pide', SEV, TIER));
      }
    }
    return out;
  },
};
