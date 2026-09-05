import './style.css'
import heroImg from './assets/hero.png'
import typescriptLogo from './assets/typescript.svg'
import viteLogo from './assets/vite.svg'
import { setupCounter } from './counter.ts'

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
<section id="center">
  <div class="hero">
    <img src="${heroImg}" class="base" width="170" height="179">
  <div class="app-shell">
    <aside class="sidebar">
      <div class="brand"><span class="brand-mark">↯</span><span>counterpoint</span><span class="beta">BETA</span></div>
      <div class="side-label">Workspace</div>
      <button class="nav-item active"><span>✦</span> New decision <kbd>⌘ N</kbd></button>
      <button class="nav-item"><span>◷</span> Decision history</button>
      <div class="side-label criteria-label">Your criteria</div>
      <div class="criteria-list">
        <button class="criterion"><span class="dot amber"></span> Financial upside</button>
        <button class="criterion"><span class="dot coral"></span> Career growth</button>
        <button class="criterion"><span class="dot blue"></span> Lifestyle fit</button>
        <button class="criterion"><span class="dot green"></span> Risk tolerance</button>
      </div>
      <div class="sidebar-footer"><div class="avatar">AR</div><div><strong>Alex Rivera</strong><small>Personal workspace</small></div><span class="more">•••</span></div>
    </aside>

    <main class="main-content">
      <header class="topbar"><div class="breadcrumb">Decisions <span>/</span> New decision</div><div class="top-actions"><button class="icon-btn" aria-label="Help">?</button><button class="text-btn">How it works <span>↗</span></button></div></header>

      <section class="intro">
        <div class="eyebrow"><span class="pulse"></span> EVIDENCE-LED DECISIONS</div>
        <h1>Think it through.<br><em>Then decide.</em></h1>
        <p>Put a real decision on trial. Two independent advocates<br class="desktop-only"> will research the strongest case for each side.</p>
      </section>

      ${renderResults()}
    </main>
  </div>`
  bindEvents()
