import { esPrueba, esMarcado, esCss, esCodigo, ext, sinComentarios, textosVisibles, cadenasDeClases, etiquetas, hallazgo, hexAHsl, rgbAHsl, lineaDe } from '../lib/fuente.mjs';

// Inputs de 16 px en movil. pila-de-estilo.md: tabla de choques shadcn a iOS.
const ID = 'input-menor-a-16px';
const SEV = 'warn';
const TIER = 'AA';

export default {
  id: ID,
  run(ctx) {
    const out = [];
    for (const { ruta, contenido } of ctx.archivos) {
      if (esPrueba(ruta)) continue;
      if (esCss(ruta)) {
        const s = sinComentarios(contenido, ruta);
        for (const m of s.matchAll(/([^{}]*\b(?:input|textarea|select)\b[^{}]*)\{([^{}]*)\}/g)) {
          const fs = m[2].match(/font-size\s*:\s*([\d.]+)(px|rem)/);
          if (!fs) continue;
          const px = fs[2] === 'rem' ? +fs[1] * 16 : +fs[1];
          if (px < 16 && !/@media[^{]*min-width/.test(s.slice(Math.max(0, m.index - 200), m.index)))
            out.push(hallazgo(ID, ruta, s, m.index, m[0], `Campo de ${px}px: iOS hace zoom; usa 16px en móvil`, SEV, TIER));
        }
        continue;
      }
      if (!esMarcado(ruta)) continue;
      for (const e of etiquetas(contenido, ruta, 'input|Input|textarea|Textarea|select|SelectTrigger|CommandInput')) {
        if (/type=["'](checkbox|radio|range|hidden|file|color|submit|button)["']/.test(e.texto)) continue;
        const toks = e.texto.split(/[\s"'`{}()]+/);
        const base = toks.filter((t) => /^text-(?:xs|sm|base|lg|xl|\d?xl|\[\d+(?:\.\d+)?px\])$/.test(t));
        const chico = base.find((t) => /^text-(?:xs|sm)$/.test(t) || (/^text-\[(\d+(?:\.\d+)?)px\]$/.test(t) && +t.match(/\d+(?:\.\d+)?/)[0] < 16));
        const grande = base.some((t) => /^text-(?:base|lg|xl|\dxl)$/.test(t) || (/^text-\[(\d+)/.test(t) && +t.match(/\d+/)[0] >= 16));
        if (chico && !grande)
          out.push(hallazgo(ID, ruta, contenido, e.idx, e.texto, `<${e.nombre}> con ${chico} en móvil: iOS hace zoom; usa text-base md:${chico}`, SEV, TIER));
      }
    }
    return out;
  },
};
