import { Search } from 'lucide-react'
import { Collapse, Count, Segmented, Stage, Window, type Act, ACENTO } from './ss'
import './marco.css'
import './criterio.css'
import { decimal, t } from '../lang'

// Demo 2 · Criterio y contrapropuesta, in the page's one frame. The window is
// Sightline's report in a browser; the rolling total a beat after the edit comes
// from Stageshow's examples/table-edit.
//
// The story: the report shows Cuaderno's Notas view as it is, its helper text
// marked. The cursor presses the mark and its criterion drops into the list
// on the right, carrying the others down. A press on Después: the helper text
// collapses, the list rises, the title has room; a beat later AA rolls from
// 72,0 to 79,5. It holds, then Antes brings it back by the same control and
// the criterion closes with it. Poster: después, criterion open, 79,5.

type S = { mark: boolean; card: boolean; after: boolean; score: number }

const BEFORE = 72
const AFTER = 79.5
const initial: S = { mark: true, card: false, after: false, score: BEFORE }
const poster: S = { mark: false, card: true, after: true, score: AFTER }


async function script(a: Act<S>) {
  await a.wait(900)
  a.mark('mark')
  await a.click({ at: 'help', x: 0.4, y: 0.5 })
  await a.set({ card: true })
  await a.wait(1600)

  a.mark('after')
  await a.click({ at: 'after', x: 0.5, y: 0.55 })
  await a.set({ after: true, mark: false })
  await a.wait(450)
  await a.set({ score: AFTER })
  await a.wait(2600)

  a.mark('before')
  await a.click({ at: 'before', x: 0.5, y: 0.55 })
  await a.set({ after: false, card: false, mark: true, score: BEFORE })
  await a.wait(900)
  await a.move('rest')
  await a.wait(300)
}

const NOTES = () =>
  t(
    [
      ['Viaje a Oaxaca', 'Ayer'],
      ['Lista del súper', 'Lunes'],
      ['Ideas para el taller', '28 oct'],
      ['Libros pendientes', '21 oct'],
      ['Cumpleaños de Ana', '12 oct'],
    ],
    [
      ['Oaxaca trip', 'Yesterday'],
      ['Groceries', 'Monday'],
      ['Workshop ideas', 'Oct 28'],
      ['Books to read', 'Oct 21'],
      ["Ana's birthday", 'Oct 12'],
    ],
  )

// The criteria already in the list, under the one that drops in
const OTHERS = () =>
  t(
    [
      ['Tutea el botón Compartir', 'voseo-en-copy'],
      ['Anima solo opacidad y posición', 'solo-opacity-y-transform'],
      ['Agranda la zona de Ajustes', 'zona-tactil-menor-a-44'],
    ],
    [
      ['Format the Share label', 'enums-crudos-nunca'],
      ['Animate only opacity and position', 'solo-opacity-y-transform'],
      ['Enlarge the Settings target', 'zona-tactil-menor-a-44'],
    ],
  )

export default function Criterio() {
  return (
    <Stage<S>
      width={550}
      height={440}
      compact={{ below: 500, width: 400, height: 340 }}
      initial={initial}
      poster={poster}
      script={script}
      accent={ACENTO}
      cursor={{ at: 'rest' }}
      className="marco cri"
    >
      {(s) => (
        <>
          <Window url="informe.html" className="marco-win cri-win">
            <div className="cri-report">
              <div className="cri-bar">
                <div className="cri-title">
                  <span className="cri-app">Cuaderno</span>
                  <span className="cri-sep">/</span>
                  <span className="cri-view">{t('Notas', 'Notes')}</span>
                </div>
                <Segmented className="cri-seg" items={t(['Antes', 'Después'], ['Before', 'After'])} value={s.after ? 1 : 0} targets={['before', 'after']} cursor="pointer" />
                <div className="cri-score">
                  <span className="cri-tier">AA</span>
                  <Count className="cri-num" value={s.score} format={decimal} duration={800} />
                </div>
              </div>

              <div className="cri-cols">
                <div className="cri-shot" data-crop>
                  <div className="cri-h">{t('Notas', 'Notes')}</div>
                  <Collapse open={!s.after}>
                    <div className="cri-help-wrap">
                      <span className="cri-help" data-target="help" data-cursor="pointer" data-mark={s.mark || undefined}>
                        {t('Aquí puedes ver y organizar todas tus notas', 'Here you can see and organize all your notes')}
                      </span>
                    </div>
                  </Collapse>
                  <div className="cri-search">
                    <Search size={15} strokeWidth={1.75} />
                    <span>{t('Buscar', 'Search')}</span>
                  </div>
                  <div className="cri-list">
                    {NOTES().map(([t, d]) => (
                      <div key={t} className="cri-row">
                        <span className="cri-row__t">{t}</span>
                        <span className="cri-row__d">{d}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="cri-side">
                  <Collapse open={s.card} reveal="drop">
                    <div className="cri-card">
                      <div className="cri-card__t">{t('Quita el texto de ayuda bajo el título', 'Remove the helper text under the title')}</div>
                      <div className="cri-card__rule">
                        texto-de-ayuda-y-eslogan <span className="cri-card__src">SOUL.md:18</span>
                      </div>
                      <div className="cri-card__xs">
                        <span data-up>{t('UX mejora', 'UX better')}</span>
                        <span>{t('DX igual', 'DX same')}</span>
                        <span>{t('AX igual', 'AX same')}</span>
                      </div>
                    </div>
                  </Collapse>
                  {OTHERS().map(([t, r]) => (
                    <div key={t} className="cri-other">
                      <div className="cri-other__t">{t}</div>
                      <div className="cri-other__r">{r}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Window>
          <span className="cri-rest" data-target="rest" />
        </>
      )}
    </Stage>
  )
}
