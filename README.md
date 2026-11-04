# Sightline

Una skill para tu agente que recorre la interfaz de una app web en marcha, vista por vista, y propone cómo dejarla
como la haría un diseñador exigente. Para quien construye apps con agentes y quiere que la interfaz aguante esa mirada.

## Instalar

Pégale esto a tu agente (Claude Code, Codex o Cursor) abierto en la carpeta de tu app:

> Instala Sightline en este equipo: clona https://github.com/madebyjred-sudo/sightline en ~/sightline, y dentro corre npm install,
> npx playwright install chromium y sh instalar.sh. Después audita esta app con sightline auditar --repo . y
> muéstrame el puntaje por tier y los hallazgos por vista, cada uno con su criterio. No cambies nada de la app sin
> preguntarme.

O a mano, una vez:

```sh
git clone https://github.com/madebyjred-sudo/sightline ~/sightline
cd ~/sightline && npm install
npx playwright install chromium
sh instalar.sh
```

Eso deja la skill en Claude Code (y en Hermes, si lo usas) y el comando `sightline` en `~/.local/bin`. Necesitas Node 20 o
más y una app con servidor de desarrollo.

```sh
sightline fundar --repo ~/tu-app
sightline auditar --repo ~/tu-app
```

## Qué hace

- **Recorre:** levanta tu servidor de desarrollo y visita cada ruta, pestaña, hoja y diálogo que encuentra. Captura
  cada vista en escritorio (1440 × 900) y en móvil (390 × 844), dos veces, para separar el ruido de un cambio real.
- **Detecta:** con tres fuentes: [transitions-agent](https://transitions.dev) para el movimiento,
  [Impeccable](https://impeccable.style) como detector y los checks propios de Sightline.
- **Funda los criterios:** `sightline fundar` deduce si el producto es una herramienta, una vitrina o un mixto, y deja
  escrita la pila: shadcn el código, macOS e iOS la interacción, Material 3 el sistema, la marca lo que se ve, y cuál
  manda según el producto.
- **Mide la composición:** corta cada vista en secciones y le mide a cada una cuánto golpea, cuánto condensa y qué tan
  cinematográfica es. Cada componente tiene su puntaje y ninguna sección queda sin decidir. Deja un `mapa.html`.
- **Juzga:** cada hallazgo cae en una de 178 reglas, en tres tiers (A, AA, AAA). 19 tienen un check determinista; el
  resto es criterio que escribe tu agente: una frase, la regla, su fuente y qué pasa con UX, DX y AX.
- **Propone:** lo que queda se aplica en un clon con rama propia, nunca en tu repo, con un informe antes y después.

Los cinco modos: `correccion`, `limpieza`, `mejora`, `edicion` y `creacion`. La skill (`skills/sightline/SKILL.md`) le explica a
tu agente cuándo usar cada uno.

## Perfiles

Cada repo puede declarar el suyo en `perfiles/NOMBRE-DEL-REPO.json`:

```json
{ "mundo": "personal", "perfil": "libre", "url": "http://localhost:3000", "arranque": "npm run dev" }
```

`libre` puede proponer piezas nuevas; `estricto` nunca toca tokens ni marca. Sin archivo, Sightline es conservador: perfil
estricto, mundo personal. Ver `perfiles/sitio.json`, el de la landing.

## La composición

`docs/COMPOSICION.md` explica el método: cómo se elige y se combina la pila, el mapa vertical (golpe, condensado, sin
decidir) y el puntaje por componente. Lo mueve la Bauhaus: menos es más, entendido desde el problema que resuelve
cada sección.

## Las reglas

`reglas/reglas.json`. Cada regla nació de una corrección real hecha a mano sobre una interfaz y guarda el archivo y la
línea de donde salió. Esas notas son privadas del autor; la referencia queda para rastrearla. `reglas/LEEME.md` tiene
la precisión medida de cada check.

## La landing

`sitio/` es la página de Sightline: Vite y React, con demos hechas con [Stageshow](https://benji.org/stageshow) de Benji
Taylor, usado tal cual. `sitio/herramientas/fondos-ascii.mjs` dibuja sus fondos.

```sh
cd sitio && npm install && npm run dev
```

## Licencia

MIT. Los avisos de terceros están en `NOTICE.md`.
