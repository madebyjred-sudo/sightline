// Deteccion completa sobre una raiz (repo original o arbol).
export async function detectarTodo({ raiz, dirCorrida, urls = [], perfil, log = () => {} }) {
  const { correrTransitions } = await import('../detectar/transitions.mjs')
  const { correrImpeccable } = await import('../detectar/impeccable.mjs')
  const { correrChecks } = await import('../detectar/checks.mjs')
  const notas = []
  log('detectar: transitions'); const t = correrTransitions({ repo: raiz, dirCorrida }); notas.push(t.nota)
  log(`detectar: impeccable (${urls.length} urls)`); const i = correrImpeccable({ repo: raiz, dirCorrida, urls }); notas.push(i.nota)
  log('detectar: checks'); const c = await correrChecks({ repo: raiz, perfil }); notas.push(c.nota)
  const hallazgos = [...t.hallazgos, ...i.hallazgos, ...c.hallazgos].map((h, n) => ({ id: `h-${String(n + 1).padStart(4, '0')}`, ...h }))
  return { hallazgos, notas, cobertura: { impeccable_vivo: i.escaneadas || [] } }
}
