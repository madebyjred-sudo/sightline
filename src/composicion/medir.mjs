// Corre en el navegador (page.evaluate): corta la vista en secciones de arriba abajo y mide cada
// seccion y sus componentes. Todo en pixeles de documento; sin dependencias de fuera de la funcion.
export function medirEnPagina() {
  const vw = innerWidth
  const visible = (el) => {
    const r = el.getBoundingClientRect(), s = getComputedStyle(el)
    return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' && +s.opacity > 0.05
  }
  const rect = (el) => { const r = el.getBoundingClientRect(); return { x: r.left + scrollX, y: r.top + scrollY, w: r.width, h: r.height } }
  const lum = ([r, g, b]) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b) }
  const rgba = (c) => { const m = String(c).match(/[\d.]+/g); return m ? m.map(Number) : null }
  const fondo = (el) => {
    for (let n = el; n; n = n.parentElement) {
      const c = rgba(getComputedStyle(n).backgroundColor)
      if (c && (c.length < 4 || c[3] > 0.5)) return c.slice(0, 3)
      if (getComputedStyle(n).backgroundImage !== 'none') return null // degradado o imagen: no se mide
    }
    return [255, 255, 255]
  }
  const contraste = (el) => {
    const c = rgba(getComputedStyle(el).color), b = fondo(el)
    if (!c || !b) return null
    const a = c.length > 3 ? c[3] : 1
    const fg = c.slice(0, 3).map((v, i) => v * a + b[i] * (1 - a))
    const x = lum(fg), y = lum(b)
    return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)
  }
  const etiqueta = (el) => {
    const h = el.matches('h1,h2,h3,h4') ? el : el.querySelector('h1,h2,h3,h4,[role=heading]')
    const t = (h?.innerText || el.getAttribute('aria-label') || el.innerText || '').replace(/\s+/g, ' ').trim()
    return t.slice(0, 48) || el.tagName.toLowerCase()
  }
  // Cuerpo de referencia: el tamano de texto mas comun en parrafos y celdas.
  const tamanos = new Map()
  for (const el of document.querySelectorAll('p, li, td, span, a, label')) {
    if (!visible(el) || !el.innerText?.trim()) continue
    const fs = Math.round(parseFloat(getComputedStyle(el).fontSize))
    tamanos.set(fs, (tamanos.get(fs) || 0) + el.innerText.length)
  }
  const base = [...tamanos.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || 16

  // Metricas de un elemento: recorre sus nodos de texto y medios una sola vez.
  function metricas(el) {
    const r = rect(el)
    const area = Math.max(1, r.w * r.h)
    let chars = 0, maxFs = 0, maxPeso = 400, minFs = Infinity, minCr = Infinity, crMayor = null, tinta = 0
    const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
    for (let n = w.nextNode(); n; n = w.nextNode()) {
      const t = n.textContent.trim()
      const p = n.parentElement
      if (!t || !p || !visible(p)) continue
      const s = getComputedStyle(p)
      const fs = parseFloat(s.fontSize)
      chars += t.length
      const rg = document.createRange(); rg.selectNodeContents(n)
      for (const q of rg.getClientRects()) tinta += q.width * q.height
      const cr = contraste(p)
      if (fs > maxFs) { maxFs = fs; maxPeso = +s.fontWeight || 400; crMayor = cr }
      if (fs < minFs) minFs = fs
      if (cr != null && cr < minCr) minCr = cr
    }
    // Masa: bloques con fondo propio distinto de la pagina (escenas, tarjetas de color, bandas). Solo
    // el primer nivel que lo tiene, para no contar dos veces lo anidado.
    let masa = 0
    const pagina = fondo(document.body) || [255, 255, 255]
    const lp = lum(pagina)
    const conFondo = (n) => {
      const s = getComputedStyle(n)
      const c = rgba(s.backgroundColor)
      if (s.backgroundImage !== 'none') return true
      if (!c || (c.length > 3 && c[3] < 0.5)) return false
      return Math.abs(lum(c.slice(0, 3)) - lp) > 0.04
    }
    const pilaM = [...el.children]
    while (pilaM.length) {
      const n = pilaM.pop()
      if (!visible(n)) continue
      const q = n.getBoundingClientRect()
      if (q.width >= 80 && q.height >= 60 && conFondo(n)) { masa += q.width * q.height; continue }
      pilaM.push(...n.children)
    }
    let medios = 0, sangre = false
    for (const m of el.querySelectorAll('img, video, canvas, svg, picture, [style*="background-image"]')) {
      if (!visible(m)) continue
      const q = m.getBoundingClientRect()
      if (q.width < 80 || q.height < 80) continue
      medios += q.width * q.height
      if (q.width >= vw * 0.9) sangre = true
    }
    const controles = el.querySelectorAll('a[href], button, input, select, textarea, [role=button], [role=tab]').length
    let mov = 0
    for (const m of [el, ...el.querySelectorAll('*')].slice(0, 400)) {
      const s = getComputedStyle(m)
      if ((s.animationName && s.animationName !== 'none') || parseFloat(s.transitionDuration) > 0) mov++
    }
    return {
      caja: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.w), h: Math.round(r.h) },
      chars, controles,
      escala: maxFs ? +(maxFs / base).toFixed(2) : 0, peso: maxPeso,
      contraste_mayor: crMayor ? +crMayor.toFixed(2) : null,
      contraste_min: Number.isFinite(minCr) ? +minCr.toFixed(2) : null,
      texto_min: Number.isFinite(minFs) ? Math.round(minFs) : null,
      tinta: +Math.min(1, tinta / area).toFixed(3),
      medios: +Math.min(1, medios / area).toFixed(3), masa: +Math.min(1, masa / area).toFixed(3), sangre, movimiento: mov,
    }
  }

  // Secciones: landmarks y bloques grandes de main, bajando por envoltorios que llenan a su padre.
  const raiz = document.querySelector('main') || document.body
  let bandas = []
  const bajar = (el, prof) => {
    const hijos = [...el.children].filter((c) => visible(c) && !['SCRIPT', 'STYLE', 'TEMPLATE'].includes(c.tagName))
    const r = el.getBoundingClientRect()
    const grandes = hijos.filter((c) => c.getBoundingClientRect().height >= 24)
    // Un envoltorio con un solo hijo grande que lo llena: se baja un nivel.
    if (prof < 6 && grandes.length === 1 && grandes[0].getBoundingClientRect().height >= r.height * 0.8) return bajar(grandes[0], prof + 1)
    return grandes
  }
  const fuera = [...document.querySelectorAll('body > header, body > nav, body > footer, header[role=banner], footer[role=contentinfo]')].filter(visible)
  bandas = [...fuera.filter((f) => !raiz.contains(f)), ...bajar(raiz, 0)]
  // Columnas lado a lado (indice lateral + contenido): se queda la mas ancha como eje vertical.
  bandas = bandas.filter((b) => b.getBoundingClientRect().width >= vw * 0.25)
  bandas.sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top)

  const COMPONENTE = (el) => {
    const s = getComputedStyle(el)
    const r = el.getBoundingClientRect()
    if (r.width < 40 || r.height < 24) return false
    const bg = rgba(s.backgroundColor)
    return (bg && bg.length > 3 ? bg[3] > 0.05 : !!bg && s.backgroundColor !== 'rgba(0, 0, 0, 0)') ||
      parseFloat(s.borderTopWidth) > 0 || s.boxShadow !== 'none' || s.backgroundImage !== 'none' ||
      el.matches('figure, img, video, canvas, table, form, pre, blockquote, ul, ol, button, [role=button], input, select, textarea')
  }
  const secciones = bandas.slice(0, 40).map((b, i) => {
    const comps = []
    const buscar = (el, prof) => {
      for (const c of el.children) {
        if (!visible(c) || comps.length >= 30) continue
        if (COMPONENTE(c)) comps.push(c)
        else if (prof < 6) buscar(c, prof + 1)
      }
    }
    buscar(b, 0)
    // Si no hay piezas con caja, los bloques de texto son los componentes.
    const piezas = comps.length ? comps : [...b.querySelectorAll('h1,h2,h3,p')].filter(visible).slice(0, 12)
    return {
      id: `s${i + 1}`, etiqueta: etiqueta(b), tag: b.tagName.toLowerCase(), ...metricas(b),
      componentes: piezas.map((c, j) => ({ id: `s${i + 1}c${j + 1}`, etiqueta: etiqueta(c), tag: c.tagName.toLowerCase(), ...metricas(c) })),
    }
  })
  const alto = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight)
  return { base, ancho: vw, alto, secciones }
}
