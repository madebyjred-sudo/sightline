import { Collapse, Count, States, Stage, type Act, ACENTO } from './ss'
import './marco.css'
import './menos.css'
import { t } from '../lang'

// Menos, pero pensado. Sightline's panel for Cuaderno's landing: every section and,
// beside it, the problem it solves in one line, as the agent wrote it. One
// section solves none. The cursor presses «Quitar» on it; the row closes, the
// rest move up, the page drops a section and its dead area falls from 31 % to
// 18 %. It holds, then the section comes back. Poster: seven sections, 18 %.

type S = { quitada: boolean; muerta: number }

const ANTES = 31
const DESPUES = 18

const SECCIONES = t(
  [
    { s: 'Portada', p: 'Decidir en tres segundos si probarlo' },
    { s: 'Funciones', p: 'Saber qué hace sin instalar nada' },
    { s: 'Testimonios', p: null },
    { s: 'Precios', p: 'Elegir un plan' },
    { s: 'Preguntas', p: 'Resolver dudas antes de pagar' },
    { s: 'Descarga', p: 'Instalarlo en su equipo' },
    { s: 'Integraciones', p: 'Conectarlo con lo que ya usa' },
    { s: 'Pie', p: 'Encontrar ayuda y contacto' },
  ],
  [
    { s: 'Hero', p: 'Decide in three seconds whether to try it' },
    { s: 'Features', p: 'Know what it does without installing' },
    { s: 'Testimonials', p: null },
    { s: 'Pricing', p: 'Pick a plan' },
    { s: 'FAQ', p: 'Clear up doubts before paying' },
    { s: 'Download', p: 'Install it on their machine' },
    { s: 'Integrations', p: 'Connect it to what they already use' },
    { s: 'Footer', p: 'Find help and a contact' },
  ],
)

async function script(a: Act<S>) {
  await a.wait(1200)
  a.mark('quitar')
  await a.click({ at: 'quitar', x: 0.88, y: 0.5 })
  await a.set({ quitada: true })
  await a.wait(450)
  await a.set({ muerta: DESPUES })
  await a.wait(2800)
  a.mark('vuelta')
  await a.set({ quitada: false, muerta: ANTES })
  await a.move('rest')
  await a.wait(900)
}

const pct = (n: number) => t(`${Math.round(n)} %`, `${Math.round(n)}%`)

export default function Menos() {
  return (
    <Stage<S>
      width={550}
      height={440}
      compact={{ below: 500, width: 400, height: 340 }}
      initial={{ quitada: false, muerta: ANTES }}
      poster={{ quitada: true, muerta: DESPUES }}
      script={script}
      accent={ACENTO}
      cursor={{ at: 'rest' }}
      className="marco men"
    >
      {(s) => (
        <>
          <div className="marco-win men-panel">
            <div className="men-cabeza">
              <span className="men-cabeza__t">
                <span className="men-cabeza__sitio">cuaderno.app ·</span>
                <States value={s.quitada ? 'b' : 'a'} align="start" states={{ a: t('8 secciones', '8 sections'), b: t('7 secciones', '7 sections') }} />
              </span>
              <span className="men-cabeza__m">
                {t('área muerta', 'dead area')} <Count className="men-cabeza__n" value={s.muerta} format={pct} duration={900} />
                <span className="delta" data-show={s.quitada || undefined}>
                  −{ANTES - DESPUES}
                </span>
              </span>
            </div>
            <div className="men-filas">
              {SECCIONES.map((x) =>
                x.p ? (
                  <div key={x.s} className="men-fila">
                    <span className="men-fila__s">{x.s}</span>
                    <span className="men-fila__p">{x.p}</span>
                  </div>
                ) : (
                  <Collapse key={x.s} open={!s.quitada}>
                    <div className="men-fila" data-sin>
                      <span className="men-fila__s">{x.s}</span>
                      <span className="men-fila__p">
                        <span className="men-sin">{t('Ningún problema', 'Solves nothing')}</span>
                        <span className="men-quitar" data-target="quitar" data-cursor="pointer">
                          {t('Quitar', 'Remove')}
                        </span>
                      </span>
                    </div>
                  </Collapse>
                ),
              )}
            </div>
          </div>
          <span className="men-reposo" data-target="rest" />
        </>
      )}
    </Stage>
  )
}
