// taste comparar: servidor del arbol en puerto + 1, mismas vistas, deteccion, guardas, informe.
import { readFileSync, writeFileSync, existsSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { asegurarServidor } from '../servidor.mjs'
import { arranqueEnPuerto, commitsDeRama } from './arbol.mjs'
import { detectarTodo } from './detectar.mjs'
import { normalizarArchivo } from '../criterio/criterios.mjs'
import { escribirInforme } from '../informe/informe.mjs'
import { puntaje } from '../puntaje.mjs'
import { leerPerfil } from './perfil.mjs'

export async function cargarGuardas() {
  try { const m = await import('../guardas.mjs'); if (typeof m.revisar === 'function') return m.revisar } catch {}
  return async () => ({ ok: true, motivos: ['guardas sin construir'], por_vista: {}, build: 'sin-build' })
}

export async function comparar({ dir, log = () => {}, sinServidor = false }) {
  const antes = JSON.parse(readFileSync(join(dir, 'corrida.json'), 'utf8'))
  const prop = JSON.parse(readFileSync(join(dir, 'propuesta.json'), 'utf8'))
  const { arbol, base, rama, modo } = prop
  const vistasIds = antes.vistas.map((v) => v.id)
  const crit = normalizarArchivo(join(dir, 'criterios.json'), { vistas: vistasIds, modo })
  const u = new URL(antes.url)
  const puerto = Number(u.port || 80) + 1
  u.port = String(puerto)
  const url = u.origin
  const perfil = leerPerfil(antes.repo)
  const notas = [...crit.errores.map((e) => `criterios: ${e}`)]
  let servidor = { vivo: false, apagar: async () => {} }
  let previo = { cerrar: async () => {} }
  let vistas = []
  let det = { hallazgos: [], notas: [] }
  try {
    if (!sinServidor) {
      const { abrirPrevio } = await import('../previo.mjs')
      previo = await abrirPrevio(perfil?.previo)
      if (previo.nota) notas.push(previo.nota)
      const cmd = arranqueEnPuerto({ arranque: perfil?.arranque ?? 'npm run dev', url: antes.url, arbol, puerto })
      log(`servidor del arbol: ${cmd}`)
      servidor = await asegurarServidor({ url, arranque: cmd, repo: arbol, logArchivo: join(dir, 'servidor-despues.log'), tope: 180000, entorno: perfil?.entorno ?? {} })
      notas.push(servidor.nota)
      if (servidor.vivo && !servidor.propio) notas.push(`aviso: ${url} ya respondia; no es necesariamente el arbol`)
    }
    if (servidor.vivo) {
      const { recorrer } = await import('../recorrido/navegar.mjs')
      vistas = await recorrer({ url, rutas: [], dirCorrida: dir, log, lecturas: perfil?.lecturas_permitidas ?? [], subdir: 'despues', fijas: antes.vistas })
    } else vistas = antes.vistas.map((v) => ({ ...v, capturas: { escritorio: null, movil: null }, error: 'sin servidor del arbol: no capturada' }))
    const urls = servidor.vivo ? vistas.filter((v) => v.tipo === 'pagina' && v.capturas.escritorio).map((v) => ({ url: url + v.ruta, vista: v.id })) : []
    det = await detectarTodo({ raiz: arbol, dirCorrida: dir, urls, perfil: antes.perfil, log })
    // Mismo mapa vertical que el antes, con los mismos criterios: la composicion se compara pareja.
    if (vistas.some((v) => v.medida)) {
      const { componerVistas } = await import('../composicion/analizar.mjs')
      const extra = componerVistas(vistas, antes.criterios?.tipo ?? 'mixto')
      det.hallazgos = [...det.hallazgos, ...extra.map((h, n) => ({ id: `h-c${String(n + 1).padStart(4, '0')}`, ...h }))]
    }
  } finally {
    await servidor.apagar()
    await previo.cerrar()
    rmSync(join(dir, 'tmp'), { recursive: true, force: true })
  }
  const despues = { ...antes, url, rama, sha: commitsDeRama(arbol, base).length ? null : base, ruta_repo: arbol, modo, vistas, hallazgos: det.hallazgos, cobertura: det.cobertura,
    puntaje: puntaje(det.hallazgos, vistas, { notas: det.notas }), notas: [...det.notas, ...notas] }
  try { despues.sha = (await import('node:child_process')).execFileSync('git', ['-C', arbol, 'rev-parse', '--short', 'HEAD'], { encoding: 'utf8' }).trim() } catch {}
  writeFileSync(join(dir, 'despues.json'), JSON.stringify(despues, null, 2))
  const directas = new Set(crit.criterios.filter((c) => c.estado === 'aplicado').map((c) => c.vista))
  // Las vistas internas comparten la pagina de su ruta: si se toca una, cambian todas las de esa ruta.
  const rutasTocadas = new Set((antes.vistas || []).filter((v) => directas.has(v.id)).map((v) => v.ruta))
  const tocadas = [...new Set([...directas, ...(antes.vistas || []).filter((v) => rutasTocadas.has(v.ruta)).map((v) => v.id)])]
  const revisar = await cargarGuardas()
  let guardas
  try { guardas = await revisar(antes, despues, antes.perfil, { arbol, base, tocadas, corrida: dir, tier: prop.tier }) }
  catch (e) { guardas = { ok: false, motivos: [`guardas fallaron: ${e.message}`], por_vista: {}, build: 'falla' } }
  writeFileSync(join(dir, 'guardas.json'), JSON.stringify(guardas, null, 2))
  const informe = escribirInforme({ dir, antes, despues, criterios: crit.criterios, guardas, propuesta: prop, commits: commitsDeRama(arbol, base) })
  return { antes, despues, guardas, criterios: crit, informe, servidor: servidor.vivo ? (servidor.propio ? 'arrancado y apagado' : 'ya estaba') : 'no disponible' }
}
