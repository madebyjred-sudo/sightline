# reglas

Catálogo de Taste: 169 reglas, 19 con check determinista. Formato: `docs/ESPEC.md`.
Cada regla guarda el archivo y la línea de la corrección que la originó, en las notas privadas del autor (las de `docs/` sí vienen en este repo). La línea sirve para rastrearla.

## Extensiones al formato
- `tambien_en`: otras fuentes con la misma idea (lista de `{archivo, linea}`).
- `cubre_externo`: id de transitions o impeccable que ya detecta la idea, total o «(parcial)». 17 reglas lo llevan.
- `fuente.archivo = perfil-usuario-hermes`, `linea 0`: correcciones dictadas en el perfil de usuario.
- Los checks importan `reglas/lib/fuente.mjs` (local, sin dependencias). `reglas/herramientas/` no es parte del contrato.

## Conteos
Por tier
| tier | n |
|---|---|
| A | 38 |
| AA | 101 |
| AAA | 30 |

Por capa
| capa | n |
|---|---|
| a11y | 8 |
| ax | 3 |
| copy | 20 |
| dx | 23 |
| ios | 18 |
| m3 | 17 |
| marca | 28 |
| movimiento | 14 |
| producto | 36 |
| shadcn | 2 |

Por tipo
| tipo | n |
|---|---|
| criterio | 150 |
| determinista | 19 |

Por perfil
| perfil | n |
|---|---|
| solo libre | 57 |
| libre y estricto | 112 |

## Checks
Hallazgos en una app de producción privada, «app A» (`app`, `components`, `packages/ui/src`, 211 archivos) y precisión sobre una muestra de 3 (o todos si hay menos).

| check | tier | perfiles | app A | verdaderos en app A | otros repos |
|---|---|---|---|---|---|
| animaciones-sin-css | A | L+E | 2 | 2/2 |  |
| azules-en-la-paleta | AAA | L | 0 | sin hallazgos | app B 3/3 |
| boton-pildora | AA | L | 3 | 3/3 |  |
| clases-tailwind-que-no-generan-css | A | L+E | 0 | sin hallazgos | app C: 2 falsos (token oklch con alfa de shadcn), ajustado, 0 después |
| copy-sin-em-dash | A | L+E | 2 | 2/2 |  |
| fondo-crema-por-defecto | AA | L | 0 | sin hallazgos | app B 3/3, app C 3/3 |
| gris-azulado-tailwind | AAA | L | 0 | sin hallazgos | app B 3/3 |
| hex-en-componentes | AA | L+E | 2 | 2/2 |  |
| input-menor-a-16px | AA | L+E | 15 | 3/3 |  |
| italica-de-acento-en-titulares | AA | L | 0 | sin hallazgos | sin hallazgos en 3 repos |
| jerga-interna-en-copy | AA | L+E | 0 | sin hallazgos | app B 3/3 |
| monospace-por-defecto | AA | L | 4 | 3/3 |  |
| pop-ups-modales | AA | L | 6 | 3/3 |  |
| rotulos-numerados-01-02-03 | AA | L | 0 | sin hallazgos | app B 3/3 |
| segunda-barra-superior | AA | L | 0 | sin hallazgos | sin hallazgos en 3 repos |
| sin-scrollbars-internos | AA | L+E | 3 | 2/3 |  |
| texto-de-ayuda-y-eslogan | AA | L | 5 | 3/3 (pista) |  |
| voseo-en-copy | AA | L+E | 36 | 3/3 |  |
| zona-tactil-menor-a-44 | AA | L+E | 23 | 3/3 |  |

Probar: `node --test 'tests/reglas/*.test.mjs'`. Correr sobre un repo: `node reglas/herramientas/probar-en-repo.mjs RAIZ salida.json dir1 dir2`.
