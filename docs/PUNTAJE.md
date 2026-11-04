# Puntaje v1

Determinista, en `src/puntaje.mjs`. Reemplaza la v0 (`100 - penalidad`), que daba 0 en todo repo real.

## Fórmula
1. **Penalidad de un bloque** (igual que v0): `P = Σ_regla min(peso × n, 20)`, pesos major 8, warn 4, minor 1, info 0.
2. **Puntaje de un bloque**: `B = 100 × 100 / (100 + P)` (se publica con una decimal para que un hallazgo más siempre mueva el número). Sin piso en 0: P 0 → 100, P 25 → 80, P 100 → 50, P 300 → 25. Cada hallazgo nuevo baja B y cada arreglo lo sube, salvo los info (peso 0) y los de una regla que ya está en su tope.
3. **Bloques**: uno por vista analizada (páginas más cualquier vista con hallazgos propios; las hojas y pestañas sin análisis propio no cuentan, así no meten 100 gratis) y uno de **código sin vista**.
4. **Global por tier** = `0,5 × B_código + 0,5 × promedio(B_vistas)`. Sin vistas, global = B_código. El código pesa la mitad fijo: descubrir menos vistas no baja la penalidad del código y el promedio no premia tener pocas vistas.
5. Tier A usa hallazgos A; AA usa A+AA; AAA usa todos.
6. `puntaje.referencias.transitions` = el `score` propio de transitions-agent, sin tocar (sale de la nota de la corrida).

## Ejemplo real: una app de producción privada (529 hallazgos)
- Código sin vista: P(A) = 92 → B 52,1; P(AA) = 189 → B 34,6.
- 9 vistas analizadas, promedio A ≈ 92,9; AA ≈ 87,6 (inicio 96, campo 83/67, barrer-avatares 84/72…).
- Global: **A 72,5 · AA 61,1 · AAA 61,1**. v0 daba 0/0/0. `referencias.transitions` = **19**.

## Umbrales por tier
Un tier aprueba si su puntaje es ≥ umbral, no tiene hallazgos major de su tier y aprueban los tiers de abajo.

| Tier | Umbral | Por qué |
|---|---|---|
| A | 85 | Lo objetivo debe quedar casi limpio: 85 deja ~18 de penalidad, una regla al tope como mucho. |
| AA | 75 | La pila (shadcn, HIG, M3) admite deuda menor: ~33 de penalidad, dos reglas al tope. |
| AAA | 70 | El criterio se suma encima de AA y tiene más reglas de criterio; se tolera algo más. |

Esa app hoy: A 72,5 < 85 y tiene 4 major A, así que no aprueba ningún tier.
