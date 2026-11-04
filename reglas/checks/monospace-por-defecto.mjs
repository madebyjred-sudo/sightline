import { esPrueba, esMarcado, esCss, esCodigo, ext, sinComentarios, textosVisibles, cadenasDeClases, etiquetas, hallazgo, hexAHsl, rgbAHsl, lineaDe } from '../lib/fuente.mjs';

// Monospace solo para codigo. SOUL.md: Frontend sin direccion de marca.
const ID = 'monospace-por-defecto';
const SEV = 'minor';
const TIER = 'AA';

const ETIQUETAS_CODIGO = /^(code|pre|kbd|samp|Kbd|Code|CodeBlock|KbdKey|Shortcut|CommandShortcut)$/;

export default {
  id: ID,
  run(ctx) {
    const out = [];
    for (const { ruta, contenido } of ctx.archivos) {
      if (esPrueba(ruta)) continue;
      if (esCss(ruta)) {
        const s = sinComentarios(contenido, ruta);
        for (const m of s.matchAll(/(^|[}\n])\s*([^{}@]*?)\{([^{}]*)\}/g)) {
          const sel = m[2].trim();
          const ff = m[3].match(/font-family\s*:\s*([^;]+)/);
          const varSans = m[3].match(/--font-(?:sans|body|ui|base)\s*:\s*([^;]+)/);
          const amplio = /(^|,)\s*(html|body|:root|\*|p|h[1-6]|button|label|input)\s*(,|$)/.test(sel);
          if (ff && amplio && /mono/i.test(ff[1]) && !/sans|serif/i.test(ff[1].split(',')[0]))
            out.push(hallazgo(ID, ruta, s, m.index, `${sel} { ${ff[0]} }`, 'Monospace como fuente del texto de interfaz', SEV, TIER));
          if (varSans && /mono/i.test(varSans[1].split(',')[0]))
            out.push(hallazgo(ID, ruta, s, m.index, varSans[0], 'La fuente base del tema es monospace', SEV, TIER));
        }
        continue;
      }
      if (!esMarcado(ruta)) continue;
      for (const e of etiquetas(contenido, ruta, '[A-Za-z][\\w.]*')) {
        if (!/(?:^|[\s"'`:])font-mono(?=[\s"'`]|$)/.test(e.texto)) continue;
        if (ETIQUETAS_CODIGO.test(e.nombre)) continue;
        if (/tabular-nums/.test(e.texto)) continue;
        out.push(hallazgo(ID, ruta, contenido, e.idx, e.texto, `font-mono en <${e.nombre}>: reservala para código`, SEV, TIER));
      }
    }
    return out;
  },
};
