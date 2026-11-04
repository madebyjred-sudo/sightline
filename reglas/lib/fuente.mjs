// Utilidades compartidas por los checks. Sin dependencias, sin disco, sin red.

export const ext = (ruta) => (ruta.match(/\.([a-z]+)$/i)?.[1] || '').toLowerCase();
export const esMarcado = (ruta) => ['tsx', 'jsx', 'html', 'vue', 'svelte'].includes(ext(ruta));
export const esCss = (ruta) => ['css', 'scss'].includes(ext(ruta));
export const esCodigo = (ruta) => ['tsx', 'jsx', 'ts', 'js', 'vue', 'svelte', 'html'].includes(ext(ruta));
// Rutas de servidor: su texto lo leen agentes o desarrolladores, no la pantalla (supuesto declarado).
export const esServidor = (ruta) => /(^|\/)(api|server)\/|(^|\/)route\.(t|j)s$|(^|\/)middleware\.(t|j)s$/.test(ruta);
export const esPrueba = (ruta) => /(^|\/)(__tests__|tests?|e2e|stories|__mocks__)\/|\.(test|spec|stories)\.[a-z]+$/i.test(ruta);

// Reemplaza comentarios por espacios conservando saltos de línea (las posiciones no cambian).
export function sinComentarios(src, ruta = '') {
  const e = ext(ruta);
  const blanco = (m) => m.replace(/[^\n]/g, ' ');
  let s = src.replace(/<!--[\s\S]*?-->/g, blanco);
  if (e === 'html') return s;
  // Recorrido que respeta strings para no comerse "http://".
  let out = '';
  let i = 0;
  const n = s.length;
  const css = e === 'css' || e === 'scss';
  while (i < n) {
    const c = s[i], d = s[i + 1];
    if (c === '/' && d === '*') {
      const fin = s.indexOf('*/', i + 2);
      const j = fin < 0 ? n : fin + 2;
      out += blanco(s.slice(i, j)); i = j; continue;
    }
    if (!css && c === '/' && d === '/' && s[i - 1] !== ':' ) {
      const fin = s.indexOf('\n', i);
      const j = fin < 0 ? n : fin;
      out += blanco(s.slice(i, j)); i = j; continue;
    }
    if (c === '"' || c === "'" || c === '`') {
      let j = i + 1;
      while (j < n && s[j] !== c) { if (s[j] === '\\') j++; if (c !== '`' && s[j] === '\n') break; j++; }
      out += s.slice(i, j + 1); i = j + 1; continue;
    }
    out += c; i++;
  }
  return out;
}

export function lineaDe(src, idx) {
  let l = 1;
  for (let i = 0; i < idx && i < src.length; i++) if (src.charCodeAt(i) === 10) l++;
  return l;
}

export const corto = (s, n = 80) => {
  const t = String(s).replace(/\s+/g, ' ').trim();
  return t.length > n ? t.slice(0, n - 1) + '…' : t;
};

export function hallazgo(regla, ruta, src, idx, fragmento, mensaje, severidad, tier) {
  return { regla, fuente: 'taste', severidad, tier, archivo: ruta, linea: lineaDe(src, idx), vista: null, fragmento: corto(fragmento), mensaje };
}

const ATRIBUTOS_VISIBLES = 'title|placeholder|aria-label|alt|label|description|aria-description|tooltip';
const CLAVES_COPY = 'label|title|titulo|description|descripcion|placeholder|text|texto|subtitle|subtitulo|heading|message|mensaje|etiqueta|hint|helper|caption|cta|tooltip|empty|vacio';

// Textos visibles: nodos de texto JSX/HTML, atributos visibles y valores de claves de copy.
export function textosVisibles(src, ruta) {
  const s = sinComentarios(src, ruta);
  const e = ext(ruta);
  const res = [];
  let cuerpo = s;
  if (e === 'html' || e === 'vue' || e === 'svelte') {
    cuerpo = s.replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, (m) => m.replace(/[^\n]/g, ' '));
  }
  if (esMarcado(ruta)) {
    const rxTexto = /(?<![=\-])>([^<>{}]*[A-Za-zÁÉÍÓÚáéíóúñÑ\u2014][^<>{}]*)</g;
    for (const m of cuerpo.matchAll(rxTexto)) {
      const t = m[1];
      if (/=>|&&|\|\||;|\breturn\b|\bconst\b|\bimport\b/.test(t)) continue;
      if (!t.trim()) continue;
      res.push({ texto: t, idx: m.index + 1, tipo: 'texto' });
    }
    // texto JSX dentro de {'...'} o {"..."}
    for (const m of cuerpo.matchAll(/>\s*\{\s*(['"])([^'"\n]+)\1\s*\}/g)) res.push({ texto: m[2], idx: m.index, tipo: 'texto' });
  }
  const rxAttr = new RegExp(`\\b(?:${ATRIBUTOS_VISIBLES})\\s*=\\s*(?:\\{\\s*)?(["'\`])([^"'\`\\n]*)\\1`, 'g');
  for (const m of cuerpo.matchAll(rxAttr)) res.push({ texto: m[2], idx: m.index, tipo: 'atributo' });
  if (['tsx', 'jsx', 'ts', 'js', 'vue', 'svelte'].includes(e)) {
    const rxClave = new RegExp(`\\b(?:${CLAVES_COPY})\\s*:\\s*(["'\`])([^"'\`\\n]*)\\1`, 'gi');
    for (const m of cuerpo.matchAll(rxClave)) res.push({ texto: m[2], idx: m.index, tipo: 'clave' });
    // toast("...") / toast.success("...")
    for (const m of cuerpo.matchAll(/\btoast(?:\.\w+)?\(\s*(["'`])([^"'`\n]*)\1/g)) res.push({ texto: m[2], idx: m.index, tipo: 'clave' });
  }
  return res;
}

// Cadenas de clases: className/class (literal, template o dentro de cn()/clsx()/cva()) y strings sueltos con pinta de clases.
export function cadenasDeClases(src, ruta) {
  const s = sinComentarios(src, ruta);
  const res = [];
  const vistos = new Set();
  const rxStr = /(["'`])((?:(?!\1)[^\\\n]|\\.)*)\1/g;
  for (const m of s.matchAll(rxStr)) {
    const v = m[2];
    if (!v || v.length < 2) continue;
    // parece lista de clases: tokens con guion o utilidades conocidas, sin espacios raros de prosa
    const toks = v.split(/\s+/).filter(Boolean);
    const utiles = toks.filter((t) => /^(?:[a-z0-9-]+:)*!?-?[a-z]+(?:-[a-z0-9.\/\[\]#%(),_:'"-]+)+$|^(?:[a-z0-9-]+:)*(?:flex|grid|block|hidden|inline|relative|absolute|fixed|sticky|italic|truncate|uppercase|border|rounded|shadow|underline|container)$/.test(t));
    if (!utiles.length || utiles.length < toks.length * 0.6) continue;
    if (vistos.has(m.index)) continue;
    vistos.add(m.index);
    res.push({ valor: v, idx: m.index + 1, toks });
  }
  return res;
}

// Etiquetas de apertura (con sus atributos) de JSX/HTML: devuelve {nombre, texto, idx}.
export function etiquetas(src, ruta, rxNombre) {
  const s = sinComentarios(src, ruta);
  const res = [];
  const rx = new RegExp(`<(${rxNombre})(?=[\\s>/])`, 'g');
  for (const m of s.matchAll(rx)) {
    // avanzar hasta el > que cierra la etiqueta, respetando llaves y comillas
    let i = m.index + m[0].length, prof = 0, q = null;
    for (; i < s.length; i++) {
      const c = s[i];
      if (q) { if (c === q && s[i - 1] !== '\\') q = null; continue; }
      if (c === '"' || c === "'" || c === '`') { q = c; continue; }
      if (c === '{') prof++;
      else if (c === '}') prof--;
      else if (c === '>' && prof <= 0) break;
    }
    res.push({ nombre: m[1], texto: s.slice(m.index, i + 1), idx: m.index });
  }
  return res;
}

export function hexAHsl(hex) {
  let h = hex.replace('#', '');
  if (h.length === 3 || h.length === 4) h = h.slice(0, 3).split('').map((c) => c + c).join('');
  if (h.length === 8) h = h.slice(0, 6);
  if (h.length !== 6) return null;
  const r = parseInt(h.slice(0, 2), 16) / 255, g = parseInt(h.slice(2, 4), 16) / 255, b = parseInt(h.slice(4, 6), 16) / 255;
  return rgbAHsl(r * 255, g * 255, b * 255);
}

export function rgbAHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0, s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
  }
  return { h, s: s * 100, l: l * 100 };
}
