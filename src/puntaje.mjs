// Puntaje v1 (C5). Formula y umbrales en docs/PUNTAJE.md.
export const PESOS = { major: 8, warn: 4, minor: 1, info: 0 }
export const TOPE_REGLA = 20
export const K = 100 // penalidad que deja un bloque en 50
export const PESO_CODIGO = 0.5 // peso del bloque de codigo sin vista en el global
export const UMBRALES = { A: 85, AA: 75, AAA: 70 }
export const INCLUYE = { A: ['A'], AA: ['A', 'AA'], AAA: ['A', 'AA', 'AAA'] }

// Penalidad de un bloque: suma por regla de peso x n, con tope por regla.
export function penalidad(hallazgos) {
  const porRegla = new Map()
  for (const h of hallazgos) porRegla.set(h.regla, (porRegla.get(h.regla) || 0) + (PESOS[h.severidad] ?? 0))
  let resta = 0
  for (const v of porRegla.values()) resta += Math.min(v, TOPE_REGLA)
  return resta
}

// v0 (se conserva para comparar y para la prueba de C1): 100 - penalidad, piso 0.
export const puntuar = (hallazgos) => Math.max(0, 100 - penalidad(hallazgos))

// v1 por bloque: 100 * K / (K + penalidad). Nunca llega a 0 y baja con cada hallazgo nuevo.
const r1 = (x) => Math.round(x * 10) / 10 // una decimal: un hallazgo mas siempre mueve el numero
export const bloque = (hallazgos) => (100 * K) / (K + penalidad(hallazgos))

const filtrar = (hs, t) => hs.filter((h) => INCLUYE[t].includes(h.tier))

// Vistas que cuentan: paginas y cualquier vista con hallazgos propios. Hojas y pestanas sin
// analisis propio no inflan el promedio con 100 gratis.
function vistasAnalizadas(hallazgos, vistas) {
  const conH = hallazgos.map((h) => h.vista).filter(Boolean)
  return [...new Set([...vistas.filter((v) => v.tipo === 'pagina').map((v) => v.id), ...conH])]
}

export function transitionsDeNotas(notas = []) {
  for (const n of notas || []) {
    const m = /^transitions .*score propio (\d+)/.exec(String(n))
    if (m) return Number(m[1])
  }
  return null
}

// Firma que usa bin/taste.mjs: puntaje(hallazgos, vistas). Tercer argumento opcional
// { notas } o { transitions } para llenar referencias.transitions.
export function puntaje(hallazgos, vistas = [], extra = {}) {
  const ids = vistasAnalizadas(hallazgos, vistas)
  const codigo = hallazgos.filter((h) => !h.vista)
  const por_vista = {}
  for (const id of ids) {
    const hs = hallazgos.filter((h) => h.vista === id)
    por_vista[id] = Object.fromEntries(Object.keys(INCLUYE).map((t) => [t, r1(bloque(filtrar(hs, t)))]))
  }
  const out = {}
  for (const t of Object.keys(INCLUYE)) {
    const c = bloque(filtrar(codigo, t))
    if (!ids.length) { out[t] = r1(c); continue }
    const media = ids.reduce((s, id) => s + bloque(filtrar(hallazgos.filter((h) => h.vista === id), t)), 0) / ids.length
    out[t] = r1(PESO_CODIGO * c + (1 - PESO_CODIGO) * media)
  }
  const tr = extra.transitions ?? transitionsDeNotas(extra.notas)
  return { version: 1, ...out, por_vista, referencias: { transitions: tr ?? null } }
}

export const puntajeDeCorrida = (c) => puntaje(c.hallazgos || [], c.vistas || [], { notas: c.notas })

// Un tier aprueba si su puntaje >= umbral, no hay hallazgos major de ese tier y aprueban los
// tiers de abajo (AAA = AA + oficio).
export function aprueba(corrida, tier) {
  const abajo = { A: null, AA: 'A', AAA: 'AA' }[tier]
  const p = corrida.puntaje?.version === 1 ? corrida.puntaje : puntajeDeCorrida(corrida)
  const majors = (corrida.hallazgos || []).filter((h) => h.severidad === 'major' && INCLUYE[tier].includes(h.tier)).length
  const propio = p[tier] >= UMBRALES[tier] && majors === 0
  const base = abajo ? aprueba(corrida, abajo) : { ok: true }
  return { ok: propio && base.ok, puntaje: p[tier], umbral: UMBRALES[tier], majors, abajo_ok: base.ok }
}
