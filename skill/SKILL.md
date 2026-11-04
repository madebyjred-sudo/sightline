---
name: taste
description: Use when auditing or cleaning a web app's UI with taste.
---

# taste

Audita una app web viva (capturas por vista, hallazgos con fuente, puntaje por tier, mapa vertical con
puntaje por componente) y produce una contrapropuesta en un clon con rama propia, con informe antes y después.
Nunca escribe en el repo analizado.

## Cuándo usarlo
- Te piden revisar, limpiar, corregir o mejorar la interfaz de un repo con servidor de desarrollo.
- Quieres pruebas visuales de un cambio de UI antes de llevarlo al repo real.

## Perfiles y mundos
- `perfiles/REPO.json` en el repo de taste: `mundo` (shift | personal), `perfil` (libre | estricto), `url`,
  `arranque`, `lecturas_permitidas` (lista `{metodo, ruta}` de peticiones POST que solo leen; el resto se bloquea),
  `previo` (`{nombre, puerto, comando}`: lo que el servidor necesita antes de arrancar, p. ej. un túnel ssh a la
  base de desarrollo; taste lo abre si el puerto está cerrado y cierra solo lo que abrió), `entorno` (variables
  extra para el servidor: apaga trabajos de fondo que escriben, p. ej. un barrido periódico).
- Una corrida solo lee `biblioteca/externa` y la biblioteca de su mundo. Nunca la del otro.
- Estricto (productos de cliente con marca cerrada): nunca cambies tokens ni marca ni agregues piezas.

## Tiers
`A` (lo mínimo), `AA` (por defecto, A + AA), `AAA` (todo). El puntaje del tier usa los hallazgos de ese tier y los de abajo.

## Los cinco modos
| modo | qué hace |
|---|---|
| correccion | arregla hallazgos sin cambiar layout ni piezas |
| limpieza | solo quita: eslogan, textos de ayuda, etiquetas secundarias, duplicados, estilos muertos; voseo a tuteo y em-dash fuera |
| mejora | pule dentro del esquema actual |
| edicion | solo lo pedido en `--pedido TEXTO` |
| creacion | pantalla o componente nuevo desde la biblioteca |

## Antes de todo: los criterios (taste fundar)
Un repo sin decisiones de diseño se funda primero: `taste fundar --repo RUTA [--tipo herramienta|vitrina|mixto]`.
- Deduce el tipo de producto por el código (tablas, formularios, barra lateral y sesión contra hero, imágenes y
  marketing; ignora kits de ilustración y pruebas). Si el dueño lo sabe, `--tipo` lo fija.
- Escribe `perfiles/REPO.criterios.json` y `.md`: la pila (shadcn el código, macOS/iOS la interacción, Material 3 el
  sistema, la marca lo visible), cuál manda según el tipo (herramienta: macOS/iOS; vitrina: la marca; mixto: por
  vista), qué capa decide cada pieza y cómo se combinan: cada una en su dominio, en un choque gana la del dominio,
  se importan las leyes y nunca el look literal.
- Sin criterios guardados, la auditoría los deduce al vuelo y lo dice en la corrida. Método en `docs/COMPOSICION.md`.

## El mapa vertical y el puntaje por componente
Cada vista se mide en escritorio, sección por sección de arriba abajo: **fuerza** (escala, contraste, peso visual,
movimiento), **densidad** (información por área) y **cine** (escala, aire, encuadre, movimiento). Con eso cada
sección tiene un rol: golpe, condensado, saturado o **sin decidir** (el gris medio que nadie pensó).
- Cada componente de la sección tiene su puntaje: mitad calidad medida en el DOM (contraste, texto mínimo), mitad
  composición (en un golpe pesa el cine; en un condensado, la legibilidad de lo denso). Una sección sin decidir no
  pasa de 60.
- Hallazgos (fuente `taste`, con `vista` y `seccion`): `seccion-sin-decidir`, `seccion-saturada`, `golpes-seguidos`,
  `apertura-segun-el-producto`, `cine-donde-golpea`, `area-muerta`. Una vista interna con la misma composición que su
  padre (un ancla) no los repite.
- `CORRIDA/mapa.html`: la tira de cada vista (el ancho de la barra es la fuerza, lo sin decidir en amarillo), con
  el puntaje por sección y sus componentes más débiles.
- En el paquete de cada vista va el mapa. Antes de escribir criterios, di en una frase qué problema resuelve cada
  sección; la que no resuelve ninguno se propone quitar (`seccion-con-problema`). Menos, pero pensado.

## De punta a punta
1. `taste MODO --repo RUTA --tier AA [--solo VISTA] [--agente ninguno|claude] [--pedido TEXTO]`
   Audita, escribe `paquete/VISTA.md` por vista, clona a `CORRIDA/arbol` en la rama `taste/AAAAMMDD-HHMM-MODO`
   y escribe `CORRIDA/TAREA.md`. Con `ninguno` imprime la frase para pegar en tu agente.
2. Lee `TAREA.md` y cada paquete (capturas, hallazgos por regla con archivo:línea, reglas que aplican, inspo y componentes del mismo patrón).
3. Escribe `CORRIDA/criterios.json`: uno por hallazgo o grupo de la misma regla. Cada criterio lleva `regla`
   (id de reglas.json o `inspo:ID`), `criterio` (una frase imperativa), `por_que` (con la fuente archivo:línea),
   `ux`, `dx`, `ax` (mejora | igual | empeora + 5 palabras), `accion`, `componente`, `archivos`, `estado`, `motivo_descarte`.
   - Si algo empeora UX, DX o AX, se descarta (taste lo fuerza).
   - En limpieza, todo lo que no sea `quitar` queda `propuesto`.
4. Aplica en el árbol solo los `aplicado`, un commit por criterio o grupo. Nunca push.
5. Corre el chequeo de tipos del árbol (`npx tsc --noEmit` si hay tsconfig).
6. `taste comparar --corrida CORRIDA`: levanta el árbol en puerto + 1, repite las mismas vistas, captura en
   `capturas/despues`, re-detecta, corre guardas y genera `informe.html`.

## Ruido base
La auditoría captura cada vista dos veces sobre el mismo árbol y guarda en `vista.ruido` cuánto cambia sola
(datos vivos, relojes, carga diferida). Las guardas suman ese ruido al tope de 0,5 % de las vistas no tocadas.
`--sin-ruido` lo salta (corre la mitad de rápido, pero las guardas quedan más estrictas de lo justo).
Cada captura usa un contexto de navegador nuevo: el estado que deja un clic (barra plegada en localStorage) no
pasa a la vista siguiente.

## Leer el informe
- Arriba: puntaje global antes, después y delta por tier; índice de vistas con su delta.
- Por vista: escritorio y móvil antes y después, cada criterio con regla, fuente, ux/dx/ax y estado.
- Guardas `no ok` o un delta negativo: no lleves la rama. Revisa el motivo.
- Traer la rama: `git fetch CORRIDA/arbol RAMA`.

## Escenas: mostrar el producto (Stageshow)
Taste limpia la app real; para **mostrarla** (hero de landing, tarjeta de feature, demo animada) se usa la skill
`stageshow` de Benji Taylor tal cual, con las reglas de Taste encima. No es otro comando.
- Marco por defecto: el gold `finder-glass` (escenario 860 x 440, ventana en 40/40/780/480 que sangra por
  abajo; compacto 400 x 340, ventana en 20/20/460/400 que sangra a la derecha y abajo; radio 14; fondo de tres capas
  recoloreado a la marca). Geometría y capturas: `biblioteca/externa/golds/marco-finder-glass.md`.
- Antes de construir, capturar la app real con sesión de prueba (solo lectura) y tomar sus tokens del CSS.
- Escenas aprobadas = gold propio por mundo, en `biblioteca/<mundo>/escenas/` (o en `TASTE_BIBLIOTECA_SHIFT` para un
  segundo mundo de trabajo).
- Ensayo: `film.mjs --gate` de Stageshow es pista, no veredicto (en sus propios golds pasa la mitad).
- Después de limpiar con Taste, la escena se arma sobre la pantalla ya limpia: primero el producto, luego cómo se muestra.

## Trampas
- Si una vista sale en error, mira `vista.error`: `bloqueada POST /api/...` indica una lectura POST que falta
  en `lecturas_permitidas` (agrégala solo si leíste el código y no escribe); `500` suele ser la base de datos o un túnel caído: revisa la nota de `previo` en `corrida.notas`.
- El árbol enlaza `node_modules` del original: no instales dependencias en el árbol.
