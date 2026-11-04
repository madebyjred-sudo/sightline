import { spawn } from 'node:child_process'
import { openSync, closeSync } from 'node:fs'

export async function responde(url, ms = 3000) {
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(ms), redirect: 'manual' })
    return r.status > 0
  } catch { return false }
}

/**
 * Si la url ya responde, no arranca nada (y tampoco lo apaga al final).
 * Si no, corre `arranque` en el repo, espera con tope y devuelve apagar().
 */
export async function asegurarServidor({ url, arranque, repo, logArchivo, tope = 120000, entorno = {} }) {
  if (await responde(url)) return { vivo: true, propio: false, apagar: async () => {}, nota: `servidor ya escuchando en ${url}: no se arranca ni se apaga` }
  const fd = openSync(logArchivo, 'a')
  const hijo = spawn('/bin/sh', ['-c', `exec ${arranque}`], { cwd: repo, detached: true, stdio: ['ignore', fd, fd], env: { ...process.env, BROWSER: 'none', ...entorno } })
  closeSync(fd)
  const apagar = async () => {
    if (hijo.exitCode !== null) return
    try { process.kill(-hijo.pid, 'SIGTERM') } catch {}
    const fin = Date.now() + 8000
    while (hijo.exitCode === null && hijo.signalCode === null && Date.now() < fin) await new Promise((r) => setTimeout(r, 200))
    if (hijo.exitCode === null && hijo.signalCode === null) { try { process.kill(-hijo.pid, 'SIGKILL') } catch {} }
  }
  const limite = Date.now() + tope
  while (Date.now() < limite) {
    if (hijo.exitCode !== null) break
    if (await responde(url, 5000)) return { vivo: true, propio: true, pid: hijo.pid, apagar, nota: `servidor arrancado (${arranque}, pid ${hijo.pid}); se apaga al final` }
    await new Promise((r) => setTimeout(r, 1000))
  }
  await apagar()
  return { vivo: false, propio: true, apagar: async () => {}, nota: `servidor no levanto en ${tope / 1000}s (${arranque}); corrida solo estatica` }
}
