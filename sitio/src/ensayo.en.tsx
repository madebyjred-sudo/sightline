import Hero from './escenas/hero'
import Auditar from './escenas/auditar'
import Criterio from './escenas/criterio'
import Nota from './escenas/nota'
import Pila from './escenas/pila'
import Mapa from './escenas/mapa'
import Menos from './escenas/menos'
import Cuaderno from './escenas/cuaderno'
import { Llevar, Prompt, REPO } from './llevar'

// The essay in English: ensayo.es.tsx, section for section. The ids stay the
// Spanish ones, so a link to a section works in both languages.

export const SECCIONES = [
  ['ejemplo', 'The example'],
  ['instalar', 'Install'],
  ['que-revisa', 'What it checks'],
  ['pila', 'The stack'],
  ['criterio', 'Criteria'],
  ['mapa', 'The vertical map'],
  ['menos', 'Less, but better'],
  ['modos', 'The five modes'],
  ['escenas', 'Scenes'],
  ['como-se-hizo', 'How it was made'],
  ['limites', 'Limits'],
  ['notas', 'Notes'],
] as const

export default function Ensayo() {
  return (
    <>
      <p>
        Sightline is a skill for your agent that walks through the interface of a running web app, view by view, and
        proposes how to leave it the way a demanding designer would. It's for people who build apps with agents and
        want the interface to hold up to that look.
      </p>

      <Llevar />

      <figure className="hero">
        <Hero />
        <figcaption>Made with Stageshow.</figcaption>
      </figure>

      <h2 id="ejemplo">The example: Cuaderno</h2>
      <p>
        To show what Sightline does, this page uses a made-up app: Cuaderno, a notes app with its list, its open note and
        its landing page. It has the flaws Sightline finds in real apps, and every demo from here on is Sightline working on it.
      </p>

      <figure className="demo" id="demo-cuaderno">
        <Cuaderno />
        <figcaption>Cuaderno as it is. The light walks the window the way Sightline walks a view, and lights up wherever there's something to fix.</figcaption>
      </figure>

      <h2 id="instalar">Install</h2>
      <p>Paste this into your agent (Claude Code, Codex or Cursor), open in your app's folder:</p>
      <Prompt />
      <p>Or by hand, once:</p>
      <pre className="comando">
        <span className="n">
          1{'\n'}2{'\n'}3{'\n'}4
        </span>
        <code>
          <span className="c">git</span> clone {REPO} ~/sightline{'\n'}
          <span className="c">cd</span> ~/sightline <span className="f">&amp;&amp;</span> <span className="c">npm</span> install{'\n'}
          <span className="c">npx</span> playwright install chromium{'\n'}
          <span className="c">sh</span> instalar.sh
        </code>
      </pre>
      <p>
        That puts the skill in Claude Code (and in Hermes, if you use it) and the <code>sightline</code> command in{' '}
        <code>~/.local/bin</code>. Then, from any folder:
      </p>
      <pre className="comando">
        <span className="n">1</span>
        <code>
          <span className="c">sightline</span> auditar <span className="f">--repo</span> ~/your-app
        </code>
      </pre>

      <figure className="demo" id="demo-auditar">
        <Auditar />
        <figcaption>Cuaderno after the cleanup: Sightline walks every view again and AA goes from 72.0 to 81.4.</figcaption>
      </figure>

      <h2 id="que-revisa">What it checks</h2>
      <p>
        Sightline starts your dev server and walks every view it finds: routes, tabs, sheets and dialogs. It captures each
        one on desktop, at 1440 × 900, and on mobile, at 390 × 844. It does it twice, to measure how much a view changes
        on its own and not mistake a clock or live data for a regression.
      </p>
      <p>
        Findings come from three sources: transitions-agent for motion<sup><a href="#n2" id="r2">2</a></sup>, Impeccable
        as a detector<sup><a href="#n3" id="r3">3</a></sup> and Sightline's own checks. Each one falls under one of 178
        rules, and every rule says where it came from: the file and line of the correction that started it. 19 have a
        deterministic check; the rest is judgment.
      </p>
      <p>
        The rules come in three tiers. A is the minimum, AA is what's asked for by default and AAA adds everything. A
        tier passes at 85, 75 and 70 points, with no serious findings of its own. The free profile can propose new
        pieces; the strict one never touches tokens or brand.
      </p>

      <h2 id="pila">The stack</h2>
      <p>
        Sightline doesn't choose between shadcn, macOS or Material 3: it uses all three, each for what it's good at, and the
        brand on top. shadcn brings the code and the accessibility. macOS and iOS bring the interaction: 44 points,
        sheets with a grabber, springs, keyboard. Material 3 brings the system: color roles, a type scale, states as
        layers. The brand is the only thing you see.
      </p>

      <figure className="demo" id="demo-pila">
        <Pila />
        <figcaption>The same Share sheet, layer by layer. The brand comes in last and is the only thing you see.</figcaption>
      </figure>

      <p>
        When two clash, the one whose domain the clash is in wins. And you import the laws, never the look: if a screen
        looks like Apple or looks like Google, the brand failed. How much each one weighs depends on the product:
      </p>
      <table className="modos">
        <thead>
          <tr>
            <th scope="col">Product</th>
            <th scope="col">Leads</th>
            <th scope="col">Why</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Tool</td>
            <td>macOS and iOS</td>
            <td>The experience is the interaction: three columns, keyboard, editing in place.</td>
          </tr>
          <tr>
            <td>Showcase</td>
            <td>The brand</td>
            <td>What you see is the product; iOS brings only the touch laws.</td>
          </tr>
          <tr>
            <td>Mixed</td>
            <td>Each view</td>
            <td>Working views as a tool, presentation views as a showcase.</td>
          </tr>
        </tbody>
      </table>
      <p>
        If a repo doesn't have these decisions yet, <code>sightline fundar</code> deduces them from the code and writes them
        down. From then on, every audit measures against them.
      </p>

      <h2 id="criterio">Criteria and counterproposal</h2>
      <p>
        For each finding, your agent writes a criterion: one sentence, the rule, its source and what happens to the
        experience of whoever uses the app, whoever codes it and the agent that touches it next. If anything gets worse,
        it's dropped. What's left is applied in a clone on its own branch, never in your repo, and the report shows
        every view before and after.
      </p>

      <figure className="demo" id="demo-criterio">
        <Criterio />
        <figcaption>A click on what's marked opens its criterion. Then it's removed and the title can breathe.</figcaption>
      </figure>

      <h2 id="mapa">The vertical map</h2>
      <p>
        Sightline cuts each view into sections, top to bottom, and measures three things on each: how hard it hits, how
        much information it carries and how cinematic it is. That gives every section a role: a hit, condensed or
        undecided, the middle gray nobody thought about.
      </p>

      <figure className="demo" id="demo-mapa">
        <Mapa />
        <figcaption>The undecided section gets condensed and its score goes from 58 to 86.</figcaption>
      </figure>

      <p>
        Every component has its score. Half is quality measured on the page, like contrast or the smallest text; the
        other half is composition, how well it plays the role of its section. In a hit, cinema weighs most; in a
        condensed section, that the dense part reads. Every audit leaves a <code>mapa.html</code> with each view's strip.
      </p>

      <h2 id="menos">Less, but better</h2>
      <p>
        What drives Sightline is the Bauhaus: less is more, but understood from the problem being solved. Before proposing
        anything, your agent writes in one sentence what problem each section solves. The one that solves none is
        proposed for removal.
      </p>

      <figure className="demo" id="demo-menos">
        <Menos />
        <figcaption>Testimonials solves no problem: it goes, and the dead area drops.</figcaption>
      </figure>

      <p>
        Sightline also measures dead area, what holds nothing. In a tool, more than 25 % is wasted space; in a showcase, air
        is intentional up to 60 %. And it always tries removing before adding.
      </p>

      <h2 id="modos">The five modes</h2>
      <table className="modos">
        <thead>
          <tr>
            <th scope="col">Mode</th>
            <th scope="col">What it does</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Correction</td>
            <td>Fixes the findings without changing the layout or the pieces.</td>
          </tr>
          <tr>
            <td>Cleanup</td>
            <td>Only removes: slogans, helper text, secondary labels, duplicates and dead styles.</td>
          </tr>
          <tr>
            <td>Improvement</td>
            <td>Polishes within the scheme you already have.</td>
          </tr>
          <tr>
            <td>Editing</td>
            <td>Does only what you ask, and nothing else.</td>
          </tr>
          <tr>
            <td>Creation</td>
            <td>Builds a new screen or component from the library.</td>
          </tr>
        </tbody>
      </table>

      <h2 id="escenas">Scenes, with Stageshow</h2>
      <p>
        Stageshow is by <a href="https://benji.org/stageshow">Benji Taylor</a>
        <sup><a href="#n1" id="r1">1</a></sup>, MIT licensed, and its code is at{' '}
        <a href="https://github.com/benjitaylor/skills">github.com/benjitaylor/skills</a>. Sightline uses it as is: its
        seven-step flow, its kit, its reference examples and its filmed rehearsal. The demos on this page are made with
        it.
      </p>
      <p>
        What Sightline adds is order and memory. The scene is built on the screen once it's clean, with the product's real
        tokens, and every approved scene is kept as a reference for the next one.
      </p>

      <figure className="demo" id="demo-escena">
        <Nota />
        <figcaption>Cuaderno on macOS 26. A note opens from the list and the previous one comes back with a click.</figcaption>
      </figure>

      <h2 id="como-se-hizo">How it was made</h2>
      <p>
        Every rule was born from a real correction, made by hand on an interface, and keeps the file and line it came
        from. The deterministic checks were measured on real repos before entering the catalog.
      </p>

      <h2 id="limites">Limits</h2>
      <p>
        Sightline doesn't invent ideas: it finds what's extra and what's wrong, and proposes with what already exists. Nor
        does it replace looking; the before and after captures are there for you to look at. And the Stageshow rehearsal
        is a hint, not a verdict: on its own reference examples, half pass.
      </p>
      <p>
        Sightline was written in Spanish. The commands and the rule names are in Spanish; your agent writes the criteria and
        the report in your language.
      </p>

      <footer className="notas">
        <h2 id="notas">Notes</h2>
        <ol>
          <li id="n1">
            Stageshow, by Benji Taylor. MIT license. <a href="https://benji.org/stageshow">benji.org/stageshow</a>.{' '}
            <a href="#r1" aria-label="Back to the text">↩</a>
          </li>
          <li id="n2">
            transitions-agent, by Jakub Antalik, the motion scanner. MIT license.{' '}
            <a href="https://transitions.dev">transitions.dev</a>. <a href="#r2" aria-label="Back to the text">↩</a>
          </li>
          <li id="n3">
            Impeccable, by Paul Bakaus, the detector. Apache-2.0 license.{' '}
            <a href="https://impeccable.style">impeccable.style</a>. <a href="#r3" aria-label="Back to the text">↩</a>
          </li>
          <li>Cuaderno and its notes are made up for this page. Cuaderno is Spanish for notebook.</li>
        </ol>
      </footer>
    </>
  )
}
