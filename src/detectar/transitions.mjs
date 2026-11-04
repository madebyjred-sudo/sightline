import { spawnSync } from 'node:child_process'
import { mkdirSync } from 'node:fs'
import { join, resolve } from 'node:path'

const BIN = resolve(new URL('../../vendor/transitions-agent/bin/transitions-agent.mjs', import.meta.url).pathname)

export function mapearTransitions(salida) {
  return (salida?.findings || []).map((f) => ({
    regla: `transitions:${f.rule}`,
    fuente: 'transitions',
    severidad: ['major', 'warn', 'minor', 'info'].includes(f.severity) ? f.severity : 'info',
    tier: 'A',
    archivo: f.path ?? null,
    linea: f.line ?? null,
    vista: null,
    fragmento: f.selector ? (f.props?.length ? `${f.selector} { ${f.props.join(', ')} }` : f.selector) : null,
    mensaje: (f.message || '').split('\n')[0],
  }))
}

export function correrTransitions({ repo, dirCorrida }) {
  const home = join(dirCorrida, 'tmp', 'home-transitions')
  mkdirSync(home, { recursive: true })
  const r = spawnSync(process.execPath, [BIN, 'scan', '--json'], { cwd: repo, env: { ...process.env, HOME: home }, encoding: 'utf8', maxBuffer: 64 << 20, timeout: 180000 })
  let salida
  try { salida = JSON.parse(r.stdout.slice(r.stdout.indexOf('{'))) }
  catch { return { hallazgos: [], nota: `transitions fallo (exit ${r.status}): ${(r.stderr || '').slice(0, 200)}` } }
  return { hallazgos: mapearTransitions(salida), nota: `transitions ${salida.version}: ${salida.findings.length} hallazgos, score propio ${salida.score}`, crudo: salida }
}
