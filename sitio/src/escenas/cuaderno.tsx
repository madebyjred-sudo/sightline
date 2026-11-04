import { Collapse, Stage, Window, type Act, ACENTO } from './ss'
import './marco.css'
import './cuaderno.css'
import { t } from '../lang'

// El ejemplo: Cuaderno, the made-up notes app every demo on the page works on,
// as it is before Sightline touches it. A line of yellow light runs down the
// window, the way Sightline walks a view; where it passes, the defects light up and
// a card lists them: the Share button off-voice («Compartí», in voseo; in
// English, a raw enum), a 22 px icon (less than a finger), the helper text
// under the title. The same three the demos below fix. It holds, then the
// marks fade and the light starts again. Poster: all three.

type S = { linea: number; paso: number; viaje: boolean }

const BOTON = () => t('Compartí', 'SHARE_NOTE')

const DEFECTOS = () =>
  t(
    [
      { n: 1, t: 'Botón en voseo: «Compartí»' },
      { n: 2, t: 'Ícono de 22 px, más chico que un dedo' },
      { n: 3, t: 'Texto de ayuda bajo el título' },
    ],
    [
      { n: 1, t: 'Raw enum: SHARE_NOTE' },
      { n: 2, t: 'A 22 px icon, smaller than a finger' },
      { n: 3, t: 'Helper text under the title' },
    ],
  )

const NOTAS = () =>
  t(
    [
      ['Viaje a Oaxaca', 'Ayer'],
      ['Lista del súper', 'Hoy'],
      ['Ideas para el taller', '28 oct'],
      ['Libros pendientes', '21 oct'],
      ['Cumpleaños de Ana', '12 oct'],
    ],
    [
      ['Oaxaca trip', 'Yesterday'],
      ['Groceries', 'Today'],
      ['Workshop ideas', 'Oct 28'],
      ['Books to read', 'Oct 21'],
      ["Ana's birthday", 'Oct 12'],
    ],
  )

async function script(a: Act<S>) {
  await a.wait(500)
  a.mark('barra')
  await a.set({ viaje: true, linea: 1 })
  await a.wait(700)
  await a.set({ paso: 2 })
  await a.wait(600)
  a.mark('ayuda')
  await a.set({ linea: 2 })
  await a.wait(500)
  await a.set({ paso: 3 })
  await a.wait(400)
  await a.set({ linea: 3 })
  await a.wait(2800)
  a.mark('vuelta')
  await a.set({ paso: 0, viaje: false })
  await a.wait(600)
  await a.snap({ linea: 0 })
  await a.wait(300)
}

export default function Cuaderno() {
  return (
    <Stage<S>
      width={550}
      height={440}
      compact={{ below: 500, width: 400, height: 340 }}
      initial={{ linea: 0, paso: 0, viaje: false }}
      poster={{ linea: 3, paso: 3, viaje: false }}
      script={script}
      accent={ACENTO}
      className="marco cdn oscuro"
    >
      {(s) => (
        <>
          <Window
            className="marco-win cdn-win"
            lightsSize="large"
            barSize="tall"
            lead={
              <span className="cdn-lead">
                <span className="cdn-titulo">{t('Notas', 'Notes')}</span>
                <span className="cdn-boton" data-visto={s.paso >= 1 || undefined}>
                  {BOTON()}
                  <i className="cdn-num">1</i>
                </span>
                <span className="cdn-icono" data-visto={s.paso >= 2 || undefined} aria-hidden="true">
                  ⚙<i className="cdn-num">2</i>
                </span>
              </span>
            }
            body={{ className: 'cdn-body', 'data-crop': true }}
          >
            <div className="cdn-lista">
              <div className="cdn-ayuda" data-visto={s.paso >= 3 || undefined}>
                {t('Aquí puedes ver y organizar todas tus notas', 'Here you can see and organize all your notes')}
                <i className="cdn-num">3</i>
              </div>
              {NOTAS().map(([t, d]) => (
                <div key={t} className="cdn-fila">
                  <span className="cdn-fila__t">{t}</span>
                  <span className="cdn-fila__d">{d}</span>
                </div>
              ))}
            </div>
          </Window>

          <span className="cdn-luz" data-linea={s.linea} data-viaje={s.viaje || undefined} />

          <div className="marco-sat cdn-ve" data-show={s.paso >= 1 || undefined}>
            <div className="cdn-ve__t">{t('Lo que Sightline ve', 'What Sightline sees')}</div>
            {DEFECTOS().map((d) => (
              <Collapse key={d.n} open={s.paso >= d.n}>
                <div className="cdn-ve__fila">
                  <i className="cdn-num">{d.n}</i>
                  {d.t}
                </div>
              </Collapse>
            ))}
          </div>
        </>
      )}
    </Stage>
  )
}
