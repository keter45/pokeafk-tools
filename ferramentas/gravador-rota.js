// Gravador de caminho (ferramenta de pesquisa, não faz parte do userscript). Grava o que o jogador
// faz para ir de um NPC a outro, como base de um script que faça isso sozinho: teclas e cliques
// reais (isTrusted), o ponto clicado no canvas do mundo (em pixels do canvas, 1:1 com a tela do
// jogo), os avisos de mapa (.map-popup), os desafios (.b5-challenge), as janelas abertas e o
// começo e o fim das lutas. Roda na página com (0, eval)(código).
//
// Uso: __pafkRoute.status(), __pafkRoute.stop(), __pafkRoute.json().
(() => {
  if (window.__pafkRoute) window.__pafkRoute.stop();
  const t0 = performance.now();
  const now = () => Math.round(performance.now() - t0);
  const route = { v: 1, startedAt: new Date().toISOString(), events: [] };
  const add = (type, data) => route.events.push({ t: now(), type, ...data });

  function worldCanvas() {
    return [...document.querySelectorAll('canvas')]
      .filter(c => c.width && !c.dataset.pafk && c.getBoundingClientRect().width / c.width > 1.2
        && !c.closest('[hidden]') && !c.classList.contains('title-scene'))
      .sort((a, b) => b.width * b.height - a.width * a.height)[0];
  }

  const onKey = e => {
    if (!e.isTrusted || e.repeat) return;
    add(e.type, { key: e.key, code: e.code });
  };
  const onPointer = e => {
    if (!e.isTrusted) return;
    const canvas = worldCanvas();
    const r = canvas?.getBoundingClientRect();
    const onCanvas = canvas && e.target === canvas;
    add('click', {
      x: Math.round(e.clientX), y: Math.round(e.clientY),
      canvas: onCanvas ? [Math.round((e.clientX - r.left) * canvas.width / r.width), Math.round((e.clientY - r.top) * canvas.height / r.height)] : null,
      target: (e.target.closest?.('[class]')?.className?.toString() || e.target.tagName).slice(0, 60),
      text: (e.target.closest?.('button, a, [role="button"]')?.textContent || '').trim().slice(0, 40),
    });
  };
  addEventListener('keydown', onKey, true);
  addEventListener('keyup', onKey, true);
  addEventListener('pointerdown', onPointer, true);

  let last = {};
  const watch = setInterval(() => {
    const state = {
      map: document.querySelector('.map-popup')?.textContent.trim() || '',
      challenge: document.querySelector('.b5-challenge')?.innerText.replace(/\s+/g, ' ').trim().slice(0, 80) || '',
      modal: document.querySelector('.modal.open')?.querySelector('h1, h2, .title, header')?.textContent.trim().slice(0, 40) || '',
      arena: !!document.querySelector('.in-arena'),
      result: document.querySelector('.ah-result')?.dataset.result || '',
      next: document.querySelector('.ah-result-next')?.textContent.trim().slice(0, 100) || '',
    };
    for (const [k, v] of Object.entries(state)) if (v !== last[k]) add(k, { value: v });
    last = state;
  }, 200);

  window.__pafkRoute = {
    route,
    status: () => ({ t: now(), events: route.events.length, last: route.events.slice(-5) }),
    stop() {
      clearInterval(watch);
      removeEventListener('keydown', onKey, true);
      removeEventListener('keyup', onKey, true);
      removeEventListener('pointerdown', onPointer, true);
    },
    json: () => JSON.stringify(route),
  };
  return 'gravador de rota ligado';
})();
