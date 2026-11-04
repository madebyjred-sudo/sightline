// informe.html autocontenido: antes, criterio y despues por vista. Imagenes relativas a la corrida.
import { writeFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])).replace(/\u2014/g, ',')
const TIERS = ['A', 'AA', 'AAA']

const CSS = `
*{box-sizing:border-box}
body{margin:0;background:#fafafa;color:#1d1d1f;font:15px/1.5 -apple-system,BlinkMacSystemFont,"Inter","Segoe UI",sans-serif}
main{max-width:1180px;margin:0 auto;padding:48px 24px 96px}
h1{font-size:24px;font-weight:600;margin:0 0 4px}
h2{font-size:18px;font-weight:600;margin:0 0 12px}
h3{font-size:14px;font-weight:600;margin:20px 0 8px;color:#6e6e73}
p{margin:0 0 8px}
.meta{color:#6e6e73;margin-bottom:32px}
table{width:100%;border-collapse:collapse;font-size:14px}
th,td{text-align:left;padding:8px 10px;border-bottom:1px solid #e5e5ea;vertical-align:top}
th{font-weight:600;color:#6e6e73}
td.n{text-align:right;font-variant-numeric:tabular-nums}
a{color:#1d1d1f}
section{background:#fff;border:1px solid #e5e5ea;border-radius:8px;padding:24px;margin-top:24px}
.par{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.movil{display:grid;grid-template-columns:repeat(2,minmax(0,220px));gap:12px}
figure{margin:0}
figcaption{font-size:13px;color:#6e6e73;margin-bottom:4px}
img{width:100%;border:1px solid #e5e5ea;border-radius:4px;display:block}
.vacio{border:1px dashed #d2d2d7;border-radius:4px;padding:24px;color:#6e6e73;font-size:13px}
.sube{color:#1a7f37}.baja{color:#c0362c}
.descartado td{color:#86868b}
`

function img(rel, dir, alt) {
  if (rel && existsSync(join(dir, rel))) return `<img src="${esc(rel)}" alt="${esc(alt)}" loading="lazy">`
  return `<div class="vacio">Sin captura</div>`
}

function delta(a, d) {
  if (a == null || d == null) return '-'
  const x = Math.round((d - a) * 10) / 10
  return `<span class="${x > 0 ? 'sube' : x < 0 ? 'baja' : ''}">${x > 0 ? '+' : ''}${x}</span>`
}

export function htmlInforme({ dir, antes, despues, criterios = [], guardas = {}, propuesta = {}, commits = [] }) {
  const tier = propuesta.tier ?? antes.tier
  const pv = (c, id) => c?.puntaje?.por_vista?.[id] ?? null
  const dv = new Map((despues?.vistas ?? []).map((v) => [v.id, v]))
  const filas = antes.vistas.map((v) => {
    const a = pv(antes, v.id)?.[tier], d = pv(despues, v.id)?.[tier]
    const n = criterios.filter((c) => c.vista === v.id).length
    return `<tr><td><a href="#${esc(v.id)}">${esc(v.id)}</a></td><td class="n">${n}</td><td class="n">${a ?? '-'}</td><td class="n">${d ?? '-'}</td><td class="n">${delta(a, d)}</td></tr>`
  }).join('')
  const global = TIERS.map((t) => `<tr><td>${t}</td><td class="n">${antes.puntaje?.[t] ?? '-'}</td><td class="n">${despues?.puntaje?.[t] ?? '-'}</td><td class="n">${delta(antes.puntaje?.[t], despues?.puntaje?.[t])}</td></tr>`).join('')
  const secciones = antes.vistas.map((v) => {
    const w = dv.get(v.id) ?? { capturas: {} }
    const cs = criterios.filter((c) => c.vista === v.id)
    const pa = pv(antes, v.id), pd = pv(despues, v.id)
    const pts = pa || pd ? `<table><tr><th>Tier</th><th>Antes</th><th>Después</th><th>Delta</th></tr>${TIERS.map((t) => `<tr><td>${t}</td><td class="n">${pa?.[t] ?? '-'}</td><td class="n">${pd?.[t] ?? '-'}</td><td class="n">${delta(pa?.[t], pd?.[t])}</td></tr>`).join('')}</table>` : ''
    const crit = cs.length ? `<table><tr><th>Criterio</th><th>Regla y fuente</th><th>UX</th><th>DX</th><th>AX</th><th>Estado</th></tr>${cs.map((c) => `<tr class="${esc(c.estado)}"><td>${esc(c.criterio)}</td><td>${esc(c.regla)}<br>${esc(c.por_que)}</td><td>${esc(c.ux)}</td><td>${esc(c.dx)}</td><td>${esc(c.ax)}</td><td>${esc(c.estado)}${c.motivo_descarte ? `<br>${esc(c.motivo_descarte)}` : ''}</td></tr>`).join('')}</table>` : '<p class="meta">Sin criterios.</p>'
    const pix = guardas.por_vista?.[v.id]
    return `<section id="${esc(v.id)}"><h2>${esc(v.id)}</h2>
<p class="meta">${esc(v.ruta)} · ${esc(v.tipo)}${v.error ? ` · antes: ${esc(v.error)}` : ''}${w.error ? ` · después: ${esc(w.error)}` : ''}${pix ? ` · píxeles distintos ${esc(JSON.stringify(pix))}` : ''}</p>
<h3>Escritorio</h3><div class="par"><figure><figcaption>Antes</figcaption>${img(v.capturas?.escritorio, dir, 'antes escritorio')}</figure><figure><figcaption>Después</figcaption>${img(w.capturas?.escritorio, dir, 'después escritorio')}</figure></div>
<h3>Móvil</h3><div class="movil"><figure><figcaption>Antes</figcaption>${img(v.capturas?.movil, dir, 'antes móvil')}</figure><figure><figcaption>Después</figcaption>${img(w.capturas?.movil, dir, 'después móvil')}</figure></div>
<h3>Criterios</h3>${crit}${pts ? `<h3>Puntaje</h3>${pts}` : ''}</section>`
  }).join('\n')
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(antes.repo)} · ${esc(propuesta.modo ?? '')}</title><style>${CSS}</style></head><body><main>
<h1>${esc(antes.repo)} · ${esc(propuesta.modo ?? '')} ${esc(tier)}</h1>
<p class="meta">${esc(antes.rama)}@${esc(antes.sha)} · rama ${esc(propuesta.rama ?? '-')} · ${commits.length} commits · guardas ${guardas.ok ? 'ok' : 'no ok'}${guardas.build ? ` · build ${esc(guardas.build)}` : ''}${(guardas.motivos ?? []).length ? ` · ${esc(guardas.motivos.join('; '))}` : ''}</p>
<table><tr><th>Tier</th><th>Antes</th><th>Después</th><th>Delta</th></tr>${global}</table>
<h3>Vistas</h3>
<table><tr><th>Vista</th><th>Criterios</th><th>Antes ${esc(tier)}</th><th>Después ${esc(tier)}</th><th>Delta</th></tr>${filas}</table>
${secciones}
</main></body></html>`
}

export function escribirInforme(o) {
  const f = join(o.dir, 'informe.html')
  writeFileSync(f, htmlInforme(o))
  return f
}
