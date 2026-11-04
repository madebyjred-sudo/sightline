import { spawnSync } from 'node:child_process'
import { mkdirSync, existsSync, readdirSync } from 'node:fs'
import { join, relative, isAbsolute } from 'node:path'
import { chromium } from 'playwright'

// Severidad de impeccable -> escala de la ESPEC (supuesto declarado: advisory = minor).
const SEV = { error: 'major', critical: 'major', warning: 'warn', advisory: 'minor', info: 'info' }

export function mapearImpeccable(lista, { raiz = null, vista = null } = {}) {
  return (Array.isArray(lista) ? lista : lista?.findings || []).map((f) => {
    const a11y = /a11y|accessib|contrast/i.test(`${f.category} ${f.antipattern}`)
    let archivo = f.file ?? f.url ?? null
    if (archivo && raiz && isAbsolute(archivo)) archivo = relative(raiz, archivo)
    return {
      regla: `impeccable:${f.antipattern}`,
      fuente: 'impeccable',
      severidad: SEV[f.severity] ?? (f.advisory ? 'minor' : 'warn'),
      tier: a11y ? 'A' : 'AA',
      archivo,
      linea: f.line ?? null,
      vista,
      fragmento: f.snippet ?? null,
      mensaje: f.name ? `${f.name}${f.category ? ` (${f.category})` : ''}` : (f.description || '').split('.')[0],
    }
  })
}

function npx(args, { cwd, dir }) {
  const env = { ...process.env, HOME: join(dir, 'home'), npm_config_cache: join(dir, 'npm-cache'), npm_config_update_notifier: 'false',
    PUPPETEER_EXECUTABLE_PATH: chromium.executablePath(), PUPPETEER_SKIP_DOWNLOAD: '1',
    NODE_OPTIONS: [process.env.NODE_OPTIONS, '--dns-result-order=ipv4first'].filter(Boolean).join(' ') }
  const r = spawnSync('npx', ['-y', 'impeccable@latest', 'detect', '--json', ...args], { cwd, env, encoding: 'utf8', maxBuffer: 64 << 20, timeout: 300000 })
  if (r.status !== 0 && r.status !== 2) return { error: `exit ${r.status}: ${(r.stderr || r.error?.message || '').trim().split('\n').slice(-2).join(' ').slice(0, 240)}` }
  try { const s = r.stdout; return { datos: JSON.parse(s.slice(Math.min(...['[', '{'].map((c) => s.indexOf(c)).filter((i) => i >= 0)))) } }
  catch { return { error: `salida no JSON (exit ${r.status})` } }
}

const CARPETAS = ['app', 'components', 'packages/ui/src', 'src', 'pages']
const CODIGO = /\.(tsx|jsx|ts|js|css|scss|html|vue|svelte)$/

function tieneCodigo(dir) {
  try { for (const e of readdirSync(dir, { withFileTypes: true, recursive: true })) if (e.isFile() && CODIGO.test(e.name) && !e.parentPath?.includes('node_modules')) return true } catch {}
  return false
}

/** urls: [{url, vista}] de las paginas que rindieron (puede ir vacio). */
export function correrImpeccable({ repo, dirCorrida, urls = [] }) {
  const dir = join(dirCorrida, 'tmp', 'impeccable')
  mkdirSync(dir, { recursive: true })
  const notas = []
  const hallazgos = []
  const carpetas = CARPETAS.filter((c) => existsSync(join(repo, c)) && tieneCodigo(join(repo, c)))
  if (carpetas.length) {
    const r = npx(carpetas, { cwd: repo, dir })
    if (r.error) notas.push(`impeccable codigo (${carpetas.join(' ')}): ${r.error}`)
    else { const h = mapearImpeccable(r.datos, { raiz: repo }); hallazgos.push(...h); notas.push(`impeccable codigo (${carpetas.join(' ')}): ${h.length} hallazgos`) }
  } else notas.push('impeccable: ninguna carpeta de codigo conocida')
  let vivos = 0, fallos = 0
  const escaneadas = []
  for (const { url, vista } of urls) {
    const r = npx([url], { cwd: dir, dir })
    if (r.error) { fallos++; if (fallos <= 2) notas.push(`impeccable url ${url}: ${r.error}`); continue }
    const h = mapearImpeccable(r.datos, { vista }); vivos += h.length; hallazgos.push(...h)
    escaneadas.push(vista)
  }
  if (urls.length) notas.push(`impeccable vivo: ${urls.length - fallos}/${urls.length} urls escaneadas, ${vivos} hallazgos`)
  return { hallazgos, nota: notas.join(' ; '), escaneadas }
}
