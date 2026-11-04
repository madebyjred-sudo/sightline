import { Prompt, Stage, Window, ACENTO } from './ss'
import './hero.css'

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
              <div className="hro-crit__t">Quita el texto de ayuda bajo el título</div>
              <div className="hro-crit__rule">
                texto-de-ayuda-y-eslogan <span>· SOUL.md:18</span>
              </div>
              <div className="hro-crit__xs">
                <span data-up>UX mejora</span>
                <span>DX igual</span>
                <span>AX igual</span>
              </div>
            </div>
          </div>

          <div className="hro-tile hro-b">
            <div className="hro-score__head">
              <span>Cuaderno</span>
              <span className="hro-chip">AA</span>
            </div>
            <div className="hro-score__n">81,4</div>
            <div className="hro-score__f">desde 72,0 · 23 hallazgos</div>
          </div>

          <div className="hro-tile hro-c">
            <Window chrome="terminal" title="cuaderno · zsh" className="hro-term">
              <div className="hro-term__body">
                <Prompt path="~/cuaderno">taste auditar</Prompt>
                <div className="ss-term__line">
                  <span className="ok">✓ </span>Ajustes <span className="dim">diálogo</span>
                </div>
                <div className="ss-term__line">
                  <span className="ok">✓ </span>checks <span className="dim">8 hallazgos</span>
                </div>
                <div className="ss-term__line hro-term__out">A 92,3 · AA 81,4 · AAA 76,0</div>
              </div>
            </Window>
          </div>

          <div className="hro-tile hro-d">
            <div className="hro-view">
              <div className="hro-view__h">Notas</div>
              <div className="hro-view__cut">Aquí puedes ver y organizar todas tus notas</div>
              <div className="hro-view__row">
                <span>Viaje a Oaxaca</span>
                <span>Ayer</span>
              </div>
              <div className="hro-view__row">
                <span>Lista del súper</span>
                <span>Hoy</span>
              </div>
              <div className="hro-view__row">
                <span>Hotel en Puerto</span>
                <span>Lunes</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </Stage>
  )
}
