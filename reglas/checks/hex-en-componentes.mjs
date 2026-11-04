import { esPrueba, esMarcado, esCss, esCodigo, ext, sinComentarios, textosVisibles, cadenasDeClases, etiquetas, hallazgo, hexAHsl, rgbAHsl, lineaDe } from '../lib/fuente.mjs';

// Compuerta: grep de hex fuera de tokens da 0. integrated-dashboard-ux SKILL.md.
const ID = 'hex-en-componentes';
const SEV = 'minor';
const TIER = 'AA';

const EXCLUIR = /(^|\/)(tokens?|themes?|colors?|palette|paleta|brand|marca|styles)(\/|\.|-)|tailwind\.config|\.(css|scss|html)$/i;

export default {
  id: ID,
  run(ctx) {
    const out = [];
    for (const { ruta, contenido } of ctx.archivos) {
      if (esPrueba(ruta) || !['tsx', 'jsx', 'vue', 'svelte'].includes(ext(ruta)) || EXCLUIR.test(ruta)) continue;
      const s = sinComentarios(contenido, ruta);
      for (const m of s.matchAll(/(?<=[\['"`(\s:,])#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})(?![\w-])/g)) {
        const antes = s.slice(Math.max(0, m.index - 8), m.index);
        if (/(href|id|to|key)=["'{`]*$/.test(antes)) continue;
        if (/--[\w-]+["']?\s*,\s*["']?$/.test(s.slice(Math.max(0, m.index - 40), m.index))) continue; // respaldo de var()/token()
        if (!/[0-9]/.test(m[0]) && m[0].length <= 5 && /^#[a-f]+$/i.test(m[0]) && !/\[$/.test(antes)) continue; // #add, #fff ambiguos fuera de [ ]
        out.push(hallazgo(ID, ruta, s, m.index, s.slice(Math.max(0, m.index - 20), m.index + m[0].length + 10), `Color literal ${m[0]} en componente: usa un token`, SEV, TIER));
      }
    }
    return out;
  },
};
