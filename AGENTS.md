# Instruções do projeto

Leia e siga `F:\Projetos\AGENTS.md` antes de iniciar o design ou a implementação visual neste projeto.

## O que é

Um userscript do **Tampermonkey**, o **PokeAFK Tools** (`poke-tools.user.js`), para o jogo [pokeAFK](https://pokeafk.io/) (Chrome e Firefox, o mesmo arquivo serve nos dois). O código fica dividido em módulos em `src/` e `build-userscript.mjs` junta tudo num arquivo só (pedido do usuário: um script principal que reúne os outros). Ele:

- filtra anúncios de Pokémon no **Mercado da Comunidade** (natureza e IV mínimo);
- mostra o selo de tier **PvE** e **Competitivo** ao lado do nome da espécie no mercado (lista, cartões e página da espécie), na janela **MAPA** (lista de hunts e cartão da hunt selecionada) e na **ficha do Pokémon**;
- no MAPA, ao lado do selo de tier, o gasto médio para capturar o Pokémon principal da hunt (pedido do usuário; detalhes no `title`);
- recomenda natureza, IVs prioritários e moveset de 4 golpes (painel no mercado e seção "Moveset recomendado" na ficha);
- abre uma tier list (diálogo no mercado) com as duas listas;
- ordena a lista agrupada do mercado por tier (percorre as páginas do servidor);
- botão **Daily** (abaixo de "Poke Market", no HUD): luta com todos os treinadores do dia na ordem da lista do MAPA ordenada por XP ("Mais XP primeiro"), com progresso "Faltam N" e botão Parar.

- monitor de contas (pedido do usuário, que joga com 4 contas em 4 abas do Firefox, em contêineres diferentes): dá a cada aba do jogo um título e um ícone com a conta, o estado (caçando, daily, batalha, parado) e as contagens de bolas e poções, e mostra o painel **Contas** com todas as contas abertas.
- botão **DESVIO** (pedido do usuário; **experimental, desligado por padrão**) ao lado de AUTO/MANUAL na barra de COMBATE: durante a caça, sai andando dos golpes em área inimigos que dá tempo de evitar (só os lentos, só na aba em foco).

Cada grupo (tiers e mercado, daily, monitor, desvio) pode ser desligado no menu do Tampermonkey (`src/settings.js`, chave `modules` no armazenamento `GM_*`; vale ao recarregar). Grupos experimentais (`MODULES_OFF_BY_DEFAULT`, hoje só o desvio) começam desligados até o jogador ligar no menu.

**Scripts antigos:** `pokeafk-market-filtros.user.js` e `pokeafk-monitor.user.js` viraram avisos de migração. Ficam no repositório para quem já os tem instalados receber essa última versão pelo `@updateURL`: depois de 4 s, se a página não tem `html[data-poke-tools]` (marcado pelo PokeAFK Tools), mostram um aviso com o link de instalação e pedem para desinstalar os antigos. Não volte a pôr código neles.

Há também uma página, `tierlist.html`, gerada a partir dos mesmos dados e publicada no GitHub Pages: https://keter45.github.io/pokeafk-tools/ (o `index.html` redireciona para ela).

O usuário escreve em português do Brasil. Todo texto de interface fica em pt-BR.

## Arquivos

| Arquivo | Papel |
|---|---|
| `poke-tools.user.js` | O userscript instalado (gerado por `build-userscript.mjs`; não edite à mão). |
| `src/meta.js` | Cabeçalho do userscript (`@version`, grants, `@sandbox JavaScript`). |
| `src/settings.js` | Liga e desliga os módulos (menu do Tampermonkey) e marca `html[data-poke-tools]`. |
| `src/data/guide.js`, `src/data/dex.js`, `src/data/capture.js` | Dados gerados por `build-data.mjs`: `MARKET_GUIDE` (perfis, tiers, tipos por dex), `DEX` (`"Nome:tipo"` por dex, usado pelo monitor) e `CAPTURE` (`hunts: {id: [dex, nível ao capturar, preço]}` do principal de cada hunt, `certainAt`, `profitSchedule`, preços da Poké e da Ultra Ball; grupo tiers). Não edite à mão. |
| `src/tiers/*.js`, `src/market/*.js` | Grupo **tiers**: constantes e selos (`tiers/common.js`), MAPA e ficha (`tiers/badges.js`), tier list (`tiers/dialog.js`), CSS (`tiers/styles.js`), filtros e recomendação (`market/filters.js`, `market/panel.js`, `market/state.js`), ordenação por tier (`market/tier-sort.js`) e o observador (`tiers/observer.js`). Dividem um escopo só, na ordem de `GROUPS` em `build-userscript.mjs`. |
| `src/daily.js`, `src/monitor.js`, `src/dodge.js` | Daily de treinadores, monitor de contas e desvio de golpes, cada um no próprio escopo. O daily só usa `MARKET_GUIDE.types` de fora; o desvio não usa nada de fora. |
| `pokeafk-market-filtros.user.js`, `pokeafk-monitor.user.js` | Avisos de migração para quem tem os scripts antigos (veja acima). |
| `collect-pokepedia.mjs` | Baixa o catálogo do jogo (módulo `selectStyle-*.js` da Poképédia) e gera `pokepedia-data.json`: espécies (`id`, `key`, stats, tipos, evoluções, golpes por nível com parâmetros de combate), formas Mega, HMs e TMs. |
| `collect-competitive.mjs` | Baixa referências da Gen 3 (sets da Smogon via data.pkmn.cc, tiers e random battles do Pokémon Showdown) e gera `competitive-data.json`. |
| `rank-pokemon.mjs` | Motor do ranking (`buildGuide`). Simula PvE e duelo, escolhe loadout, natureza e IVs, calcula tiers. |
| `build-data.mjs` | Roda `buildGuide` (com HMs) e escreve `src/data/guide.js` (só os campos que a interface usa) e `src/data/dex.js`. |
| `build-userscript.mjs` | Junta `src/` em `poke-tools.user.js` (rápido; rode depois de qualquer mudança em `src/`). |
| `build-tierlist-page.mjs` | Gera `tierlist.html` (página autônoma com dados embutidos, imagens do jogo e links para a Poképédia), com as abas PvE, Competitivo e Farms early game. |
| `farms.mjs` | `buildFarms`: hunts de Kanto com Pokémon de primeiro estágio cuja evolução final é S ou A, com o preço de captura estimado. |
| `capture.mjs` | `captureRules(snapshot)`: preço de captura (`price`), nível ao capturar (`caughtLevel`) e o par numa hunt (`inHunt`), copiando as funções `J1`/`Vu` do módulo `selectStyle-*.js` (veja "Captura" abaixo). `levelPrice` e `roundPrice` também servem às farms. |
| `pokepedia-data.json`, `competitive-data.json` | Dados coletados (gerados; não edite à mão). |

O projeto é um repositório git público: [keter45/pokeafk-tools](https://github.com/keter45/pokeafk-tools) (branch `main`). Os commits usam o e-mail anônimo do GitHub (`user.email` local); não troque pelo e-mail pessoal. O GitHub Pages publica a branch `main` na raiz; depois de regenerar `tierlist.html`, o site só muda com commit e push. Faça commit só quando o usuário pedir.

## Comandos

```powershell
node collect-pokepedia.mjs        # atualiza pokepedia-data.json a partir do site
node collect-competitive.mjs      # atualiza competitive-data.json (Smogon/Showdown)
node build-data.mjs               # recompila src/data/ a partir dos dados (~5 s)
node build-userscript.mjs         # junta src/ em poke-tools.user.js
node build-tierlist-page.mjs      # regenera tierlist.html
node --check poke-tools.user.js
```

Sempre que mudar `rank-pokemon.mjs` ou os dados: rode `build-data.mjs`, `build-userscript.mjs`, `build-tierlist-page.mjs` e `node --check`. Ao mudar qualquer arquivo de `src/`, rode `build-userscript.mjs`, suba `@version` em `src/meta.js` e faça commit de `src/` e de `poke-tools.user.js` juntos. O Tampermonkey busca a versão nova em `@updateURL` (arquivo bruto da branch `main` no GitHub), então a atualização só chega ao usuário depois do push.

## Erros já cometidos (leia antes de editar qualquer coisa)

Um agente anterior deixou o Daily quebrado no Tampermonkey (corrigido na v1.3.4). Os treinadores apareciam como "Inacessível" mesmo parados ao lado do jogador, e o daily parava depois de 4 seguidos. Foram três erros somados. Evite cada um em qualquer arquivo de `src/`:

1. **Supor que o código roda como na página.** Ele chamava `dispatchEvent(...)` solto, como se estivesse no `window` da página. No Tampermonkey do Firefox com grants `GM_*`, o script roda num sandbox em que alguns globais existem (`addEventListener`, `innerWidth`, `setTimeout`) e outros não: `dispatchEvent` dava "(intermediate value).dispatchEvent is not a function".
   - **Regra:** chame métodos de evento da janela por um alvo explícito: `document.defaultView.dispatchEvent(...)` (no daily, `pageWindow`). Não confie que um global solto existe só porque outro funciona. Antes de terminar, procure chamadas soltas com `grep -nE "(^|[^.\w])(dispatchEvent|removeEventListener)\(" src/*.js src/*/*.js`; o resultado deve vir vazio.
2. **Testar num ambiente que esconde o erro.** O teste pelo navegador embutido roda o código com `(0, eval)` direto na página, onde `dispatchEvent` solto funciona. O teste passou, e o erro só aparecia no Tampermonkey do usuário.
   - **Regra:** ao testar no navegador embutido, embrulhe o código enviado em `(() => { const dispatchEvent = undefined; … })()`, junto com qualquer outro global novo que o código use solto. Na resposta ao usuário, diga que o teste não foi no Tampermonkey real.
3. **Engolir erro inesperado como se fosse resposta do jogo.** O `catch` do laço do daily tratava qualquer exceção como "o jogo não respondeu": marcava o treinador como inacessível e seguia. Um bug do script virou um falso "Inacessível", e o motivo só aparecia em letra miúda na rota.
   - **Regra:** `catch` que pula, ignora ou tenta de novo só aceita o erro esperado (no daily, `NoResponse`, lançado por `until` quando o tempo esgota). Qualquer outro erro sobe, para o fluxo e mostra a mensagem ao usuário. Não escreva `catch {}` em volta de lógica, só em volta de `localStorage`/`JSON.parse` e de leituras opcionais do DOM.

Além disso, ao mexer num módulo:

- **Contagens:** o que não dá para fazer hoje (lugar fechado, bloqueado, evitado) não entra no "Faltam N".
- **Marcação duplicada:** o painel do daily tinha `data-daily-status` e `data-daily-route` repetidos, e `querySelector` só pegava o primeiro. Ao editar HTML em template string, confira se cada `data-*` usado por `querySelector` aparece uma vez só.
- **Testes longos no navegador embutido:** `javascript_tool` corta em 45 s. Acompanhe um fluxo longo (o daily) com várias chamadas curtas que só leem o estado do painel. Não clique na página durante a execução, porque clique real (`isTrusted`) para o daily.
- **Fim do trabalho:** rode `build-userscript.mjs` e `node --check`, suba `@version` e registre aqui o que aprendeu sobre o jogo ou o ambiente.

## Regras decididas com o usuário (não mude sem perguntar)

- **Golpes considerados:** golpes por nível da linha evolutiva inteira (o jogo deixa relembrar golpes das pré-evoluções até o nível do Pokémon) **+ as 7 HMs vendidas na Loja de Celadon** (Cut, Rock Smash, Strength, Surf, Waterfall, Fly, Dive), só para espécies compatíveis pela tabela do jogo. **TMs ficam de fora** (só saem ao acaso da TM Box). As HMs entram via `buildGuide(..., { machines: snapshot.hms })`.
- **HMs só entram se valerem a compra:** uma HM só fica no moveset se um golpe gratuito (por nível) ou a vaga vazia perder mais de 3% do resultado (`HM_MIN_GAIN`). Vagas de reserva (`fillSlots`) nunca sugerem HM e são ordenadas pelo dano real com o atributo do próprio Pokémon (golpe físico em atacante especial fica atrás), com bônus de só 25% para tipo novo.
- **Pré-evoluções** usam a forma final como referência. Megas ficam como opção; o padrão é a evolução normal.
- **Duas tier lists:** PvE (máximo de dano na caça) e Competitivo (luta mais longa, com desvio).
- **PvE é DPS e área; PvP é velocidade e desvio (decisão do usuário, 2026-11-22):** selvagens não desviam (premissa do usuário, mesmo com o guia "Faixas das caças" falando em esquiva de 30–50% nas faixas 4–6), e as caças são em área, então o PvE valoriza o tamanho da área. No PvP os jogadores desviam: tempo de preparo (cast) é ruim, corpo a corpo e golpes que seguem o alvo são confiáveis, e Velocidade e Agility contam pelo intervalo entre golpes.
- **Farms early game (pedido do usuário):** só hunts de Kanto (Johto e Hoenn têm preço mínimo de captura alto e portões de nível). Entra o Pokémon de primeiro estágio (sem pré-evolução, que evolui, não lendário) cuja melhor evolução final é S ou A em PvE ou Competitivo; a fileira é a melhor tier entre as evoluções. Preço de captura como no guia "Captura" do jogo: preço do nível (curva log-log `capture.curve`, arredondada como o jogo) no nível em que chega (Kanto: 70–80% do selvagem, entre 5 e 50; usamos 75% da média) × fator do Tier de captura (`capture.groups`; `capture.first` = mais fáceis; uma espécie usa o menor fator entre ela e as pré-evoluções). Ordem: tier, insígnias (`badge` da hunt), `recLv`, preço.
- **Dados de captura e hunts:** `collect-pokepedia.mjs` lê o Tier de captura de cada espécie (`catchTier`, tabela `{0:[144,145,…]}` do catálogo) e, do módulo de configuração `socialLinks-*.js` (importado pelo catálogo), `capture` (`curve`, `first`, `groups`, `caughtLevel`, `caughtMaxLevel`, `caughtRegionLevel`, `caughtStageLevel`, `maxLevel`, `regionFloor`, `speciesCatch`, `certainAt`, `profitSchedule`, `shiny`, `shinyCatch`, `ivCatch`) e `hunts` (`JSON.parse` com `id`, `region`, `name`, `main`, `recLv`, `levels`, `badge`, `slots[{dex, lv, w, on}]`; `on` = `land`, `surf`, `old`, `good` ou `super`).
- **Comportamento do AUTO (premissa do usuário):** reforços (Swords Dance, Growth…) e reduções no oponente (Screech, Growl…) são usados uma vez e repetidos só quando o efeito acaba; não acumulam. Em PvE, o AUTO usa o golpe pronto de maior poder × mesmo tipo × precisão, igual à estimativa de dano do próprio jogo.
- **Categoria separada** para Lendários/míticos (lista fixa da Gen 1–3 em `LEGENDARY_DEX`) e Megas.
- **Tiers por percentil** das espécies normais: S = 8% melhores, A até 25%, B até 50%, C até 80%, D o resto (`tierShares`).
- **Cores dos tiers:** S vermelho, A laranja, B amarelo, C verde, D azul.
- **Botão "Preencher natureza e IVs"** marca as naturezas recomendadas e IV mínimo **28** nos IVs prioritários da lista escolhida.

## Modelo de ranking (`rank-pokemon.mjs`)

Mecânicas tiradas do código e do guia "Mecânicas" do jogo:

- Intervalo global entre golpes: `clamp(0,7 s, 2,0 s, 1,2 s × √((1,75·nível + 5) / Velocidade))`; paralisia ×1,5. Recarga real = `max(intervalo, recarga do golpe)`; em batalha, curas têm recarga 30 s (Rest 45 s) e golpes de sono 20 s; máximo de 4 curas.
- Stats calculados no nível 100, IV 31, sem EV. Dano pela fórmula da Gen 3 × 0,6. Área (`huntTargets`, `areaMultiplier`): alvos esperados = 1 + 2 × min(1, quadrados extras / 12) num bando de 3 (`PACK_SIZE`, `PACK_SPREAD_TILES`); cone = quarto de disco do raio, círculo/campo = disco menos o próprio quadrado e o do alvo, área/salto = disco em volta do alvo, feixe = alcance. Com 2 ou mais alvos cada um leva 75% (`combat.areaFactor` do jogo só vale com 2+ alvos); entre 1 e 2 interpola de 100% a 150%. Resultado: cone 4 (Surf, Flamethrower) e círculo raio 3+ (Earthquake) = 225%, círculo raio 2 ≈ 212%, Thunderbolt (feixe 8) ≈ 163%, cone 2 ≈ 125%, projétil/corpo a corpo = 100%.
- Estágios ±6 (multiplicador padrão), duram 10 s. Paralisia: 25% dos golpes falham. Queimadura e veneno: 1/16 da vida a cada 2 s; Toxic começa em 1/32 e sobe até 5/32. Confusão: 33% de se acertar. Sono, congelamento e paralisia sem acumular; imunidade de 8 s ao acordar.
- Thrash/Outrage/Petal Dance acertam 3 vezes em 2,4 s e ficam prontos logo depois, então o AUTO quase só usa eles; o loadout completa as vagas com golpes de reserva para cobertura (`fillSlots`).
- **PvE:** média de 3 simulações de 60 s (`SEEDS`); nota 100 = espécie normal com maior dano por segundo.
- **Competitivo:** duelos de até 180 s contra um atacante físico e um especial de referência, média de 8 sementes (`DUEL_SEEDS`), com cobertura de tipo e resistências. Desvio (`dodgeChance`): golpes que marcam o chão (`TELEGRAPH_SHAPES`: projétil, feixe, investida, cone, círculo, área, salto) erram com chance `clamp(0, 0,7, (cast − 0,25) × 1,4)` (Flamethrower/Surf 0,3 s ≈ 7%, Thunderbolt 0,4 s ≈ 21%, Earthquake 0,6 s ≈ 49%, Fire Blast/Thunder/SolarBeam ≥ 0,75 s = 70%); corpo a corpo e `homing` nunca. O AUTO do duelo já pesa isso na escolha do golpe. O oponente de referência erra 25% (`INCOMING_DODGE`) dos ataques, menos quando o nosso Pokémon está preparando um golpe (cast + `hitSpan` + recarga) ou dormindo. Nota = 70% duelo + 30% referência da Gen 3 (tier da Smogon/Showdown × quanto do set competitivo a espécie aprende). Tiers ajustados porque o jogo **não tem habilidades** (`ABILITY_TIER_OVERRIDES`: Slaking, Medicham, Azumarill, Wobbuffet, Dugtrio, Shedinja).
- Busca do loadout: combinações dos melhores golpes de dano + hill climb trocando qualquer vaga por golpes de dano ou de status. Natureza nunca reduz um atributo de ataque que carrega ≥23% do dano; IVs prioritários vêm de sensibilidade (+10% em cada stat).
- Golpes excluídos: Explosion/Selfdestruct, Memento, OHKO, Counter/Mirror Coat e outros de poder variável (`EXCLUDED_EFFECTS`). Golpes de status sem efeito modelado (Hail, Sandstorm, Safeguard, Taunt, Encore, Ingrain…) não entram (`modeledEffect`). Belly Drum custa 50% da vida; Yawn adormece após o atraso.

## Captura (fórmula do jogo, lida em 2026-11-22)

Do guia "Captura" da Poképédia e das funções `J1`, `zu`, `e0` e `Vu` do módulo `selectStyle-*.js`:

- **Preço (P):** `roundPrice(levelPrice(nível ao capturar) × fator do Tier de captura da própria espécie)`, no mínimo `regionFloor` (Johto 45 mil, Hoenn 90 mil; 70 mil/135 mil nas linhas de três que terminam em Tier 1) e `speciesCatch` (Porygon, Aerodactyl). Shiny, IV Tier 1 e IV100 têm tabelas próprias. A menor tier da linha (`Ao`) só entra no valor de venda, não na captura.
- **Nível ao capturar:** Johto/Hoenn pelo estágio na linha (`caughtStageLevel`, ex.: Chikorita 15, Bayleef 30, Meganium 65); Johto/Hoenn sem evolução e Outland/Orre/Nightmare fixos (`caughtRegionLevel`); Kanto 70–80% (média 75%) do selvagem, entre 5 e 50. Numa hunt, o jogo usa o meio dos níveis da espécie ali.
- **Chance:** `s` = ₽ já gastos em bolas na espécie desde a última captura (Sorte acumulada; shiny, IV Tier 1 e IV100 separados). Por Poké Ball, `q = min(1, (200/(2P) + k·s) × bônus)`; uma bola que vale N Poké Balls (preço ÷ 200: Great 3, Super 5, Ultra 6) acerta com `1 − (1 − q)^N`. Certa quando `s + preço da bola ≥ certainAt (3) × P`. `k` é calibrado para o gasto médio ser `P / (1 + margem)`; a margem (`profitSchedule`) começou em 10% em 2026-11-20 e cai 2,5 pontos por dia até 5%. Bônus multiplicam: boost ×2, tag do Discord +10%, live +10%, castelo +10%, buff de mundo.
- **Selo do MAPA:** mostra `P / (1 + margem)` (gasto médio). O `title` tem o nível ao capturar, a média e a garantia em Ultra Balls, o preço e a chance da 1ª Poké Ball. O cartão `.mx-card` não tem id: usa a linha selecionada (`.mx-row.sel[data-hunt]`) se o dex bater. Testado no jogo (Fearow, Rota 17: ₽16,2 mil, chega no Nv. 34).

## Estrutura do jogo usada pelo userscript (seletores)

- Mercado: `.mk > .mk-main`; lista agrupada `.mk-itr.mk-spr` e cartões `article.mk-sp` com `button.mk-sp-go[data-species]` e nome em `.mk-spr-x > b` / `.mk-sp-x > h4`; página da espécie `.mk-spec` com `.mk-dexno` (`#147`) e `.mk-spec-name`; ofertas `article.mk-offer, article.mk-lr` com `.mk-ivs`.
- MAPA: `.modal .mx-row[data-hunt]` (número da espécie no ícone `/assets/mon/icon/{dex}.png`, selo em `.mx-row-main`) e `.mx-card` (sprite `/assets/mon/front/{dex}.png`, selo em `.mx-card-txt`). Os marcadores do mapa são canvas, sem DOM.
- Ficha: `.lab[data-lab-dex]`, `.lab-hero .lab-tags` (selo), `section.lab-panel[data-lab-section="golpes"]` com `.mv-name` (golpes conhecidos, em maiúsculas); a seção nova entra logo depois. O conteúdo rola dentro de `.lab-scroll`.
- Um único `MutationObserver` em `document.body` observa `.mk` e `.modal` e chama `syncAll()` por `requestAnimationFrame`. Elementos inseridos pelo script levam `data-pafk` e são ignorados pelo observador; não remova isso, ou o script entra em loop.
- Links úteis: Poképédia de espécie `https://pokeafk.io/pokepedia/pokemon/{key}` (key com `_`, ex.: `mr_mime`); sprites `https://pokeafk.io/assets/mon/front/{id}.png` (Megas: `3-mega.png`). Cores dos tipos e mecânicas ficam nos módulos `shell-*.js` e `selectStyle-*.js` da Poképédia.

## Fazer daily (`src/daily.js`)

Independente do resto (tem CSS, helpers e listeners próprios; de fora só usa `MARKET_GUIDE.types`). Para testar no jogo dá para enviar só `src/data/guide.js` + `src/daily.js`.

- **Rota:** abre MAPA → aba `[data-list="npcs"]`, passa por todas as regiões liberadas (`.mx-tab[data-region]` sem `.locked`/`.soon`), ordena por XP (`[data-npcsort="xp"]`, que mostra o resumo `.mx-npc-sum` "Faltam N", o capítulo `MAIS XP PRIMEIRO` com os desafiáveis e os capítulos `BLOQUEADOS (N)` e `VENCIDOS HOJE (N)`) e lê `.mx-list > .mx-row.npc[data-npc]` (nome em `.mx-row-main strong`, lugar em `.mx-row-place`, nível em `.mx-row-lv`). **Decisão do usuário (2026-11-22): a rota segue a ordem da lista, mais XP primeiro, sem filtro de nível** (antes era a faixa do principal até N abaixo, do nível mais baixo ao mais alto; o campo de níveis saiu do card). Entram todos os não vencidos e não bloqueados; derrota pula o treinador. A lista não mostra o XP, então com várias regiões liberadas a rota faz uma região depois da outra. O "Faltam N" do card não conta os bloqueados (o do jogo conta). Depois devolve a ordenação e a região que o jogador usava.
- **Times e vantagem de tipo (pedido do usuário):** o cliente não recebe o time do treinador antes da luta (vem do servidor; `npcs.json` e os mapas não têm). Por isso cada luta grava os Pokémon do oponente lidos do cartão vermelho da arena (`.ah-card` com `.ah-name.red`, ícone `.ah-mon-ic` → `/assets/mon/icon/{dex}.png`) em `localStorage` `pokeafk-market-filtros:npc-teams` (`{npcId: {name, dex[], at}}`). Na rota, se a opção "Evitar times com vantagem de tipo" estiver ligada (`pokeafk-market-filtros:daily-avoid`), um treinador cujo time conhecido tem algum tipo super efetivo (≥2×, tabela da Gen 3) contra o principal fica como "Evitado" e sai da contagem. Treinador desconhecido é enfrentado (e aprendido). Tipos por dex vêm do campo `types` de `MARKET_GUIDE` (gerado por `build-data.mjs`); o dex do principal vem de `.hud-active-button img.front`.
- **Luta:** clica na linha → cartão `.mx-card` (status "Disponível hoje"/"Vencido hoje"/"Bloqueado") → `.mx-acts [data-act="tp"]` → espera o MAPA fechar → envia `keydown` da tecla de interagir na `window` (`pokeafk.ui.keys`.talk, padrão `Z`; o jogo fala com o NPC à frente) → `.b5-challenge` (classe em `.b5-ch-cls`, nome em `.b5-ch-name`; confere com o nome da lista) → `[data-fight]` → arena (`.in-arena` na raiz) → `.ah-result[data-result="win|loss|draw"]` → `[data-ah="ok"]` (CONTINUAR).
- **Cura:** HP do principal em `.hud-hp-numbers` ("33/ 50"). Abaixo de 50% antes de uma luta, ou depois de uma derrota (se o jogo não levou ao Centro), clica `.hud-act.center[data-act="center"]` e espera o HP encher. Derrota pula o treinador.
- **Treinador que anda (pedido do usuário):** se o desafio não abre depois de 2 tentativas de falar, o script procura o sprite do treinador no canvas do mundo e clica nele; o próprio jogo anda até o NPC e fala (handler `pointerdown` do canvas → `Sg`). O sprite vem da lista do MAPA (`.mx-npc-face i`, `background-image: /assets/npcs/{gfx}.png`) e o tamanho do quadro de `/assets/npcs/npcs.json` (`{w, h, frames, hd}`). O canvas desenha 1:1 (`canvas.width` = largura lógica; o CSS amplia), então a busca compara pixels de todos os quadros (e espelhados) com ajuste de ganho e deslocamento por canal (tolera filtros de dia e noite) e escolhe o mais perto do centro. Sprites `hd` ficam em outra camada e não são buscados. Não use ganchos internos do jogo: o cliente detecta automação (`pokeafk-piloto.gancho`, rede num Worker).
- **Inacessíveis (pedido do usuário):** se o cartão do MAPA avisa que o lugar está fechado ("abre quando…", insígnias, como os Ginásios), o treinador vira `closed` sem teleportar. Se nada acontece na tela (teleporte não fecha o MAPA, desafio não abre depois de 3 tentativas de falar), vira `unreachable`: o script recusa o desafio aberto, fecha o MAPA e segue a rota. Os dois aparecem como "Inacessível". Com uma batalha na tela o erro não é engolido. `MAX_UNREACHABLE_STREAK` (4) seguidos sem resposta param o daily.
- **Caça:** `.hud-act.hunt[data-act="hunt"]` tem `.on` quando está caçando; o daily para a caça antes de começar.
- **Posição:** o card fica abaixo de `.hud-quick` até ser arrastado (pelo botão "Daily" ou pelo cabeçalho); a posição arrastada fica em `pokeafk-market-filtros:daily-pos` (`{right, top}`) e duplo clique no cabeçalho volta ao lugar padrão. Em telas com até 500 px de altura (celular deitado; veja "Celular"), o botão fica logo abaixo do chip Contas, alinhado pela esquerda (sem o monitor, à esquerda do AUTO).
- **Globais da janela:** no sandbox do Tampermonkey (Firefox com grants) `dispatchEvent` solto não existe ("(intermediate value).dispatchEvent is not a function"); use `document.defaultView.dispatchEvent` (`pageWindow` no daily). No teste pelo navegador embutido o erro não aparece; para simular, embrulhe o código em `(() => { const dispatchEvent = undefined; … })()`. Só falha de resposta do jogo (`NoResponse`, tempo esgotado) marca o treinador como "Inacessível"; outro erro é bug e para o daily com a mensagem. Lugares fechados (ginásio sem insígnias) e bloqueados saem do "Faltam N".
- **Segurança:** qualquer clique ou tecla real (`isTrusted`) fora do widget para o loop; tempo esgotado em qualquer etapa também. Cliques no painel do monitor (`#pafk-monitor`) também não contam. Pausas aleatórias curtas entre ações (padrão 0,3–0,8 s; o usuário pediu para acelerar a partir de 1–3 s). Os cliques do script são `element.click()` (não confiáveis), por isso não disparam a parada.

## Monitor de contas (`src/monitor.js`)

Lê só o DOM; nada de ganchos internos do jogo. Antes era um script separado para o principal ficar em `@grant none`; no PokeAFK Tools tudo roda com os grants `GM_*` e `@sandbox JavaScript` (perto do contexto da página, mas **não igual**: no Firefox com grants faltam globais soltos como `dispatchEvent`; veja "Erros já cometidos"), para os `keydown` sintéticos do daily continuarem chegando ao jogo. Se o daily parar de falar com os NPCs no Tampermonkey, suspeite disso primeiro. Os apelidos e contas gravados pelo monitor antigo ficaram no armazenamento do script antigo (o `GM_*` é por script); o `localStorage` (filtros, daily, XP) continua valendo.

- **Por que GM_*:** os contêineres do Firefox isolam `localStorage` e `BroadcastChannel` por contêiner. O armazenamento do Tampermonkey (`GM_setValue`/`GM_getValue`/`GM_listValues`/`GM_addValueChangeListener`) é um só para todas as abas. Cada conta grava a chave `acct:<nome>` (uma chave por conta, para as abas não sobrescreverem umas às outras); apelidos ficam em `nicks` (`{nome: apelido}`). Sem grants, cai para `localStorage` (só o contêiner da aba).
- **O que lê do HUD:** nome em `.hud-trainer-name [translate="no"]`; bolas em `.capture-ball[data-capture-ball]` (`<span>` com a contagem, `title` com o nome; ficam no DOM com a captura fechada). Pedido do usuário: o total de bolas (`ballsTotal`, título, alerta) soma `poke-ball`, `great-ball`, `net-ball` (Super Ball) e `ultra-ball`; a `afk-ball` (shinies) fica em `afkBalls`, com ícone próprio `/assets/items/afk-ball.png` no painel; poções em `.ax-pick[data-heal]` (`berry`, `potion`, `super-potion`, `hyper-potion`; `<b>` com a contagem) do painel AUTOMAÇÕES, que fica no DOM e é atualizado mesmo recolhido; se não existir, usa os cartões `.bag-card[data-card$="potion"]` da Bolsa quando ela é aberta; bolas permitidas na captura automática em `.ax-pick[data-ball].on`; dinheiro em `.hud-wallet .hud-amt`; Pokémon principal em `button.hud-active-button` (`aria-label` "Resumo de X, nível N"), `.hud-hp-numbers` e `.hud-mon-portrait` (sprite `img.front`, fundo do tipo `img.hud-mon-bg` = `/assets/ui/v5/fundos/{tipo}.webp`, cor do tipo em `--tc`); selvagem na tela em `.gba-healthbox.opponent` (`.name` com `title`, `.lv`), só com nome: o dex vem da tabela `DEX`, e o último fica guardado enquanto a conta caça. Frutas e reviver não aparecem (pedido do usuário).
- **XP por hora (pedido do usuário):** os `title` das barras de XP do HUD têm os números exatos: `.hud-trainer-xp` ("511.795 / 549.646 XP de treinador neste nível. XP total: 6.681.268.") e `.hud-xp-line` do principal (mesmo formato, com "próximo nível N"). O monitor usa a **XP total** (não zera ao subir de nível) e calcula o ganho nos últimos 10 min (`XP_WINDOW`, como o "ritmo atual" do Analisador de caça `#hunt-analyzer-1`, que só preenche os números com o painel aberto). Amostras a cada 10 s em `sessionStorage` `pokeafk-monitor:xp` (sobrevivem ao recarregar); a série do Pokémon recomeça se o principal muda. Só mostra o valor com 3 min de histórico (`XP_MIN_SPAN`): a XP chega às vezes em blocos (recompensa de missão, +20 mil de uma vez). Conferido no jogo: ~370 mil/h medidos contra 345 mil/h do Analisador.
- **Estado:** `daily` se `#pafk-daily[data-running]` (progresso em `[data-daily-total]`, "N de M"); `battle` com `.in-arena` ou `.ah-result[data-result]`; `hunting` com `.hud-act.hunt.on` ou `.hud.world-hud.hunting`; `fishing` com `.hud-act.fish` ligado; senão `idle`. Sem `.hud.world-hud` = `out` (tela de login). Quem vê calcula `stale` (sem gravação há mais de `STALE_AFTER`, 150 s) e `closed` (`pagehide`).
- **Atualização:** um `MutationObserver` no `body` dispara a leitura (300–400 ms depois) e um `setInterval` de 5 s cobre o resto. Grava quando algo muda (HP fica de fora para não gravar a cada golpe) ou a cada 20 s (`HEARTBEAT`). Testado: com a aba em segundo plano o jogo continua atualizando o HUD.
- **Título e ícone:** `🟢 Nome · ◓bolas ✚poções` (estado parado/batalha e "faltam N" do daily entram no título; `⚠` com menos de 50 bolas ou 20 poções). Ícone SVG em data URL (a CSP do site não restringe `img-src`) com a inicial e a cor do estado. Um `MutationObserver` no `<head>` recoloca título e ícone se o jogo mudar.
- **Painel:** botão "Contas" à esquerda do `.hud-auto-toggle` (o espaço sob AUTO tem os atalhos, o bônus de XP e o card do Daily), arrastável (`pokeafk-monitor:pos` no `localStorage`); linhas atualizadas no lugar (recriar o DOM a cada segundo perdia cliques em ✎/✕). Os botões do cabeçalho não podem servir de alça de arrastar (a captura do ponteiro engole o clique).
- **Visual (pedido do usuário: design mais rico, com sprites):** segue o HUD do jogo: moldura `border-image: url(/assets/ui/hud-frame-a1.svg) 10 fill`, fonte "HUD Pixel" (carregada pelo jogo), azul-marinho `#14206b`, sombra dura `2px 3px 0`, sprites `pixelated`. Ícones de item do jogo: `/assets/ui/hud-icons/24-poke-ball.png` e `29-super-pocao.png`. Ícone do selvagem: `/assets/mon/icon/{dex}.png` (dois quadros de 32×32 empilhados, animados com `steps`; sem animação com `prefers-reduced-motion`). Cada estado tem cor fixa e sempre aparece com o nome (PatternFly, status).
- **Modos:** Completo (cartão: sprite 60 px no fundo do tipo, estado, HP, XP/h do treinador e do Pokémon, selvagem ou progresso do daily, bolas, poções, dinheiro, ✎/✕) e Compacto (uma linha: sprite 34 px, estado e selvagem, bolas, poções e XP/h do treinador; sem ✎/✕). O modo fica em `ui:compact` no armazenamento compartilhado; sem escolha salva, telas com até 500 px de altura começam no Compacto.
- **Teste no navegador embutido:** antes do script, defina substitutos de `GM_*` sobre `localStorage` (prefixo `pafk-gm:`), que as abas do mesmo perfil compartilham; uma aba da Poképédia (sem HUD) serve de segunda aba. Apague `pafk-gm:*` e `pokeafk-monitor:*` no fim.

## Desvio de golpes (`src/dodge.js`)

Pedido do usuário: um "terceiro modo" que desvia dos golpes em área e usa as skills sozinho. Investigado e medido no jogo (2026-11-22): o aviso chega ao cliente já atrasado pela latência (o cliente recua o início pelo atraso da rede), então golpes de 0,3 s (a maioria dos cones e linhas) não dá para desviar; os de 0,6 s ou mais dão. O usuário pediu "o mais possível", e o resultado é um complemento, não um modo exclusivo. **Decisão do usuário: fica experimental e desligado por padrão** (módulo `dodge` em `MODULES_OFF_BY_DEFAULT`; ligado no menu, o botão ainda começa desligado):

- **Botão:** `.pafk-dodge` dentro de `.pafk-dodge-group`, logo depois de `.mb-modes` (sem a classe `mb-mode` e sem `data-mode`, senão o jogo o trata como botão de modo). O visual é copiado em tempo de execução dos botões do jogo (preenchido = ligado). Estado em `localStorage` `pokeafk-market-filtros:dodge`.
- **Leitura (só pixels, nada interno):** aviso inimigo = bordas opacas `#f86048` nos limites dos quadrados (o preenchimento é translúcido; selos ATQ/AT.E são `#d04038`, por isso a cor é exata ±6). Pokémon próprio = barra de HP de 16 px (caixa 18×4 `#283840`, fundo `#506860`) cujo preenchimento bate com `.hud-hp-numbers`; a coluna é a borda esquerda da barra e a linha vem da altura visível do sprite `/assets/mon/ow/{id}.png` (o jogo põe a barra 4 px acima da cabeça). Dentro/fora do aviso e passos até sair saem das bordas na linha e na coluna do Pokémon. **A câmera segue o Pokémon** (na tela ele quase não muda de lugar ao andar), então o passo e o "saiu a tempo" são medidos em relação ao aviso, acompanhado quadro a quadro (fica parado no mundo), nunca pela posição na tela.
- **Ação:** setas sintéticas (`keydown`+`keyup` na `window`), 1 ou 2 passos (passo = 267 ms), sem pisar em outro aviso; direção bloqueada (cerca, outro Pokémon, limite da caça) fica de fora por 2,5 s e tenta a próxima. Do AUTO, o primeiro passo espera o servidor trocar para MANUAL (o jogo só anda depois da resposta) e, passado o golpe, o script clica AUTO de novo (confere e repete até 4 vezes, a cada 0,7 s; entrada do jogador cancela). No MANUAL o passo sai na hora e o servidor ataca sozinho ("AUTO POR INATIVIDADE") entre os desvios.
- **Não age** sem foco (o jogo também não anda: `document.hidden || !document.hasFocus()`), fora da caça, com o chat focado, durante o Daily, e por 3 s depois de tecla ou clique real do jogador no mapa ou nos botões de combate.
- **Limites conhecidos:** avisos de outros jogadores contra os próprios selvagens também são vermelhos (o cliente desenha todos com `foe`) e podem causar desvios inúteis; formas sobrepostas ou cobertas por sprites viram caixas maiores. O tooltip do botão mostra tentados, saíram antes do golpe, tarde demais e sem caminho livre.
- **Medido (2026-11-22, caça de Ivysaur, Arcanine):** no MANUAL, 21 tentativas → 5 saíram antes do golpe, 15 tarde demais (o aviso sumia 40–220 ms depois da tecla), 1 sem caminho; o passo é percebido em 80–180 ms. No AUTO, em 80 s nenhum aviso cobriu o Pokémon (os selvagens dali atacam corpo a corpo); a troca AUTO→MANUAL→AUTO no desvio ainda não foi vista no jogo. Teste com a janela visível: oculta, o navegador segura os timers em 1 s e tudo falha.

## Celular (Android)

Pedido do usuário (2026-11-22): jogar as 4 contas e usar o script só num celular Android. Conferido no jogo:

- O jogo só joga numa aba por navegador (avisa "use outro navegador ou outro perfil" para outra conta), e o Firefox para Android não tem contêineres. Cada conta fica num app da família Firefox com o próprio Tampermonkey (Firefox, Beta, Nightly, Fennec F-Droid ou Iceraven). O armazenamento `GM_*` não passa de um app para outro, então o painel Contas só vê a conta do próprio app.
- A caça continua no servidor com o jogo fechado; ao voltar, o cliente reconecta sozinho. O Daily e o desvio só rodam no app em primeiro plano, com a tela ligada.
- O jogo pede a tela deitada ("Gire o celular"). Testado em 812×375. O CSS do script trata `@media (max-height: 500px)` como celular deitado: o card aberto do Daily ocupa a altura inteira à direita (camada 42, acima do chip Contas), e o Daily (fora de execução) e o monitor somem enquanto há uma janela do jogo aberta (`.hud .modal.open`), que nessa tela cobre tudo. Os widgets do script ficam no `body` com camada 40–42, acima de todo o HUD do jogo (o `.hud.world-hud` é `fixed` sem `z-index`; as janelas dele têm camada 60 só lá dentro).
- Em telas de toque (`hover: none`) não há `title`; a dica "passe o mouse" do monitor some.

## Como testar no jogo

O usuário prefere testes no navegador embutido, logado na conta dele (peça para ele fazer login; nunca digite senha). O navegador embutido não tem Tampermonkey e a CSP do site bloqueia scripts externos e `fetch` para localhost. O que funciona:

1. Recarregue a página do jogo para não haver cópia antiga rodando.
2. Comprima o script (`gzip` + base64) e envie em pedaços de ~24 KB com `javascript_tool`, guardando em `localStorage` (`pafk-test-*`). Dá para enviar o bloco de dados uma vez e só o código nas próximas.
3. Descomprima com `DecompressionStream('gzip')` numa chamada e rode `(0, eval)(código)` **numa chamada separada, no topo, sem `await`** (dentro de função assíncrona a CSP bloqueia `eval`).
4. Abra mercado (botão `RMT`), MAPA e ficha (PC → Pokémon → "Ver ficha"). Não clique em vender, guardar, tornar líder nem viajar.
5. No fim, apague as chaves `pafk-test-*` e `pokeafk-market-filtros:mode` e recarregue a página.

Atalho: a página do jogo consegue `fetch` do arquivo bruto do GitHub (`raw.githubusercontent.com`), então a versão publicada chega sem pedaços. Para testar mudanças locais por cima dela, gere pares de texto antigo → novo a partir do `git diff -U2` de `poke-tools.user.js` (sem `\r`), troque cada um (cada trecho deve aparecer uma vez só) e rode com `(0, eval)`.

Celular deitado: `resize_window` com 812×375. A largura ≥ 768 não emula toque. Se a captura vier cortada (escala de tela 1,25), encolha só a imagem com `document.body.style.transform = 'scale(0.78)'` (origem `0 0`) no mesmo lote da captura e desfaça logo depois: com a escala ligada, `getBoundingClientRect` devolve posições encolhidas e o próprio script se reposiciona errado. Meça sempre sem a escala.

Para testar só a interface sem o jogo, uma página local com as mesmas classes servida em `127.0.0.1` funciona; arquivos `file://` abrem só como imagem estática.

## Cuidados

- O bloco de dados (`src/data/guide.js`) tem ~200 KB; mantenha só campos usados (`build-data.mjs` corta o resto).
- `normalizeName` (em `collect-competitive.mjs`) casa nomes da Smogon com os do jogo (aliases `High Jump Kick`, `Feint Attack`; Nidoran♀/♂).
- Se o jogo mudar o catálogo, o hash em `pokepedia-data.json` muda; recolete e compare antes de recompilar.
- Depois de mudanças no ranking, confira anomalias: Mega abaixo da forma base (só é aceitável se a Mega perde Velocidade) e golpes recomendados que não sejam de nível ou HM compatível.
