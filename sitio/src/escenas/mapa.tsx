import { Collapse, Count, States, Stage, Window, type Act, ACENTO } from './ss'
import './marco.css'
import './mapa.css'
import { t } from '../lang'

// Cada componente, su puntaje. Cuaderno's landing in a browser, and beside it
// the vertical map Taste measures for it: one bar per section, its width the
// section's strength, its color the role. One bar is yellow: a section nobody
// decided. The cursor presses it; its numbers open under the map. A press on
// «Condensar»: the section turns into three dense counts, its bar goes grey
// and narrow, and its score rolls from 58 to 86. It holds, then the panel
// closes and the section goes back. Poster: decided, 86.

type S = { abierto: boolean; decidida: boolean; puntaje: number }

const ANTES = 58
const DESPUES = 86

// Sections of the page, top to bottom: height in page px, strength 0-1, role.
const SECCIONES = [
  { id: 'hero', h: 118, f: 0.86, rol: 'golpe' },
  { id: 'medio', h: 96, f: 0.32, rol: 'sin' },
  { id: 'demo', h: 132, f: 0.78, rol: 'golpe' },
  { id: 'pie', h: 46, f: 0.12, rol: 'condensado' },
]

async function script(a: Act<S>) {
  await a.wait(1000)
  a.mark('abrir')
  await a.click({ at: 'barra', x: 0.5, y: 0.5 })
  await a.set({ abierto: true })
  await a.wait(1300)
  a.mark('decidir')
  await a.click({ at: 'condensar', x: 0.9, y: 0.5 })
  await a.set({ decidida: true })
  await a.wait(500)
  await a.set({ puntaje: DESPUES })
  await a.wait(2800)
  a.mark('vuelta')
  await a.set({ abierto: false })
  await a.wait(500)
  await a.set({ decidida: false, puntaje: ANTES })
  await a.move('rest')
  await a.wait(700)
}

const fmt = (n: number) => String(Math.round(n))

export default function Mapa() {
  return (
    <Stage<S>
      width={550}
      height={440}
      compact={{ below: 500, width: 400, height: 340 }}
      initial={{ abierto: false, decidida: false, puntaje: ANTES }}
      poster={{ abierto: true, decidida: true, puntaje: DESPUES }}
      script={script}
      accent={ACENTO}
      cursor={{ at: 'rest' }}
      className="marco map oscuro"
    >
      {(s) => (
        <>
          <Window url="cuaderno.app" className="marco-win map-win">
            <div className="map-pagina">
              <div className="map-s map-hero">
                <div className="map-hero__t">{t('Tus notas, en orden.', 'Your notes, in order.')}</div>
                <span className="map-hero__b">{t('Empieza', 'Start')}</span>
              </div>
              <div className="map-s map-medio" data-sel={s.abierto || undefined} data-decidida={s.decidida || undefined}>
                <States
                  className="map-medio__estados"
                  align="start"
                  value={s.decidida ? 'despues' : 'antes'}
                  states={{
                    antes: (
                      <span className="map-medio__antes">
                        <span className="map-medio__h">{t('Todo en un lugar', 'Everything in one place')}</span>
                        <span className="map-medio__p">
                          {t('Guarda listas, viajes e ideas, y encuéntralas cuando las necesites.', 'Keep lists, trips and ideas, and find them when you need them.')}
                        </span>
                      </span>
                    ),
                    despues: (
                      <span className="map-medio__despues">
                        {[
                          ['12', t('listas', 'lists')],
                          ['4', t('viajes', 'trips')],
                          ['31', 'ideas'],
                        ].map(([n, t]) => (
                          <span key={t} className="map-cifra">
                            <b>{n}</b>
                            {t}
                          </span>
                        ))}
                      </span>
                    ),
                  }}
                />
              </div>
              <div className="map-s map-demo">
                <div className="map-demo__ventana">
                  <span className="map-demo__fecha">{t('Ayer, 18:40', 'Yesterday, 6:40 PM')}</span>
                  <span className="map-demo__t">{t('Viaje a Oaxaca', 'Oaxaca trip')}</span>
                  <span className="map-demo__p">{t('Mercado de Abastos el sábado temprano.', 'Mercado de Abastos early on Saturday.')}</span>
                </div>
              </div>
              <div className="map-s map-pie">{t('Precios · Ayuda · Contacto', 'Pricing · Help · Contact')}</div>
            </div>
          </Window>

          <div className="map-panel">
            <div className="map-panel__t">{t('Mapa vertical', 'Vertical map')}</div>
            <div className="map-barras">
              {SECCIONES.map((x) => {
                const sin = x.rol === 'sin' && !s.decidida
                const ancho = x.rol === 'sin' ? (s.decidida ? 0.16 : x.f) : x.f
                return (
                  <span
                    key={x.id}
                    className="map-barra"
                    data-rol={sin ? 'sin' : x.rol === 'sin' ? 'condensado' : x.rol}
                    data-sel={(x.rol === 'sin' && s.abierto) || undefined}
                    data-target={x.rol === 'sin' ? 'barra' : undefined}
                    data-cursor={x.rol === 'sin' ? 'pointer' : undefined}
                    style={{ height: Math.round(x.h * 0.36), width: `${Math.round(24 + 76 * ancho)}%` }}
                  />
                )
              })}
            </div>
            <Collapse open={s.abierto} reveal="drop">
              <div className="map-detalle">
                <div className="map-detalle__rol">
                  <States value={s.decidida ? 'c' : 's'} align="start" states={{ s: t('Sin decidir', 'Undecided'), c: t('Condensado', 'Condensed') }} />
                </div>
                <div className="map-detalle__cifras">
                  <Count className="map-detalle__n" value={s.puntaje} format={fmt} duration={900} />
                  <span className="delta" data-show={s.decidida || undefined}>
                    +{DESPUES - ANTES}
                  </span>
                </div>
                <span className="map-detalle__b" data-target="condensar" data-cursor="pointer" data-hecho={s.decidida || undefined}>
                  {t('Condensar', 'Condense')}
                </span>
              </div>
            </Collapse>
          </div>
          <span className="map-reposo" data-target="rest" />
        </>
      )}
    </Stage>
  )
}
