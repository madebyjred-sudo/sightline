import { esPrueba, esMarcado, esCss, esCodigo, ext, sinComentarios, textosVisibles, cadenasDeClases, etiquetas, hallazgo, hexAHsl, rgbAHsl, lineaDe } from '../lib/fuente.mjs';

// Una sola barra superior compartida. SOUL.md: Reglas de producto.
const ID = 'segunda-barra-superior';
const SEV = 'warn';
const TIER = 'AA';

const FIJA_ARRIBA = /(?:^|[\s"'`])(?:fixed|sticky)(?=[\s"'`])[\s\S]*?(?:^|[\s"'`])(?:top-0|inset-x-0\s+top-0|top-\[0(?:px)?\])(?=[\s"'`])|(?:^|[\s"'`])(?:top-0)(?=[\s"'`])[\s\S]*?(?:^|[\s"'`])(?:fixed|sticky)(?=[\s"'`])/;

export default {
  id: ID,
  run(ctx) {
    const barras = [];
    for (const { ruta, contenido } of ctx.archivos) {
      if (esPrueba(ruta) || !esMarcado(ruta)) continue;
      if (/(^|\/)ui\/(sidebar|table|sheet|dialog|drawer|command)\.(t|j)sx$/.test(ruta)) continue;
      for (const e of etiquetas(contenido, ruta, 'header|nav|Header|Navbar|TopBar|AppBar')) {
        if (/role=["']banner/.test(e.texto) || FIJA_ARRIBA.test(e.texto))
          if (FIJA_ARRIBA.test(e.texto)) barras.push({ ruta, contenido, e });
      }
      for (const e of etiquetas(contenido, ruta, 'div')) {
        if (/role=["']banner["']/.test(e.texto) && FIJA_ARRIBA.test(e.texto)) barras.push({ ruta, contenido, e });
      }
    }
    if (barras.length < 2) return [];
    const archivos = [...new Set(barras.map((b) => b.ruta))];
    return barras.map(({ ruta, contenido, e }) =>
      hallazgo(ID, ruta, contenido, e.idx, e.texto,
        `${barras.length} barras superiores fijas en ${archivos.length} archivo(s): debe haber una sola compartida`, SEV, TIER));
  },
};
