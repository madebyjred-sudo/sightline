import { esPrueba, esServidor, esMarcado, esCss, esCodigo, ext, sinComentarios, textosVisibles, cadenasDeClases, etiquetas, hallazgo, hexAHsl, rgbAHsl, lineaDe } from '../lib/fuente.mjs';

// Pista para el criterio: textos de ayuda y eslogan bajo titulos. SOUL.md regla principal.
const ID = 'texto-de-ayuda-y-eslogan';
const SEV = 'info';
const TIER = 'AA';

const TITULO = /<(h1|h2|h3|CardTitle|DialogTitle|SheetTitle|DrawerTitle|PageTitle|SectionTitle)\b[\s\S]*?<\/\1>/g;
const SECUNDARIO = /muted|text-gray-[45]00|text-neutral-[45]00|text-zinc-[45]00|text-slate-[45]00|text-ink-[23]|text-secondary|text-subtle|opacity-[1-7]0|text-foreground\/[1-7]0/;
const palabras = (t) => t.replace(/\{[^}]*\}/g, ' x ').trim().split(/\s+/).filter((w) => /\p{L}/u.test(w)).length;

export default {
  id: ID,
  run(ctx) {
    const out = [];
    for (const { ruta, contenido } of ctx.archivos) {
      if (esServidor(ruta) || esPrueba(ruta) || !esMarcado(ruta)) continue;
      const s = sinComentarios(contenido, ruta);
      for (const m of s.matchAll(TITULO)) {
        const tras = s.slice(m.index + m[0].length, m.index + m[0].length + 500);
        const p = tras.match(/^\s*(?:<\/[^>]+>\s*)?<(p|span|div|CardDescription|DialogDescription|SheetDescription|DrawerDescription)\b([^>]*)>([^<]{1,400})</);
        if (!p) continue;
        const desc = /Description$/.test(p[1]);
        if (!desc && !SECUNDARIO.test(p[2])) continue;
        if (palabras(p[3]) < 6) continue;
        out.push(hallazgo(ID, ruta, s, m.index + m[0].length + p.index, p[3], 'Texto secundario bajo el título: revisar si es ayuda o eslogan que el layout debería hacer innecesario', SEV, TIER));
      }
      for (const m of s.matchAll(/\b(?:description|subtitle|subtitulo|tagline|helperText|hint)\s*=\s*(["'])([^"'\n]{20,})\1/g)) {
        if (palabras(m[2]) < 6) continue;
        out.push(hallazgo(ID, ruta, s, m.index, m[2], 'Subtítulo o ayuda en prop: revisar si sobra', SEV, TIER));
      }
    }
    return out;
  },
};
