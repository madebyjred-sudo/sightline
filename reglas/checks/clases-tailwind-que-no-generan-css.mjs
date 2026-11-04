import { esPrueba, esMarcado, esCss, esCodigo, ext, sinComentarios, textosVisibles, cadenasDeClases, etiquetas, hallazgo, hexAHsl, rgbAHsl, lineaDe } from '../lib/fuente.mjs';

// Clases de Tailwind que no generan CSS. tailwind-clases-que-no-generan-css.md.
const ID = 'clases-tailwind-que-no-generan-css';
const SEV = 'warn';
const TIER = 'A';

const CONTEXTO_CLASE = /className|class=|\bcn\(|clsx\(|cva\(|twMerge\(|tw`|classList/;
const PREFIJOS = 'bg|text|border|ring|outline|fill|stroke|from|via|to|divide|decoration|placeholder|caret|accent|shadow|ring-offset';

export default {
  id: ID,
  run(ctx) {
    const out = [];
    // variables con alfa propio (rgba/hsla/#rrggbbaa/"/ a") y variables hex simples
    const conAlfa = new Set();
    const hexSimple = new Set();
    const mapeoVarPlano = new Map(); // nombre de color tailwind (v3) -> var
    for (const { ruta, contenido } of ctx.archivos) {
      if (esCss(ruta)) {
        for (const m of sinComentarios(contenido, ruta).matchAll(/--(?:color-)?([\w-]+)\s*:\s*([^;]+);/g)) {
          const v = m[2].trim();
          // caso documentado: rgba()/hsla() con alfa literal (oklch con / alfa funciona en v4 con color-mix)
          if (/^(?:rgba|hsla)\([^)]*,\s*0?\.\d+\s*\)$/.test(v)) conAlfa.add(m[1]);
          if (/^#[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/.test(v)) hexSimple.add(m[1]);
        }
      }
      if (/tailwind\.config\.(c|m)?(j|t)s$/.test(ruta)) {
        for (const m of contenido.matchAll(/['"]?([\w-]+)['"]?\s*:\s*['"]var\(--([\w-]+)\)['"]/g)) mapeoVarPlano.set(m[1], m[2]);
      }
    }
    for (const { ruta, contenido } of ctx.archivos) {
      if (esPrueba(ruta) || !esCodigo(ruta)) continue;
      const s = sinComentarios(contenido, ruta);
      const lineas = s.split('\n');
      // 1. valores arbitrarios con espacios
      for (const m of s.matchAll(/(?<![\w-])[a-z][\w:-]*-\[[^\]\n"'`]*\s[^\]\n"'`]*\]/g)) {
        const ln = lineaDe(s, m.index);
        const ctxL = lineas.slice(Math.max(0, ln - 3), ln).join('\n');
        if (!CONTEXTO_CLASE.test(ctxL)) continue;
        out.push(hallazgo(ID, ruta, s, m.index, m[0], 'Valor arbitrario con espacios: Tailwind no genera la clase; quita espacios o usa _', SEV, TIER));
      }
      // 2. /NN sobre token con alfa propio, o sobre var hex mapeada plana (v3)
      for (const c of cadenasDeClases(contenido, ruta)) {
        for (const t of c.toks) {
          const m = t.replace(/^!?(?:[\w-]+:)+/, '').match(new RegExp(`^(?:${PREFIJOS})-([a-z][\\w-]*?)\\/(\\d+|\\[[^\\]]+\\])$`));
          if (!m) continue;
          const nombre = m[1];
          if (conAlfa.has(nombre))
            out.push(hallazgo(ID, ruta, contenido, c.idx, t, `--${nombre} ya trae alfa: el modificador /NN descarta la clase`, SEV, TIER));
          else if (mapeoVarPlano.has(nombre) && hexSimple.has(mapeoVarPlano.get(nombre)))
            out.push(hallazgo(ID, ruta, contenido, c.idx, t, `${nombre} es var(--${mapeoVarPlano.get(nombre)}) hex: /NN no genera alfa; usa color-mix`, SEV, TIER));
        }
      }
    }
    return out;
  },
};
