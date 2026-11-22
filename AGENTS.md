# Instruções do projeto

Leia e siga `F:\Projetos\AGENTS.md` antes de iniciar o design ou a implementação visual neste projeto.

## O que é

Um userscript do **Tampermonkey** para o jogo [pokeAFK](https://pokeafk.io/) (Chrome e Firefox, o mesmo arquivo serve nos dois). Ele:

- filtra anúncios de Pokémon no **Mercado da Comunidade** (natureza e IV mínimo);
- mostra o selo de tier **PvE** e **Competitivo** ao lado do nome da espécie no mercado (lista, cartões e página da espécie), na janela **MAPA** (lista de hunts e cartão da hunt selecionada) e na **ficha do Pokémon**;
- recomenda natureza, IVs prioritários e moveset de 4 golpes (painel no mercado e seção "Moveset recomendado" na ficha);
- abre uma tier list (diálogo no mercado) com as duas listas;
- ordena a lista agrupada do mercado por tier (percorre as páginas do servidor);
- botão **Daily** (abaixo de "Poke Market", no HUD): luta com os treinadores do dia do nível do Pokémon principal até N abaixo (o usuário escolhe; sugerido 10), com progresso "Faltam N" e botão Parar.

Ao mudar `pokeafk-monitor.user.js`, suba o `// @version` dele (é independente do principal).

Um segundo userscript, `pokeafk-monitor.user.js` (pedido do usuário, que joga com 4 contas em 4 abas do Firefox, em contêineres diferentes), dá a cada aba do jogo um título e um ícone com a conta, o estado (caçando, daily, batalha, parado) e as contagens de bolas e poções, e mostra o painel **Contas** com todas as contas abertas.

Há também uma página, `tierlist.html`, gerada a partir dos mesmos dados e publicada no GitHub Pages: https://keter45.github.io/pokeafk-tools/ (o `index.html` redireciona para ela).

O usuário escreve em português do Brasil. Todo texto de interface fica em pt-BR.

## Arquivos

| Arquivo | Papel |
|---|---|
| `pokeafk-market-filtros.user.js` | O userscript. Código da interface + bloco de dados gerado entre `/* GUIDE_DATA_START */` e `/* GUIDE_DATA_END */`. Não edite o bloco de dados à mão. |
| `pokeafk-monitor.user.js` | Monitor de contas (título e ícone da aba e painel Contas). Script separado, com grants `GM_*`. Versão própria em `// @version`. |
| `build-monitor.mjs` | Escreve no monitor a tabela de espécies (`DEX`, índice = dex, `"Nome:tipo"`) entre `/* DEX_DATA_START */` e `/* DEX_DATA_END */`, lida de `pokepedia-data.json`. Não edite o bloco à mão. |
| `collect-pokepedia.mjs` | Baixa o catálogo do jogo (módulo `selectStyle-*.js` da Poképédia) e gera `pokepedia-data.json`: espécies (`id`, `key`, stats, tipos, evoluções, golpes por nível com parâmetros de combate), formas Mega, HMs e TMs. |
| `collect-competitive.mjs` | Baixa referências da Gen 3 (sets da Smogon via data.pkmn.cc, tiers e random battles do Pokémon Showdown) e gera `competitive-data.json`. |
| `rank-pokemon.mjs` | Motor do ranking (`buildGuide`). Simula PvE e duelo, escolhe loadout, natureza e IVs, calcula tiers. |
| `build-userscript.mjs` | Roda `buildGuide` (com HMs) e reescreve o bloco de dados do userscript, mantendo só os campos que a interface usa. |
| `build-tierlist-page.mjs` | Gera `tierlist.html` (página autônoma com dados embutidos, imagens do jogo e links para a Poképédia), com as abas PvE, Competitivo e Farms early game. |
| `farms.mjs` | `buildFarms`: hunts de Kanto com Pokémon de primeiro estágio cuja evolução final é S ou A, com o preço de captura estimado. |
| `pokepedia-data.json`, `competitive-data.json` | Dados coletados (gerados; não edite à mão). |

O projeto é um repositório git público: [keter45/pokeafk-tools](https://github.com/keter45/pokeafk-tools) (branch `main`). Os commits usam o e-mail anônimo do GitHub (`user.email` local); não troque pelo e-mail pessoal. O GitHub Pages publica a branch `main` na raiz; depois de regenerar `tierlist.html`, o site só muda com commit e push. Faça commit só quando o usuário pedir.

## Comandos

```powershell
node collect-pokepedia.mjs        # atualiza pokepedia-data.json a partir do site
node collect-competitive.mjs      # atualiza competitive-data.json (Smogon/Showdown)
node build-userscript.mjs         # recompila o bloco de dados do userscript (~5 s)
node build-monitor.mjs            # recompila a tabela de espécies do monitor
node build-tierlist-page.mjs      # regenera tierlist.html
node --check pokeafk-market-filtros.user.js
```

Sempre que mudar `rank-pokemon.mjs` ou os dados: rode `build-userscript.mjs`, `build-tierlist-page.mjs`, `build-monitor.mjs` e `node --check`. Ao mudar o userscript, suba `// @version` no cabeçalho para o Tampermonkey atualizar. O Tampermonkey busca a versão nova em `@updateURL` (arquivo bruto da branch `main` no GitHub), então a atualização só chega ao usuário depois do push.

## Regras decididas com o usuário (não mude sem perguntar)

- **Golpes considerados:** golpes por nível da linha evolutiva inteira (o jogo deixa relembrar golpes das pré-evoluções até o nível do Pokémon) **+ as 7 HMs vendidas na Loja de Celadon** (Cut, Rock Smash, Strength, Surf, Waterfall, Fly, Dive), só para espécies compatíveis pela tabela do jogo. **TMs ficam de fora** (só saem ao acaso da TM Box). As HMs entram via `buildGuide(..., { machines: snapshot.hms })`.
- **HMs só entram se valerem a compra:** uma HM só fica no moveset se um golpe gratuito (por nível) ou a vaga vazia perder mais de 3% do resultado (`HM_MIN_GAIN`). Vagas de reserva (`fillSlots`) nunca sugerem HM e são ordenadas pelo dano real com o atributo do próprio Pokémon (golpe físico em atacante especial fica atrás), com bônus de só 25% para tipo novo.
- **Pré-evoluções** usam a forma final como referência. Megas ficam como opção; o padrão é a evolução normal.
- **Duas tier lists:** PvE (máximo de dano na caça) e Competitivo (luta mais longa, como a Ranqueada automática).
- **Farms early game (pedido do usuário):** só hunts de Kanto (Johto e Hoenn têm preço mínimo de captura alto e portões de nível). Entra o Pokémon de primeiro estágio (sem pré-evolução, que evolui, não lendário) cuja melhor evolução final é S ou A em PvE ou Competitivo; a fileira é a melhor tier entre as evoluções. Preço de captura como no guia "Captura" do jogo: preço do nível (curva log-log `capture.curve`, arredondada como o jogo) no nível em que chega (Kanto: 70–80% do selvagem, entre 5 e 50; usamos 75% da média) × fator do Tier de captura (`capture.groups`; `capture.first` = mais fáceis; uma espécie usa o menor fator entre ela e as pré-evoluções). Ordem: tier, insígnias (`badge` da hunt), `recLv`, preço.
- **Dados de captura e hunts:** `collect-pokepedia.mjs` lê o Tier de captura de cada espécie (`catchTier`, tabela `{0:[144,145,…]}` do catálogo) e, do módulo de configuração `socialLinks-*.js` (importado pelo catálogo), `capture` (`curve`, `first`, `groups`, `caughtLevel`, `caughtMaxLevel`) e `hunts` (`JSON.parse` com `id`, `region`, `name`, `main`, `recLv`, `levels`, `badge`, `slots[{dex, lv, w, on}]`; `on` = `land`, `surf`, `old`, `good` ou `super`).
- **Comportamento do AUTO (premissa do usuário):** reforços (Swords Dance, Growth…) e reduções no oponente (Screech, Growl…) são usados uma vez e repetidos só quando o efeito acaba; não acumulam. Em PvE, o AUTO usa o golpe pronto de maior poder × mesmo tipo × precisão, igual à estimativa de dano do próprio jogo.
- **Categoria separada** para Lendários/míticos (lista fixa da Gen 1–3 em `LEGENDARY_DEX`) e Megas.
- **Tiers por percentil** das espécies normais: S = 8% melhores, A até 25%, B até 50%, C até 80%, D o resto (`tierShares`).
- **Cores dos tiers:** S vermelho, A laranja, B amarelo, C verde, D azul.
- **Botão "Preencher natureza e IVs"** marca as naturezas recomendadas e IV mínimo **28** nos IVs prioritários da lista escolhida.

## Modelo de ranking (`rank-pokemon.mjs`)

Mecânicas tiradas do código e do guia "Mecânicas" do jogo:

- Intervalo global entre golpes: `clamp(0,7 s, 2,0 s, 1,2 s × √((1,75·nível + 5) / Velocidade))`; paralisia ×1,5. Recarga real = `max(intervalo, recarga do golpe)`; em batalha, curas têm recarga 30 s (Rest 45 s) e golpes de sono 20 s; máximo de 4 curas.
- Stats calculados no nível 100, IV 31, sem EV. Dano pela fórmula da Gen 3 × 0,6; área conta 2 alvos do bando a 75% cada (hunts geram bandos de 2–3).
- Estágios ±6 (multiplicador padrão), duram 10 s. Paralisia: 25% dos golpes falham. Queimadura e veneno: 1/16 da vida a cada 2 s; Toxic começa em 1/32 e sobe até 5/32. Confusão: 33% de se acertar. Sono, congelamento e paralisia sem acumular; imunidade de 8 s ao acordar.
- Thrash/Outrage/Petal Dance acertam 3 vezes em 2,4 s e ficam prontos logo depois, então o AUTO quase só usa eles; o loadout completa as vagas com golpes de reserva para cobertura (`fillSlots`).
- **PvE:** média de 3 simulações de 60 s (`SEEDS`); nota 100 = espécie normal com maior dano por segundo.
- **Competitivo:** duelos de até 180 s contra um atacante físico e um especial de referência, média de 8 sementes (`DUEL_SEEDS`), com cobertura de tipo e resistências. Nota = 70% duelo + 30% referência da Gen 3 (tier da Smogon/Showdown × quanto do set competitivo a espécie aprende). Tiers ajustados porque o jogo **não tem habilidades** (`ABILITY_TIER_OVERRIDES`: Slaking, Medicham, Azumarill, Wobbuffet, Dugtrio, Shedinja).
- Busca do loadout: combinações dos melhores golpes de dano + hill climb trocando qualquer vaga por golpes de dano ou de status. Natureza nunca reduz um atributo de ataque que carrega ≥23% do dano; IVs prioritários vêm de sensibilidade (+10% em cada stat).
- Golpes excluídos: Explosion/Selfdestruct, Memento, OHKO, Counter/Mirror Coat e outros de poder variável (`EXCLUDED_EFFECTS`). Golpes de status sem efeito modelado (Hail, Sandstorm, Safeguard, Taunt, Encore, Ingrain…) não entram (`modeledEffect`). Belly Drum custa 50% da vida; Yawn adormece após o atraso.

## Estrutura do jogo usada pelo userscript (seletores)

- Mercado: `.mk > .mk-main`; lista agrupada `.mk-itr.mk-spr` e cartões `article.mk-sp` com `button.mk-sp-go[data-species]` e nome em `.mk-spr-x > b` / `.mk-sp-x > h4`; página da espécie `.mk-spec` com `.mk-dexno` (`#147`) e `.mk-spec-name`; ofertas `article.mk-offer, article.mk-lr` com `.mk-ivs`.
- MAPA: `.modal .mx-row[data-hunt]` (número da espécie no ícone `/assets/mon/icon/{dex}.png`, selo em `.mx-row-main`) e `.mx-card` (sprite `/assets/mon/front/{dex}.png`, selo em `.mx-card-txt`). Os marcadores do mapa são canvas, sem DOM.
- Ficha: `.lab[data-lab-dex]`, `.lab-hero .lab-tags` (selo), `section.lab-panel[data-lab-section="golpes"]` com `.mv-name` (golpes conhecidos, em maiúsculas); a seção nova entra logo depois. O conteúdo rola dentro de `.lab-scroll`.
- Um único `MutationObserver` em `document.body` observa `.mk` e `.modal` e chama `syncAll()` por `requestAnimationFrame`. Elementos inseridos pelo script levam `data-pafk` e são ignorados pelo observador; não remova isso, ou o script entra em loop.
- Links úteis: Poképédia de espécie `https://pokeafk.io/pokepedia/pokemon/{key}` (key com `_`, ex.: `mr_mime`); sprites `https://pokeafk.io/assets/mon/front/{id}.png` (Megas: `3-mega.png`). Cores dos tipos e mecânicas ficam nos módulos `shell-*.js` e `selectStyle-*.js` da Poképédia.

## Fazer daily (módulo no fim do userscript)

Independente do resto (tem CSS, helpers e listeners próprios); para testar no jogo dá para enviar só esse trecho (de `// ---- Fazer daily` até o fim).

- **Rota:** abre MAPA → aba `[data-list="npcs"]`, passa por todas as regiões liberadas (`.mx-tab[data-region]` sem `.locked`/`.soon`), ordena por XP (`[data-npcsort="xp"]`, que separa os capítulos `BLOQUEADOS` e `VENCIDOS HOJE`) e lê `.mx-list > .mx-row.npc[data-npc]` (nome em `.mx-row-main strong`, lugar em `.mx-row-place`, nível em `.mx-row-lv`). Filtra nível `[principal − N, principal]` (N escolhido no card, campo `[data-daily-levels]`, 0–99, sugerido 10, salvo em `pokeafk-market-filtros:daily-range`; travado durante a execução), não vencidos e não bloqueados; ordena do **nível mais baixo ao mais alto** (no mesmo nível, treinadores do mesmo lugar ficam juntos). Depois devolve a ordenação e a região que o jogador usava.
- **Times e vantagem de tipo (pedido do usuário):** o cliente não recebe o time do treinador antes da luta (vem do servidor; `npcs.json` e os mapas não têm). Por isso cada luta grava os Pokémon do oponente lidos do cartão vermelho da arena (`.ah-card` com `.ah-name.red`, ícone `.ah-mon-ic` → `/assets/mon/icon/{dex}.png`) em `localStorage` `pokeafk-market-filtros:npc-teams` (`{npcId: {name, dex[], at}}`). Na rota, se a opção "Evitar times com vantagem de tipo" estiver ligada (`pokeafk-market-filtros:daily-avoid`), um treinador cujo time conhecido tem algum tipo super efetivo (≥2×, tabela da Gen 3) contra o principal fica como "Evitado" e sai da contagem. Treinador desconhecido é enfrentado (e aprendido). Tipos por dex vêm do campo `types` do bloco de dados (gerado por `build-userscript.mjs`); o dex do principal vem de `.hud-active-button img.front`.
- **Luta:** clica na linha → cartão `.mx-card` (status "Disponível hoje"/"Vencido hoje"/"Bloqueado") → `.mx-acts [data-act="tp"]` → espera o MAPA fechar → envia `keydown` da tecla de interagir na `window` (`pokeafk.ui.keys`.talk, padrão `Z`; o jogo fala com o NPC à frente) → `.b5-challenge` (classe em `.b5-ch-cls`, nome em `.b5-ch-name`; confere com o nome da lista) → `[data-fight]` → arena (`.in-arena` na raiz) → `.ah-result[data-result="win|loss|draw"]` → `[data-ah="ok"]` (CONTINUAR).
- **Cura:** HP do principal em `.hud-hp-numbers` ("33/ 50"). Abaixo de 50% antes de uma luta, ou depois de uma derrota (se o jogo não levou ao Centro), clica `.hud-act.center[data-act="center"]` e espera o HP encher. Derrota pula o treinador.
- **Treinador que anda (pedido do usuário):** se o desafio não abre depois de 2 tentativas de falar, o script procura o sprite do treinador no canvas do mundo e clica nele; o próprio jogo anda até o NPC e fala (handler `pointerdown` do canvas → `Sg`). O sprite vem da lista do MAPA (`.mx-npc-face i`, `background-image: /assets/npcs/{gfx}.png`) e o tamanho do quadro de `/assets/npcs/npcs.json` (`{w, h, frames, hd}`). O canvas desenha 1:1 (`canvas.width` = largura lógica; o CSS amplia), então a busca compara pixels de todos os quadros (e espelhados) com ajuste de ganho e deslocamento por canal (tolera filtros de dia e noite) e escolhe o mais perto do centro. Sprites `hd` ficam em outra camada e não são buscados. Não use ganchos internos do jogo: o cliente detecta automação (`pokeafk-piloto.gancho`, rede num Worker).
- **Inacessíveis (pedido do usuário):** se o cartão do MAPA avisa que o lugar está fechado ("abre quando…", insígnias, como os Ginásios), o treinador vira `closed` sem teleportar. Se nada acontece na tela (teleporte não fecha o MAPA, desafio não abre depois de 3 tentativas de falar), vira `unreachable`: o script recusa o desafio aberto, fecha o MAPA e segue a rota. Os dois aparecem como "Inacessível". Com uma batalha na tela o erro não é engolido. `MAX_UNREACHABLE_STREAK` (4) seguidos sem resposta param o daily.
- **Caça:** `.hud-act.hunt[data-act="hunt"]` tem `.on` quando está caçando; o daily para a caça antes de começar.
- **Posição:** o card fica abaixo de `.hud-quick` até ser arrastado (pelo botão "Daily" ou pelo cabeçalho); a posição arrastada fica em `pokeafk-market-filtros:daily-pos` (`{right, top}`) e duplo clique no cabeçalho volta ao lugar padrão.
- **Segurança:** qualquer clique ou tecla real (`isTrusted`) fora do widget para o loop; tempo esgotado em qualquer etapa também. Cliques no painel do monitor (`#pafk-monitor`) também não contam. Pausas aleatórias curtas entre ações (padrão 0,3–0,8 s; o usuário pediu para acelerar a partir de 1–3 s). Os cliques do script são `element.click()` (não confiáveis), por isso não disparam a parada.

## Monitor de contas (`pokeafk-monitor.user.js`)

Script separado para não tirar o principal do modo `@grant none` (o contexto muda e pode afetar os `keydown` sintéticos do daily). Lê só o DOM; nada de ganchos internos do jogo.

- **Por que GM_*:** os contêineres do Firefox isolam `localStorage` e `BroadcastChannel` por contêiner. O armazenamento do Tampermonkey (`GM_setValue`/`GM_getValue`/`GM_listValues`/`GM_addValueChangeListener`) é um só para todas as abas. Cada conta grava a chave `acct:<nome>` (uma chave por conta, para as abas não sobrescreverem umas às outras); apelidos ficam em `nicks` (`{nome: apelido}`). Sem grants, cai para `localStorage` (só o contêiner da aba).
- **O que lê do HUD:** nome em `.hud-trainer-name [translate="no"]`; bolas em `.capture-ball[data-capture-ball]` (`<span>` com a contagem, `title` com o nome; ficam no DOM com a captura fechada); poções em `.ax-pick[data-heal]` (`berry`, `potion`, `super-potion`, `hyper-potion`; `<b>` com a contagem) do painel AUTOMAÇÕES, que fica no DOM e é atualizado mesmo recolhido; se não existir, usa os cartões `.bag-card[data-card$="potion"]` da Bolsa quando ela é aberta; bolas permitidas na captura automática em `.ax-pick[data-ball].on`; dinheiro em `.hud-wallet .hud-amt`; Pokémon principal em `button.hud-active-button` (`aria-label` "Resumo de X, nível N"), `.hud-hp-numbers` e `.hud-mon-portrait` (sprite `img.front`, fundo do tipo `img.hud-mon-bg` = `/assets/ui/v5/fundos/{tipo}.webp`, cor do tipo em `--tc`); selvagem na tela em `.gba-healthbox.opponent` (`.name` com `title`, `.lv`), só com nome: o dex vem da tabela `DEX`, e o último fica guardado enquanto a conta caça. Frutas e reviver não aparecem (pedido do usuário).
- **Estado:** `daily` se `#pafk-daily[data-running]` (progresso em `[data-daily-total]`, "N de M"); `battle` com `.in-arena` ou `.ah-result[data-result]`; `hunting` com `.hud-act.hunt.on` ou `.hud.world-hud.hunting`; `fishing` com `.hud-act.fish` ligado; senão `idle`. Sem `.hud.world-hud` = `out` (tela de login). Quem vê calcula `stale` (sem gravação há mais de `STALE_AFTER`, 150 s) e `closed` (`pagehide`).
- **Atualização:** um `MutationObserver` no `body` dispara a leitura (300–400 ms depois) e um `setInterval` de 5 s cobre o resto. Grava quando algo muda (HP fica de fora para não gravar a cada golpe) ou a cada 20 s (`HEARTBEAT`). Testado: com a aba em segundo plano o jogo continua atualizando o HUD.
- **Título e ícone:** `🟢 Nome · ◓bolas ✚poções` (estado parado/batalha e "faltam N" do daily entram no título; `⚠` com menos de 50 bolas ou 20 poções). Ícone SVG em data URL (a CSP do site não restringe `img-src`) com a inicial e a cor do estado. Um `MutationObserver` no `<head>` recoloca título e ícone se o jogo mudar.
- **Painel:** botão "Contas" à esquerda do `.hud-auto-toggle` (o espaço sob AUTO tem os atalhos, o bônus de XP e o card do Daily), arrastável (`pokeafk-monitor:pos` no `localStorage`); linhas atualizadas no lugar (recriar o DOM a cada segundo perdia cliques em ✎/✕). Os botões do cabeçalho não podem servir de alça de arrastar (a captura do ponteiro engole o clique).
- **Visual (pedido do usuário: design mais rico, com sprites):** segue o HUD do jogo: moldura `border-image: url(/assets/ui/hud-frame-a1.svg) 10 fill`, fonte "HUD Pixel" (carregada pelo jogo), azul-marinho `#14206b`, sombra dura `2px 3px 0`, sprites `pixelated`. Ícones de item do jogo: `/assets/ui/hud-icons/24-poke-ball.png` e `29-super-pocao.png`. Ícone do selvagem: `/assets/mon/icon/{dex}.png` (dois quadros de 32×32 empilhados, animados com `steps`; sem animação com `prefers-reduced-motion`). Cada estado tem cor fixa e sempre aparece com o nome (PatternFly, status).
- **Modos:** Completo (cartão: sprite 60 px no fundo do tipo, estado, HP, selvagem ou progresso do daily, bolas, poções, dinheiro, ✎/✕) e Compacto (uma linha: sprite 34 px, estado e selvagem, bolas e poções; sem ✎/✕). O modo fica em `ui:compact` no armazenamento compartilhado.
- **Teste no navegador embutido:** antes do script, defina substitutos de `GM_*` sobre `localStorage` (prefixo `pafk-gm:`), que as abas do mesmo perfil compartilham; uma aba da Poképédia (sem HUD) serve de segunda aba. Apague `pafk-gm:*` e `pokeafk-monitor:*` no fim.

## Como testar no jogo

O usuário prefere testes no navegador embutido, logado na conta dele (peça para ele fazer login; nunca digite senha). O navegador embutido não tem Tampermonkey e a CSP do site bloqueia scripts externos e `fetch` para localhost. O que funciona:

1. Recarregue a página do jogo para não haver cópia antiga rodando.
2. Comprima o script (`gzip` + base64) e envie em pedaços de ~24 KB com `javascript_tool`, guardando em `localStorage` (`pafk-test-*`). Dá para enviar o bloco de dados uma vez e só o código nas próximas.
3. Descomprima com `DecompressionStream('gzip')` numa chamada e rode `(0, eval)(código)` **numa chamada separada, no topo, sem `await`** (dentro de função assíncrona a CSP bloqueia `eval`).
4. Abra mercado (botão `RMT`), MAPA e ficha (PC → Pokémon → "Ver ficha"). Não clique em vender, guardar, tornar líder nem viajar.
5. No fim, apague as chaves `pafk-test-*` e `pokeafk-market-filtros:mode` e recarregue a página.

Para testar só a interface sem o jogo, uma página local com as mesmas classes servida em `127.0.0.1` funciona; arquivos `file://` abrem só como imagem estática.

## Cuidados

- O bloco de dados do userscript tem ~200 KB; mantenha só campos usados (`build-userscript.mjs` corta o resto).
- `normalizeName` (em `collect-competitive.mjs`) casa nomes da Smogon com os do jogo (aliases `High Jump Kick`, `Feint Attack`; Nidoran♀/♂).
- Se o jogo mudar o catálogo, o hash em `pokepedia-data.json` muda; recolete e compare antes de recompilar.
- Depois de mudanças no ranking, confira anomalias: Mega abaixo da forma base (só é aceitável se a Mega perde Velocidade) e golpes recomendados que não sejam de nível ou HM compatível.
