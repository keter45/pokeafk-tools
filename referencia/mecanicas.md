# Mecânicas de combate usadas na tier list

Resumo do que já foi pesquisado no cliente do jogo (`game-copy/`) e combinado com o usuário, para não precisar procurar de novo a cada atualização da tier list. Escrito à mão; os números de golpes e espécies ficam nos arquivos gerados (`golpes.md`, `especies.md`, `dados.json`) e as constantes do modelo em `constantes.md`.

Cada item diz de onde veio:

- **[código]**: lido no cliente do jogo (arquivo e chave indicados).
- **[jogo]**: texto dos guias da Poképédia ou da interface.
- **[usuário]**: premissa ou decisão do usuário.
- **[estimativa]**: número nosso, sem medição; ajuste em `rank-pokemon.mjs` se o jogo mostrar outra coisa.

Última revisão: 2026-11-23 (cliente baixado em 2026-11-22).

## Onde procurar no cliente

| O quê | Arquivo em `game-copy/assets/` | Como achar |
|---|---|---|
| Configuração de combate | `socialLinks-*.js` | `combat:{dmgScale:.6,gcd:{…}` (também `manual:` e `arena:`) |
| Catálogo de golpes e espécies | `selectStyle-*.js` | coletado por `collect-pokepedia.mjs` |
| Movimento do jogador | `main-*.js` | `stepMs(e,t){…}` e a constante de 267 ms |
| Precisão contra golpes que marcam o chão | `selectStyle-*.js` | `dodgeSoften` |
| Textos dos guias (pt-BR são as chaves) | `en-*.js` | procure a frase em português |

## Atributos

- **Ataque principal** [usuário]: os golpes de dano seguem o maior entre Atq e Atq. Esp. (atributos base). Se a diferença for menor que 15% (`MAIN_STAT_RATIO`), o Pokémon é misto e a simulação escolhe entre os dois tipos de golpe. Golpes de dano fixo (Night Shade, Seismic Toss) valem para todos. Se o principal não tem nenhum golpe de dano na lista de golpes, os do outro atributo ficam (ex.: Blissey sem TMs).
- **Velocidade** [código + jogo]: encurta o intervalo geral entre golpes: `clamp(0,7 s; 2,0 s; 1,2 s × √((1,75·nível + 5) / Vel))` ("+10% de Velocidade, a espera fica cerca de 5% menor"). Paralisia multiplica o intervalo por 1,5.
- **Velocidade e movimento** [código]: o passo do Pokémon **não** depende do atributo Velocidade. Em `main-*.js`, `stepMs` devolve 445 ms com paralisia, 133 ms (`combat.stepMs.run`) com estágio de Velocidade positivo (Agility, Dragon Dance…) e 267 ms nos outros casos. O guia confirma: a paralisia deixa "o passo mais lento".
  - O usuário partiu da premissa de que Velocidade também é velocidade de movimento. O código mostra que só o estágio de Velocidade conta. O ranking segue o código: esquiva ×2 com estágio positivo, ×0,6 paralisado (`STEP_SECONDS`). A Velocidade base ainda conta pelo intervalo entre golpes. Se o jogo mudar isso, troque `walk()` no duelo.

## Golpes

Cada golpe tem forma, alcance (ou raio), recarga e preparo. O cartão do golpe no jogo mostra os três primeiros [jogo].

- **Recarga** [código + jogo]: a espera real é o maior entre a recarga do golpe, o intervalo do Pokémon e o preparo. Em batalha (treinadores, duelos), curas têm recarga 30 s (Rest 45 s) e golpes de sono 20 s (`arena.battleCd`); no máximo 4 curas (`arena.battleHeals`). Hyper Beam e similares travam o usuário 1,5 s depois (`combat.rechargeMs`). O dano por segundo da simulação já usa isso.
- **Preparo (cast)** [jogo + usuário]: golpes com preparo marcam no chão onde vão acertar. Na caça não atrapalha a mira (selvagens não desviam, premissa do usuário), só ocupa o tempo. No PvP, dá tempo para o alvo sair.
- **Área** [código + usuário]: forma e raio. Na caça, mais alvos do bando de 3 (`PACK_SIZE`); com 2 ou mais alvos cada um leva 75% (`combat.areaFactor`). No PvP, área maior é mais difícil de desviar: sair dela custa passos (veja "Esquiva").
- **Alcance** [usuário + estimativa]: quão longe o golpe chega. No PvP, atacar de longe mantém o atacante corpo a corpo afastado (veja "Alcance no PvP"). Corpo a corpo alcança 2 quadrados no MANUAL (`manual.meleeReach`).
- **Precisão** [código]: contra golpes que marcam o chão, a chance de errar pela precisão cai pela metade (`dodgeSoften: 0.5`).
- **Corpo a corpo e "segue o alvo"** [jogo]: não marcam o chão e acertam o alvo onde ele estiver, se continuar ao alcance; nunca são esquivados.

Formas (campo `target` do catálogo): `cone`, `circle` (em volta do usuário), `field`, `area` (no ponto mirado), `leap`, `beam` (linha), `projectile`, `dash` (investida), `melee`, `homing` (segue o alvo), `rampage` (Thrash/Outrage/Petal Dance), `self`, `borrow`, `trap`.

## Esquiva

- **Quem esquiva** [jogo]: só projéteis, feixes, investidas, cones, círculos, áreas e saltos (`TELEGRAPH_SHAPES`).
- **Caça** [jogo + usuário]: o guia "Faixas das caças" fala em esquiva de 30%, 40% e 50% nas faixas 4–6 (`combat.dodge`). Premissa do usuário: selvagens não desviam; o PvE ignora isso.
- **Treinadores** [jogo]: líderes desviam ou usam Protect contra um golpe que veem chegando, com chance de 10% no 1º ginásio até 38% no 8º, 50% na Elite e 60% no Campeão (`arena.dodge`); chefes de missão 10%; os outros treinadores não desviam.
- **PvP** [jogo + estimativa]: a Ranqueada é automática, "com a mesma inteligência dos dois lados"; duelos amistosos podem ser AUTO ou MANUAL. O código do servidor não está no cliente, então a esquiva do PvP é estimada:
  - nossos golpes: `clamp(0; 0,7; (preparo − 0,25 s − (passos para sair − 1) × 0,267 s) × 1,4)`. Passos para sair: o raio numa área centrada no alvo (`area`, `leap`), metade do raio num cone, círculo ou campo (o alvo pode estar em qualquer ponto), 1 nos outros. Assim área grande (Earthquake, Eruption, cones de 4) quase não é desviada, e golpe pequeno com preparo longo (Thunder, Fire Blast, SolarBeam) é.
  - o oponente de referência: 25% (`INCOMING_DODGE`) dos golpes dele erram, menos enquanto o nosso Pokémon prepara um golpe ou dorme;
  - os dois lados: esquiva ×2 com estágio de Velocidade positivo e ×0,6 paralisado (passo de 133 ou 445 ms contra 267 ms).

## Alcance no PvP

[usuário + estimativa] Atacar de longe afasta o atacante corpo a corpo. No duelo, contra o oponente de referência físico (corpo a corpo), cada golpe dele tem uma chance extra de não chegar de `KITE_MAX × clamp((alcance − 2) / 3)`: 0 com alcance de 2 quadrados ou menos, 15% com 5 ou mais. Vale o alcance do último golpe de dano usado e só quando o nosso Pokémon pode se mexer (sem preparo nem sono). O oponente especial (à distância) não é afetado.

## PvP sem troca

[usuário + jogo] Não dá para trocar de Pokémon quando quiser no meio da luta, e a Ranqueada é automática. O Pokémon precisa ganhar sozinho: quem só aplica debuffs, ou prepara o oponente para outro bater, rende pouco. Por isso:

- o duelo de referência é 1 contra 1 e pesa 80% da nota (`PVP_DUEL_WEIGHT`);
- a referência da Gen 3 (Smogon/Showdown) pesa 20% (antes 30%), porque premia paredes e suportes que dependem do time.

## Caça (PvE)

- Bandos de 2 ou 3 a partir da faixa 4 (`combat.packSpawn`); o modelo usa 3.
- O AUTO usa o golpe pronto de maior poder × mesmo tipo × precisão [usuário], e reforços (Swords Dance…) uma vez, repetindo quando acabam.
- O dano por segundo vem de 3 simulações de 60 s, com recargas, intervalo e preparo.

## Golpes especiais

- **Focus Punch** [jogo]: "falha se o seu Pokémon levar um golpe enquanto se concentra" (1 s). Modelado só na lista com TMs (decisão do usuário; veja `AGENTS.md`).
- **TMs** [jogo]: "usado num Pokémon compatível… é consumido". Saem ao acaso da TM Box. HMs são vendidas na Loja de Celadon e também são de uso único. Uma HM ou TM só entra no moveset se valer mais de 3% (`HM_MIN_GAIN`).
- Habilidades não existem no jogo (tiers da Smogon ajustados em `ABILITY_TIER_OVERRIDES`).

## Como atualizar

1. Se o jogo mudou, rode `node download-game.mjs` e confira as chaves da tabela "Onde procurar".
2. `node collect-pokepedia.mjs` (golpes e espécies) e, se preciso, `node collect-competitive.mjs`.
3. `node build-reference.mjs` regenera `golpes.md`, `especies.md`, `constantes.md` e `dados.json`.
4. Ajuste este arquivo à mão se alguma regra mudou, depois rode `build-data.mjs`, `build-userscript.mjs` e `build-tierlist-page.mjs`.
