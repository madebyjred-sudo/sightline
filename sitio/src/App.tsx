import { useEffect, useState } from 'react'
import { t } from './lang'
import { REPO } from './llevar'
import EnsayoEs, { SECCIONES as SECCIONES_ES } from './ensayo.es'
import EnsayoEn, { SECCIONES as SECCIONES_EN } from './ensayo.en'

// The title in ASCII (figlet, Small Slant), its period in the accent. The g's
// descender is the last line, so it comes after the period.
const MARCA = [
  '       _      __   __  ___',
  '  ___ (_)__ _/ /  / /_/ (_)__  ___',
  ' (_-</ / _ `/ _ \\/ __/ / / _ \\/ -_)',
  '/___/_/\\_, /_//_/\\__/_/_/_//_/\\__',
].join('\n')
const COLA = '\n      /___/'

const SECCIONES = t<readonly (readonly [string, string])[]>(SECCIONES_ES, SECCIONES_EN)
const Ensayo = t(EnsayoEs, EnsayoEn)

// The other language's page, kept on the section the reader is at
const OTRO = t({ href: '/en/', nombre: 'English', lang: 'en' }, { href: '/', nombre: 'Español', lang: 'es' })

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
    <nav className="indice" aria-label={t('Secciones', 'Sections')}>
      <a className="indice__arriba" href="#top">
        ↑ {t('Arriba', 'Top')}
      </a>
      <div className="indice__titulo">
        <span className="solo-lectores">Sightline</span>
        <pre className="marca marca--chica" aria-hidden="true">
          {MARCA}
          <b>(_)</b>
          {COLA}
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
  // The page renders after load, so the browser can't find the hash's section
  // on its own; this takes the reader there (the language switch keeps it)
  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.slice(1))
    if (id) document.getElementById(id)?.scrollIntoView()
  }, [])
  return (
    <>
      <Indice />
      <main className="ensayo" id="top">
        <header className="cabeza">
          <h1>
            <span className="solo-lectores">Sightline</span>
            <pre className="marca" aria-hidden="true">
              {MARCA}
              <b>(_)</b>
              {COLA}
            </pre>
          </h1>
          <div className="cabeza__linea">
            <time dateTime="2026-11-03">{t('3 de noviembre, 2026', 'November 3, 2026')}</time>
            <a href={REPO}>GitHub</a>
            <a
              href={OTRO.href}
              hrefLang={OTRO.lang}
              lang={OTRO.lang}
              onClick={(e) => {
                e.preventDefault()
                window.location.href = OTRO.href + window.location.hash
              }}
            >
              {OTRO.nombre}
            </a>
          </div>
        </header>
        <Ensayo />
      </main>
    </>
  )
}
