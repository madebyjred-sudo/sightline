// criterios.json: validacion y descarte automatico (ESPEC v1).
import { readFileSync, writeFileSync, existsSync } from 'node:fs'

export const ACCIONES = ['quitar', 'cambiar', 'agregar', 'reemplazar-por-componente']
export const ESTADOS = ['propuesto', 'aplicado', 'descartado']
const EJES = ['ux', 'dx', 'ax']
const CLAVES = ['id', 'vista', 'hallazgos', 'regla', 'criterio', 'por_que', 'ux', 'dx', 'ax', 'accion', 'componente', 'archivos', 'estado', 'motivo_descarte']

export const veredicto = (v) => String(v ?? '').trim().split(/[\s:,.]+/)[0].toLowerCase()

// Regla dura: si ux, dx o ax empeora, se descarta solo. En limpieza, agregar o reemplazar nunca queda
// aplicado (cambiar se admite: voseo a tuteo o em-dash fuera reescriben sin sumar piezas).
export function aplicarReglasDuras(c, { modo } = {}) {
  const peor = EJES.filter((e) => veredicto(c[e]) === 'empeora')
  if (peor.length) return { ...c, estado: 'descartado', motivo_descarte: `${peor.join(', ')} empeora (descarte automático)` }
  if (modo === 'limpieza' && ['agregar', 'reemplazar-por-componente'].includes(c.accion) && c.estado === 'aplicado') return { ...c, estado: 'propuesto', motivo_descarte: null, nota: 'limpieza solo quita: queda propuesto' }
  return c
}

export function validar(lista, { vistas = null, reglas = null, modo } = {}) {
  const errores = []
  if (!Array.isArray(lista)) return { criterios: [], errores: ['criterios.json no es una lista'] }
  const ids = new Set()
  const criterios = lista.map((c, i) => {
    const donde = c?.id ?? `#${i}`
    for (const k of CLAVES) if (!(k in (c ?? {}))) errores.push(`${donde}: falta ${k}`)
    if (ids.has(c.id)) errores.push(`${donde}: id repetido`); ids.add(c.id)
    if (!/^c-\d{4}$/.test(c.id ?? '')) errores.push(`${donde}: id debe ser c-0001`)
    if (!ACCIONES.includes(c.accion)) errores.push(`${donde}: accion invalida ${c.accion}`)
    if (!ESTADOS.includes(c.estado)) errores.push(`${donde}: estado invalido ${c.estado}`)
    for (const e of EJES) if (!['mejora', 'igual', 'empeora'].includes(veredicto(c[e]))) errores.push(`${donde}: ${e} debe empezar con mejora, igual o empeora`)
    if (vistas && !vistas.includes(c.vista)) errores.push(`${donde}: vista desconocida ${c.vista}`)
    if (reglas && !String(c.regla).startsWith('inspo:') && !reglas.includes(c.regla) && !String(c.regla).includes(':')) errores.push(`${donde}: regla desconocida ${c.regla}`)
    if (!c.por_que) errores.push(`${donde}: por_que vacio (lleva la fuente)`)
    return aplicarReglasDuras(c, { modo })
  })
  return { criterios, errores }
}

export function leerCriterios(f) {
  if (!existsSync(f)) return null
  return JSON.parse(readFileSync(f, 'utf8'))
}

export function normalizarArchivo(f, opciones) {
  const lista = leerCriterios(f)
  if (!lista) return { criterios: [], errores: ['sin criterios.json'] }
  const r = validar(lista, opciones)
  writeFileSync(f, JSON.stringify(r.criterios, null, 2))
  return r
}
