# Criterios de diseño · sitio

Tipo de producto: **vitrina** (deducido por taste fundar). En una vitrina manda la dirección artística; macOS/iOS solo pone las leyes táctiles.

- trabajo 5 (tablas 1, formularios 0, barra lateral 1, sesión 0)
- vitrina 14 (hero 7, imágenes grandes 0, palabras de marketing 0)

## La pila

Manda: marca. Orden de peso: marca > hig > m3 > shadcn.

- **shadcn**: Código y accesibilidad de componentes: foco, estados, ARIA. La base del repo, nunca la norma visual.
- **hig**: macOS / iOS: leyes de interacción y sensación. 44 pt, hojas inferiores, resortes, teclado, tres columnas.
- **m3**: Material 3: sistema y estructura. Roles de color, escala tipográfica, elevación tonal, estados como capas, layouts por clase de ventana.
- **marca**: Dirección artística: tipografía, paleta, foto y tono. Lo único que se ve.

## Cómo se combinan

- Se usan las cuatro capas a la vez, cada una en su dominio.
- Cuando dos chocan, gana la del dominio del choque: una hoja en móvil la decide macOS/iOS; un color, la marca sobre los roles de Material 3; el foco, shadcn.
- Se importan las leyes, nunca el look literal: si una pantalla «se ve Apple» o «se ve Google», falló la marca.

## Qué capa decide cada pieza

| Pieza | Decide | Regla |
|---|---|---|
| Navegación | marca | Una barra, la de la marca; sin segunda barra superior. |
| Hojas, menús y diálogos en móvil | hig | Hoja inferior con agarre; menú como hoja de acciones; nada de pop-ups salvo la paleta de comandos. |
| Botones y controles | shadcn | Código y estados de shadcn; forma y color de la marca; 44 pt de zona táctil aunque se vean más chicos. |
| Formularios | shadcn | Accesibilidad de shadcn; inputs de 16 px en móvil (iOS); edición en el sitio en vez de pantallas de editar. |
| Color | marca | Roles de Material 3 (fondo, superficie, acento, estados) llenados con la paleta de la marca: neutros más su acento. |
| Tipografía | m3 | Escala de Material 3; familia de la marca. |
| Elevación y estados | m3 | Capas tonales y estados como capas (hover, pressed, focus); un contenedor, un tono. |
| Movimiento | hig | Resortes con causa (iOS) y propósito (Material 3); cifras que se mueven con el dato; nada sin reduced-motion. |
| Layout | m3 | Una columna con ritmo de golpe y condensado. |
| Teclado | hig | Lo básico: foco visible y Esc. |

## Choques típicos en móvil (shadcn → iOS)

- Dialog o Sheet lateral → hoja inferior con agarre
- DropdownMenu → hoja de acciones
- zona táctil de 32 a 36 px → 44 pt
- input de 14 px → 16 px
- barra fija arriba → acciones al alcance del pulgar
- fade → resorte
