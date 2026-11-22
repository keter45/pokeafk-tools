// Diálogo da tier list (PvE e Competitivo) aberto pelo botão "Tier list" do mercado.
function createTierDialog(trigger) {
  const dialog = document.createElement('dialog');
  dialog.id = 'pafk-tier-dialog';
  dialog.setAttribute('aria-labelledby', 'pafk-tier-title');
  dialog.innerHTML = `
    <header class="pafk-tier-header">
      <h3 id="pafk-tier-title">Tier list de Pokémon</h3>
      <button type="button" data-close-tier>Fechar</button>
    </header>
    <div class="pafk-tier-content">
      <div class="pafk-mode-switch" role="group" aria-label="Tier list">
        ${Object.entries(MODES).map(([mode, { label }]) => `<button type="button" data-rank-mode="${mode}" aria-pressed="false">${label}</button>`).join('')}
      </div>
      <p>Cada forma final usa até 4 golpes entre os aprendidos por nível na linha evolutiva e as HMs vendidas na Loja de Celadon. TMs ficam de fora porque só saem, ao acaso, da TM Box. Lendários, míticos e Megas ficam numa categoria separada. <a href="https://pokeafk.io/pokepedia/" target="_blank" rel="noopener noreferrer">Dados da Poképédia</a></p>
      <details data-rank-help="pve">
        <summary>Como a nota PvE é calculada</summary>
        <p>Simula 60 s de caça como o AUTO: usa o golpe pronto mais forte, respeitando recarga e o intervalo entre golpes, que diminui com a Velocidade. Golpes em área acertam mais do bando quanto maior a área: um cone de 4 quadrados (Surf, Flamethrower) ou um círculo de raio 3 (Earthquake) pega os 3 do bando, com 75% do dano em cada um; um cone de 2 quadrados, pouco mais de um. Reforços como Swords Dance e Growth são usados uma vez e repetidos quando o efeito acaba, sem acumular. Sunny Day e Rain Dance contam enquanto duram. A nota 100 é a espécie normal com mais dano por segundo.</p>
      </details>
      <details data-rank-help="pvp" hidden>
        <summary>Como a nota competitiva é calculada</summary>
        <p>Simula duelos de até 180 s contra um atacante físico e um especial de referência, com as regras do jogo e o AUTO da Ranqueada: reforços e reduções de atributo usados uma vez e repetidos quando acabam, sono, paralisia, queimadura, veneno, confusão, recargas de batalha e até 4 curas. No PvP os jogadores desviam: golpes que marcam o chão (projétil, feixe, investida, cone, círculo, área, salto) erram mais quanto maior o tempo de preparo (nada abaixo de 0,25 s, até 70% a partir de 0,75 s); corpo a corpo e golpes que seguem o alvo nunca erram por isso. Enquanto prepara um golpe, o Pokémon fica parado e não desvia dos ataques do oponente. Velocidade e reforços como Agility encurtam o intervalo entre golpes. Cobertura de tipos e resistências também contam. 70% da nota vem do duelo e 30% da referência competitiva da Gen 3 (tiers e sets da Smogon e do Pokémon Showdown). Essa referência é reduzida quando o set da Smogon depende de golpes que a espécie não aprende por nível.</p>
      </details>
      <div class="pafk-tier-controls">
        <label>Espécie<input type="search" placeholder="Buscar evolução final" data-rank-search autofocus></label>
        <label>Categoria<select data-rank-category>
          ${Object.entries(CATEGORIES).map(([value, label]) => `<option value="${value}">${label}</option>`).join('')}
        </select></label>
        <label>Tier<select data-rank-tier><option value="">Todos</option>
          ${TIERS.map(tier => `<option>${tier}</option>`).join('')}
        </select></label>
        <label>Perfil<select data-rank-role><option value="">Todos</option>
          ${Object.entries(ROLES).map(([role, label]) => `<option value="${role}">${label}</option>`).join('')}
        </select></label>
        <label>Ordenar por<select data-rank-sort>
          <option value="score">Maior nota</option><option value="name">Nome</option>
        </select></label>
      </div>
      <div class="pafk-tier-table" role="region" aria-label="Tabela da tier list" tabindex="0">
        <table>
          <thead><tr>
            <th scope="col">Espécie</th><th scope="col">Tier</th><th scope="col">Nota</th><th scope="col">Perfil</th>
            <th scope="col">IVs prioritários</th><th scope="col">Golpes recomendados</th><th scope="col" data-gen3-col>Gen 3</th>
          </tr></thead>
          <tbody></tbody>
        </table>
      </div>
      <p data-rank-empty hidden>Nenhum Pokémon encontrado.</p>
      <footer class="pafk-tier-pagination">
        <p role="status" data-rank-status></p>
        <div>
          <button type="button" data-rank-prev>Anterior</button>
          <button type="button" data-rank-next>Próxima</button>
        </div>
      </footer>
    </div>`;

  const modeButtons = [...dialog.querySelectorAll('[data-rank-mode]')];
  let mode = readMode();
  const search = dialog.querySelector('[data-rank-search]');
  const category = dialog.querySelector('[data-rank-category]');
  const tier = dialog.querySelector('[data-rank-tier]');
  const role = dialog.querySelector('[data-rank-role]');
  const sort = dialog.querySelector('[data-rank-sort]');
  const table = dialog.querySelector('.pafk-tier-table');
  const body = table.querySelector('tbody');
  const empty = dialog.querySelector('[data-rank-empty]');
  const status = dialog.querySelector('[data-rank-status]');
  const previous = dialog.querySelector('[data-rank-prev]');
  const next = dialog.querySelector('[data-rank-next]');
  let page = 0;

  function searchKey(text) {
    return text.trim().normalize('NFD').replace(/\p{Diacritic}/gu, '').toLocaleLowerCase('pt-BR');
  }

  function renderPage() {
    const query = searchKey(search.value);
    for (const button of modeButtons) button.setAttribute('aria-pressed', String(button.dataset.rankMode === mode));
    for (const help of dialog.querySelectorAll('[data-rank-help]')) help.hidden = help.dataset.rankHelp !== mode;
    dialog.querySelector('[data-gen3-col]').hidden = mode !== 'pvp';
    const filtered = rankedProfiles.filter(profile => (category.value === 'all' || profile.category === category.value)
      && (!tier.value || profile[mode].tier === tier.value)
      && (!role.value || profile[mode].role === role.value)
      && (!query || searchKey(profile.name).includes(query)));
    filtered.sort(sort.value === 'name'
      ? (left, right) => left.name.localeCompare(right.name, 'pt-BR')
      : (left, right) => right[mode].score - left[mode].score || left.name.localeCompare(right.name, 'pt-BR'));

    const pageCount = Math.ceil(filtered.length / RANK_PAGE_SIZE);
    const offset = page * RANK_PAGE_SIZE;
    body.replaceChildren(...filtered.slice(offset, offset + RANK_PAGE_SIZE).map(profile => {
      const row = document.createElement('tr');
      const name = document.createElement('th');
      name.scope = 'row';
      name.textContent = profile.name;
      if (profile.category === 'special') {
        const tag = document.createElement('small');
        tag.className = 'pafk-category-tag';
        tag.textContent = profile.isMega ? 'Mega' : 'Lendário';
        name.append(' ', tag);
      }
      row.append(name);
      const build = profile[mode];
      const tierCell = row.insertCell();
      const tierBadge = document.createElement('span');
      tierBadge.className = TIER_BADGE;
      tierBadge.append(tierSegment(mode, build.tier, false));
      tierCell.append(tierBadge);
      const values = [scoreFormat.format(build.score), ROLES[build.role] ?? build.role,
        priorityText(build) || '—', build.moves.join(', ') || '—'];
      for (const value of values) row.insertCell().textContent = value;
      row.cells[2].title = build.note ?? '';
      if (mode === 'pvp') {
        const smogon = build.smogon;
        const cell = row.insertCell();
        cell.textContent = smogon
          ? `${smogon.tier ?? '—'}${smogon.slots ? ` · ${smogon.covered}/${smogon.slots}` : ''}` : '—';
        cell.title = build.note ?? '';
      }
      return row;
    }));
    table.hidden = !filtered.length;
    empty.hidden = Boolean(filtered.length);
    status.textContent = filtered.length ? `Página ${page + 1} de ${pageCount} · ${filtered.length} Pokémon` : '';
    previous.disabled = page === 0;
    next.disabled = page + 1 >= pageCount;
  }

  function resetPage() {
    page = 0;
    renderPage();
  }

  for (const button of modeButtons) {
    button.addEventListener('click', () => {
      mode = button.dataset.rankMode;
      saveMode(mode);
      resetPage();
    });
  }
  search.addEventListener('input', resetPage);
  for (const control of [category, tier, role, sort]) control.addEventListener('change', resetPage);
  previous.addEventListener('click', () => {
    page--;
    renderPage();
  });
  next.addEventListener('click', () => {
    page++;
    renderPage();
  });
  dialog.querySelector('[data-close-tier]').addEventListener('click', () => dialog.close());
  dialog.addEventListener('keydown', event => {
    event.stopPropagation();
    if (event.key === 'Escape') {
      event.preventDefault();
      dialog.close();
    }
  });
  dialog.addEventListener('close', () => {
    if (trigger.isConnected) trigger.focus();
  });
  document.body.append(dialog);
  renderPage();
  return dialog;
}
