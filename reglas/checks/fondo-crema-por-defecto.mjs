import { esPrueba, esMarcado, esCss, esCodigo, ext, sinComentarios, textosVisibles, cadenasDeClases, etiquetas, hallazgo, hexAHsl, rgbAHsl, lineaDe } from '../lib/fuente.mjs';

// Sin fondo crema por defecto. SOUL.md: Frontend sin direccion de marca.
const ID = 'fondo-crema-por-defecto';
const SEV = 'warn';
const TIER = 'AA';

// Clasificación de crema tomada de pila-de-estilo.md: hue 25-60, sat > 15 %, luz > 85 %.
const esCrema = (hsl) => hsl && hsl.h >= 25 && hsl.h <= 60 && hsl.s > 15 && hsl.l > 85;

function coloresEn(valor) {
  const res = [];
  for (const m of valor.matchAll(/#[0-9a-fA-F]{3,8}\b/g)) res.push([m[0], hexAHsl(m[0])]);
  for (const m of valor.matchAll(/rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)/g)) res.push([m[0], rgbAHsl(+m[1], +m[2], +m[3])]);
  for (const m of valor.matchAll(/hsla?\(\s*([\d.]+)(?:deg)?[\s,]+([\d.]+)%[\s,]+([\d.]+)%/g)) res.push([m[0], { h: +m[1], s: +m[2], l: +m[3] }]);
  // formato shadcn v3: "40 30% 96%"
  const crudo = valor.trim().match(/^([\d.]+)\s+([\d.]+)%\s+([\d.]+)%$/);
  if (crudo) res.push([valor.trim(), { h: +crudo[1], s: +crudo[2], l: +crudo[3] }]);
  return res;
}

const CLASES_CREMA = /^(?:[\w-]+:)*bg-(?:amber|yellow|orange|stone)-(?:50|100)(?:\/\d+)?$|^(?:[\w-]+:)*bg-(?:cream|crema|beige|ivory|paper)\b/;

export default {
  id: ID,
  run(ctx) {
    const out = [];
    for (const { ruta, contenido } of ctx.archivos) {
      if (esPrueba(ruta)) continue;
      if (esCss(ruta)) {
        const s = sinComentarios(contenido, ruta);
        const rx = /(background(?:-color)?|--[\w-]*(?:background|bg|surface|paper|canvas|fondo|base|page|app)[\w-]*)\s*:\s*([^;{}]+)/gi;
        for (const m of s.matchAll(rx)) {
          if (/gradient\(/.test(m[2])) continue; // degradados decorativos: los juzga la regla de degradados
          for (const [txt, hsl] of coloresEn(m[2])) {
            if (esCrema(hsl)) out.push(hallazgo(ID, ruta, s, m.index, m[0], `Fondo crema (${txt}) sin pedido de marca; usa la superficie neutra`, SEV, TIER));
          }
        }
        continue;
      }
      if (!esCodigo(ruta)) continue;
      for (const c of cadenasDeClases(contenido, ruta)) {
        for (const t of c.toks) {
          const arb = t.match(/^(?:[\w-]+:)*bg-\[(#[0-9a-fA-F]{3,8}|rgba?\([^\]]+\))\]/);
          const crema = (arb && coloresEn(arb[1]).some(([, h]) => esCrema(h))) || CLASES_CREMA.test(t);
          if (crema) out.push(hallazgo(ID, ruta, contenido, c.idx, t, `Fondo crema (${t}) sin pedido de marca; usa la superficie neutra`, SEV, TIER));
        }
      }
    }
    return out;
  },
};
