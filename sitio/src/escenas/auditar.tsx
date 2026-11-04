import { Collapse, Count, Prompt, Caret, Stage, Window, type Act, ACENTO } from './ss'
import './marco.css'
import './auditar.css'

// Demo 1 · Auditar, in the page's one frame (550 × 440, window off the right
// edge). The terminal is mid-session, never empty: the last audit of Cuaderno
// (AA 72,0) and the cleanup that followed are on screen. The new audit is
// typed at the bottom and its lines push the history up, one at a time, the
// way a terminal scrolls. The score card lands on the terminal's empty right
// side and rolls from the old AA to the new one. It holds, then the feed dips
// out and back in at the start. Poster: the finished run.

type S = { cmd: string; run: boolean; lines: number; card: boolean; score: number; dip: boolean }

const COMMAND = 'taste auditar --repo ~/cuaderno'

type Line = { k: 'ok' | 'dim' | 'out' | 'cmd'; a: string; b?: string; wideOnly?: boolean }

// What the terminal already shows when the scene starts
const HISTORY: Line[] = [
  { k: 'cmd', a: 'taste auditar --repo ~/cuaderno' },
  { k: 'dim', a: 'servidor', b: 'localhost:5173' },
  { k: 'ok', a: '/', b: 'inicio' },
  { k: 'ok', a: '/notas', b: 'página' },
  { k: 'ok', a: '/notas/:id', b: 'página' },
  { k: 'ok', a: 'Compartir', b: 'hoja' },
  { k: 'ok', a: 'Ajustes', b: 'diálogo' },
  { k: 'ok', a: 'transitions', b: '9 hallazgos' },
  { k: 'ok', a: 'impeccable', b: '14 hallazgos' },
  { k: 'ok', a: 'checks', b: '11 hallazgos' },
  { k: 'out', a: 'A 86,0 · AA 72,0 · AAA 66,3' },
  { k: 'cmd', a: 'taste limpieza --repo ~/cuaderno' },
  { k: 'ok', a: '12 criterios', b: '9 en taste/limpieza' },
]

const LINES: Line[] = [
  { k: 'dim', a: 'servidor', b: 'localhost:5173', wideOnly: true },
  { k: 'ok', a: '/', b: 'inicio' },
  { k: 'ok', a: '/notas', b: 'página' },
  { k: 'ok', a: '/notas/:id', b: 'página' },
  { k: 'ok', a: 'Compartir', b: 'hoja' },
  { k: 'ok', a: 'Ajustes', b: 'diálogo' },
  { k: 'dim', a: 'ruido base', b: '0 vistas', wideOnly: true },
  { k: 'ok', a: 'transitions', b: '6 hallazgos' },
  { k: 'ok', a: 'impeccable', b: '9 hallazgos' },
  { k: 'ok', a: 'checks', b: '8 hallazgos' },
  { k: 'out', a: 'A 92,3 · AA 81,4 · AAA 76,0', wideOnly: true },
]
const BEFORE = 72
const SCORE = 81.4

const initial: S = { cmd: '', run: false, lines: 0, card: false, score: BEFORE, dip: false }
const poster: S = { cmd: COMMAND, run: true, lines: LINES.length, card: true, score: SCORE, dip: false }

const fmt = (n: number) => n.toFixed(1).replace('.', ',')

async function script(a: Act<S>) {
  await a.wait(500)
  a.mark('type')
  await a.type('cmd', COMMAND)
  await a.wait(250)
  await a.key('enter')
  await a.set({ run: true })
  await a.wait(400)

  a.mark('views')
  for (let i = 1; i <= LINES.length; i++) {
    await a.set({ lines: i })
    await a.wait(i < 7 ? 380 : 300)
  }
  await a.wait(300)

  a.mark('score')
  await a.set({ card: true })
  await a.wait(350)
  await a.set({ score: SCORE })
  await a.wait(3400)

  a.mark('reset')
  await a.set({ card: false, dip: true })
  await a.wait(320)
  await a.snap({ cmd: '', run: false, lines: 0, score: BEFORE })
  await a.set({ dip: false })
  await a.wait(400)
}

function Row({ l }: { l: Line }) {
  if (l.k === 'cmd') return <Prompt path="~/cuaderno">{l.a}</Prompt>
  return (
    <div className="ss-term__line aud-line" data-k={l.k}>
      <span className={l.k === 'ok' ? 'ok aud-tick' : 'dim aud-tick'}>{l.k === 'ok' ? '✓' : l.k === 'dim' ? '·' : ''}</span>
      <span className="aud-a">{l.a}</span>
      {l.b && <span className={l.k === 'dim' ? 'dim aud-b' : 'aud-b'}>{l.b}</span>}
    </div>
  )
}

export default function Auditar() {
  return (
    <Stage<S>
      width={550}
      height={440}
      compact={{ below: 500, width: 400, height: 340 }}
      initial={initial}
      poster={poster}
      script={script}
      accent={ACENTO}
      keys={{ wide: 'bottom-left', compact: 'top' }}
      className="marco aud"
    >
      {(s, _rect, layout) => {
        const wide = layout === 'wide'
        const keep = (l: Line) => wide || !l.wideOnly
        const shown = LINES.filter(keep)
        const count = wide ? s.lines : LINES.slice(0, s.lines).filter(keep).length
        return (
          <>
            <Window chrome="terminal" title="cuaderno · zsh" className="marco-win aud-term">
              <div className="aud-body">
                <div className="aud-feed" data-dip={s.dip || undefined}>
                  {HISTORY.filter(keep).map((l, i) => (
                    <Row key={`h-${i}`} l={l} />
                  ))}
                  <Prompt path="~/cuaderno">
                    {s.cmd}
                    {!s.run && <Caret still={s.cmd.length > 0 && s.cmd.length < COMMAND.length} />}
                  </Prompt>
                  {shown.map((l, i) => (
                    <Collapse key={`n-${l.a}`} open={count > i}>
                      <Row l={l} />
                    </Collapse>
                  ))}
                </div>
              </div>
            </Window>

            <div className="marco-sat aud-card" data-show={s.card || undefined}>
              <div className="aud-card__head">
                <span className="aud-card__app">Cuaderno</span>
                <span className="aud-card__tier">AA</span>
              </div>
              <Count className="aud-card__score" value={s.score} format={fmt} duration={900} />
              <div className="aud-card__foot">
                <span className="delta" data-show={s.score > BEFORE || undefined}>
                  +9,4
                </span>{' '}
                23 hallazgos
              </div>
            </div>
          </>
        )
      }}
    </Stage>
  )
}
