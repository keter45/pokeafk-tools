// Helpers shared by the market modules. The tier sort that walked the market pages was removed
// in 2.0.0: the game now blocks clicks sent by scripts and reports them (see AGENTS.md).
const SPECIES_ROWS = '.mk-sptable .mk-itr.mk-spr, .mk-grid > article.mk-sp';

const marketMain = () => document.querySelector('.mk > .mk-main');
const currentPage = main => {
  const current = main.querySelector('.mk-pager .mk-pg[aria-current="page"]');
  return current ? Number(current.textContent) - 1 : 0;
};

function waitFor(test, timeout = 8000) {
  return new Promise(resolve => {
    const started = performance.now();
    const check = () => {
      if (test()) return resolve(true);
      if (performance.now() - started > timeout) return resolve(false);
      setTimeout(check, 120);
    };
    check();
  });
}
