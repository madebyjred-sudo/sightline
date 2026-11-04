import { Collapse, Count, Prompt, Caret, Stage, Window, type Act, ACENTO } from './ss'
import './marco.css'
import './auditar.css'
import { decimal, t } from '../lang'

// Demo 1 · Auditar, in the page's one frame (550 × 440, window off the right
// edge). The terminal is mid-session, never empty: the last audit of Cuaderno
// (AA 72,0) and the cleanup that followed are on screen. The new audit is
// typed at the bottom and its lines push the history up, one at a time, the
// way a terminal scrolls. The score card lands on the terminal's empty right
// side and rolls from the old AA to the new one. It holds, then the feed dips
// out and back in at the start. Poster: the finished run.

type S = { cmd: string; run: boolean; lines: number; card: boolean; score: number; dip: boolean }

const COMMAND = 'sightline auditar --repo ~/cuaderno'

type Line = { k: 'ok' | 'dim' | 'out' | 'cmd'; a: string; b?: string; wideOnly?: boolean }

// What the terminal already shows when the scene starts
// The views Cuaderno has, as the walk reports them
const VISTAS: Line[] = [
  { k: 'ok', a: '/', b: t('inicio', 'home') },
  { k: 'ok', a: t('/notas', '/notes'), b: t('página', 'page') },
  { k: 'ok', a: t('/notas/:id', '/notes/:id'), b: t('página', 'page') },
  { k: 'ok', a: t('Compartir', 'Share'), b: t('hoja', 'sheet') },
  { k: 'ok', a: t('Ajustes', 'Settings'), b: t('diálogo', 'dialog') },
]
const hallazgos = (n: number) => t(`${n} hallazgos`, `${n} findings`)
const tiers = (a: number, aa: number, aaa: number) => `A ${decimal(a)} · AA ${decimal(aa)} · AAA ${decimal(aaa)}`

const HISTORY: Line[] = [
  { k: 'cmd', a: 'sightline auditar --repo ~/cuaderno' },
  { k: 'dim', a: t('servidor', 'server'), b: 'localhost:5173' },
  ...VISTAS,
  { k: 'ok', a: 'transitions', b: hallazgos(9) },
  { k: 'ok', a: 'impeccable', b: hallazgos(14) },
  { k: 'ok', a: 'checks', b: hallazgos(11) },
  { k: 'out', a: tiers(86, 72, 66.3) },
  { k: 'cmd', a: 'sightline limpieza --repo ~/cuaderno' },
  { k: 'ok', a: t('12 criterios', '12 criteria'), b: t('9 en sightline/limpieza', '9 in sightline/limpieza') },
]

const LINES: Line[] = [
  { k: 'dim', a: t('servidor', 'server'), b: 'localhost:5173', wideOnly: true },
  ...VISTAS,
  { k: 'dim', a: t('ruido base', 'baseline noise'), b: t('0 vistas', '0 views'), wideOnly: true },
  { k: 'ok', a: 'transitions', b: hallazgos(6) },
  { k: 'ok', a: 'impeccable', b: hallazgos(9) },
  { k: 'ok', a: 'checks', b: hallazgos(8) },
  { k: 'out', a: tiers(92.3, 81.4, 76), wideOnly: true },
]
const BEFORE = 72
const SCORE = 81.4

const initial: S = { cmd: '', run: false, lines: 0, card: false, score: BEFORE, dip: false }
const poster: S = { cmd: COMMAND, run: true, lines: LINES.length, card: true, score: SCORE, dip: false }


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
              <Count className="aud-card__score" value={s.score} format={decimal} duration={900} />
              <div className="aud-card__foot">
                <span className="delta" data-show={s.score > BEFORE || undefined}>
                  +{decimal(9.4)}
                </span>{' '}
                {hallazgos(23)}
              </div>
            </div>
          </>
        )
      }}
    </Stage>
  )
}
