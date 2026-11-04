// Arbol de la propuesta: clon local con rama propia. Nunca toca el repo analizado.
import { execFileSync } from 'node:child_process'
import { existsSync, symlinkSync, copyFileSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const git = (cwd, args) => execFileSync('git', ['-C', cwd, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim()

export function crearArbol({ repo, dirCorrida, rama }) {
  const arbol = join(dirCorrida, 'arbol')
  const notas = []
  // --no-hardlinks: la corrida vive en otro disco (TERA) y los hardlinks fallan entre volumenes.
  if (!existsSync(arbol)) execFileSync('git', ['clone', '--local', '--no-hardlinks', '--quiet', repo, arbol], { stdio: ['ignore', 'pipe', 'pipe'] })
  // Sin remoto: un push por error no puede llegar al original.
  try { git(arbol, ['remote', 'remove', 'origin']) } catch {}
  const actual = git(arbol, ['branch', '--show-current'])
  if (actual !== rama) git(arbol, ['checkout', '-q', '-b', rama])
  git(arbol, ['config', 'user.name', 'sightline']); git(arbol, ['config', 'user.email', 'sightline@localhost'])
  const base = git(arbol, ['rev-parse', '--short', 'HEAD'])
  const nm = ['', ...(() => { try { return readdirSync(join(repo, 'packages')).map((p) => join('packages', p)) } catch { return [] } })()]
  for (const d of nm) {
    const o = join(repo, d, 'node_modules'), c = join(arbol, d, 'node_modules')
    if (existsSync(o) && !existsSync(c) && existsSync(join(arbol, d))) { symlinkSync(o, c); notas.push(`node_modules enlazado: ${d || '.'}`) }
  }
  for (const f of ['.env.local', '.env']) if (existsSync(join(repo, f)) && !existsSync(join(arbol, f))) { copyFileSync(join(repo, f), join(arbol, f)); notas.push(`copiado ${f}`) }
  return { arbol, rama, base, notas }
}

// Arranque del arbol en puerto + 1: sustituye el puerto en el comando o en el script de npm.
export function arranqueEnPuerto({ arranque, url, arbol, puerto }) {
  const viejo = new URL(url).port || '80'
  const m = /^npm run (\S+)$/.exec(arranque.trim())
  let cmd = arranque
  if (m) {
    const pkg = JSON.parse(readFileSync(join(arbol, 'package.json'), 'utf8'))
    cmd = pkg.scripts?.[m[1]] ?? arranque
    // servidor.mjs hace `exec CMD`: las variables van con env, no como prefijo.
    if (pkg.scripts?.[m[1]]) cmd = `env PATH="${join(arbol, 'node_modules', '.bin')}:$PATH" ${cmd}`
  }
  if (cmd.includes(viejo)) return cmd.split(viejo).join(String(puerto))
  return cmd.startsWith('env ') ? cmd.replace(/^env /, `env PORT=${puerto} `) : `env PORT=${puerto} ${cmd}`
}

export function commitsDeRama(arbol, base) {
  try { return git(arbol, ['log', '--oneline', `${base}..HEAD`]).split('\n').filter(Boolean) } catch { return [] }
}
