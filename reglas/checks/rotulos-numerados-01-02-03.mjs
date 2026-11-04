import { esPrueba, esServidor, esMarcado, esCss, esCodigo, ext, sinComentarios, textosVisibles, cadenasDeClases, etiquetas, hallazgo, hexAHsl, rgbAHsl, lineaDe } from '../lib/fuente.mjs';

// Sin rotulos 01/02/03. SOUL.md: Frontend sin direccion de marca.
const ID = 'rotulos-numerados-01-02-03';
const SEV = 'warn';
const TIER = 'AA';

const RX_TEXTO = /^\s*(?:0[1-9]\s*(?:[.·:\u2014\u2013-]\s*)?|0[1-9]\s*[·\u2014\u2013/-]\s*[A-Za-zÁÉÍÓÚáéíóúñ][^\d]*|0[1-9]\s*\/\s*0[1-9])\s*$/;

export default {
  id: ID,
  run(ctx) {
    const out = [];
    for (const { ruta, contenido } of ctx.archivos) {
      if (esServidor(ruta) || esPrueba(ruta) || !esCodigo(ruta)) continue;
      for (const t of textosVisibles(contenido, ruta)) {
        if (t.tipo === 'texto' && RX_TEXTO.test(t.texto))
          out.push(hallazgo(ID, ruta, contenido, t.idx, t.texto, 'Rótulo numerado tipo 01/02/03; quítalo si la marca no lo pide', SEV, TIER));
      }
      const s = sinComentarios(contenido, ruta);
      if (esMarcado(ruta)) for (const m of s.matchAll(/(?<![=\-])>\s*(0[1-9](?:\s*\/\s*0[1-9])?)\s*</g))
        out.push(hallazgo(ID, ruta, s, m.index + 1, m[1], 'Rótulo numerado tipo 01/02/03; quítalo si la marca no lo pide', SEV, TIER));
      for (const m of s.matchAll(/\b(?:n|num|numero|number|step|paso|index|kicker|eyebrow|label)\s*:\s*(["'])0[1-9]\1/g))
        out.push(hallazgo(ID, ruta, s, m.index, m[0], 'Rótulo numerado tipo 01/02/03 en datos de secciones', SEV, TIER));
      for (const m of s.matchAll(/String\(\s*\w+\s*\+\s*1\s*\)\.padStart\(\s*2\s*,\s*["']0["']\s*\)/g))
        out.push(hallazgo(ID, ruta, s, m.index, m[0], 'Numeración 01/02/03 generada por índice', SEV, TIER));
    }
    return out;
  },
};
