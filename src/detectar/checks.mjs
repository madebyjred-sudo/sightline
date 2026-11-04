import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs'
import { join, relative, resolve, sep } from 'node:path'
import { pathToFileURL } from 'node:url'

const REGLAS = resolve(new URL('../../reglas', import.meta.url).pathname)
const EXT = /\.(tsx|jsx|ts|js|css|scss|html|vue|svelte)$/
const FUERA = new Set(['node_modules', '.next', 'dist', 'build', 'vendor', '.git'])
const TOPE_ARCHIVO = 1 << 20 // 1 MB: archivos mayores (bundles, minificados) se saltan

export function archivosDe(raiz) {
  const out = []
  const ir = (d) => {
    let ents = []
    try { ents = readdirSync(d, { withFileTypes: true }) } catch { return }
    for (const e of ents) {
      if (FUERA.has(e.name)) continue
      const p = join(d, e.name)
      if (e.isDirectory()) ir(p)
      else if (EXT.test(e.name) && statSync(p).size <= TOPE_ARCHIVO) out.push({ ruta: relative(raiz, p).split(sep).join('/'), contenido: readFileSync(p, 'utf8') })
    }
  }
  ir(raiz)
  return out
}

export async function correrChecks({ repo, perfil, dirReglas = REGLAS }) {
  const dirChecks = join(dirReglas, 'checks')
  const files = existsSync(dirChecks) ? readdirSync(dirChecks).filter((f) => f.endsWith('.mjs')).sort() : []
  if (!files.length) return { hallazgos: [], nota: 'reglas/checks vacio: corrida sin checks propios' }
  let reglas = []
  try { reglas = JSON.parse(readFileSync(join(dirReglas, 'reglas.json'), 'utf8')) } catch {}
  const porId = new Map(reglas.map((r) => [r.id, r]))
  const ctx = { raiz: repo, archivos: archivosDe(repo) }
  const hallazgos = []
  const fallos = []
  let corridos = 0
  for (const f of files) {
    try {
      const mod = (await import(pathToFileURL(join(dirChecks, f)).href)).default
      const regla = porId.get(mod.id)
      if (regla?.perfiles && perfil && !regla.perfiles.includes(perfil)) continue
      const tier = regla?.tier ?? 'AA'
      const res = mod.run(ctx) || []
      corridos++
      for (const h of res) hallazgos.push({ regla: h.regla ?? mod.id, fuente: 'taste', severidad: h.severidad ?? 'warn', tier: h.tier ?? tier,
        archivo: h.archivo ?? null, linea: h.linea ?? null, vista: h.vista ?? null, fragmento: h.fragmento ?? null, mensaje: h.mensaje ?? regla?.titulo ?? mod.id })
    } catch (e) { fallos.push(`${f}: ${String(e.message).slice(0, 120)}`) }
  }
  return { hallazgos, nota: `checks: ${corridos}/${files.length} corridos sobre ${ctx.archivos.length} archivos, ${hallazgos.length} hallazgos${fallos.length ? `; fallaron ${fallos.join(' | ')}` : ''}` }
}
