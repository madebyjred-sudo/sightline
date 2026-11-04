import { esPrueba, esMarcado, esCss, esCodigo, ext, sinComentarios, textosVisibles, cadenasDeClases, etiquetas, hallazgo, hexAHsl, rgbAHsl, lineaDe } from '../lib/fuente.mjs';

// Nada de pop-ups ni modales (excepcion: paleta de comandos). SOUL.md: Reglas de producto.
const ID = 'pop-ups-modales';
const SEV = 'warn';
const TIER = 'AA';

export default {
  id: ID,
  run(ctx) {
    const out = [];
    for (const { ruta, contenido } of ctx.archivos) {
      if (esPrueba(ruta) || !esCodigo(ruta)) continue;
      // la definición del primitivo en components/ui no es un uso
      if (/(^|\/)ui\/(alert-)?dialog\.(t|j)sx$|(^|\/)ui\/modal\.(t|j)sx$/.test(ruta)) continue;
      const s = sinComentarios(contenido, ruta);
      for (const m of s.matchAll(/<(AlertDialog|Dialog|Modal|ResponsiveDialog|ConfirmDialog)(?=[\s>])/g))
        out.push(hallazgo(ID, ruta, s, m.index, m[0], `<${m[1]}> es un modal; el detalle va dentro del panel con animación`, SEV, TIER));
      for (const m of s.matchAll(/(?<![\w.$])(?:window\.)?(confirm|alert|prompt)\(\s*[`'"]/g))
        out.push(hallazgo(ID, ruta, s, m.index, m[0], `${m[1]}() nativo es un pop-up; confirma dentro del panel o con deshacer`, SEV, TIER));
      for (const m of s.matchAll(/aria-modal\s*=\s*(?:\{\s*true\s*\}|["']true["'])|\.showModal\(\)/g))
        out.push(hallazgo(ID, ruta, s, m.index, m[0], 'Superficie modal; el detalle va dentro del panel', SEV, TIER));
    }
    return out;
  },
};
