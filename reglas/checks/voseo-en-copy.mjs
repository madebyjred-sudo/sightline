import { esPrueba, esServidor, esMarcado, esCss, esCodigo, ext, sinComentarios, textosVisibles, cadenasDeClases, etiquetas, hallazgo, hexAHsl, rgbAHsl, lineaDe } from '../lib/fuente.mjs';

// Tuteo, no voseo. integrated-dashboard-ux SKILL.md.
const ID = 'voseo-en-copy';
const SEV = 'minor';
const TIER = 'AA';

const VOSEO = /(?<!\p{L})(querés|podés|tenés|sabés|decís|hacés|sos|vos|entrá|mirá|andá|probá|elegí|escribí|hacé|tené|poné|decime|fijate|contame|avisame|buscá|agregá|creá|guardá|subí|abrí|cerrá|usá|seleccioná|ingresá|completá|revisá|confirmá|editá|copiá|empezá|armá|cargá|descargá|compartí|volvé|esperá|registrate|iniciá|conectá|activá|probalo|miralo)(?!\p{L})/iu;

export default {
  id: ID,
  run(ctx) {
    const out = [];
    for (const { ruta, contenido } of ctx.archivos) {
      if (esServidor(ruta) || esPrueba(ruta) || !esCodigo(ruta)) continue;
      for (const t of textosVisibles(contenido, ruta)) {
        const m = t.texto.match(VOSEO);
        if (m) out.push(hallazgo(ID, ruta, contenido, t.idx, t.texto, `Voseo «${m[1]}»: el copy tutea`, SEV, TIER));
      }
    }
    return out;
  },
};
