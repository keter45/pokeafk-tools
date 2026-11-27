# Lorelei no modo FULL (2026-11-27, conta Issues)

Primeira luta longa com o FULL (v1.13.0 de teste, navegador embutido). Time: Alakazam Nv. 81, Dratini Nv. 23, Ivysaur. Derrota no Lapras.

Linha do tempo (ms desde o início; meu Pokémon e HP | oponente e HP):

| t | Evento |
|---|---|
| 3082 | FULL troca para MANUAL |
| 3582 | Alakazam 186 (Dewgong, aviso 1×3 + linha 1×4) |
| 4356–4495 | cone grande do Dewgong visível 105 ms; Alakazam −17 |
| 5926 | Dewgong cai |
| 8823–20745 | Slowbro: 3 avisos (cone 4×5, 2×2), Alakazam −13 no total; cai em 12 s |
| 23427–35647 | **Jynx: 7 golpes sem nenhum aviso**, a cada ~1,2 s (−25, −12, −16, −28, −18, −9, −25): Alakazam 156 → 23. A Jynx levou 12 s para cair (no AUTO, 5 s) |
| 38263–52105 | Cloyster: avisos 3×3 de 0,9 s (dodgeados); Alakazam 23 → 11 |
| 54094–55527 | Lapras derruba o Alakazam |
| 60622–63962 | Dratini cai para o Lapras |
| 68957–71316 | Ivysaur cai; derrota |

Placar do FULL: avisos que cobriam o Alakazam 8, todos sem dano; passos antes do golpe 4 de 5 sem dano; 11 golpes recebidos, quase todos sem aviso.

Conclusões aplicadas no `src/arena.js`:

- Contra oponente cujos golpes chegam sem aviso (corpo a corpo, `homing`), o passo antecipado não ajuda e segurar o ataque (`ATTACK_GUARD`) só dá tempo ao oponente. Por Pokémon oponente, o script conta golpes com e sem aviso; com 2 ou mais sem aviso e maioria sem aviso, ataca sempre que pode.
- Na espera entre os próprios golpes, se o oponente está a 2 quadrados ou menos, dá um passo para longe dele.

## 3ª e 4ª tentativas (mesmo dia)

- **3ª (com Calm Mind renovado):** Alakazam derrubou Dewgong, Slowbro, Jynx e Cloyster e chegou ao Lapras com 66 HP, mas o script mandou a última tecla aos 20,5 s; daí em diante foi o "AUTO POR INATIVIDADE" do jogo. Causa não achada (sem erro no console, foco ok, barras achadas). O painel ganhou `data-wait` com o motivo da espera.
- **4ª (com `data-wait`):** o script agiu a luta inteira. Slowbro: cone 4×4 visível 243 ms acertou −66 logo depois do Calm Mind (aviso curto demais para reagir; ritmo ainda não aprendido). Alakazam caiu no Cloyster. Ivysaur ficou ~60 s contra o Cloyster sem levar golpe (passos antes do golpe 55 de 56 sem dano, avisos 12 de 13 sem dano), mas tirou pouco HP (Razor Leaf) e perdeu no fim. Total: 66 ataques, 11 golpes recebidos.
- Em aberto: no AUTO (1ª luta gravada) o Alakazam tirou 184 do Slowbro de uma vez; no FULL, o Psychic tirou ~50. Ver se o AUTO acumula Calm Mind (estágios somam?) ou foi crítico.
- **5ª: vitória.** Com mais Pokémon na equipe. No FULL, o Alakazam derrubou Dewgong, Slowbro, Jynx e Cloyster e chegou ao Lapras com 26 HP (93 ataques; passos antes do golpe 56 de 57 sem dano; avisos 15 de 20 sem dano; 21 golpes recebidos). Do Lapras em diante o painel mostrou "sem foco": a janela do app perdeu o foco, o script parou (como o jogo, só age em foco) e o "AUTO POR INATIVIDADE" terminou a luta com o Arcanine. O travamento da 3ª tentativa foi o mesmo caso.

## Bruno (Elite 2), mesmo dia: vitória inteira no FULL

Alakazam sozinho, no MANUAL do começo ao fim (sem "sem foco"): Onix, Onix, Hitmonchan, Hitmonlee e Machamp, quase todos com um golpe (lutadores são fracos contra Psíquico). O Alakazam levou só 2 golpes (203 → 175 → 155) em ~25 s; 22 teclas enviadas.

## Agatha (Elite 3): vitória inteira no FULL

Alakazam sozinho: Gengar, Gengar, Golbat, Arbok e Haunter. Terminou com ~79 de 203 HP; o Golbat (golpes sem aviso) tirou 79 de uma vez em ~2 s. Placar acumulado da sessão: avisos sem dano 17/23, passos antes do golpe 56/57 sem dano.

## Lance (Elite 4): vitória inteira no FULL

Alakazam: Gyarados, Dragonair, Dragonair e Aerodactyl; caiu no Dragonite com 30 HP. Dratini e Ivysaur caíram para o Dragonite; o Arcanine o levou a 61 (o Dragonite tirou 113 do Arcanine num golpe) e o Machamp terminou. Caminho da Agatha ao Lance gravado em `referencia/rotas/2026-11-27-agatha-para-lance.json` (CONTINUAR + 4 cliques no canvas; o jogo anda até o ponto clicado).

## Campeão Blue: derrota no FULL

Alakazam derrubou Pidgeot e Exeggutor (o Exeggutor se recupera: 2 → 14 HP) e caiu no Arcanine do Blue em ~4 s (golpes sem aviso de 23 a 62 HP). Dratini e Ivysaur caíram no Arcanine; o nosso Arcanine o derrubou e caiu no Rhydon; o Machamp derrubou o Rhydon e perdeu para o Alakazam do Blue, que usa Recover (95 → 125). Placar da sessão: 58 golpes recebidos; o painel terminou em "golpes do oponente sem aviso". Caminho do Lance ao Campeão em `referencia/rotas/2026-11-27-lance-para-campeao.json`.

Ideias para as próximas versões: contra cura (Recover, Giga Drain) vale concentrar o dano; contra oponente rápido e sem aviso (Arcanine), afastar não adianta — talvez trocar de Pokémon (o jogo deixa a cada `arena.swapEveryMs`, 10 s).
