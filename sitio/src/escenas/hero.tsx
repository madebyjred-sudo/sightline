import { Prompt, Stage, Window, ACENTO } from './ss'
import './hero.css'
import { decimal, t } from '../lang'

// The hero under the intro, as on benji.org/stageshow: real pieces of Taste
// composed as one bento picture, built with the kit. A still: no script.
// Four tiles, four kinds (Stageshow's references/bento.md): the criterion
// on the amber of demo 2, the score on the neutral tile, the terminal on the
// violet of demo 1 and the view after the cut on the blue of demo 3.

export default function Hero() {
  return (
    <Stage width={550} height={372} compact={{ below: 500, width: 358, height: 594 }} initial={{}} className="hro" accent={ACENTO}>
      {() => (
        <div className="hro-grid">
          <div className="hro-tile hro-a">
            <div className="hro-crit">
              <div className="hro-crit__t">{t('Quita el texto de ayuda bajo el título', 'Remove the helper text under the title')}</div>
              <div className="hro-crit__rule">
                texto-de-ayuda-y-eslogan <span>· SOUL.md:18</span>
              </div>
              <div className="hro-crit__xs">
                <span data-up>{t('UX mejora', 'UX better')}</span>
                <span>{t('DX igual', 'DX same')}</span>
                <span>{t('AX igual', 'AX same')}</span>
              </div>
            </div>
          </div>

          <div className="hro-tile hro-b">
            <div className="hro-score__head">
              <span>Cuaderno</span>
              <span className="hro-chip">AA</span>
            </div>
            <div className="hro-score__n">{decimal(81.4)}</div>
            <div className="hro-score__f">
              <span className="delta">+{decimal(9.4)}</span> {t('23 hallazgos', '23 findings')}
            </div>
          </div>

          <div className="hro-tile hro-c">
            <Window chrome="terminal" title="cuaderno · zsh" className="hro-term">
              <div className="hro-term__body">
                <Prompt path="~/cuaderno">taste auditar</Prompt>
                <div className="ss-term__line">
                  <span className="ok">✓ </span>{t('Ajustes', 'Settings')} <span className="dim">{t('diálogo', 'dialog')}</span>
                </div>
                <div className="ss-term__line">
                  <span className="ok">✓ </span>checks <span className="dim">{t('8 hallazgos', '8 findings')}</span>
                </div>
                <div className="ss-term__line hro-term__out">A {decimal(92.3)} · AA {decimal(81.4)} · AAA {decimal(76)}</div>
              </div>
            </Window>
          </div>

          <div className="hro-tile hro-d">
            <div className="hro-view">
              <div className="hro-view__h">{t('Notas', 'Notes')}</div>
              <div className="hro-view__cut">{t('Aquí puedes ver y organizar todas tus notas', 'Here you can see and organize all your notes')}</div>
              <div className="hro-view__row">
                <span>{t('Viaje a Oaxaca', 'Oaxaca trip')}</span>
                <span>{t('Ayer', 'Nov 2')}</span>
              </div>
              <div className="hro-view__row">
                <span>{t('Lista del súper', 'Groceries')}</span>
                <span>{t('Hoy', 'Today')}</span>
              </div>
              <div className="hro-view__row">
                <span>{t('Hotel en Puerto', 'Hotel in Puerto')}</span>
                <span>{t('Lunes', 'Monday')}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </Stage>
  )
}
