import { esPrueba, esMarcado, esCss, esCodigo, ext, sinComentarios, textosVisibles, cadenasDeClases, etiquetas, hallazgo, hexAHsl, rgbAHsl, lineaDe } from '../lib/fuente.mjs';

// Una animacion existe solo si esta en el CSS compilado. animaciones-que-no-existen.md.
const ID = 'animaciones-sin-css';
const SEV = 'warn';
const TIER = 'A';

const USO = /(?:^|[\s"'`:])(animate-in|animate-out|fade-in(?:-\d+)?|fade-out(?:-\d+)?|slide-in-from-[\w-]+|slide-out-to-[\w-]+|zoom-in-\d+|zoom-out-\d+|spin-in-\d+)(?=[\s"'`]|$)/;
const DEFINE = /tw-animate-css|tailwindcss-animate|\.animate-in\b|@utility\s+animate-in|@keyframes\s+(?:enter|exit)\b/;

export default {
  id: ID,
  run(ctx) {
    const definida = ctx.archivos.some(({ ruta, contenido }) => (esCss(ruta) || /tailwind\.config|\.(c|m)?js$|\.ts$/.test(ruta)) && DEFINE.test(contenido));
    if (definida) return [];
    const out = [];
    for (const { ruta, contenido } of ctx.archivos) {
      if (esPrueba(ruta) || !esCodigo(ruta)) continue;
      for (const c of cadenasDeClases(contenido, ruta)) {
        const m = c.valor.match(USO);
        if (m) { out.push(hallazgo(ID, ruta, contenido, c.idx, c.valor, `${m[1]} sin plugin ni CSS que lo defina: la animación no existe`, SEV, TIER)); break; }
      }
    }
    return out;
  },
};
