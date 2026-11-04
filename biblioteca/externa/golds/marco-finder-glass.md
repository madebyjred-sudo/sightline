# Gold · marco con ventana sangrada (Finder glass, Stageshow)

Elegido el 3-nov-2026 («copiemos exactamente ese componente y su espaciado, cómo se corta dentro del marco»).
Fuente: Stageshow `examples/finder-glass` (MIT, commit 8020574), `index.tsx` y `finder-glass.css`.
Capturas: `inspo/marco/marco-finder-glass-benji-01.png` (la suya, de benji.org), `-compacto.png` y `-ancho.png` (filmadas aquí).

## Geometría exacta
| | Escenario | Ventana | Corte |
|---|---|---|---|
| Ancho | 860 × 440 | x 40, y 40, w 780, h 480 | un gutter (40) arriba, izquierda y derecha; sale por abajo (40 + 480 = 520 > 440) |
| Compacto (bajo 560 px de página) | 400 × 340 | x 20, y 20, w 460, h 400 | un gutter (20) arriba e izquierda; sale por la derecha (480 > 400) y por abajo (420 > 340) |

- La compacta: entra por arriba-izquierda con un gutter y se corta a la derecha y abajo.
- Escenario: `overflow: hidden`, `border-radius: 14px`. El marco es el fondo; nada de placa debajo de la ventana.
- Ventana: chrome macOS 26 del kit (`sidebarStyle="floating"`, radio 24, `lightsSize="large"`, `barSize="tall"` 64 px,
  `greys="cool"`). Sidebar 196 (ancho) / 132 (compacto).
- Sombra de la ventana: `0 0 0 0.5px rgba(0,0,0,.16), 0 24px 60px -10px rgba(10,30,80,.38), 0 8px 20px -10px rgba(10,30,80,.24)`.
- Fondo (wallpaper Tahoe):
  `radial-gradient(110% 80% at 10% 0%, #cfe0f7 0%, transparent 62%),
   radial-gradient(90% 110% at 100% 100%, #2f6fd0 0%, transparent 72%),
   linear-gradient(165deg, #b4ccf0 0%, #7ea6e6 50%, #4f86dc 100%)`.
- Pie: una línea centrada en gris bajo el marco, con el nombre del producto y lo que pasa («Finder on macOS 26. A folder
  opens in column view, and Space previews a photo.»).
- Contenido: palabras reales solo en lo que cuenta la historia (la carpeta abierta, el archivo); el resto, barras grises.
- Historia: abre una carpeta en columnas, la selección baja a su hija, Space abre Quick Look desde la miniatura.

## Cómo se usa en un producto propio
Mismo escenario, mismos gutters, mismo corte y misma sombra. Cambian el contenido de la ventana (la pantalla del
producto), el fondo (el color de la marca en la misma construcción) y el pie.
