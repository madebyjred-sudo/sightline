// mapa.html autocontenido de una auditoria: la tira vertical de cada vista (donde golpea y donde
// condensa), el puntaje de cada seccion y sus componentes mas debiles, y los hallazgos de composicion.
import { writeFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))

// Un color por rol, en la paleta de Sightline: el golpe en tinta, lo condensado en grafito, lo que falta
// decidir en amarillo, que es donde hay que mirar.
const ROL = {
  golpe: '#232426', 'golpe suave': '#53565a', condensado: '#8b8e92', 'condensado suave': '#b9bbbd',
  saturado: '#5f6266', 'sin decidir': '#ffcd00',
}

function tira(mapa, alto) {
  const H = 420, W = 64
  const k = H / Math.max(1, alto)
  const bloques = mapa.secciones.map((s) => {
    const y = Math.round(s.caja.y * k), h = Math.max(2, Math.round(s.caja.h * k))
    const ancho = Math.round(18 + 46 * s.fuerza)
    return `<rect x="0" y="${y}" width="${ancho}" height="${h - 1}" rx="2" fill="${ROL[s.rol] || '#ccc'}"><title>${esc(s.etiqueta)} · ${esc(s.rol)} · fuerza ${s.fuerza} · densidad ${s.densidad} · cine ${s.cine}</title></rect>`
  }).join('')
  return `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Mapa vertical: el ancho de cada barra es su fuerza">${bloques}</svg>`
}

const CSS = `
*{box-sizing:border-box}
body{margin:0;background:#f4f5f0;color:#232426;font:15px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
main{max-width:1080px;margin:0 auto;padding:48px 24px 96px}
h1{font-size:22px;font-weight:600;margin:0 0 4px}h2{font-size:17px;font-weight:600;margin:0 0 4px}
.meta{color:#5f6266;margin:0 0 20px}
section{display:grid;grid-template-columns:72px minmax(0,1fr);gap:24px;background:#fff;border:1px solid #e6e7e3;border-radius:10px;padding:20px;margin-top:20px}
table{width:100%;border-collapse:collapse;font-size:13.5px}
th,td{text-align:left;padding:6px 8px;border-bottom:1px solid #e6e7e3;vertical-align:top}
th{font-weight:600;color:#5f6266}td.n{text-align:right;font-variant-numeric:tabular-nums}
.rol{display:inline-block;width:10px;height:10px;border-radius:2px;margin-right:6px;vertical-align:-1px}
.debil{color:#5f6266;font-size:12.5px}
.ley{display:flex;gap:16px;flex-wrap:wrap;font-size:13px;color:#5f6266;margin-bottom:8px}
img{width:100%;border:1px solid #e6e7e3;border-radius:6px;margin-top:12px}
`

export function htmlMapa({ dir, corrida }) {
  const c = corrida.criterios
  const vistas = corrida.vistas.filter((v) => v.mapa?.secciones?.length)
  const hs = corrida.hallazgos.filter((h) => h.fuente === 'sightline' && h.vista && ['seccion-sin-decidir', 'seccion-saturada', 'golpes-seguidos', 'apertura-segun-el-producto', 'cine-donde-golpea', 'area-muerta'].includes(h.regla))
  const ley = Object.entries(ROL).map(([r, col]) => `<span><span class="rol" style="background:${col}"></span>${esc(r)}</span>`).join('')
  const bloques = vistas.map((v) => {
    const m = v.mapa
    const alto = Math.max(...m.secciones.map((s) => s.caja.y + s.caja.h), 1)
    const filas = m.secciones.map((s) => {
      const debiles = [...s.componentes].sort((a, b) => a.puntaje - b.puntaje).slice(0, 3)
      return `<tr><td><span class="rol" style="background:${ROL[s.rol]}"></span>${esc(s.etiqueta)}</td><td>${esc(s.rol)}</td><td class="n">${s.fuerza}</td><td class="n">${s.densidad}</td><td class="n">${s.cine}</td><td class="n"><b>${s.puntaje}</b></td><td class="debil">${debiles.map((d) => `${esc(d.etiqueta)} ${d.puntaje}`).join(' · ') || '-'}</td></tr>`
    }).join('')
    const propios = hs.filter((h) => h.vista === v.id)
    const cap = v.capturas?.escritorio && existsSync(join(dir, v.capturas.escritorio)) ? `<img src="${esc(v.capturas.escritorio)}" alt="${esc(v.id)} en escritorio" loading="lazy">` : ''
    return `<section id="${esc(v.id)}"><div>${tira(m, alto)}</div><div>
<h2>${esc(v.id)}</h2><p class="meta">${esc(v.ruta)} · ${esc(v.tipo)} · área muerta ${Math.round(m.area_muerta * 100)} %</p>
<table><tr><th>Sección</th><th>Rol</th><th>Fuerza</th><th>Densidad</th><th>Cine</th><th>Puntaje</th><th>Componentes más débiles</th></tr>${filas}</table>
${propios.length ? `<p class="meta" style="margin-top:12px">${propios.map((h) => esc(h.mensaje)).join('<br>')}</p>` : ''}${cap}</div></section>`
  }).join('\n')
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(corrida.repo)} · mapa vertical</title><style>${CSS}</style></head><body><main>
<h1>${esc(corrida.repo)} · mapa vertical</h1>
<p class="meta">${c ? `Tipo ${esc(c.tipo)} (${esc(c.origen)}) · manda ${esc(c.manda)} · ` : ''}${vistas.length} vistas · ${hs.length} hallazgos de composición. El ancho de cada barra es su fuerza.</p>
<div class="ley">${ley}</div>
${bloques}
</main></body></html>`
}

export function escribirMapa(o) {
  const f = join(o.dir, 'mapa.html')
  writeFileSync(f, htmlMapa(o))
  return f
}
