// ==UserScript==
// @name         PokeAFK — Monitor de contas
// @namespace    pokeafk-market-filtros
// @version      0.4.0
// @description  Substituído pelo PokeAFK Tools (poke-tools.user.js). Esta versão só avisa para trocar de script.
// @homepageURL  https://github.com/keter45/pokeafk-tools
// @supportURL   https://github.com/keter45/pokeafk-tools/issues
// @updateURL    https://raw.githubusercontent.com/keter45/pokeafk-tools/main/pokeafk-monitor.user.js
// @downloadURL  https://raw.githubusercontent.com/keter45/pokeafk-tools/main/pokeafk-monitor.user.js
// @match        https://pokeafk.io/*
// @run-at       document-idle
// @grant        none
// @noframes
// ==/UserScript==

// Os scripts separados viraram um só, o PokeAFK Tools. Este arquivo ficou para os scripts antigos
// receberem esta última versão pelo @updateURL: ela não faz mais nada além de avisar a troca.
(() => {
  'use strict';

  const INSTALL = 'https://raw.githubusercontent.com/keter45/pokeafk-tools/main/poke-tools.user.js';
  const HIDE_KEY = 'pokeafk-tools:migrate-hidden';

  // The new script marks the page; give it a few seconds, since the run order is not fixed.
  setTimeout(() => {
    const root = document.documentElement;
    if ('pokeTools' in root.dataset || document.getElementById('pafk-migrate')) return;
    try {
      if (sessionStorage.getItem(HIDE_KEY)) return;
    } catch {
      // Without storage the notice shows on every load.
    }
    const box = document.createElement('div');
    box.id = 'pafk-migrate';
    box.dataset.pafk = '';
    box.setAttribute('role', 'status');
    box.innerHTML = `
      <p><strong>Os scripts do pokeAFK agora são um só: PokeAFK Tools.</strong>
        Instale o novo e depois desinstale “PokeAFK — Filtros do Mercado” e “PokeAFK — Monitor de contas”
        no painel do Tampermonkey. Seus filtros e o daily continuam salvos.</p>
      <div>
        <a href="${INSTALL}" target="_blank" rel="noopener noreferrer">Instalar PokeAFK Tools</a>
        <button type="button">Agora não</button>
      </div>`;
    Object.assign(box.style, {
      position: 'fixed', left: '50%', bottom: '16px', transform: 'translateX(-50%)', zIndex: '2147483000',
      width: 'min(560px, calc(100vw - 32px))', boxSizing: 'border-box', padding: '12px 14px',
      border: '1px solid #bed0ec', borderRadius: '10px', background: '#fff', color: '#152964',
      boxShadow: '0 6px 24px #10275240', font: '13px/1.4 system-ui, sans-serif',
    });
    box.querySelector('p').style.margin = '0 0 10px';
    Object.assign(box.querySelector('div').style, { display: 'flex', gap: '8px', justifyContent: 'flex-end' });
    const link = box.querySelector('a');
    Object.assign(link.style, {
      padding: '8px 12px', borderRadius: '6px', background: '#1958b8', color: '#fff',
      fontWeight: '700', textDecoration: 'none',
    });
    const later = box.querySelector('button');
    Object.assign(later.style, {
      padding: '8px 12px', border: '1px solid #bed0ec', borderRadius: '6px', background: '#fff',
      color: 'inherit', font: 'inherit', fontWeight: '700', cursor: 'pointer',
    });
    later.addEventListener('click', () => {
      try {
        sessionStorage.setItem(HIDE_KEY, '1');
      } catch {
        // Hidden for this page only.
      }
      box.remove();
    });
    document.body.append(box);
  }, 4000);
})();
