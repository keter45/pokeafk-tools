// ---- Módulos ----
// Each part of the script can be turned off in the userscript manager's menu. The choice lives in
// the manager's storage (shared by every tab and container) and applies on the next page load.
const MODULES = {
  tiers: 'Tiers, filtros do mercado e ficha',
  daily: 'Daily de treinadores',
  monitor: 'Monitor de contas e troca entre contas',
  dodge: 'Desvio de golpes em área (experimental)',
};
// Experimental parts start turned off until the player turns them on in the menu.
const MODULES_OFF_BY_DEFAULT = new Set(['dodge']);
const MODULES_KEY = 'modules';
const hasModuleStore = typeof GM_getValue === 'function' && typeof GM_setValue === 'function';

function readModules() {
  let saved = {};
  try {
    saved = (hasModuleStore ? GM_getValue(MODULES_KEY, {}) : {}) || {};
  } catch {}
  return Object.fromEntries(Object.keys(MODULES).map(id => [id,
    typeof saved[id] === 'boolean' ? saved[id] : !MODULES_OFF_BY_DEFAULT.has(id)]));
}

const enabledModules = readModules();
const moduleEnabled = id => enabledModules[id] === true;

if (hasModuleStore && typeof GM_registerMenuCommand === 'function') {
  for (const [id, label] of Object.entries(MODULES)) {
    const on = moduleEnabled(id);
    GM_registerMenuCommand(`${on ? '✅' : '⬜'} ${label}`, () => {
      const next = { ...readModules(), [id]: !on };
      GM_setValue(MODULES_KEY, next);
      const verb = on ? 'desligado' : 'ligado';
      if (confirm(`${label}: ${verb}. Recarregar a página para aplicar?`)) location.reload();
    });
  }
}

// Lets the old separate scripts know this one is installed, so they stay quiet.
document.documentElement.dataset.pokeTools = '';
