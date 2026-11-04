import { useState } from 'react'
import { t } from './lang'

// Where Sightline lives once published, and the two prompts that take it to
// someone's own AI: the full one for a coding agent that can run commands
// (copied), and a reading one for a chat that can only open links.
export const REPO = 'https://github.com/madebyjred-sudo/sightline'

export const PROMPT_AGENTE = () =>
  t(
    [
      `Instala Sightline en este equipo: clona ${REPO} en ~/sightline, y dentro corre npm install, npx playwright install chromium y sh instalar.sh.`,
      'Después audita esta app con sightline auditar --repo . y muéstrame el puntaje por tier y los hallazgos por vista, cada uno con su criterio.',
      'No cambies nada de la app sin preguntarme.',
    ],
    [
      `Install Sightline on this machine: clone ${REPO} into ~/sightline, and inside it run npm install, npx playwright install chromium and sh instalar.sh.`,
      'Then audit this app with sightline auditar --repo . and show me the score by tier and the findings by view, each with its criterion, in English.',
      "Don't change anything in the app without asking me.",
    ],
  ).join(' ')

const PROMPT_CHAT = () =>
  t(
    `Lee ${REPO} y ayúdame a usar Sightline con mi app: qué hace, qué necesito tener instalado y los pasos para la primera auditoría.`,
    `Read ${REPO} and help me use Sightline with my app: what it does, what I need installed and the steps for the first audit.`,
  )

const claude = () => `https://claude.ai/new?q=${encodeURIComponent(PROMPT_CHAT())}`
const chatgpt = () => `https://chatgpt.com/?q=${encodeURIComponent(PROMPT_CHAT())}`

// The Clipboard API first; where a browser or an embed blocks it, the old
// selection copy, which still works inside the click
async function copiar(texto: string) {
  try {
    await navigator.clipboard.writeText(texto)
    return true
  } catch {
    const campo = document.createElement('textarea')
    campo.value = texto
    campo.setAttribute('readonly', '')
    campo.style.position = 'fixed'
    campo.style.opacity = '0'
    document.body.appendChild(campo)
    campo.select()
    const ok = document.execCommand('copy')
    campo.remove()
    return ok
  }
}

function Copiar({ texto, children, className }: { texto: string; children: string; className?: string }) {
  const [hecho, setHecho] = useState(false)
  return (
    <button
      type="button"
      className={className}
      onClick={async () => {
        // If neither works, the prompt is still on the page to select
        if (!(await copiar(texto))) return
        setHecho(true)
        setTimeout(() => setHecho(false), 1600)
      }}
    >
      <span aria-live="polite">{hecho ? t('Copiado', 'Copied') : children}</span>
    </button>
  )
}

/** The row under the intro: one action that does the work, two that explain. */
export function Llevar() {
  return (
    <div className="llevar">
      <Copiar texto={PROMPT_AGENTE()} className="boton boton--lleno">
        {t('Copiar para tu agente', 'Copy for your agent')}
      </Copiar>
      <a className="boton" href={claude()} target="_blank" rel="noreferrer">
        {t('Abrir en Claude', 'Open in Claude')} <span aria-hidden="true">↗</span>
      </a>
      <a className="boton" href={chatgpt()} target="_blank" rel="noreferrer">
        {t('Abrir en ChatGPT', 'Open in ChatGPT')} <span aria-hidden="true">↗</span>
      </a>
    </div>
  )
}

/** The prompt itself, shown whole at the install step, with its copy. */
export function Prompt() {
  return (
    <div className="prompt">
      <p className="prompt__texto">{PROMPT_AGENTE()}</p>
      <Copiar texto={PROMPT_AGENTE()} className="boton boton--chico">
        {t('Copiar', 'Copy')}
      </Copiar>
    </div>
  )
}
