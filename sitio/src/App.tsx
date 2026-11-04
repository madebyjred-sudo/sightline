import { useEffect, useState } from 'react'
import Hero from './escenas/hero'
import Auditar from './escenas/auditar'
import Criterio from './escenas/criterio'
import Nota from './escenas/nota'
import Pila from './escenas/pila'
import Mapa from './escenas/mapa'
import Menos from './escenas/menos'
import { Llevar, Prompt, REPO } from './llevar'

// The title in ASCII (figlet, Small Slant), its period in the accent
const MARCA = [
  '  __           __',
  ' / /____ ____ / /____',
  '/ __/ _ `(_-</ __/ -_)',
  '\\__/\\_,_/___/\\__/\\__',
].join('\n')

const SECCIONES = [
  ['instalar', 'Instalar'],
  ['que-revisa', 'Qué revisa'],
  ['pila', 'La pila'],
  ['criterio', 'Criterio'],
  ['mapa', 'El mapa vertical'],
  ['menos', 'Menos, pero pensado'],
  ['modos', 'Los cinco modos'],
  ['escenas', 'Escenas'],
  ['como-se-hizo', 'Cómo se hizo'],
  ['limites', 'Límites'],
  ['notas', 'Notas'],
] as const

function Indice() {
  const [activa, setActiva] = useState<string>('')
  useEffect(() => {
    const els = SECCIONES.map(([id]) => document.getElementById(id)).filter(Boolean) as HTMLElement[]
    const alto = () => {
      let actual = ''
      for (const el of els) if (el.getBoundingClientRect().top < window.innerHeight * 0.35) actual = el.id
      setActiva(actual)
    }
    alto()
    window.addEventListener('scroll', alto, { passive: true })
    return () => window.removeEventListener('scroll', alto)
  }, [])
  return (
    <nav className="indice" aria-label="Secciones">
      <a className="indice__arriba" href="#top">
        ↑ Arriba
      </a>
      <div className="indice__titulo">
        <span className="solo-lectores">Taste</span>
        <pre className="marca marca--chica" aria-hidden="true">
          {MARCA}
          <b>(_)</b>
        </pre>
      </div>
      <ul>
        {SECCIONES.map(([id, nombre]) => (
          <li key={id}>
            <a href={`#${id}`} aria-current={activa === id ? 'true' : undefined}>
              {nombre}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}

export default function App() {
  return (
    <>
      <Indice />
      <main className="ensayo" id="top">
        <header className="cabeza">
          <h1>
            <span className="solo-lectores">Taste</span>
            <pre className="marca" aria-hidden="true">
              {MARCA}
              <b>(_)</b>
            </pre>
          </h1>
          <div className="cabeza__linea">
            <time dateTime="2026-11-03">3 de noviembre, 2026</time>
            <a href={REPO}>GitHub</a>
          </div>
        </header>

        <p>
          Taste es una skill para tu agente que recorre la interfaz de una app web en marcha, vista por vista, y propone
          cómo dejarla como la haría un diseñador exigente. Es para quien construye apps con agentes y quiere que la
          interfaz aguante esa mirada.
        </p>

        <Llevar />

        <figure className="hero">
          <Hero />
          <figcaption>Hecho con Stageshow.</figcaption>
        </figure>

        <h2 id="instalar">Instalar</h2>
        <p>Pégale esto a tu agente (Claude Code, Codex o Cursor) abierto en la carpeta de tu app:</p>
        <Prompt />
        <p>O a mano, una vez:</p>
        <pre className="comando">
          <span className="n">
            1{'\n'}2{'\n'}3{'\n'}4
          </span>
          <code>
            <span className="c">git</span> clone {REPO} ~/taste{'\n'}
            <span className="c">cd</span> ~/taste <span className="f">&amp;&amp;</span> <span className="c">npm</span> install{'\n'}
            <span className="c">npx</span> playwright install chromium{'\n'}
            <span className="c">sh</span> skill/instalar.sh
          </code>
        </pre>
        <p>
          Eso deja la skill en Claude Code (y en Hermes, si lo usas) y el comando <code>taste</code> en{' '}
          <code>~/.local/bin</code>. Después, desde cualquier carpeta:
        </p>
        <pre className="comando">
          <span className="n">1</span>
          <code>
            <span className="c">taste</span> auditar <span className="f">--repo</span> ~/tu-app
          </code>
        </pre>

        <figure className="demo" id="demo-auditar">
          <Auditar />
          <figcaption>Cuaderno después de la limpieza: Taste vuelve a recorrer cada vista y el AA pasa de 72,0 a 81,4.</figcaption>
        </figure>

        <h2 id="que-revisa">Qué revisa</h2>
        <p>
          Taste levanta tu servidor de desarrollo y recorre todas las vistas que encuentra: rutas, pestañas, hojas y
          diálogos. Captura cada una en escritorio, a 1440 × 900, y en móvil, a 390 × 844. Lo hace dos veces, para medir
          cuánto cambia una vista sola y no confundir un reloj o un dato vivo con una regresión.
        </p>
        <p>
          Los hallazgos salen de tres fuentes: transitions-agent para el movimiento<sup><a href="#n2" id="r2">2</a></sup>,
          Impeccable como detector<sup><a href="#n3" id="r3">3</a></sup> y los checks propios de Taste. Cada uno cae en una
          de 169 reglas, y cada regla dice de dónde salió: el archivo y la línea de la corrección que la originó. 19
          tienen un check determinista; el resto es criterio.
        </p>
        <p>
          Las reglas van en tres tiers. A es lo mínimo, AA es lo que se pide por defecto y AAA lo suma todo. Un tier
          aprueba con 85, 75 y 70 puntos, sin hallazgos graves propios. El perfil libre puede proponer piezas nuevas; el
          estricto nunca toca tokens ni marca.
        </p>

        <h2 id="pila">La pila</h2>
        <p>
          Taste no elige entre shadcn, macOS o Material 3: usa los tres, cada uno en lo suyo, y la marca encima. shadcn
          pone el código y la accesibilidad. macOS e iOS ponen la interacción: 44 puntos, hojas con agarre, resortes,
          teclado. Material 3 pone el sistema: roles de color, escala tipográfica, estados como capas. La marca es lo
          único que se ve.
        </p>

        <figure className="demo" id="demo-pila">
          <Pila />
          <figcaption>La misma hoja de Compartir, capa por capa. La marca entra al final y es lo único que se ve.</figcaption>
        </figure>

        <p>
          Cuando dos chocan, gana la del dominio del choque. Y se importan las leyes, nunca el look: si una pantalla se ve
          Apple o se ve Google, falló la marca. Cuánto pesa cada una depende del producto:
        </p>
        <table className="modos">
          <thead>
            <tr>
              <th scope="col">Producto</th>
              <th scope="col">Manda</th>
              <th scope="col">Por qué</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Herramienta</td>
              <td>macOS e iOS</td>
              <td>La experiencia es la interacción: tres columnas, teclado, editar en el sitio.</td>
            </tr>
            <tr>
              <td>Vitrina</td>
              <td>La marca</td>
              <td>Lo que se ve es el producto; iOS pone solo las leyes táctiles.</td>
            </tr>
            <tr>
              <td>Mixto</td>
              <td>Cada vista</td>
              <td>Las vistas de trabajo como herramienta, las de presentación como vitrina.</td>
            </tr>
          </tbody>
        </table>
        <p>
          Si un repo todavía no tiene estas decisiones, <code>taste fundar</code> las deduce del código y las escribe.
          Desde ahí, cada auditoría las usa como vara.
        </p>

        <h2 id="criterio">Criterio y contrapropuesta</h2>
        <p>
          Por cada hallazgo, tu agente escribe un criterio: una frase, la regla, su fuente y qué pasa con la experiencia
          de quien usa la app, de quien la programa y del agente que la toque después. Si algo empeora, se descarta. Lo
          que queda se aplica en un clon con rama propia, nunca en tu repo, y el informe muestra cada vista antes y
          después.
        </p>

        <figure className="demo" id="demo-criterio">
          <Criterio />
          <figcaption>Un clic en lo marcado abre su criterio. Después lo quita y el título respira.</figcaption>
        </figure>

        <h2 id="mapa">El mapa vertical</h2>
        <p>
          Taste corta cada vista en secciones, de arriba abajo, y a cada una le mide tres cosas: cuánto golpea, cuánta
          información carga y qué tan cinematográfica es. Con eso cada sección tiene un rol: golpe, condensado o sin
          decidir, el gris medio que nadie pensó.
        </p>

        <figure className="demo" id="demo-mapa">
          <Mapa />
          <figcaption>La sección sin decidir se condensa y su puntaje pasa de 58 a 86.</figcaption>
        </figure>

        <p>
          Cada componente tiene su puntaje. La mitad es calidad medida en la página, como el contraste o el texto más
          chico; la otra mitad es composición, qué tan bien cumple el rol de su sección. En un golpe pesa el cine; en un
          condensado, que lo denso se lea. Cada auditoría deja un <code>mapa.html</code> con la tira de cada vista.
        </p>

        <h2 id="menos">Menos, pero pensado</h2>
        <p>
          Lo que mueve a Taste es la Bauhaus: menos es más, pero entendido desde el problema que se resuelve. Antes de
          proponer, tu agente escribe en una frase qué problema resuelve cada sección. La que no resuelve ninguno se
          propone quitar.
        </p>

        <figure className="demo" id="demo-menos">
          <Menos />
          <figcaption>Testimonios no resuelve ningún problema: se va, y el área muerta baja.</figcaption>
        </figure>

        <p>
          Taste también mide el área muerta, lo que no ocupa nada. En una herramienta, más de un 25 % es espacio perdido;
          en una vitrina, el aire es intencional hasta el 60 %. Y siempre se prueba quitar antes de agregar.
        </p>

        <h2 id="modos">Los cinco modos</h2>
        <table className="modos">
          <thead>
            <tr>
              <th scope="col">Modo</th>
              <th scope="col">Qué hace</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Corrección</td>
              <td>Arregla los hallazgos sin cambiar el layout ni las piezas.</td>
            </tr>
            <tr>
              <td>Limpieza</td>
              <td>Solo quita: eslóganes, textos de ayuda, etiquetas secundarias, duplicados y estilos muertos.</td>
            </tr>
            <tr>
              <td>Mejora</td>
              <td>Pule dentro del esquema que ya tienes.</td>
            </tr>
            <tr>
              <td>Edición</td>
              <td>Hace solo lo que pides, y nada más.</td>
            </tr>
            <tr>
              <td>Creación</td>
              <td>Arma una pantalla o un componente nuevo desde la biblioteca.</td>
            </tr>
          </tbody>
        </table>

        <h2 id="escenas">Escenas, con Stageshow</h2>
        <p>
          Stageshow es de <a href="https://benji.org/stageshow">Benji Taylor</a>
          <sup><a href="#n1" id="r1">1</a></sup>, con licencia MIT, y su código está en{' '}
          <a href="https://github.com/benjitaylor/skills">github.com/benjitaylor/skills</a>. Taste lo usa tal cual: su
          flujo de siete pasos, su kit, sus ejemplos de referencia y su ensayo filmado. Las demos de esta página están
          hechas con él.
        </p>
        <p>
          Lo que agrega Taste es el orden y la memoria. La escena se arma sobre la pantalla ya limpia, con los tokens
          reales del producto, y cada escena aprobada se guarda como referencia para la siguiente.
        </p>

        <figure className="demo" id="demo-escena">
          <Nota />
          <figcaption>Cuaderno en macOS 26. Una nota se abre desde la lista y la anterior vuelve con un clic.</figcaption>
        </figure>

        <h2 id="como-se-hizo">Cómo se hizo</h2>
        <p>
          Cada regla nació de una corrección real, hecha a mano sobre una interfaz, y guarda el archivo y la línea de
          donde salió. Los checks deterministas se midieron sobre repos reales antes de entrar al catálogo.
        </p>

        <h2 id="limites">Límites</h2>
        <p>
          Taste no inventa ideas: encuentra lo que sobra y lo que está mal, y propone con lo que ya existe. Tampoco
          reemplaza mirar; las capturas de antes y después están para que las mires tú. Y el ensayo de Stageshow es una
          pista, no un veredicto: en sus propios ejemplos de referencia pasa la mitad.
        </p>

        <footer className="notas">
          <h2 id="notas">Notas</h2>
          <ol>
            <li id="n1">
              Stageshow, de Benji Taylor. Licencia MIT. <a href="https://benji.org/stageshow">benji.org/stageshow</a>.{' '}
              <a href="#r1" aria-label="Volver al texto">↩</a>
            </li>
            <li id="n2">
              transitions-agent, de Jakub Antalik, el escáner de movimiento. Licencia MIT.{' '}
              <a href="https://transitions.dev">transitions.dev</a>. <a href="#r2" aria-label="Volver al texto">↩</a>
            </li>
            <li id="n3">
              Impeccable, de Paul Bakaus, el detector. Licencia Apache-2.0.{' '}
              <a href="https://impeccable.style">impeccable.style</a>. <a href="#r3" aria-label="Volver al texto">↩</a>
            </li>
            <li>Cuaderno y sus notas son inventados para esta página.</li>
          </ol>
        </footer>
      </main>
    </>
  )
}
