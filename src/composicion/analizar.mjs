// Mapa vertical y puntaje por componente (docs/COMPOSICION.md). Funciones puras sobre lo que mide
// medir.mjs en el navegador; los umbrales viven aqui y en el documento, no en otro lado.

const c01 = (x) => Math.max(0, Math.min(1, x))
const r2 = (x) => Math.round(x * 100) / 100

// Fuerza: cuanto golpea. Escala del texto mayor frente al cuerpo (1x = 0, 3,5x = 1), su contraste,
// peso visual (medios grandes o bloques con fondo propio) y movimiento. Lo que pesa mas de los dos
// (escala o peso visual) manda: un titular enorme golpea sin imagen, y una escena golpea sin titular.
export function fuerza(m) {
  const escala = c01((m.escala - 1) / 2.5)
  const cr = m.contraste_mayor == null ? 0.5 : c01((m.contraste_mayor - 3) / 9)
  const peso = c01(((m.medios || 0) + (m.masa || 0)) / 0.5)
  const mov = m.movimiento > 0 ? 1 : 0
  return r2(c01(0.65 * Math.max(escala, peso) + 0.15 * Math.min(escala, peso) + 0.1 * cr + 0.1 * mov))
}

// Densidad: informacion por area. Caracteres por 10.000 px² (60 ya es denso) y controles por 10.000 px².
export function densidad(m) {
  const area = Math.max(1, m.caja.w * m.caja.h)
  const chars = c01((m.chars / area) * 10000 / 60)
  const ctrl = c01((m.controles / area) * 10000 / 1.5)
  return r2(c01(0.7 * chars + 0.3 * ctrl))
}

// Cine: contraste de escala, aire (lo que no es tinta ni medio), encuadre y movimiento.
export function cine(m) {
  const escala = c01((m.escala - 1.5) / 2.5)
  const aire = c01(1 - m.tinta - m.medios - (m.masa || 0) * 0.5)
  // Encuadre: un medio a sangre, o un bloque propio (escena, foto, banda) que llena la seccion.
  const encuadre = m.sangre ? 1 : c01(((m.medios || 0) + (m.masa || 0)) / 0.6)
  return r2(c01(0.35 * escala + 0.2 * aire + 0.3 * encuadre + 0.15 * (m.movimiento > 0 ? 1 : 0)))
}

export const UMBRAL = { fuerte: 0.5, denso: 0.45, medioF: [0.2, 0.5], medioD: [0.15, 0.45] }

export function rol(f, d) {
  if (f >= UMBRAL.fuerte && d >= UMBRAL.denso) return 'saturado'
  if (f >= UMBRAL.fuerte) return 'golpe'
  if (d >= UMBRAL.denso) return 'condensado'
  const enMedio = (x, [a, b]) => x >= a && x < b
  if (enMedio(f, UMBRAL.medioF) && enMedio(d, UMBRAL.medioD)) return 'sin decidir'
  return f >= d ? 'golpe suave' : 'condensado suave'
}

// Calidad medida en el DOM: el texto mas debil y el mas chico.
export function calidad(m) {
  let q = 100
  if (m.contraste_min != null) q -= m.contraste_min < 3 ? 40 : m.contraste_min < 4.5 ? 20 : 0
  if (m.texto_min != null) q -= m.texto_min < 11 ? 20 : m.texto_min < 12 ? 10 : 0
  return Math.max(0, q)
}

// Composicion: que tan bien cumple el rol de su seccion.
export function composicion(m, rolSeccion) {
  if (/golpe/.test(rolSeccion)) return Math.round(100 * c01(0.25 + cine(m)))
  if (/condensado/.test(rolSeccion)) {
    // Lo denso se lee si no esta apretado (tinta < 0,6) y su texto no baja del cuerpo.
    const aire = m.tinta < 0.6 ? 1 : c01((0.85 - m.tinta) / 0.25)
    const tam = m.texto_min == null ? 1 : c01((m.texto_min - 10) / 4)
    return Math.round(100 * (0.6 * aire + 0.4 * tam))
  }
  if (rolSeccion === 'saturado') return 35
  return 50
}

export function puntajeComponente(m, rolSeccion) {
  const q = calidad(m), k = composicion(m, rolSeccion)
  return { calidad: q, composicion: k, puntaje: Math.round(0.5 * q + 0.5 * k) }
}

const TECHO_SIN_DECIDIR = 60

/**
 * Mapa vertical de una vista medida: rol, fuerza, densidad y cine por seccion, puntaje por componente
 * y por seccion, y el area muerta de la vista.
 */
export function mapaVertical(medida) {
  const secciones = (medida?.secciones || []).map((s) => {
    const f = fuerza(s), d = densidad(s), k = cine(s), papel = rol(f, d)
    const componentes = s.componentes.map((c) => ({ id: c.id, etiqueta: c.etiqueta, tag: c.tag, caja: c.caja, ...puntajeComponente(c, papel) }))
    let p = componentes.length ? Math.round(componentes.reduce((a, c) => a + c.puntaje, 0) / componentes.length) : puntajeComponente(s, papel).puntaje
    if (papel === 'sin decidir') p = Math.min(p, TECHO_SIN_DECIDIR)
    return { id: s.id, etiqueta: s.etiqueta, caja: s.caja, fuerza: f, densidad: d, cine: k, rol: papel, puntaje: p, componentes }
  })
  // Area muerta: dentro de cada seccion (no los margenes de la columna), lo que no es tinta, medio ni
  // bloque con fondo, ponderado por area. La tinta se mide sobre la caja del texto, que es mas chica que
  // su renglon: x1,6 la lleva al renglon.
  let lleno = 0, total = 0
  for (const s of medida?.secciones || []) {
    const a = s.caja.w * s.caja.h
    total += a
    lleno += c01(s.tinta * 1.6 + (s.medios || 0) + (s.masa || 0)) * a
  }
  return { secciones, area_muerta: total ? r2(1 - lleno / total) : 0 }
}

/** Hallazgos del mapa vertical para una vista. tipo: herramienta | vitrina | mixto. */
export function hallazgosDeComposicion(vista, mapa, tipo = 'mixto') {
  const out = []
  if (mapa.igual_a) return out // misma composicion que su padre: ya se conto ahi
  const h = (regla, sev, tier, seccion, mensaje) => out.push({ regla, fuente: 'taste', severidad: sev, tier, archivo: null, linea: null, vista: vista.id, seccion: seccion?.id ?? null, mensaje, fragmento: seccion?.etiqueta ?? null })
  const S = mapa.secciones
  for (const s of S) if (s.rol === 'sin decidir') h('seccion-sin-decidir', 'warn', 'AA', s, `«${s.etiqueta}» ni golpea ni condensa (fuerza ${s.fuerza}, densidad ${s.densidad})`)
  for (const s of S) if (s.rol === 'saturado') h('seccion-saturada', 'warn', 'AA', s, `«${s.etiqueta}» golpea y carga a la vez (fuerza ${s.fuerza}, densidad ${s.densidad})`)
  for (let i = 1; i < S.length; i++) {
    if (/^golpe$/.test(S[i].rol) && /^golpe$/.test(S[i - 1].rol)) h('golpes-seguidos', 'minor', 'AAA', S[i], `«${S[i - 1].etiqueta}» y «${S[i].etiqueta}» golpean seguidas: ninguna pesa`)
  }
  // Apertura: la primera seccion despues de cabeceras bajas (< 120 px).
  const abre = S.find((s) => s.caja.h >= 120)
  if (abre && vista.tipo === 'pagina') {
    if (tipo === 'vitrina' && !/golpe/.test(abre.rol)) h('apertura-segun-el-producto', 'warn', 'AA', abre, `la vitrina abre con «${abre.etiqueta}» (${abre.rol}), no con un golpe`)
    if (tipo === 'herramienta' && abre.rol === 'golpe' && abre.densidad < 0.1) h('apertura-segun-el-producto', 'warn', 'AA', abre, `la herramienta abre con «${abre.etiqueta}», un golpe sin trabajo: arriba va lo accionable`)
  }
  for (const s of S) if (/golpe/.test(s.rol) && s.cine < 0.3 && s.caja.h >= 200) h('cine-donde-golpea', 'minor', 'AAA', s, `«${s.etiqueta}» debe golpear y es plana (cine ${s.cine})`)
  const tope = tipo === 'herramienta' ? 0.25 : tipo === 'vitrina' ? 0.6 : 0.4
  if (mapa.area_muerta > tope && vista.tipo === 'pagina') h('area-muerta', 'warn', 'AA', null, `área muerta ${Math.round(mapa.area_muerta * 100)} % (tope ${Math.round(tope * 100)} % para ${tipo})`)
  return out
}

/**
 * Pasa la medida cruda de cada vista (vista.medida, del recorrido) a su mapa vertical, marca las vistas
 * internas con la misma composicion que su padre y devuelve los hallazgos de composicion.
 */
export function componerVistas(vistas, tipo = 'mixto') {
  const firma = (m) => (m?.secciones || []).map((s) => `${s.etiqueta}:${s.caja.h}`).join('|')
  for (const v of vistas) {
    if (v.medida && !v.medida.error) v.mapa = mapaVertical(v.medida)
    else if (v.medida?.error) v.mapa = { error: v.medida.error }
    delete v.medida
  }
  // Una vista interna con la misma composicion que su padre (un ancla, una pestana sin cambios) no
  // vuelve a sumar hallazgos.
  const porId = new Map(vistas.map((v) => [v.id, v]))
  for (const v of vistas) {
    const p = v.padre && porId.get(v.padre)
    if (p?.mapa?.secciones && v.mapa?.secciones && firma(p.mapa) === firma(v.mapa)) v.mapa.igual_a = p.id
  }
  return vistas.flatMap((v) => (v.mapa?.secciones ? hallazgosDeComposicion(v, v.mapa, tipo) : []))
}
