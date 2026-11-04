# Composición: la pila, el mapa vertical y ninguna sección sin pensar

Lo que mueve a Taste, dicho por su autor el 3 de noviembre de 2026:

> Lo que más me mueve es la Bauhaus: entender el menos es más, pero desde la perspectiva real de entender qué
> problemas estamos resolviendo.

> Que nunca ninguna sección se quede sin ser pensada.

> Cada componente debe tener un puntaje individual que tenga en cuenta otros factores, como qué tan
> cinematográfico es. De esa manera entendemos verticalmente dónde queremos darle fuerza a cierta información y
> dónde otra que tal vez sea más de ir condensada.

## 1. La pila: cómo se elige entre shadcn, macOS/iOS y Material 3

No se elige una. Se usan las tres, cada una en su dominio, y la marca encima:

| Capa | Su trabajo | Manda en |
|---|---|---|
| shadcn | Código y accesibilidad de componentes: foco, estados, ARIA | La base del repo, nunca la norma visual |
| macOS / iOS (HIG) | Leyes de interacción y sensación: 44 pt, hojas inferiores, resortes, teclado, tres columnas | La interacción y el móvil |
| Material 3 | Sistema: roles de color, escala tipográfica, elevación tonal, estados como capas, layouts por clase de ventana | La estructura |
| Dirección artística | La marca: tipografía, paleta, foto, tono | Lo único que se ve |

Cuando dos chocan, gana la del dominio del choque. Se importan las leyes, nunca el look literal: si una pantalla
«se ve Apple» o «se ve Google», falló la capa de marca.

El peso de cada capa depende del tipo de producto:

- Herramienta de trabajo diario (CRM, bandeja, panel operativo): manda macOS/iOS, porque la experiencia es la
  interacción. Tres columnas, teclado de primera, edición en el sitio, deshacer en vez de confirmar.
- Vitrina (landing, marca, portafolio): manda la marca; iOS solo pone las leyes táctiles.
- Mixto: se decide por vista.

`taste fundar` deduce el tipo, lo escribe con sus razones y deja la decisión por pieza en
`perfiles/REPO.criterios.json`. Si el repo no tiene criterios, la auditoría los deduce igual y lo avisa.

## 2. El mapa vertical

Cada vista se corta en secciones de arriba abajo. A cada sección se le mide:

- **fuerza**: cuánto golpea al ojo. Escala tipográfica frente al cuerpo, contraste, medios grandes, movimiento.
- **densidad**: cuánta información carga por área. Caracteres, controles y piezas por superficie.
- **cine**: qué tan cinematográfica es. Contraste de escala, aire alrededor, medio a sangre, movimiento con causa.

Con eso cada sección tiene un rol:

| Rol | Fuerza | Densidad | Para qué |
|---|---|---|---|
| golpe | alta | baja | Lo que se quiere que se vea primero |
| condensado | baja | alta | Lo que se consulta, se escanea o se trabaja |
| saturado | alta | alta | Grita y carga a la vez: casi siempre es un error |
| sin decidir | media | media | Ni golpea ni condensa: nadie lo pensó |

Reglas del mapa:

- **Ninguna sección sin decidir.** Una sección en el gris medio es un hallazgo.
- **Golpes seguidos se anulan.** Dos golpes contiguos y ninguno pesa: el ritmo es golpe, condensado, golpe.
- **La apertura depende del producto.** Una vitrina abre con un golpe. Una herramienta abre con el trabajo:
  un renglón de lo accionable arriba, el trabajo en el medio, el análisis abajo y plegado.
- **Lo cinematográfico va donde golpea.** En una sección golpe, el cine se exige; en una condensada, no.

## 3. Puntaje por componente

Dentro de cada sección, los componentes (tarjetas, controles, medios, bloques de texto) tienen su puntaje:

- **calidad**: lo que se mide en el DOM. Contraste del texto más débil y tamaño del texto más chico.
- **composición**: qué tan bien cumple el rol de su sección. En un golpe pesa el cine; en un condensado, la
  legibilidad de lo denso.

Puntaje del componente = mitad calidad, mitad composición. El de la sección es el promedio de sus componentes
ajustado por su rol: una sección sin decidir no pasa de 60.

## 4. Menos, pero pensado (Bauhaus)

- Cada sección resuelve un problema. El agente lo escribe en una frase; la que no resuelve ninguno se propone
  quitar.
- Área muerta: lo que no ocupa nada. En una herramienta, más de un 25 % es espacio perdido. En una vitrina el
  aire es intencional, salvo que pase del 60 %.
- Quitar antes de agregar.
