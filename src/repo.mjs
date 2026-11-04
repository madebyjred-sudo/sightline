import { resolverPerfil } from './perfil.mjs'
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join, basename, resolve } from 'node:path'
import { homedir } from 'node:os'

const RAIZ_TASTE = resolve(new URL('..', import.meta.url).pathname)

function git(repo, args) {
  try { return execFileSync('git', ['-C', repo, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim() }
  catch { return null }
}

function leerJson(f) { try { return JSON.parse(readFileSync(f, 'utf8')) } catch { return null } }

export function framework(repo) {
  const pkg = leerJson(join(repo, 'package.json')) || {}
  const deps = { ...pkg.dependencies, ...pkg.devDependencies }
  const hay = (p) => existsSync(join(repo, p))
  if (deps.next) {
    if (hay('app') || hay('src/app')) return 'next-app'
    return 'next-pages'
  }
  if (deps['react-router'] || deps['react-router-dom'] || deps['@remix-run/react']) return 'react-router'
  if (deps.vite && deps.react) return 'vite-react'
  return 'html'
}

export function stack(repo) {
  const pkg = leerJson(join(repo, 'package.json')) || {}
  const deps = { ...pkg.dependencies, ...pkg.devDependencies }
  const tailwind = Boolean(deps.tailwindcss || deps['@tailwindcss/postcss'] ||
    ['tailwind.config.js', 'tailwind.config.ts', 'tailwind.config.mjs', 'tailwind.config.cjs'].some((f) => existsSync(join(repo, f))))
  const paquetes = (() => { try { return readdirSync(join(repo, 'packages')).map((p) => join('packages', p)) } catch { return [] } })()
  const shadcn = ['', 'src', 'apps/web', ...paquetes].some((d) => existsSync(join(repo, d, 'components.json')))
  const tokens = ['tokens', 'src/tokens', 'styles/tokens', 'app/tokens', 'packages/ui/src/tokens', 'packages/tokens', 'design-tokens']
    .filter((d) => existsSync(join(repo, d)))
  return { framework: framework(repo), tailwind, shadcn, tokens }
}

// Mundo por ruta: sin tabla de nombres. El mundo sale del perfil (perfiles/REPO.json, campo mundo);
// sin perfil queda null y reconocer() asume personal.
export function mundoPorRuta() {
  return null
}

export function reconocer(repoArg) {
  const repo = resolve(repoArg)
  const nombre = basename(repo)
  const porcelain = git(repo, ['status', '--porcelain'])
  const perfilArchivo = join(RAIZ_TASTE, 'perfiles', `${nombre}.json`)
  const perfil = leerJson(perfilArchivo)
  const notas = []
  let mundo = perfil?.mundo ?? mundoPorRuta(repo)
  if (!mundo) { mundo = 'personal'; notas.push(`mundo no reconocido para ${nombre}: se asume personal (conservador, no lee biblioteca shift)`) }
  // Un solo resolvedor de perfil (src/perfil.mjs): repo desconocido = estricto, el conservador.
  const perfilNombre = resolverPerfil(repo).perfil
  if (!perfil) notas.push(`sin perfiles/${nombre}.json: url y arranque por defecto`)
  const sucio = porcelain === null ? false : porcelain.length > 0
  if (porcelain === null) notas.push('no es repo git: rama y sha nulos')
  if (sucio) notas.push(`repo sucio: ${porcelain.split('\n').length} cambios sin commit; la corrida audita el arbol de trabajo`)
  return {
    repo: nombre, ruta_repo: repo,
    rama: git(repo, ['branch', '--show-current']) || null,
    sha: git(repo, ['rev-parse', '--short', 'HEAD']) || null,
    sucio, mundo, perfil: perfilNombre,
    stack: stack(repo),
    url: perfil?.url ?? 'http://localhost:3000',
    arranque: perfil?.arranque ?? 'npm run dev',
    notas,
  }
}
