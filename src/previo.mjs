// Requisitos previos del repo (perfil.previo): por ejemplo un tunel ssh a la base de desarrollo.
// perfil.previo = { nombre, puerto, comando }. Si el puerto ya escucha, no se toca ni se cierra.
// Si no, corre el comando, espera el puerto y al final cierra solo lo que abrio.
import { spawnSync } from 'node:child_process'
import { connect } from 'node:net'

export function puertoAbierto(puerto, ms = 1500) {
  return new Promise((res) => {
    const s = connect({ host: '127.0.0.1', port: puerto })
    const fin = (v) => { s.destroy(); res(v) }
    s.setTimeout(ms, () => fin(false))
    s.once('connect', () => fin(true))
    s.once('error', () => fin(false))
  })
}

function pidsEscuchando(puerto) {
  const r = spawnSync('lsof', ['-tiTCP:' + puerto, '-sTCP:LISTEN'], { encoding: 'utf8' })
  return (r.stdout || '').split('\n').map(Number).filter(Boolean)
}

export async function abrirPrevio(previo) {
  const nada = { nota: null, cerrar: async () => {} }
  if (!previo?.puerto || !previo?.comando) return nada
  const nombre = previo.nombre || `puerto ${previo.puerto}`
  if (await puertoAbierto(previo.puerto)) return { nota: `${nombre}: ya estaba abierto, no se toca`, cerrar: async () => {} }
  const r = spawnSync('/bin/sh', ['-c', previo.comando], { encoding: 'utf8', timeout: 30000 })
  const limite = Date.now() + 20000
  while (Date.now() < limite && !(await puertoAbierto(previo.puerto))) await new Promise((x) => setTimeout(x, 500))
  if (!(await puertoAbierto(previo.puerto))) {
    const err = String(r.stderr || r.error?.message || '').trim().split('\n')[0].slice(0, 160)
    return { nota: `aviso: ${nombre} no abrio (${err || 'sin salida'}); las vistas que dependen de el saldran con error`, cerrar: async () => {} }
  }
  const pids = pidsEscuchando(previo.puerto)
  return {
    nota: `${nombre}: abierto para la corrida (pid ${pids.join(',') || '?'}) y cerrado al final`,
    cerrar: async () => { for (const p of pids) { try { process.kill(p, 'SIGTERM') } catch {} } },
  }
}
