import { Phone, States, Stage, type Act, ACENTO } from './ss'
import './marco.css'
import './pila.css'

// La pila: cómo elijo entre shadcn, macOS/iOS y Material 3. A phone in the
// middle, run off the bottom: Cuaderno's note with its «Compartir» sheet at the
// medium detent. On the left, the four layers as chips; on the right, what the
// current one brings. The cursor presses each layer and the same sheet takes
// its job: shadcn the code and the focus, iOS the sheet with its grabber and
// 44 pt rows, Material 3 the tonal surface and the type scale, the brand what
// you see. It holds on the brand, then the first layer brings the sheet back
// to its bones. Poster: all four.

type S = { capa: number }

const CAPAS = [
  { n: 1, nombre: 'shadcn', aporta: 'El código y el foco: el anillo, los estados, ARIA.' },
  { n: 2, nombre: 'iOS', aporta: 'La interacción: hoja con agarre, filas de 44 pt.' },
  { n: 3, nombre: 'Material 3', aporta: 'El sistema: superficie tonal, escala, estados como capa.' },
  { n: 4, nombre: 'Marca', aporta: 'Lo único que se ve: Figtree, el blanco, la luz amarilla.' },
]

const ACCIONES = ['Copiar enlace', 'Mensajes', 'Correo', 'Exportar PDF', 'Imprimir']

async function script(a: Act<S>) {
  await a.wait(1100)
  for (const n of [2, 3, 4]) {
    a.mark(`capa-${n}`)
    await a.click({ at: `capa-${n}`, x: 0.85, y: 0.5 })
    await a.set({ capa: n })
    await a.wait(n === 4 ? 2800 : 1800)
  }
  a.mark('vuelta')
  await a.click({ at: 'capa-1', x: 0.85, y: 0.5 })
  await a.set({ capa: 1 })
  await a.wait(900)
  await a.move('rest')
  await a.wait(300)
}

export default function Pila() {
  return (
    <Stage<S>
      width={550}
      height={440}
      compact={{ below: 500, width: 400, height: 340 }}
      initial={{ capa: 1 }}
      poster={{ capa: 4 }}
      script={script}
      accent={ACENTO}
      cursor={{ at: 'rest' }}
      className="marco pil oscuro"
    >
      {(s, _rect, layout) => (
        <>
          <div className="pil-telefono">
            <Phone width={layout === 'wide' ? 230 : 200} frame="pro">
              <div className="pil-pantalla">
                <div className="pil-nota">
                  <div className="pil-nota__t">Oaxaca</div>
                  <div className="pil-nota__p">Mercado de Abastos</div>
                  <div className="pil-nota__p">Monte Albán</div>
                  <div className="pil-nota__p">Mole negro</div>
                  <div className="pil-nota__p">Hierve el Agua</div>
                </div>
                <div className="pil-velo" />
                <div className="pil-hoja" data-capa={s.capa}>
                  <span className="pil-hoja__agarre" />
                  <div className="pil-hoja__t">Compartir</div>
                  {ACCIONES.map((t, i) => (
                    <div key={t} className="pil-hoja__fila" data-primera={i === 0 || undefined}>
                      {t}
                    </div>
                  ))}
                </div>
              </div>
            </Phone>
          </div>

          <div className="pil-capas">
            {CAPAS.map((c) => (
              <div
                key={c.n}
                className="pil-capa"
                data-target={`capa-${c.n}`}
                data-cursor="pointer"
                data-activa={s.capa === c.n || undefined}
                data-hecha={s.capa > c.n || undefined}
              >
                <span className="pil-capa__marca" aria-hidden="true">
                  {s.capa > c.n ? '✓' : c.n}
                </span>
                {c.nombre}
              </div>
            ))}
          </div>

          {layout === 'wide' && (
            <div className="pil-aporta">
              <States
                align="start"
                value={String(s.capa)}
                states={Object.fromEntries(CAPAS.map((c) => [String(c.n), <span key={c.n}>{c.aporta}</span>]))}
              />
            </div>
          )}
          <span className="pil-reposo" data-target="rest" />
        </>
      )}
    </Stage>
  )
}
