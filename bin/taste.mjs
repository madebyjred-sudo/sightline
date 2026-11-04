#!/usr/bin/env node
import { mkdirSync, writeFileSync, rmSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { homedir } from 'node:os'
import { NOMBRE } from '../src/nombre.mjs'
import { reconocer } from '../src/repo.mjs'
import { descubrirRutas, idDeRuta } from '../src/recorrido/rutas.mjs'
import { puntaje } from '../src/puntaje.mjs'

const AYUDA = [
  `${NOMBRE} <recorrer|detectar|auditar> [--repo RUTA] [--tier A|AA|AAA] [--solo RUTA_URL] [--sin-servidor] [--sin-ruido]`,
  `${NOMBRE} <correccion|limpieza|mejora|edicion|creacion> [--repo RUTA] [--tier T] [--solo VISTA] [--agente ninguno|claude] [--pedido TEXTO] [--corrida RUTA_EXISTENTE]`,
  `${NOMBRE} comparar --corrida RUTA [--sin-servidor]`,
].join('\n')
const MODOS = ['correccion', 'limpieza', 'mejora', 'edicion', 'creacion']

function flags(argv) {
  const f = { repo: process.cwd(), tier: 'AA', solo: null, sinServidor: false, sinRuido: false, agente: 'ninguno', pedido: null, corrida: null }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--repo') f.repo = argv[++i]
    else if (a === '--tier') f.tier = argv[++i]
    else if (a === '--solo') f.solo = argv[++i]
    else if (a === '--sin-servidor') f.sinServidor = true
    else if (a === '--sin-ruido') f.sinRuido = true
    else if (a === '--agente') f.agente = argv[++i]
    else if (a === '--pedido') f.pedido = argv[++i]
    else if (a === '--corrida') f.corrida = argv[++i]
    else throw new Error(`flag desconocida: ${a}`)
  }
  if (!['A', 'AA', 'AAA'].includes(f.tier)) throw new Error('--tier debe ser A, AA o AAA')
  return f
}

function sello(d = new Date()) {
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`
}

async function correr(modo, f, modoCorrida = 'auditoria') {
  const info = reconocer(f.repo)
  const { leerPerfil } = await import('../src/proponer/perfil.mjs')
  const lecturas = leerPerfil(info.repo)?.lecturas_permitidas ?? []
  if (lecturas.length) notas_lecturas.push(`lecturas_permitidas: ${lecturas.map((l) => `${l.metodo} ${l.ruta}`).join(', ')}`)
  const dir = join(homedir(), `${NOMBRE}-corridas`, `${info.repo}-${sello()}`)
  mkdirSync(dir, { recursive: true })
  const notas = [...info.notas, ...notas_lecturas.splice(0)]
  if (info.sucio) console.warn(`aviso: ${info.repo} tiene cambios sin commit`)
  const log = (s) => process.stderr.write(s + '\n')
  let vistas = []
  let hallazgos = []
  let cobertura = { impeccable_vivo: [] }
  let servidor = { vivo: false, apagar: async () => {} }
  let previo = { cerrar: async () => {} }
  const recorre = modo !== 'detectar'
  const quiereVivo = !f.sinServidor
  try {
    if (quiereVivo) {
      const { abrirPrevio } = await import('../src/previo.mjs')
      previo = await abrirPrevio(leerPerfil(info.repo)?.previo)
      if (previo.nota) { notas.push(previo.nota); if (previo.nota.startsWith('aviso')) console.warn(previo.nota) }
      const { asegurarServidor } = await import('../src/servidor.mjs')
      servidor = await asegurarServidor({ url: info.url, arranque: info.arranque, repo: info.ruta_repo, logArchivo: join(dir, 'servidor.log'), entorno: leerPerfil(info.repo)?.entorno ?? {} })
      notas.push(servidor.nota)
    } else notas.push('--sin-servidor: sin recorrido vivo')
    // perfil.rutas: monorepos cuyo router no se deduce desde la raiz (p. ej. vite en apps/web).
    const rutasPerfil = leerPerfil(info.repo)?.rutas
    let rutas = Array.isArray(rutasPerfil) && rutasPerfil.length
      ? rutasPerfil.map((ruta) => ({ ruta, dinamica: false, archivo: null, id: idDeRuta(ruta), nombre: ruta === '/' ? 'Inicio' : ruta.replace(/^\//, '') }))
      : descubrirRutas(info.ruta_repo, info.stack.framework)
    if (f.solo) rutas = rutas.filter((r) => r.ruta === f.solo)
    notas.push(`rutas del router: ${rutas.length}`)
    if (recorre) {
      if (servidor.vivo) {
        const { recorrer } = await import('../src/recorrido/navegar.mjs')
        vistas = await recorrer({ url: info.url, rutas, dirCorrida: dir, log, lecturas })
        // Ruido base: segunda captura del mismo arbol. Lo que cambia sin tocar codigo (datos vivos,
        // relojes, carga diferida) queda medido por vista y las guardas lo descuentan.
        if (!f.sinRuido && vistas.length) {
          log('ruido: segunda captura del antes')
          const otra = await recorrer({ url: info.url, rutas: [], dirCorrida: dir, log: () => {}, lecturas, subdir: 'ruido', fijas: vistas })
          const { diferencia } = await import('../src/guardas.mjs')
          for (const v of vistas) {
            const o = otra.find((x) => x.id === v.id)
            v.ruido = {}
            for (const d of ['escritorio', 'movil']) {
              if (v.capturas[d] && o?.capturas?.[d]) v.ruido[d] = Math.round(diferencia(join(dir, v.capturas[d]), join(dir, o.capturas[d])) * 10000) / 100
            }
          }
          const ruidosas = vistas.filter((v) => Math.max(0, ...Object.values(v.ruido || {})) >= 0.5)
          notas.push(`ruido base: ${ruidosas.length} de ${vistas.length} vistas cambian 0,5 % o mas entre dos capturas del mismo arbol${ruidosas.length ? ' (' + ruidosas.map((v) => v.id).slice(0, 8).join(', ') + ')' : ''}`)
        }
      } else {
        vistas = rutas.map((r) => ({ id: r.id, ruta: r.ruta, nombre: r.nombre, tipo: 'pagina', padre: null, origen: 'router', pasos: [], capturas: { escritorio: null, movil: null }, error: 'sin servidor: no capturada' }))
      }
    }
    if (modo !== 'recorrer') {
      const { correrTransitions } = await import('../src/detectar/transitions.mjs')
      const { correrImpeccable } = await import('../src/detectar/impeccable.mjs')
      const { correrChecks } = await import('../src/detectar/checks.mjs')
      log('detectar: transitions'); const t = correrTransitions({ repo: info.ruta_repo, dirCorrida: dir }); notas.push(t.nota)
      const urls = servidor.vivo ? (vistas.length ? vistas.filter((v) => v.tipo === 'pagina' && v.capturas.escritorio) : descubrirRutas(info.ruta_repo, info.stack.framework).filter((r) => !r.dinamica)).map((v) => ({ url: info.url + v.ruta, vista: v.id })) : []
      log(`detectar: impeccable (${urls.length} urls)`); const i = correrImpeccable({ repo: info.ruta_repo, dirCorrida: dir, urls }); notas.push(i.nota); cobertura = { impeccable_vivo: i.escaneadas || [] }
      log('detectar: checks'); const c = await correrChecks({ repo: info.ruta_repo, perfil: info.perfil }); notas.push(c.nota)
      hallazgos = [...t.hallazgos, ...i.hallazgos, ...c.hallazgos].map((h, n) => ({ id: `h-${String(n + 1).padStart(4, '0')}`, ...h }))
    }
  } finally {
    await servidor.apagar()
    await previo.cerrar()
    rmSync(join(dir, 'tmp'), { recursive: true, force: true })
  }
  const corrida = {
    version: 0, repo: info.repo, ruta_repo: info.ruta_repo, rama: info.rama, sha: info.sha, sucio: info.sucio,
    mundo: info.mundo, perfil: info.perfil, modo: modoCorrida, tier: f.tier, stack: info.stack, url: info.url,
    vistas, hallazgos, cobertura, puntaje: puntaje(hallazgos, vistas, { notas }), notas,
  }
  if (modo !== 'auditar') notas.push(`subcomando ${modo}: corrida parcial`)
  writeFileSync(join(dir, 'corrida.json'), JSON.stringify(corrida, null, 2))
  const porFuente = hallazgos.reduce((a, h) => ({ ...a, [h.fuente]: (a[h.fuente] || 0) + 1 }), {})
  const conCaptura = vistas.filter((v) => v.capturas.escritorio && v.capturas.movil).length
  const lineas = [
    `${NOMBRE} ${modo} · ${info.repo} (${info.rama ?? '-'}@${info.sha ?? '-'}${info.sucio ? ', sucio' : ''}) · ${info.mundo}/${info.perfil}`,
    `vistas: ${vistas.length} (${vistas.filter((v) => v.tipo === 'pagina').length} paginas), ${conCaptura} con captura doble, ${vistas.filter((v) => v.error).length} con error`,
    `hallazgos: ${hallazgos.length} ${JSON.stringify(porFuente)}`,
    `puntaje A ${corrida.puntaje.A} · AA ${corrida.puntaje.AA} · AAA ${corrida.puntaje.AAA} (tier pedido ${f.tier}: ${corrida.puntaje[f.tier]})`,
    `servidor: ${servidor.vivo ? (servidor.propio ? 'arrancado y apagado' : 'ya estaba') : 'no disponible'}`,
    `corrida: ${join(dir, 'corrida.json')}`,
  ]
  console.log(lineas.slice(0, 10).join('\n'))
  return { corrida, dir, info }
}
const notas_lecturas = []

function sh(cmd, args) {
  return spawnSync(cmd, args, { encoding: 'utf8' })
}

async function proponer(modo, f) {
  const { resolverPerfil, permiteModo } = await import('../src/perfil.mjs')
  const perfilRepo = resolverPerfil(f.repo)
  if (!permiteModo(perfilRepo, modo)) throw new Error(`${perfilRepo.repo} es ${perfilRepo.perfil}: no permite ${modo}. Modos: ${perfilRepo.modos.join(', ')}`)
  if (modo === 'edicion' && !f.pedido) throw new Error('edicion necesita --pedido TEXTO')
  if (!['ninguno', 'claude'].includes(f.agente)) throw new Error('--agente debe ser ninguno o claude')
  const solo = f.solo; f.solo = null
  // --corrida RUTA reusa una auditoria ya hecha (no recorre de nuevo).
  const { corrida, dir, info } = f.corrida
    ? { corrida: JSON.parse(readFileSync(join(f.corrida, 'corrida.json'), 'utf8')), dir: f.corrida, info: reconocer(f.repo) }
    : await correr('auditar', f, modo)
  corrida.modo = modo; writeFileSync(join(dir, 'corrida.json'), JSON.stringify(corrida, null, 2))
  const { armarPaquetes } = await import('../src/criterio/paquete.mjs')
  const { crearArbol } = await import('../src/proponer/arbol.mjs')
  const { escribirTarea } = await import('../src/proponer/tarea.mjs')
  const paquetes = armarPaquetes(corrida, dir, { modo, tier: f.tier, raiz: info.ruta_repo, solo })
  const rama = `${NOMBRE}/${dir.split('-').slice(-2).join('-')}-${modo}`
  const arbol = crearArbol({ repo: info.ruta_repo, dirCorrida: dir, rama })
  const prop = { modo, tier: f.tier, pedido: f.pedido, solo, arbol: arbol.arbol, rama: arbol.rama, base: arbol.base, notas: arbol.notas, paquetes }
  writeFileSync(join(dir, 'propuesta.json'), JSON.stringify(prop, null, 2))
  const bin = new URL(import.meta.url).pathname
  const tarea = escribirTarea({ dir, modo, tier: f.tier, perfil: corrida.perfil, arbol: arbol.arbol, rama: arbol.rama, base: arbol.base, paquetes, pedido: f.pedido, bin: `node ${bin}` })
  console.log(`paquetes: ${paquetes.length} · arbol ${arbol.arbol} · rama ${arbol.rama}`)
  const frase = `Lee ${tarea} y cumple la tarea completa.`
  if (f.agente === 'claude') {
    const auth = sh('claude', ['-p', 'responde solo: ok', '--max-turns', '1'])
    if (auth.status !== 0 || !/ok/i.test(auth.stdout)) console.log(`claude no responde o no esta autenticado (${(auth.stderr || auth.stdout || '').trim().slice(0, 120)}); sigue como --agente ninguno`)
    else {
      console.log('lanzando claude -p ...')
      const r = spawnSync('claude', ['-p', frase, '--add-dir', arbol.arbol, '--add-dir', dir, '--permission-mode', 'acceptEdits'], { stdio: 'inherit', cwd: arbol.arbol })
      console.log(`claude termino (exit ${r.status})`)
      return
    }
  }
  console.log(`tarea: ${tarea}`)
  console.log(`pega en tu agente: ${frase}`)
}

async function compararCmd(f) {
  if (!f.corrida) throw new Error('comparar necesita --corrida RUTA')
  const { comparar } = await import('../src/proponer/comparar.mjs')
  const r = await comparar({ dir: f.corrida, log: (s) => process.stderr.write(s + '\n'), sinServidor: f.sinServidor })
  const t = r.antes.tier
  const aplicados = r.criterios.criterios.filter((c) => c.estado === 'aplicado').length
  console.log([
    `${NOMBRE} comparar · ${r.antes.repo}`,
    `criterios: ${r.criterios.criterios.length} (${aplicados} aplicados)${r.criterios.errores.length ? `, ${r.criterios.errores.length} errores de formato` : ''}`,
    `hallazgos: ${r.antes.hallazgos.length} -> ${r.despues.hallazgos.length}`,
    `puntaje ${t}: ${r.antes.puntaje[t]} -> ${r.despues.puntaje[t]} · A ${r.antes.puntaje.A} -> ${r.despues.puntaje.A} · AAA ${r.antes.puntaje.AAA} -> ${r.despues.puntaje.AAA}`,
    `guardas: ${r.guardas.ok ? 'ok' : 'no ok'} · ${(r.guardas.motivos || []).join('; ')}`,
    `servidor del arbol: ${r.servidor}`,
    `informe: ${r.informe}`,
  ].join('\n'))
}

const [cmd, ...resto] = process.argv.slice(2)
try {
  if (['recorrer', 'detectar', 'auditar'].includes(cmd)) await correr(cmd, flags(resto))
  else if (MODOS.includes(cmd)) await proponer(cmd, flags(resto))
  else if (cmd === 'comparar') await compararCmd(flags(resto))
  else { console.log(AYUDA); process.exitCode = cmd ? 1 : 0 }
} catch (e) { console.error(`${NOMBRE}: ${e.message}`); process.exitCode = 1 }
