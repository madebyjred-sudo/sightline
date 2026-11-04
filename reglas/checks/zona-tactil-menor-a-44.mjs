import { esPrueba, esMarcado, esCss, esCodigo, ext, sinComentarios, textosVisibles, cadenasDeClases, etiquetas, hallazgo, hexAHsl, rgbAHsl, lineaDe } from '../lib/fuente.mjs';

// Zona tactil de 44 pt. pila-de-estilo.md.
const ID = 'zona-tactil-menor-a-44';
const SEV = 'minor';
const TIER = 'AA';

// Tailwind: h-11 = 44px. Con pseudo-elemento de 44 (hit-44, before:/after: con tamaño) el control cumple.
const tam = (t) => {
  let m = t.match(/^(?:h|size|min-h)-(\d+(?:\.5)?)$/); if (m) return +m[1] * 4;
  m = t.match(/^(?:h|size|min-h)-\[(\d+(?:\.\d+)?)px\]$/); if (m) return +m[1];
  m = t.match(/^(?:h|size|min-h)-\[(\d+(?:\.\d+)?)rem\]$/); if (m) return +m[1] * 16;
  return null;
};

export default {
  id: ID,
  run(ctx) {
    const out = [];
    for (const { ruta, contenido } of ctx.archivos) {
      if (esPrueba(ruta) || !esMarcado(ruta)) continue;
      for (const e of etiquetas(contenido, ruta, 'button|Button|IconButton')) {
        if (/hit-44|(?:before|after):(?:\S*)(?:inset|-inset|h-11|size-11|min-h-11|w-11)|pointer-coarse:|\[@media\(pointer:coarse\)\]/.test(e.texto)) continue;
        const toks = e.texto.split(/[\s"'`{}()]+/);
        // solo clases sin prefijo de breakpoint: lo que ve el teléfono
        const alturas = toks.map(tam).filter((x) => x !== null);
        const minH = toks.some((t) => /^min-h-(?:11|12|14|16|\[4[4-9]px\])$/.test(t));
        if (!alturas.length || minH) continue;
        const h = Math.max(...alturas);
        if (h < 44) out.push(hallazgo(ID, ruta, contenido, e.idx, e.texto, `Control de ${h}px de alto: la zona táctil debe ser 44pt (pseudo-elemento si se ve más chico)`, SEV, TIER));
      }
    }
    return out;
  },
};
