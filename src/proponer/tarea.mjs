// TAREA.md: instrucciones exactas para el agente que escribe criterios y aplica en el arbol.
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { REGLA_MADRE } from '../criterio/paquete.mjs'

export const MODOS = {
  correccion: 'Arregla los hallazgos. No cambies layout ni piezas: mismo esquema, mismos componentes.',
  limpieza: 'Solo quita: eslogan, textos de ayuda, etiquetas secundarias, duplicados, estilos muertos; y corrige copy sin agregar texto (voseo a tuteo, em-dash fuera). Todo lo que requiera agregar va como propuesto, nunca aplicado.',
  mejora: 'Pule dentro del esquema actual: espaciado, jerarquia, estados, movimiento. No cambies la arquitectura de la pantalla.',
  edicion: 'Haz solo lo pedido en el pedido de abajo. Nada mas.',
  creacion: 'Crea la pantalla o componente nuevo partiendo de los componentes e inspo del paquete (solo externa y el mundo del repo).',
}

export function textoTarea({ dir, modo, tier, perfil, arbol, rama, base, paquetes, pedido, bin }) {
  const estricto = perfil === 'estricto'
  return [
    `# Tarea sightline · ${modo} · tier ${tier} · perfil ${perfil}`, '',
    `> ${REGLA_MADRE}`, '',
    '## Rutas', '',
    `- corrida: ${dir}`,
    `- arbol (clon donde aplicas): ${arbol}`,
    `- rama: ${rama} (base ${base})`,
    '- repo original: NO lo toques. Solo lees y escribes dentro de la corrida.', '',
    '## Modo', '', MODOS[modo], ...(pedido ? ['', `Pedido: ${pedido}`] : []), '',
    '## Pasos', '',
    `1. Lee cada paquete de ${join(dir, 'paquete')} (${paquetes.length} vistas) y mira sus capturas (rutas relativas a la corrida).`,
    `2. Escribe ${join(dir, 'criterios.json')}: una lista de criterios, uno por hallazgo o grupo de hallazgos de la misma regla, con al menos uno por vista donde haya algo que hacer en este modo.`,
    '   Claves: id (c-0001), vista, hallazgos (ids h-...), regla (id de reglas.json o inspo:ID), criterio (una frase imperativa), por_que (una frase con la fuente archivo:linea), ux, dx, ax (mejora | igual | empeora + 5 palabras), accion (quitar | cambiar | agregar | reemplazar-por-componente), componente (id de biblioteca o null), archivos (rutas relativas al arbol), estado (propuesto | aplicado | descartado), motivo_descarte (null o frase).',
    '   Si ux, dx o ax empeora: estado descartado. sightline lo fuerza igual.',
    `3. Aplica en el arbol SOLO los criterios con estado aplicado. Un commit por criterio o grupo, mensaje «sightline ${modo}: c-0001 ...». Nunca push.`,
    ...(estricto ? ['   Perfil estricto: nunca cambies tokens, marca ni agregues piezas.'] : []),
    '4. Antes de comparar corre en el arbol el chequeo de tipos o build que tenga (npx tsc --noEmit si hay tsconfig) y anota el resultado.',
    `5. Corre: ${bin} comparar --corrida ${dir}`,
    `6. Abre ${join(dir, 'informe.html')} y revisa antes y despues por vista.`, '',
    '## Paquetes', '', ...paquetes.map((p) => `- ${p.archivo} · ${p.hallazgos} hallazgos · ${p.patrones.slice(0, 3).join(', ')}`), '',
  ].join('\n')
}

export function escribirTarea(o) {
  const f = join(o.dir, 'TAREA.md')
  writeFileSync(f, textoTarea(o))
  return f
}
