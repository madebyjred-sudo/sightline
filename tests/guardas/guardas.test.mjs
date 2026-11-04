import { test } from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, chmodSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { PNG } from 'pngjs'
import { revisar, diferencia } from '../../src/guardas.mjs'
import { puntajeDeCorrida, puntaje, aprueba } from '../../src/puntaje.mjs'
import { resolverPerfil, permiteModo } from '../../src/perfil.mjs'

const tmp = () => mkdtempSync(join(tmpdir(), 'sightline-guardas-'))
const git = (d, ...a) => execFileSync('git', ['-C', d, ...a], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()

function png(f, w, h, pinta = () => false) {
  const p = new PNG({ width: w, height: h })
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = (w * y + x) << 2, on = pinta(x, y)
    p.data[i] = on ? 255 : 240; p.data[i + 1] = on ? 0 : 240; p.data[i + 2] = on ? 0 : 240; p.data[i + 3] = 255
  }
  writeFileSync(f, PNG.sync.write(p))
}

// Corrida falsa con capturas en dir/capturas/{antes,despues}.
function corridas(vistasCambio = {}) {
  const dir = tmp()
  mkdirSync(join(dir, 'capturas/antes'), { recursive: true }); mkdirSync(join(dir, 'capturas/despues'), { recursive: true })
  const vistas = (lado) => ['inicio', 'ajustes'].map((id) => {
    png(join(dir, `capturas/${lado}/${id}-escritorio.png`), 100, 100, lado === 'despues' ? vistasCambio[id] || (() => false) : () => false)
    return { id, tipo: 'pagina', capturas: { escritorio: `capturas/${lado}/${id}-escritorio.png` } }
  })
  const base = { tier: 'AA', hallazgos: [], stack: { tokens: [] } }
  return { dir, antes: { ...base, vistas: vistas('antes') }, despues: { ...base, vistas: vistas('despues') } }
}

// Repo falso con tsc falso: emite un error TS por cada linea con "ROTO" en src/*.ts.
function repo() {
  const d = tmp()
  git(d, 'init', '-q'); git(d, 'config', 'user.email', 't@t'); git(d, 'config', 'user.name', 't')
  mkdirSync(join(d, 'src/components'), { recursive: true }); mkdirSync(join(d, 'src/tokens'), { recursive: true })
  writeFileSync(join(d, 'src/app.ts'), 'export const a = 1 // ROTO heredado\n')
  writeFileSync(join(d, 'src/Panel.tsx'), 'export const Panel = () => <p>Ayuda: haz clic aquí para continuar</p>\n')
  writeFileSync(join(d, 'src/tokens/colores.css'), ':root { --brand: 10 90% 50%; }\n')
  writeFileSync(join(d, 'tsconfig.json'), '{}\n')
  writeFileSync(join(d, '.gitignore'), 'node_modules\n')
  git(d, 'add', '.'); git(d, 'commit', '-qm', 'base')
  const nm = join(d, 'node_modules/.bin'); mkdirSync(nm, { recursive: true })
  writeFileSync(join(nm, 'tsc'), `#!/usr/bin/env node
const fs=require('fs'),p=require('path');let n=0
for(const f of fs.readdirSync('src')){if(!f.endsWith('.ts'))continue;fs.readFileSync(p.join('src',f),'utf8').split('\\n').forEach((l,i)=>{if(l.includes('ROTO')){n++;console.log('src/'+f+'('+(i+1)+',1): error TS2322: '+l.trim())}})}
process.exit(n?2:0)
`)
  chmodSync(join(nm, 'tsc'), 0o755)
  return { d, base: git(d, 'rev-parse', 'HEAD') }
}

test('PNG iguales dan 0 y tamanos distintos cuentan como cambio total', () => {
  const d = tmp()
  png(join(d, 'a.png'), 50, 50); png(join(d, 'b.png'), 50, 50); png(join(d, 'c.png'), 60, 50)
  assert.equal(diferencia(join(d, 'a.png'), join(d, 'b.png')), 0)
  assert.equal(diferencia(join(d, 'a.png'), join(d, 'c.png')), 1)
})

test('vista no tocada que cambia se rechaza (ambos perfiles)', async () => {
  const c = corridas({ ajustes: (x, y) => x < 20 && y < 20 }) // 4 % en ajustes
  for (const perfil of ['libre', 'estricto']) {
    const r = await revisar(c.antes, c.despues, perfil, { tocadas: ['inicio'], corrida: c.dir })
    assert.equal(r.ok, false)
    assert.equal(r.por_vista.ajustes.escritorio, 4)
    assert.match(r.motivos.join(' '), /ajustes .*no estaba entre las tocadas/)
  }
})

test('estricto: vista tocada sobre el presupuesto se rechaza, libre pasa', async () => {
  const c = corridas({ inicio: (x, y) => y < 40 }) // 40 %
  assert.equal((await revisar(c.antes, c.despues, 'estricto', { tocadas: ['inicio'], corrida: c.dir })).ok, false)
  assert.equal((await revisar(c.antes, c.despues, 'libre', { tocadas: ['inicio'], corrida: c.dir })).ok, true)
})

test('estricto que toca un archivo de tokens se rechaza', async () => {
  const { d, base } = repo()
  writeFileSync(join(d, 'src/tokens/colores.css'), ':root { --brand: 200 90% 50%; }\n')
  const r = await revisar(null, null, 'estricto', { arbol: d, base })
  assert.equal(r.ok, false)
  assert.match(r.motivos[0], /tokens en src\/tokens\/colores\.css/)
})

test('estricto que agrega un componente se rechaza', async () => {
  const { d, base } = repo()
  writeFileSync(join(d, 'src/components/Nuevo.tsx'), 'export const Nuevo = () => null\n')
  const r = await revisar(null, null, 'estricto', { arbol: d, base })
  assert.equal(r.ok, false)
  assert.match(r.motivos.join(' '), /componente nuevo \(src\/components\/Nuevo\.tsx\)/)
})

test('ambos perfiles rechazan cambios fuera de interfaz', async () => {
  const { d, base } = repo()
  writeFileSync(join(d, '.env'), 'X=1\n'); git(d, 'add', '-f', '.env')
  const r = await revisar(null, null, 'libre', { arbol: d, base, build: false })
  assert.equal(r.ok, false)
  assert.match(r.motivos[0], /no es interfaz/)
})

test('libre que limpia un texto pasa; error de tipos heredado no se culpa', async () => {
  const { d, base } = repo()
  writeFileSync(join(d, 'src/Panel.tsx'), 'export const Panel = () => <p>Continuar</p>\n')
  git(d, 'commit', '-qam', 'limpia texto')
  const c = corridas()
  const r = await revisar(c.antes, c.despues, 'libre', { arbol: d, base, tocadas: ['inicio'], corrida: c.dir })
  assert.equal(r.build, 'ok', JSON.stringify(r.detalle_build))
  assert.equal(r.detalle_build.heredados, 1)
  assert.equal(r.ok, true, r.motivos.join(' | '))
  assert.equal(git(d, 'worktree', 'list').split('\n').length, 1) // worktree temporal borrado
})

test('error de tipos nuevo si se culpa', async () => {
  const { d, base } = repo()
  writeFileSync(join(d, 'src/otro.ts'), 'export const b = 2 // ROTO nuevo\n')
  const r = await revisar(null, null, 'libre', { arbol: d, base })
  assert.equal(r.build, 'falla')
  assert.equal(r.detalle_build.nuevos.length, 1)
})

test('el puntaje del tier no puede bajar', async () => {
  const c = corridas()
  c.despues.hallazgos = [{ regla: 'x', severidad: 'warn', tier: 'A', vista: null }]
  const r = await revisar(c.antes, c.despues, 'libre', { corrida: c.dir })
  assert.equal(r.ok, false)
  assert.match(r.motivos.join(' '), /puntaje AA baja de 100 a 98/)
})

const ONE = process.env.SIGHTLINE_CORRIDA_REAL ?? ''
test('puntaje v1 sobre una corrida real da entre 1 y 99', { skip: !existsSync(ONE) && 'sin corrida real (SIGHTLINE_CORRIDA_REAL)' }, () => {
  const c = JSON.parse(readFileSync(ONE, 'utf8'))
  assert.equal(c.hallazgos.length, 529)
  const p = puntajeDeCorrida(c)
  for (const t of ['A', 'AA', 'AAA']) assert.ok(p[t] >= 1 && p[t] <= 99, `${t}=${p[t]}`)
  assert.deepEqual([p.A, p.AA, p.AAA], [72.5, 61.1, 61.1])
  assert.equal(p.referencias.transitions, 19)
  // sube si se arregla, baja si aparece
  const menos = puntajeDeCorrida({ ...c, hallazgos: c.hallazgos.filter((h) => h.regla !== c.hallazgos.find((x) => !x.vista && x.tier === 'A' && x.severidad === 'major').regla) })
  assert.ok(menos.A > p.A)
  const mas = puntajeDeCorrida({ ...c, hallazgos: [...c.hallazgos, { regla: 'nueva', severidad: 'warn', tier: 'A', vista: null }] })
  assert.ok(mas.A < p.A)
  assert.equal(aprueba(c, 'A').ok, false)
})

test('puntaje v1 no premia descubrir menos vistas', () => {
  const cod = [...Array(10)].map((_, i) => ({ regla: `r${i}`, severidad: 'warn', tier: 'A', vista: null }))
  const v = (id) => ({ id, tipo: 'pagina' })
  const pocas = puntaje([...cod, { regla: 'q', severidad: 'major', tier: 'A', vista: 'a' }], [v('a')])
  const muchas = puntaje([...cod, { regla: 'q', severidad: 'major', tier: 'A', vista: 'a' }], [v('a'), v('b'), v('c')])
  assert.ok(pocas.A <= muchas.A)
  assert.ok(puntaje(cod, []).A <= muchas.A)
})

test('perfiles: archivo y conservador', () => {
  const u = resolverPerfil('/a/cosa-rara')
  assert.deepEqual([u.perfil, u.mundo, u.origen], ['estricto', 'personal', 'conservador'])
  assert.equal(permiteModo(u, 'creacion'), false); assert.equal(permiteModo('libre', 'creacion'), true)
  assert.equal(resolverPerfil('/a/sitio').perfil, 'libre')
})
