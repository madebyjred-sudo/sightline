import { type ReactNode } from 'react'
import { ChevronLeft, ChevronRight, Clock, Folder, NotebookText, Users } from 'lucide-react'
import { Stage, Text, Window, States, type Act, ACENTO } from './ss'
import './marco.css'
import './nota.css'

// Demo 3 · a scene of Cuaderno in the page's one frame (Stageshow's
// finder-glass chrome: macOS 26, floating sidebar, large lights, tall bar).
//
// The story: Viajes is open on «Lista del súper». The cursor presses «Viaje a
// Oaxaca» in the list; the selection moves to it and the reading pane turns
// to the note, its title, date and lines arriving a few ms apart. It holds,
// then a press on «Lista del súper» brings the first note back, which is
// where the loop began. The pane is never empty.

type S = { oax: boolean }

const initial: S = { oax: false }
const poster: S = { oax: true }

const LIST: { t: string; d: string; target?: string }[] = [
  { t: 'Lista del súper', d: 'Hoy', target: 'super' },
  { t: 'Viaje a Oaxaca', d: 'Ayer', target: 'oax' },
  { t: 'Hotel en Puerto', d: 'Lunes' },
  { t: 'Vuelos de diciembre', d: '28 oct' },
  { t: 'Mapa de Lisboa', d: '12 oct' },
  { t: 'Maletas', d: '2 oct' },
]

const NOTES = {
  super: {
    t: 'Lista del súper',
    d: 'Hoy, 9:12',
    p: ['Tortillas, aguacates y limones.', 'Café de Chiapas, molido medio.', 'Queso Oaxaca para el domingo.', 'Flor de calabaza si hay.', 'Pan dulce para el desayuno.'],
  },
  oax: {
    t: 'Viaje a Oaxaca',
    d: 'Ayer, 18:40',
    p: ['Mercado de Abastos el sábado temprano.', 'Reservar la visita a Monte Albán.', 'Probar el mole negro en el centro.', 'Hierve el Agua el domingo.', 'Volver con mezcal y chapulines.'],
  },
}

async function script(a: Act<S>) {
  await a.wait(900)
  a.mark('open')
  await a.click({ at: 'oax', x: 0.5, y: 0.5 })
  await a.set({ oax: true })
  await a.wait(3200)
  a.mark('back')
  await a.click({ at: 'super', x: 0.5, y: 0.5 })
  await a.set({ oax: false })
  await a.wait(1400)
  await a.move('rest')
  await a.wait(400)
}

export default function Nota() {
  return (
    <Stage<S>
      width={550}
      height={440}
      compact={{ below: 500, width: 400, height: 340 }}
      initial={initial}
      poster={poster}
      script={script}
      accent={ACENTO}
      greys="cool"
      cursor={{ at: 'rest' }}
      className="marco nta"
    >
      {(s, _rect, layout) => {
        const wide = layout === 'wide'
        return (
          <>
            <Window
              className="marco-win nta-window"
              sidebarWidth={wide ? 156 : 132}
              sidebarStyle="floating"
              lightsSize="large"
              barSize="tall"
              sidebar={<Sidebar wide={wide} />}
              lead={
                <span className="nta-lead">
                  <span className="nta-cap nta-nav">
                    <span className="nta-nav__btn">
                      <ChevronLeft {...tb} />
                    </span>
                    <span className="nta-nav__rule" />
                    <span className="nta-nav__btn">
                      <ChevronRight {...tb} className="nta-off" />
                    </span>
                  </span>
                  <span className="nta-heading">Viajes</span>
                </span>
              }
              body={{ className: 'nta-body', 'data-crop': true }}
            >
              <div className="nta-cols">
                <div className="nta-list">
                  {LIST.map((n) => {
                    const sel = (n.target === 'oax' && s.oax) || (n.target === 'super' && !s.oax)
                    return (
                      <div key={n.t} className="nta-row" data-target={n.target} data-cursor={n.target ? 'pointer' : undefined} data-sel={sel || undefined}>
                        <span className="nta-row__t">{n.t}</span>
                        <span className="nta-row__d">{n.d}</span>
                      </div>
                    )
                  })}
                </div>
                <div className="nta-pane">
                  <States
                    className="nta-states"
                    value={s.oax ? 'oax' : 'super'}
                    states={{ super: <Note n={NOTES.super} />, oax: <Note n={NOTES.oax} /> }}
                  />
                </div>
              </div>
            </Window>
            <span className="nta-rest" data-target="rest" />
          </>
        )
      }}
    </Stage>
  )
}

function Note({ n }: { n: { t: string; d: string; p: string[] } }) {
  return (
    <div className="nta-note">
      <div className="nta-note__d">{n.d}</div>
      <div className="nta-note__t">{n.t}</div>
      {n.p.map((p) => (
        <div key={p} className="nta-note__p">
          {p}
        </div>
      ))}
    </div>
  )
}

const tb = { size: 16, strokeWidth: 1.6 }

function Sidebar({ wide }: { wide: boolean }) {
  const ic = { size: 16, strokeWidth: 1.6 }
  const item = (icon: ReactNode, label: string, current?: boolean) => (
    <div className="nta-side__item" data-current={current || undefined}>
      <span className="nta-side__icon">{icon}</span>
      <Text>{label}</Text>
    </div>
  )
  return (
    <div className="nta-side">
      {item(<NotebookText {...ic} />, wide ? 'Todas las notas' : 'Todas')}
      {item(<Clock {...ic} />, 'Recientes')}
      {item(<Users {...ic} />, 'Compartidas')}
      <Text className="nta-side__label">Carpetas</Text>
      {item(<Folder {...ic} />, 'Viajes', true)}
      {item(<Folder {...ic} />, 'Casa')}
      {item(<Folder {...ic} />, 'Trabajo')}
      {item(<Folder {...ic} />, 'Ideas')}
    </div>
  )
}
