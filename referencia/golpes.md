# Golpes por forma

Gerado por `build-reference.mjs` a partir de `pokepedia-data.json` (340 golpes de nível, HM e TM). Não edite à mão.

- **Recarga**: espera do próprio golpe. A espera real é o maior entre ela, o intervalo do Pokémon (pela Velocidade) e o preparo.
- **Preparo**: tempo até o golpe sair (cast + duração dos acertos). Na caça só atrasa; no PvP dá tempo de desviar.
- **Alcance / Raio**: em quadrados (1 passo = 1 quadrado).
- **Alvos na caça**: quantos do bando de 3 a forma alcança, em média; **Dano na caça**: dano total em relação a um alvo (75% em cada com 2 ou mais).
- **Desvio PvP**: chance estimada de o alvo sair da marca a tempo (só formas que marcam o chão; corpo a corpo e "segue o alvo" nunca).
- **Poder/s**: poder × acertos × precisão ÷ max(1,2 s, recarga, preparo + travamento). Só para comparar golpes; não conta atributos, mesmo tipo nem área. Thrash e parecidos perdem 15% pela confusão; Focus Punch conta só as vezes que acerta.
- **Caça / PvP**: letra por percentil entre os golpes com nota (mesmos cortes das espécies: S = 8% melhores). Caça = poder/s × dano na caça; PvP = poder/s × (1 − desvio) × bônus de alcance. Dano fixo, poder variável e Dream Eater ficam sem nota. Mesmas regras da aba Golpes da página (`moves-info.mjs`).
- **Descrição do jogo**: o texto do cartão do golpe, gerado como o jogo gera (`describeMove`).
- **Origem**: nível (quantas espécies aprendem), HM (Loja de Celadon) ou TM (TM Box; entra só na lista com TMs).

## Cone (à frente do usuário) (41)

| Golpe | Tipo | Cat. | Poder | Prec. | Recarga | Preparo | Alcance | Raio | Alvos na caça | Dano na caça | Desvio PvP | Poder/s | Caça | PvP | Origem | Descrição do jogo |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|:-:|:-:|---|---|
| Flamethrower | fire | Especial | 95 | 100% | 4 s | 0,3 s | 4 | 4 | 3 | 225% | — | 23,8 | S | B | nível (20) + TM | 10% de chance de queimar o alvo por 8 s: perde vida aos poucos e bate mais fraco. |
| Surf | water | Especial | 95 | 100% | 4 s | 0,3 s | 4 | 4 | 3 | 225% | — | 23,8 | S | B | nível (2) + HM |  |
| Gust | flying | Especial | 40 | 100% | 1,7 s | 0,3 s | 3 | 3 | 2,17 | 163% | — | 23,5 | S | B | nível (13) + TM | Acerta até quem está no meio de um salto. |
| Air Cutter | flying | Especial | 55 | 95% | 2,4 s | 0,3 s | 3 | 3 | 2,17 | 163% | — | 21,8 | A | B | nível (4) | Mais chance de acerto crítico. |
| Razor Leaf | grass | Físico | 55 | 95% | 2,4 s | 0,3 s | 3 | 3 | 2,17 | 163% | — | 21,8 | A | B | nível (11) + TM | Mais chance de acerto crítico. |
| Heat Wave | fire | Especial | 100 | 90% | 6 s | 0,5 s | 4 | 4 | 3 | 225% | — | 15 | A | C | nível (2) | 10% de chance de queimar o alvo por 8 s: perde vida aos poucos e bate mais fraco. |
| Hyper Voice | normal | Especial | 90 | 100% | 6 s | 0,3 s | 4 | 4 | 3 | 225% | — | 15 | A | C | nível (4) |  |
| ViceGrip | normal | Físico | 55 | 100% | 2,1 s | 0,3 s | 2 | 2 | 1,5 | 125% | — | 26,2 | A | B | nível (6) | As pinças se fecham sobre os inimigos num cone de 2 passos à frente. |
| DragonBreath | dragon | Especial | 60 | 100% | 3 s | 0,3 s | 3 | 3 | 2,17 | 163% | — | 20 | A | B | nível (8) | 30% de chance de paralisar o alvo por 6 s: mais lento, e 1 em cada 4 golpes dele falha. |
| Muddy Water | water | Especial | 95 | 85% | 6 s | 0,3 s | 4 | 4 | 3 | 225% | — | 13,5 | B | C | nível (2) | 30% de chance de baixar a PRECISÃO do alvo por 10 s. |
| Razor Wind | normal | Especial | 80 | 100% | 6 s | 1,2 s | 4 | 4 | 3 | 225% | 70% | 13,3 | B | D | nível (2) | Mais chance de acerto crítico. Demora 1,2 s para sair. |
| Powder Snow | ice | Especial | 40 | 100% | 2,4 s | 0,3 s | 3 | 3 | 2,17 | 163% | — | 16,7 | B | C | nível (11) + TM | 10% de chance de congelar o alvo por 2 s (um golpe de FOGO descongela). |
| Pin Missile | bug | Físico | 14×3 | 85% | 3 s | 0,3 s | 5 | 5 | 3 | 225% | — | 11,9 | B | C | nível (6) | Espalha agulhas num leque de até 5 passos à frente. Acerta de 2 a 5 vezes seguidas. |
| Acid | poison | Especial | 40 | 100% | 2 s | 0,3 s | 2 | 2 | 1,5 | 125% | — | 20 | B | B | nível (10) + TM | 10% de chance de baixar a DEFESA do alvo por 10 s. |
| Overheat | fire | Especial | 140 | 90% | 12 s | 0,5 s | 4 | 4 | 3 | 225% | — | 10,5 | B | C | TM | Baixa muito o AT. ESP. do seu Pokémon por 10 s. |
| Twister | dragon | Especial | 40 | 100% | 3 s | 0,3 s | 3 | 3 | 2,17 | 163% | — | 13,3 | B | C | nível (9) + TM | Acerta até quem está no meio de um salto. 20% de chance de fazer o alvo recuar: o próximo golpe dele atrasa, e o que ele preparava se perde. |
| Icy Wind | ice | Especial | 55 | 95% | 4 s | 0,3 s | 3 | 3 | 2,17 | 163% | — | 13,1 | C | C | nível (6) | Baixa a VELOCIDADE do alvo por 10 s. |
| Bubble | water | Especial | 20 | 100% | 2 s | 0,3 s | 3 | 3 | 2,17 | 163% | — | 10 | C | C | nível (19) | 10% de chance de baixar a VELOCIDADE do alvo por 10 s. |
| Rolling Kick | fighting | Físico | 60 | 85% | 4 s | 0,3 s | 2 | 2 | 1,5 | 125% | — | 12,8 | C | C | nível (2) | Um chute em meia-lua atinge os inimigos no semicírculo de 2 passos à frente. 30% de chance de fazer o alvo recuar: o próximo golpe dele atrasa, e o que ele preparava se perde. |
| Uproar | normal | Especial | 50 | 100% | 6 s | 0,3 s | 3 | 3 | 2,17 | 163% | — | 8,3 | C | D | nível (11) |  |
| Cross Chop | fighting | Físico | 100 | 80% | 12 s | 0,5 s | 3 | 3 | 2,17 | 163% | — | 6,7 | D | D | nível (5) | Dois cortes cruzados acertam os inimigos num X de 3 passos à frente. Mais chance de acerto crítico. |
| Silver Wind | bug | Especial | 60 | 100% | 12 s | 0,3 s | 3 | 3 | 2,17 | 163% | — | 5 | D | D | nível (5) | 10% de chance de subir o ATAQUE, a DEFESA, o AT. ESP., a DEF. ESP. e a VELOCIDADE do seu Pokémon por 10 s. |
| Cotton Spore | grass | Status | — | 85% | 3 s | 0,3 s | 3 | 3 | — | — | — | — | — | — | nível (8) | Baixa muito a VELOCIDADE do alvo por 10 s. |
| FeatherDance | flying | Status | — | 100% | 8 s | 0,3 s | 3 | 3 | — | — | — | — | — | — | nível (3) | Baixa muito o ATAQUE do alvo por 10 s. |
| GrassWhistle | grass | Status | — | 55% | 10 s | 0,3 s | 3 | 3 | — | — | — | — | — | — | nível (1) | Faz o alvo dormir por 2,5 s. |
| Growl | normal | Status | — | 100% | 3 s | 0,3 s | 3 | 3 | — | — | — | — | — | — | nível (78) | Baixa o ATAQUE do alvo por 10 s. |
| Leer | normal | Status | — | 100% | 4 s | 0,3 s | 3 | 3 | — | — | — | — | — | — | nível (82) | Baixa a DEFESA do alvo por 10 s. |
| Metal Sound | steel | Status | — | 85% | 3 s | 0,3 s | 3 | 3 | — | — | — | — | — | — | nível (8) | Baixa muito a DEF. ESP. do alvo por 10 s. |
| Poison Gas | poison | Status | — | 55% | 3 s | 0,3 s | 2 | 2 | — | — | — | — | — | — | nível (8) | Envenena o alvo por 10 s: perde vida aos poucos. |
| PoisonPowder | poison | Status | — | 75% | 3,4 s | 0,3 s | 2 | 2 | — | — | — | — | — | — | nível (21) | Envenena o alvo por 10 s: perde vida aos poucos. |
| Roar | normal | Status | — | 100% | 6 s | 0,9 s | 3 | 3 | — | — | 33% | — | — | — | nível (19) | Não troca Pokémon: durante o combate, o próximo só entra após um desmaio |
| Sand-Attack | ground | Status | — | 100% | 8 s | 0,3 s | 2 | 2 | — | — | — | — | — | — | nível (37) | Baixa a PRECISÃO do alvo por 10 s. |
| Screech | normal | Status | — | 85% | 3 s | 0,3 s | 3 | 3 | — | — | — | — | — | — | nível (51) | Baixa muito a DEFESA do alvo por 10 s. |
| Sing | normal | Status | — | 55% | 10 s | 0,3 s | 3 | 3 | — | — | — | — | — | — | nível (14) | Faz o alvo dormir por 2,5 s. |
| Sleep Powder | grass | Status | — | 75% | 10 s | 0,3 s | 2 | 2 | — | — | — | — | — | — | nível (16) | Faz o alvo dormir por 2,5 s. |
| Smokescreen | normal | Status | — | 100% | 6 s | 0,3 s | 2 | 2 | — | — | — | — | — | — | nível (14) | Baixa a PRECISÃO do alvo por 10 s. |
| Snore | normal | Especial | 40 | 100% | 4 s | 0,3 s | 2 | 2 | 1,5 | 125% | — | — | — | — | nível (10) | 30% de chance de fazer o alvo recuar: o próximo golpe dele atrasa, e o que ele preparava se perde. |
| String Shot | bug | Status | — | 95% | 3 s | 0,3 s | 3 | 3 | — | — | — | — | — | — | nível (5) | Baixa a VELOCIDADE do alvo por 10 s. |
| Stun Spore | grass | Status | — | 75% | 4 s | 0,3 s | 2 | 2 | — | — | — | — | — | — | nível (21) | Paralisa o alvo por 6 s: mais lento, e 1 em cada 4 golpes dele falha. |
| Tail Whip | normal | Status | — | 100% | 4 s | 0,3 s | 3 | 3 | — | — | — | — | — | — | nível (47) | Baixa a DEFESA do alvo por 10 s. |
| Whirlwind | normal | Status | — | 100% | 6 s | 0,9 s | 3 | 3 | — | — | 33% | — | — | — | nível (12) | Não troca Pokémon: durante o combate, o próximo só entra após um desmaio |

## Círculo em volta do usuário (15)

| Golpe | Tipo | Cat. | Poder | Prec. | Recarga | Preparo | Alcance | Raio | Alvos na caça | Dano na caça | Desvio PvP | Poder/s | Caça | PvP | Origem | Descrição do jogo |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|:-:|:-:|---|---|
| Spark | electric | Físico | 65 | 100% | 3 s | 0,4 s | — | 2 | 2,83 | 213% | — | 21,7 | S | B | nível (11) | Uma descarga elétrica atinge os inimigos até 2 passos ao redor do seu Pokémon. 30% de chance de paralisar o alvo por 6 s: mais lento, e 1 em cada 4 golpes dele falha. |
| Stomp | normal | Físico | 65 | 100% | 3 s | 0,4 s | — | 2 | 2,83 | 213% | — | 21,7 | S | B | nível (16) | Um pisão atinge os inimigos até 2 passos ao redor do seu Pokémon. 30% de chance de fazer o alvo recuar: o próximo golpe dele atrasa, e o que ele preparava se perde. |
| Earthquake | ground | Físico | 100 | 100% | 6 s | 0,6 s | — | 3 | 3 | 225% | — | 16,7 | A | C | nível (20) + TM |  |
| Rapid Spin | normal | Físico | 20 | 100% | 1,5 s | 0,4 s | — | 1 | 1,5 | 125% | — | 13,3 | C | C | nível (11) |  |
| Bide | normal | Físico | 60 | 100% | 15 s | 0,4 s | — | 1 | 1,5 | 125% | — | — | — | — | nível (10) |  |
| Eruption | fire | Especial | — | 100% | 12 s | 0,6 s | — | 4 | — | — | — | — | — | — | nível (2) | Mais forte com a vida cheia: 150 com a vida toda, menos conforme ela cai. |
| Explosion | normal | Físico | 250 | 100% | 30 s | 1 s | — | 4 | 3 | 225% | 47% | — | — | — | nível (17) | O seu Pokémon desmaia ao usar; a DEFESA do alvo conta pela metade. Demora 1 s para sair. |
| Follow Me | normal | Status | — | 100% | 12 s | — | — | 4 | — | — | — | — | — | — | nível (5) | Ainda não faz nada neste jogo: usá-lo só gasta a recarga. |
| Haze | ice | Status | — | 100% | 12 s | 0,4 s | — | 4 | — | — | — | — | — | — | nível (13) | Ainda não faz nada neste jogo: usá-lo só gasta a recarga. |
| Magnitude | ground | Físico | — | 100% | 2,7 s | 0,4 s | — | 3 | — | — | — | — | — | — | nível (9) | Poder ao acaso, de 10 a 150. |
| Perish Song | normal | Status | — | 100% | 30 s | 0,4 s | — | 4 | — | — | — | — | — | — | nível (9) | Ainda não faz nada neste jogo: usá-lo só gasta a recarga. |
| Selfdestruct | normal | Físico | 200 | 100% | 30 s | 1 s | — | 3 | 3 | 225% | 47% | — | — | — | nível (11) | O seu Pokémon desmaia ao usar; a DEFESA do alvo conta pela metade. Demora 1 s para sair. |
| Sweet Scent | normal | Status | — | 100% | 6 s | 0,4 s | — | 3 | — | — | — | — | — | — | nível (15) | Baixa a EVASÃO do alvo por 10 s. |
| Teeter Dance | normal | Status | — | 100% | 6 s | 0,4 s | — | 3 | — | — | — | — | — | — | nível (1) | Confunde o alvo por 4 s: às vezes ele bate em si mesmo. |
| Water Spout | water | Especial | — | 100% | 12 s | 0,6 s | — | 4 | — | — | — | — | — | — | nível (3) | Mais forte com a vida cheia: 150 com a vida toda, menos conforme ela cai. |

## Campo em volta do usuário (11)

| Golpe | Tipo | Cat. | Poder | Prec. | Recarga | Preparo | Alcance | Raio | Alvos na caça | Dano na caça | Desvio PvP | Poder/s | Caça | PvP | Origem | Descrição do jogo |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|:-:|:-:|---|---|
| Hail | ice | Status | — | 100% | 30 s | 0,3 s | — | 5 | — | — | — | — | — | — | nível (6) | Faz cair granizo por 15 s em volta (por enquanto, só a WEATHER BALL sente). |
| Imprison | psychic | Status | — | 100% | 20 s | 0,3 s | — | 5 | — | — | — | — | — | — | nível (4) | Ainda não faz nada neste jogo: usá-lo só gasta a recarga. |
| Light Screen | psychic | Status | — | 100% | 20 s | 0,3 s | — | 2 | — | — | — | — | — | — | nível (20) | Por 8 s, quem estiver perto do seu Pokémon leva metade do dano especial. |
| Mist | ice | Status | — | 100% | 20 s | 0,3 s | — | 2 | — | — | — | — | — | — | nível (16) | Por 8 s, os inimigos não baixam os status de quem estiver perto do seu Pokémon. |
| Mud Sport | ground | Status | — | 100% | 20 s | 0,3 s | — | 2 | — | — | — | — | — | — | nível (13) | Por 15 s, golpes ELÉTRICOS em quem estiver perto do seu Pokémon têm metade do poder. |
| Rain Dance | water | Status | — | 100% | 30 s | 0,3 s | — | 5 | — | — | — | — | — | — | nível (16) | Faz chover por 15 s em volta: golpes de ÁGUA mais fortes e de FOGO mais fracos. |
| Reflect | psychic | Status | — | 100% | 20 s | 0,3 s | — | 2 | — | — | — | — | — | — | nível (13) | Por 8 s, quem estiver perto do seu Pokémon leva metade do dano físico. |
| Safeguard | normal | Status | — | 100% | 20 s | 0,3 s | — | 2 | — | — | — | — | — | — | nível (32) | Por 8 s, os inimigos não causam estados (sono, veneno, confusão...) em quem estiver perto do seu Pokémon. |
| Sandstorm | rock | Status | — | 100% | 30 s | 0,3 s | — | 5 | — | — | — | — | — | — | nível (15) | Levanta uma tempestade de areia por 15 s em volta (por enquanto, só a WEATHER BALL sente). |
| Sunny Day | fire | Status | — | 100% | 30 s | 0,3 s | — | 5 | — | — | — | — | — | — | nível (7) | Faz sol por 15 s em volta: golpes de FOGO mais fortes e de ÁGUA mais fracos. |
| Water Sport | water | Status | — | 100% | 20 s | 0,3 s | — | 2 | — | — | — | — | — | — | nível (12) | Por 15 s, golpes de FOGO em quem estiver perto do seu Pokémon têm metade do poder. |

## Área no ponto mirado (16)

| Golpe | Tipo | Cat. | Poder | Prec. | Recarga | Preparo | Alcance | Raio | Alvos na caça | Dano na caça | Desvio PvP | Poder/s | Caça | PvP | Origem | Descrição do jogo |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|:-:|:-:|---|---|
| Sludge | poison | Especial | 65 | 100% | 3 s | 0,6 s | 6 | 1 | 1,67 | 133% | 28% | 21,7 | B | C | nível (6) | Lança uma bola de lodo até 6 passos, que explode a 1 passo ao redor do impacto; paredes bloqueiam a bola e a explosão. 30% de chance de envenenar o alvo por 10 s: perde vida aos poucos. |
| Water Pulse | water | Especial | 60 | 100% | 3 s | 0,6 s | 6 | 1 | 1,67 | 133% | 28% | 20 | B | C | nível (7) + TM | 20% de chance de confundir o alvo por 4 s: às vezes ele bate em si mesmo. |
| Psycho Boost | psychic | Especial | 140 | 90% | 12 s | 0,8 s | 6 | 2 | 3 | 225% | 19% | 10,5 | B | C | nível (1) | Baixa muito o AT. ESP. do seu Pokémon por 10 s. |
| Sludge Bomb | poison | Especial | 90 | 100% | 6 s | 0,6 s | 6 | 1 | 1,67 | 133% | 28% | 15 | C | C | nível (5) + TM | 30% de chance de envenenar o alvo por 10 s: perde vida aos poucos. |
| Fire Blast | fire | Especial | 120 | 85% | 12 s | 0,8 s | 6 | 2 | 3 | 225% | 19% | 8,5 | C | D | nível (7) + TM | 10% de chance de queimar o alvo por 8 s: perde vida aos poucos e bate mais fraco. |
| Thunder | electric | Especial | 120 | 70% | 6 s | 0,8 s | 6 | 1 | 1,67 | 133% | 56% | 14 | C | D | nível (13) + TM | Na chuva, nunca erra e sai em 0,3 s. Acerta até quem está no meio de um salto. 30% de chance de paralisar o alvo por 6 s: mais lento, e 1 em cada 4 golpes dele falha. |
| Egg Bomb | normal | Físico | 100 | 75% | 6 s | 0,8 s | 6 | 1 | 1,67 | 133% | 56% | 12,5 | C | D | nível (3) |  |
| Blizzard | ice | Especial | 120 | 70% | 12 s | 0,8 s | 6 | 2 | 3 | 225% | 19% | 7 | C | D | nível (10) + TM | 10% de chance de congelar o alvo por 2 s (um golpe de FOGO descongela). |
| Rock Slide | rock | Físico | 75 | 90% | 6 s | 0,6 s | 6 | 1 | 1,67 | 133% | 28% | 11,3 | C | D | nível (9) | 30% de chance de fazer o alvo recuar: o próximo golpe dele atrasa, e o que ele preparava se perde. |
| Rock Tomb | rock | Físico | 50 | 80% | 6 s | 0,6 s | 6 | 1 | 1,67 | 133% | 28% | 6,7 | D | D | nível (3) | Baixa a VELOCIDADE do alvo por 10 s. |
| Fire Spin | fire | Especial | 15 | 70% | 4 s | 0,6 s | 6 | 1 | 1,67 | 133% | 28% | 2,6 | D | D | nível (13) | Prende o alvo por 3 s: ele não anda e perde vida. |
| Sand Tomb | ground | Físico | 15 | 70% | 4 s | 0,6 s | 6 | 1 | 1,67 | 133% | 28% | 2,6 | D | D | nível (7) | Prende o alvo por 3 s: ele não anda e perde vida. |
| Whirlpool | water | Especial | 15 | 70% | 4 s | 0,6 s | 6 | 1 | 1,67 | 133% | 28% | 2,6 | D | D | nível (6) | Prende o alvo por 3 s: ele não anda e perde vida. |
| Doom Desire | steel | Especial | 120 | 85% | 12 s | 0,3 s | 6 | 1 | 1,67 | 133% | — | — | — | — | nível (1) |  |
| Future Sight | psychic | Especial | 80 | 90% | 6 s | 0,3 s | 6 | 1 | 1,67 | 133% | — | — | — | — | nível (20) |  |
| Present | normal | Físico | — | 90% | 4 s | 0,6 s | 6 | 1 | — | — | 28% | — | — | — | nível (1) | Poder 40, 80 ou 120 ao acaso; 1 vez em 5 não tira nada. |

## Salto (área onde cai) (4)

| Golpe | Tipo | Cat. | Poder | Prec. | Recarga | Preparo | Alcance | Raio | Alvos na caça | Dano na caça | Desvio PvP | Poder/s | Caça | PvP | Origem | Descrição do jogo |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|:-:|:-:|---|---|
| Dig | ground | Físico | 60 | 100% | 4 s | 1 s | 5 | 1 | 1,67 | 133% | 70% | 15 | C | D | nível (4) | No meio do salto, quase nenhum golpe acerta o seu Pokémon. Demora 1 s para sair. |
| Bounce | flying | Físico | 85 | 85% | 8 s | 1 s | 5 | 1 | 1,67 | 133% | 70% | 9 | C | D | nível (4) | No meio do salto, quase nenhum golpe acerta o seu Pokémon. 30% de chance de paralisar o alvo por 6 s: mais lento, e 1 em cada 4 golpes dele falha. Demora 1 s para sair. |
| Fly | flying | Físico | 70 | 95% | 8 s | 1 s | 5 | 1 | 1,67 | 133% | 70% | 8,3 | D | D | nível (2) + HM | No meio do salto, quase nenhum golpe acerta o seu Pokémon. Demora 1 s para sair. |
| Dive | water | Físico | 60 | 100% | 8 s | 1 s | 5 | 1 | 1,67 | 133% | 70% | 7,5 | D | D | HM | No meio do salto, quase nenhum golpe acerta o seu Pokémon. Demora 1 s para sair. |

## Feixe (linha reta) (17)

| Golpe | Tipo | Cat. | Poder | Prec. | Recarga | Preparo | Alcance | Raio | Alvos na caça | Dano na caça | Desvio PvP | Poder/s | Caça | PvP | Origem | Descrição do jogo |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|:-:|:-:|---|---|
| Thunderbolt | electric | Especial | 95 | 100% | 4 s | 0,4 s | 8 | — | 2,17 | 163% | — | 23,8 | S | B | nível (4) + TM | 10% de chance de paralisar o alvo por 6 s: mais lento, e 1 em cada 4 golpes dele falha. |
| SolarBeam | grass | Especial | 120 | 100% | 6 s | 1,5 s | 8 | — | 2,17 | 163% | 70% | 20 | A | D | nível (12) + TM | Demora 1,5 s para sair; no sol, sai na hora. |
| Aurora Beam | ice | Especial | 65 | 100% | 3 s | 0,4 s | 7 | — | 2 | 150% | — | 21,7 | A | B | nível (11) | 10% de chance de baixar o ATAQUE do alvo por 10 s. |
| BubbleBeam | water | Especial | 65 | 100% | 3 s | 0,4 s | 7 | — | 2 | 150% | — | 21,7 | A | B | nível (13) | 10% de chance de baixar a VELOCIDADE do alvo por 10 s. |
| Psybeam | psychic | Especial | 65 | 100% | 3 s | 0,4 s | 7 | — | 2 | 150% | — | 21,7 | A | B | nível (20) | 10% de chance de confundir o alvo por 4 s: às vezes ele bate em si mesmo. |
| Signal Beam | bug | Especial | 75 | 100% | 4 s | 0,4 s | 7 | — | 2 | 150% | — | 18,8 | B | B | nível (1) | 10% de chance de confundir o alvo por 4 s: às vezes ele bate em si mesmo. |
| Psychic | psychic | Especial | 90 | 100% | 5 s | 0,4 s | 7 | — | 2 | 150% | — | 18 | B | B | nível (32) + TM | 10% de chance de baixar a DEF. ESP. do alvo por 10 s. |
| Ice Beam | ice | Especial | 95 | 100% | 6 s | 0,4 s | 8 | — | 2,17 | 163% | — | 15,8 | B | C | nível (10) + TM | 10% de chance de congelar o alvo por 2 s (um golpe de FOGO descongela). |
| Water Gun | water | Especial | 40 | 100% | 2,4 s | 0,4 s | 6 | — | 1,83 | 142% | — | 16,7 | B | B | nível (51) + TM |  |
| Hyper Beam | normal | Especial | 150 | 90% | 10 s | 0,6 s | 8 | — | 2,17 | 163% | 28% | 13,5 | B | C | nível (22) + TM | Depois de acertar, o seu Pokémon fica 1,5 s sem agir. |
| Tri Attack | normal | Especial | 80 | 100% | 6 s | 0,4 s | 4 | — | 1,5 | 125% | — | 13,3 | C | C | nível (6) | Dispara três faixas paralelas até 4 passos à frente; cada inimigo é atingido uma vez. 20% de chance de queimar, congelar ou paralisar o alvo. |
| Comet Punch | normal | Físico | 18×3 | 85% | 4 s | 0,4 s | 3 | — | 1,33 | 117% | — | 11,5 | C | C | nível (4) | Uma sequência de socos atinge os inimigos numa faixa de 3 passos à frente. Acerta de 2 a 5 vezes seguidas. |
| Hydro Pump | water | Especial | 120 | 80% | 12 s | 0,6 s | 8 | — | 2,17 | 163% | 28% | 8 | C | D | nível (38) |  |
| Aeroblast | flying | Especial | 100 | 95% | 12 s | 0,6 s | 8 | — | 2,17 | 163% | 28% | 7,9 | C | D | nível (1) | Mais chance de acerto crítico. |
| Smog | poison | Especial | 20 | 70% | 3 s | 0,4 s | 3 | — | 1,33 | 117% | — | 4,7 | D | D | nível (10) | Uma nuvem de veneno cobre três faixas por até 3 passos à frente. 40% de chance de envenenar o alvo por 10 s: perde vida aos poucos. |
| Dragon Rage | dragon | Especial | — | 100% | 6 s | 0,4 s | 6 | — | — | — | — | — | — | — | nível (7) | Dano fixo: o mesmo em qualquer alvo, sem contar ATAQUE, DEFESA nem tipo. |
| Fissure | ground | Físico | — | 30% | 15 s | 0,8 s | 5 | — | — | — | 56% | — | — | — | nível (6) | Derruba de uma vez um selvagem do nível do seu Pokémon ou menor (acerta 30% mais a diferença de nível); de um chefe ou de um treinador, tira 1/4 da vida. |

## Projétil (34)

| Golpe | Tipo | Cat. | Poder | Prec. | Recarga | Preparo | Alcance | Raio | Alvos na caça | Dano na caça | Desvio PvP | Poder/s | Caça | PvP | Origem | Descrição do jogo |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|:-:|:-:|---|---|
| ThunderShock | electric | Especial | 40 | 100% | 1,3 s | 0,2 s | 5 | — | 1 | 100% | — | 30,8 | B | A | nível (11) + TM | 10% de chance de paralisar o alvo por 6 s: mais lento, e 1 em cada 4 golpes dele falha. |
| Shadow Ball | ghost | Especial | 80 | 100% | 2,7 s | 0,2 s | 6 | — | 1 | 100% | — | 29,6 | B | A | nível (7) + TM | 20% de chance de baixar a DEF. ESP. do alvo por 10 s. |
| Bone Club | ground | Físico | 65 | 85% | 2 s | 0,2 s | 6 | — | 1 | 100% | — | 27,6 | B | A | nível (2) | 10% de chance de fazer o alvo recuar: o próximo golpe dele atrasa, e o que ele preparava se perde. |
| Ember | fire | Especial | 40 | 100% | 1,6 s | 0,2 s | 5 | — | 1 | 100% | — | 25 | B | A | nível (31) + TM | 10% de chance de queimar o alvo por 8 s: perde vida aos poucos e bate mais fraco. |
| Twineedle | bug | Físico | 25×2 | 100% | 2 s | 0,2 s | 5 | — | 1 | 100% | — | 25 | B | A | nível (1) | Acerta 2 vezes seguidas. 20% de chance de envenenar o alvo por 10 s: perde vida aos poucos. |
| Bullet Seed | grass | Físico | 10×3 | 100% | 1,3 s | 0,2 s | 5 | — | 1 | 100% | — | 23,1 | B | B | nível (1) | Acerta de 2 a 5 vezes seguidas. |
| Bonemerang | ground | Físico | 50×2 | 90% | 4 s | 0,2 s | 5 | — | 1 | 100% | — | 22,5 | B | B | nível (2) | Acerta 2 vezes seguidas. |
| Spike Cannon | normal | Físico | 20×3 | 100% | 2,7 s | 0,2 s | 5 | — | 1 | 100% | — | 22,2 | B | B | nível (3) | Acerta de 2 a 5 vezes seguidas. |
| Pay Day | normal | Físico | 40 | 100% | 2 s | 0,2 s | 5 | — | 1 | 100% | — | 20 | C | B | nível (2) |  |
| Mud Shot | ground | Especial | 55 | 95% | 2,7 s | 0,2 s | 5 | — | 1 | 100% | — | 19,4 | C | B | nível (11) | Baixa a VELOCIDADE do alvo por 10 s. |
| Barrage | normal | Físico | 15×3 | 85% | 2 s | 0,2 s | 5 | — | 1 | 100% | — | 19,1 | C | B | nível (2) | Acerta de 2 a 5 vezes seguidas. |
| Rock Throw | rock | Físico | 50 | 90% | 2,7 s | 0,2 s | 5 | — | 1 | 100% | — | 16,7 | C | B | nível (12) + TM |  |
| Bone Rush | ground | Físico | 25×3 | 80% | 4 s | 0,2 s | 5 | — | 1 | 100% | — | 15 | C | C | nível (2) | Acerta de 2 a 5 vezes seguidas. |
| Rock Blast | rock | Físico | 25×3 | 80% | 4 s | 0,2 s | 5 | — | 1 | 100% | — | 15 | C | C | nível (8) | Acerta de 2 a 5 vezes seguidas. |
| Octazooka | water | Especial | 65 | 85% | 4 s | 0,2 s | 6 | — | 1 | 100% | — | 13,8 | C | C | nível (1) | 50% de chance de baixar a PRECISÃO do alvo por 10 s. |
| Poison Sting | poison | Físico | 15 | 100% | 1,1 s | 0,2 s | 5 | — | 1 | 100% | — | 12,5 | C | C | nível (21) + TM | 30% de chance de envenenar o alvo por 10 s: perde vida aos poucos. |
| Weather Ball | normal | Especial | 50 | 100% | 4 s | 0,2 s | 5 | — | 1 | 100% | — | 12,5 | C | C | nível (1) | No clima, vira ÁGUA, FOGO, PEDRA ou GELO, com poder 100. |
| Sacred Fire | fire | Físico | 100 | 95% | 8 s | 0,2 s | 7 | — | 1 | 100% | — | 11,9 | D | C | nível (1) | 50% de chance de queimar o alvo por 8 s: perde vida aos poucos e bate mais fraco. |
| Luster Purge | psychic | Especial | 70 | 100% | 8 s | 0,2 s | 6 | — | 1 | 100% | — | 8,8 | D | C | nível (1) | 50% de chance de baixar a DEF. ESP. do alvo por 10 s. |
| Mist Ball | psychic | Especial | 70 | 100% | 8 s | 0,2 s | 6 | — | 1 | 100% | — | 8,8 | D | C | nível (1) | 50% de chance de baixar o AT. ESP. do alvo por 10 s. |
| AncientPower | rock | Especial | 60 | 100% | 8 s | 0,2 s | 5 | — | 1 | 100% | — | 7,5 | D | D | nível (24) | 10% de chance de subir o ATAQUE, a DEFESA, o AT. ESP., a DEF. ESP. e a VELOCIDADE do seu Pokémon por 10 s. |
| Zap Cannon | electric | Especial | 100 | 50% | 8 s | 0,2 s | 7 | — | 1 | 100% | — | 6,3 | D | D | nível (8) | Paralisa o alvo por 6 s: mais lento, e 1 em cada 4 golpes dele falha. |
| Mud-Slap | ground | Especial | 20 | 100% | 4 s | 0,2 s | 5 | — | 1 | 100% | — | 5 | D | D | nível (13) + TM | Baixa a PRECISÃO do alvo por 10 s. |
| Confuse Ray | ghost | Status | — | 100% | 12 s | 0,2 s | 5 | — | — | — | — | — | — | — | nível (29) | Confunde o alvo por 4 s: às vezes ele bate em si mesmo. |
| Hidden Power | normal | Especial | — | 100% | 2,7 s | 0,2 s | 5 | — | — | — | — | — | — | — | nível (3) | O tipo e o poder (30 a 70) dependem dos IVs do seu Pokémon. |
| Hypnosis | psychic | Status | — | 60% | 10 s | 0,2 s | 5 | — | — | — | — | — | — | — | nível (19) | Faz o alvo dormir por 2,5 s. |
| Leech Seed | grass | Status | — | 90% | 12 s | 0,2 s | 5 | — | — | — | — | — | — | — | nível (13) | Planta uma semente no alvo por 10 s: ela tira vida dele e cura o seu Pokémon. |
| Night Shade | ghost | Especial | — | 100% | 2,7 s | 0,2 s | 5 | — | — | — | — | — | — | — | nível (14) | Lança uma bola fantasma até 5 passos à frente e acerta uma vez cada inimigo no caminho. Dano pelo nível do seu Pokémon, sem contar ATAQUE nem DEFESA. |
| SonicBoom | normal | Especial | — | 90% | 2 s | 0,2 s | 5 | — | — | — | — | — | — | — | nível (5) | Dano fixo: o mesmo em qualquer alvo, sem contar ATAQUE, DEFESA nem tipo. |
| Spit Up | normal | Especial | 100 | 100% | 6 s | 0,2 s | 7 | — | 1 | 100% | — | — | — | — | nível (8) |  |
| Supersonic | normal | Status | — | 55% | 6 s | 0,2 s | 5 | — | — | — | — | — | — | — | nível (27) | Confunde o alvo por 4 s: às vezes ele bate em si mesmo. |
| Thunder Wave | electric | Status | — | 100% | 6 s | 0,2 s | 5 | — | — | — | — | — | — | — | nível (19) | Paralisa o alvo por 6 s: mais lento, e 1 em cada 4 golpes dele falha. |
| Toxic | poison | Status | — | 85% | 12 s | 0,2 s | 5 | — | — | — | — | — | — | — | nível (4) | Envenena gravemente o alvo por 10 s: perde cada vez mais vida. |
| Will-O-Wisp | fire | Status | — | 75% | 8 s | 0,2 s | 5 | — | — | — | — | — | — | — | nível (5) | Queima o alvo por 8 s: perde vida aos poucos e bate mais fraco. |

## Investida (16)

| Golpe | Tipo | Cat. | Poder | Prec. | Recarga | Preparo | Alcance | Raio | Alvos na caça | Dano na caça | Desvio PvP | Poder/s | Caça | PvP | Origem | Descrição do jogo |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|:-:|:-:|---|---|
| Double-Edge | normal | Físico | 120 | 100% | 3 s | 0,5 s | 5 | — | 1 | 100% | 14% | 40 | S | S | nível (34) | O seu Pokémon perde 1/3 do dano que causar. |
| Flame Wheel | fire | Físico | 60 | 100% | 1,6 s | 0,3 s | 3 | — | 1 | 100% | — | 37,5 | A | S | nível (4) | 10% de chance de queimar o alvo por 8 s: perde vida aos poucos e bate mais fraco. |
| Skull Bash | normal | Físico | 100 | 100% | 2,7 s | 1 s | 4 | — | 1 | 100% | 70% | 37 | A | C | nível (4) | Sobe a DEFESA do seu Pokémon por 10 s. Demora 1 s para sair. |
| Jump Kick | fighting | Físico | 70 | 95% | 1,8 s | 0,3 s | 4 | — | 1 | 100% | — | 36,9 | A | S | nível (1) | Se errar, o seu Pokémon perde 1/8 da vida. |
| Hi Jump Kick | fighting | Físico | 85 | 90% | 2,1 s | 0,3 s | 4 | — | 1 | 100% | — | 36,4 | A | S | nível (3) | Se errar, o seu Pokémon perde 1/8 da vida. |
| Take Down | normal | Físico | 90 | 85% | 2,3 s | 0,3 s | 4 | — | 1 | 100% | — | 33,3 | A | S | nível (45) | O seu Pokémon perde 1/4 do dano que causar. |
| Mach Punch | fighting | Físico | 40 | 100% | 1,3 s | — | 2 | — | 1 | 100% | — | 30,8 | B | A | nível (2) | Sai mesmo logo depois de outro golpe (não espera a vez). |
| Quick Attack | normal | Físico | 40 | 100% | 1,3 s | — | 3 | — | 1 | 100% | — | 30,8 | B | A | nível (48) | Sai mesmo logo depois de outro golpe (não espera a vez). |
| Aerial Ace | flying | Físico | 60 | 100% | 2 s | 0,3 s | 3 | — | 1 | 100% | — | 30 | B | A | nível (3) + TM |  |
| Wing Attack | flying | Físico | 60 | 100% | 2,3 s | 0,3 s | 4 | — | 1 | 100% | — | 26,1 | B | A | nível (17) | Avança num rasante até 4 passos, atingindo os inimigos no caminho e terminando num espaço livre. |
| Low Kick | fighting | Físico | 60 | 100% | 3 s | 0,3 s | 3 | — | 1 | 100% | — | 20 | C | B | nível (6) | Avança com uma bicuda por até 3 passos e acerta os inimigos no caminho; termina num espaço livre. Poder 60 em qualquer alvo (o peso ainda não conta). |
| Megahorn | bug | Físico | 120 | 85% | 6 s | 0,5 s | 4 | — | 1 | 100% | 14% | 17 | C | C | nível (3) | Avança até 4 passos e acerta os inimigos no caminho; termina num espaço livre, sem atravessar paredes. |
| Sky Attack | flying | Físico | 140 | 90% | 8 s | 1,5 s | 6 | — | 1 | 100% | 70% | 15,8 | C | D | nível (2) | Mais chance de acerto crítico. 30% de chance de fazer o alvo recuar: o próximo golpe dele atrasa, e o que ele preparava se perde. Demora 1,5 s para sair. |
| Ice Ball | ice | Físico | 30 | 90% | 2 s | 0,3 s | 3 | — | 1 | 100% | — | 13,5 | C | C | nível (3) |  |
| Rollout | rock | Físico | 30 | 90% | 2 s | 0,3 s | 3 | — | 1 | 100% | — | 13,5 | C | C | nível (14) |  |
| ExtremeSpeed | normal | Físico | 80 | 100% | 8 s | — | 5 | — | 1 | 100% | — | 10 | D | C | nível (3) | Sai mesmo logo depois de outro golpe (não espera a vez). |

## Corpo a corpo (79)

| Golpe | Tipo | Cat. | Poder | Prec. | Recarga | Preparo | Alcance | Raio | Alvos na caça | Dano na caça | Desvio PvP | Poder/s | Caça | PvP | Origem | Descrição do jogo |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|:-:|:-:|---|---|
| Double Kick | fighting | Físico | 30×2 | 100% | 1,3 s | — | 1 | — | 1 | 100% | — | 46,2 | S | S | nível (10) | Acerta 2 vezes seguidas. |
| Horn Attack | normal | Físico | 65 | 100% | 1,6 s | — | 1 | — | 1 | 100% | — | 40,6 | S | S | nível (10) |  |
| Drill Peck | flying | Físico | 80 | 100% | 2 s | — | 1 | — | 1 | 100% | — | 40 | S | S | nível (5) |  |
| Bite | dark | Físico | 60 | 100% | 1,6 s | — | 1 | — | 1 | 100% | — | 37,5 | A | S | nível (53) | 30% de chance de fazer o alvo recuar: o próximo golpe dele atrasa, e o que ele preparava se perde. |
| Metal Claw | steel | Físico | 50 | 95% | 1,3 s | — | 1 | — | 1 | 100% | — | 36,5 | A | S | nível (11) + TM | 10% de chance de subir o ATAQUE do seu Pokémon por 10 s. |
| Slash | normal | Físico | 70 | 100% | 2 s | — | 1 | — | 1 | 100% | — | 35 | A | A | nível (35) | Mais chance de acerto crítico. |
| Steel Wing | steel | Físico | 70 | 90% | 1,8 s | — | 1 | — | 1 | 100% | — | 35 | A | A | nível (1) | 10% de chance de subir a DEFESA do seu Pokémon por 10 s. |
| Mega Punch | normal | Físico | 80 | 85% | 2 s | — | 1 | — | 1 | 100% | — | 34 | A | A | nível (3) |  |
| Covet | normal | Físico | 40 | 100% | 1 s | — | 1 | — | 1 | 100% | — | 33,3 | A | A | nível (7) |  |
| False Swipe | normal | Físico | 40 | 100% | 1 s | — | 1 | — | 1 | 100% | — | 33,3 | A | A | nível (9) | Nunca derruba: deixa o alvo com pelo menos 1 de vida (bom para capturar). |
| Pound | normal | Físico | 40 | 100% | 1,1 s | — | 1 | — | 1 | 100% | — | 33,3 | A | A | nível (24) |  |
| Scratch | normal | Físico | 40 | 100% | 1,1 s | — | 1 | — | 1 | 100% | — | 33,3 | A | A | nível (44) |  |
| Submission | fighting | Físico | 80 | 80% | 2 s | — | 1 | — | 1 | 100% | — | 32 | A | A | nível (5) | O seu Pokémon perde 1/4 do dano que causar. |
| Cut | normal | Físico | 50 | 95% | 1,5 s | — | 1 | — | 1 | 100% | — | 31,7 | A | A | HM |  |
| Body Slam | normal | Físico | 85 | 100% | 2,7 s | — | 1 | — | 1 | 100% | — | 31,5 | A | A | nível (20) | 30% de chance de paralisar o alvo por 6 s: mais lento, e 1 em cada 4 golpes dele falha. |
| Karate Chop | fighting | Físico | 50 | 100% | 1,6 s | — | 1 | — | 1 | 100% | — | 31,3 | A | A | nível (5) + TM | Mais chance de acerto crítico. |
| Poison Tail | poison | Físico | 50 | 100% | 1,6 s | — | 1 | — | 1 | 100% | — | 31,3 | A | A | nível (1) | Mais chance de acerto crítico. 10% de chance de envenenar o alvo por 10 s: perde vida aos poucos. |
| Shadow Punch | ghost | Físico | 60 | 100% | 2 s | — | 1 | — | 1 | 100% | — | 30 | B | A | nível (3) |  |
| Slam | normal | Físico | 80 | 75% | 2 s | — | 1 | — | 1 | 100% | — | 30 | B | A | nível (19) |  |
| Crunch | dark | Físico | 80 | 100% | 2,7 s | — | 1 | — | 1 | 100% | — | 29,6 | B | A | nível (28) | 20% de chance de baixar a DEF. ESP. do alvo por 10 s. |
| Dragon Claw | dragon | Físico | 80 | 100% | 2,7 s | — | 1 | — | 1 | 100% | — | 29,6 | B | A | nível (4) + TM |  |
| Peck | flying | Físico | 35 | 100% | 1,1 s | — | 1 | — | 1 | 100% | — | 29,2 | B | A | nível (24) |  |
| Sky Uppercut | fighting | Físico | 85 | 90% | 2,7 s | — | 1 | — | 1 | 100% | — | 28,3 | B | A | nível (4) | Acerta até quem está no meio de um salto. |
| Brick Break | fighting | Físico | 75 | 100% | 2,7 s | — | 1 | — | 1 | 100% | — | 27,8 | B | A | nível (3) + TM |  |
| Iron Tail | steel | Físico | 100 | 75% | 2,7 s | — | 1 | — | 1 | 100% | — | 27,8 | B | A | nível (5) + TM | 30% de chance de baixar a DEFESA do alvo por 10 s. |
| Tackle | normal | Físico | 35 | 95% | 1,1 s | — | 1 | — | 1 | 100% | — | 27,7 | B | B | nível (106) |  |
| Strength | normal | Físico | 80 | 100% | 3 s | — | 1 | — | 1 | 100% | — | 26,7 | B | B | HM |  |
| Hyper Fang | normal | Físico | 80 | 90% | 2,7 s | — | 1 | — | 1 | 100% | — | 26,7 | B | B | nível (2) | 10% de chance de fazer o alvo recuar: o próximo golpe dele atrasa, e o que ele preparava se perde. |
| Headbutt | normal | Físico | 70 | 100% | 2,7 s | — | 1 | — | 1 | 100% | — | 25,9 | B | B | nível (22) | 30% de chance de fazer o alvo recuar: o próximo golpe dele atrasa, e o que ele preparava se perde. |
| Leaf Blade | grass | Físico | 70 | 100% | 2,7 s | — | 1 | — | 1 | 100% | — | 25,9 | B | B | nível (2) | Mais chance de acerto crítico. |
| Arm Thrust | fighting | Físico | 15×3 | 100% | 2 s | — | 1 | — | 1 | 100% | — | 22,5 | B | B | nível (2) | Acerta de 2 a 5 vezes seguidas. |
| Needle Arm | grass | Físico | 60 | 100% | 2,7 s | — | 1 | — | 1 | 100% | — | 22,2 | B | B | nível (2) | 30% de chance de fazer o alvo recuar: o próximo golpe dele atrasa, e o que ele preparava se perde. |
| Meteor Mash | steel | Físico | 100 | 85% | 4 s | — | 1 | — | 1 | 100% | — | 21,3 | C | B | nível (3) | 20% de chance de subir o ATAQUE do seu Pokémon por 10 s. |
| Pursuit | dark | Físico | 40 | 100% | 2 s | — | 1 | — | 1 | 100% | — | 20 | C | B | nível (25) + TM |  |
| Waterfall | water | Físico | 80 | 100% | 4 s | — | 1 | — | 1 | 100% | — | 20 | C | B | nível (2) + HM |  |
| Blaze Kick | fire | Físico | 85 | 90% | 4 s | — | 1 | — | 1 | 100% | — | 19,1 | C | B | nível (1) | Mais chance de acerto crítico. 10% de chance de queimar o alvo por 8 s: perde vida aos poucos e bate mais fraco. |
| Crabhammer | water | Físico | 90 | 85% | 4 s | — | 1 | — | 1 | 100% | — | 19,1 | C | B | nível (4) | Mais chance de acerto crítico. |
| Fury Attack | normal | Físico | 15×3 | 85% | 2 s | — | 1 | — | 1 | 100% | — | 19,1 | C | B | nível (19) | Acerta de 2 a 5 vezes seguidas. |
| Fire Punch | fire | Físico | 75 | 100% | 4 s | — | 1 | — | 1 | 100% | — | 18,8 | C | B | nível (5) + TM | 10% de chance de queimar o alvo por 8 s: perde vida aos poucos e bate mais fraco. |
| Ice Punch | ice | Físico | 75 | 100% | 4 s | — | 1 | — | 1 | 100% | — | 18,8 | C | B | nível (3) + TM | 10% de chance de congelar o alvo por 2 s (um golpe de FOGO descongela). |
| ThunderPunch | electric | Físico | 75 | 100% | 4 s | — | 1 | — | 1 | 100% | — | 18,8 | C | B | nível (5) + TM | 10% de chance de paralisar o alvo por 6 s: mais lento, e 1 em cada 4 golpes dele falha. |
| Poison Fang | poison | Físico | 50 | 100% | 2,7 s | — | 1 | — | 1 | 100% | — | 18,5 | C | C | nível (4) | 30% de chance de envenenar gravemente o alvo por 10 s: perde cada vez mais vida. |
| Crush Claw | normal | Físico | 75 | 95% | 4 s | — | 1 | — | 1 | 100% | — | 17,8 | C | C | nível (1) | 50% de chance de baixar a DEFESA do alvo por 10 s. |
| Dizzy Punch | normal | Físico | 70 | 100% | 4 s | — | 1 | — | 1 | 100% | — | 17,5 | C | C | nível (2) | 20% de chance de confundir o alvo por 4 s: às vezes ele bate em si mesmo. |
| Vital Throw | fighting | Físico | 70 | 100% | 4 s | 0,2 s | 1 | — | 1 | 100% | — | 17,5 | C | C | nível (5) |  |
| Fury Swipes | normal | Físico | 18×3 | 80% | 2,7 s | — | 1 | — | 1 | 100% | — | 16 | C | C | nível (26) | Acerta de 2 a 5 vezes seguidas. |
| Lick | ghost | Físico | 20 | 100% | 1,3 s | — | 1 | — | 1 | 100% | — | 15,4 | C | C | nível (12) | 30% de chance de paralisar o alvo por 6 s: mais lento, e 1 em cada 4 golpes dele falha. |
| Superpower | fighting | Físico | 120 | 100% | 8 s | — | 1 | — | 1 | 100% | — | 15 | C | C | nível (3) | Baixa o ATAQUE e a DEFESA do seu Pokémon por 10 s. |
| Vine Whip | grass | Físico | 45 | 100% | 3 s | — | 1 | — | 1 | 100% | — | 15 | C | C | nível (7) + TM |  |
| Mega Kick | normal | Físico | 120 | 75% | 8 s | — | 1 | — | 1 | 100% | — | 11,3 | D | C | nível (1) |  |
| Astonish | ghost | Físico | 30 | 100% | 2,7 s | — | 1 | — | 1 | 100% | — | 11,1 | D | C | nível (26) + TM | 30% de chance de fazer o alvo recuar: o próximo golpe dele atrasa, e o que ele preparava se perde. |
| Knock Off | dark | Físico | 20 | 100% | 2 s | — | 1 | — | 1 | 100% | — | 10 | D | C | nível (10) |  |
| Rage | normal | Físico | 20 | 100% | 2 s | — | 1 | — | 1 | 100% | — | 10 | D | C | nível (24) |  |
| Rock Smash | fighting | Físico | 20 | 100% | 2 s | — | 1 | — | 1 | 100% | — | 10 | D | C | HM | 50% de chance de baixar a DEFESA do alvo por 10 s. |
| Thief | dark | Físico | 40 | 100% | 4 s | — | 1 | — | 1 | 100% | — | 10 | D | C | nível (4) |  |
| DoubleSlap | normal | Físico | 15×3 | 85% | 4 s | — | 1 | — | 1 | 100% | — | 9,6 | D | C | nível (14) | Acerta de 2 a 5 vezes seguidas. |
| Constrict | normal | Físico | 10 | 100% | 1,1 s | — | 1 | — | 1 | 100% | — | 8,3 | D | D | nível (11) | 10% de chance de baixar a VELOCIDADE do alvo por 10 s. |
| Leech Life | bug | Físico | 20 | 100% | 2,7 s | — | 1 | — | 1 | 100% | — | 7,4 | D | D | nível (12) + TM | Recupera metade do dano que causar. |
| Triple Kick | fighting | Físico | 10×3 | 90% | 4 s | — | 1 | — | 1 | 100% | — | 6,8 | D | D | nível (1) | Acerta 3 vezes seguidas. |
| Clamp | water | Físico | 35 | 75% | 4 s | — | 1 | — | 1 | 100% | — | 6,6 | D | D | nível (2) | Prende o alvo por 3 s: ele não anda e perde vida. |
| Wrap | normal | Físico | 15 | 85% | 2 s | — | 1 | — | 1 | 100% | — | 6,4 | D | D | nível (15) | Prende o alvo por 3 s: ele não anda e perde vida. |
| DynamicPunch | fighting | Físico | 100 | 50% | 8 s | — | 1 | — | 1 | 100% | — | 6,3 | D | D | nível (4) | Confunde o alvo por 4 s: às vezes ele bate em si mesmo. |
| Bind | normal | Físico | 15 | 75% | 2 s | — | 1 | — | 1 | 100% | — | 5,6 | D | D | nível (6) | Prende o alvo por 3 s: ele não anda e perde vida. |
| Fury Cutter | bug | Físico | 10 | 95% | 2 s | — | 1 | — | 1 | 100% | — | 4,8 | D | D | nível (9) |  |
| Focus Punch | fighting | Físico | 150 | 100% | 6 s | 1 s | 1 | — | 1 | 100% | — | 4,2 | D | D | nível (1) + TM | Falha se o seu Pokémon levar um golpe enquanto se concentra. Demora 1 s para sair. |
| Endeavor | normal | Físico | — | 100% | 8 s | — | 1 | — | — | — | — | — | — | — | nível (11) | Deixa a vida do alvo igual à do seu Pokémon (de um chefe ou de um treinador, tira no máximo 10%). |
| Fake Out | normal | Físico | 40 | 100% | 10 s | — | 1 | — | 1 | 100% | — | — | — | — | nível (8) | Sai mesmo logo depois de outro golpe (não espera a vez). Faz o alvo recuar: o próximo golpe dele atrasa, e o que ele preparava se perde. |
| Flail | normal | Físico | — | 100% | 2,7 s | — | 1 | — | — | — | — | — | — | — | nível (15) | Mais forte quanto menos vida o seu Pokémon tem (até 200). |
| Guillotine | normal | Físico | — | 30% | 15 s | 0,8 s | 1 | — | — | — | — | — | — | — | nível (6) | Derruba de uma vez um selvagem do nível do seu Pokémon ou menor (acerta 30% mais a diferença de nível); de um chefe ou de um treinador, tira 1/4 da vida. |
| Horn Drill | normal | Físico | — | 30% | 15 s | 0,8 s | 1 | — | — | — | — | — | — | — | nível (6) | Derruba de uma vez um selvagem do nível do seu Pokémon ou menor (acerta 30% mais a diferença de nível); de um chefe ou de um treinador, tira 1/4 da vida. |
| Lovely Kiss | normal | Status | — | 75% | 10 s | — | 1 | — | — | — | — | — | — | — | nível (1) | Faz o alvo dormir por 2,5 s. |
| Revenge | fighting | Físico | 60 | 100% | 4 s | 0,6 s | 1 | — | 1 | 100% | — | — | — | — | nível (7) |  |
| Reversal | fighting | Físico | — | 100% | 2,7 s | — | 1 | — | — | — | — | — | — | — | nível (8) | Mais forte quanto menos vida o seu Pokémon tem (até 200). |
| Seismic Toss | fighting | Físico | — | 100% | 2 s | — | 1 | — | — | — | — | — | — | — | nível (8) | Dano pelo nível do seu Pokémon, sem contar ATAQUE nem DEFESA. |
| SmellingSalt | normal | Físico | 60 | 100% | 4 s | — | 1 | — | 1 | 100% | — | — | — | — | nível (2) |  |
| Spore | grass | Status | — | 100% | 10 s | — | 1 | — | — | — | — | — | — | — | nível (3) | Faz o alvo dormir por 2,5 s. |
| Super Fang | normal | Físico | — | 90% | 4 s | — | 1 | — | — | — | — | — | — | — | nível (2) | Tira metade da vida que o alvo tem (de um chefe ou de um treinador, no máximo 10%). |
| Sweet Kiss | normal | Status | — | 75% | 12 s | — | 1 | — | — | — | — | — | — | — | nível (7) | Confunde o alvo por 4 s: às vezes ele bate em si mesmo. |
| Tickle | normal | Status | — | 100% | 6 s | — | 1 | — | — | — | — | — | — | — | nível (5) | Baixa o ATAQUE e a DEFESA do alvo por 10 s. |

## Segue o alvo (42)

| Golpe | Tipo | Cat. | Poder | Prec. | Recarga | Preparo | Alcance | Raio | Alvos na caça | Dano na caça | Desvio PvP | Poder/s | Caça | PvP | Origem | Descrição do jogo |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|:-:|:-:|---|---|
| Extrasensory | psychic | Especial | 80 | 100% | 2 s | 0,2 s | 6 | — | 1 | 100% | — | 40 | S | S | nível (1) | 10% de chance de fazer o alvo recuar: o próximo golpe dele atrasa, e o que ele preparava se perde. |
| Faint Attack | dark | Físico | 60 | 100% | 2 s | 0,2 s | 5 | — | 1 | 100% | — | 30 | B | A | nível (26) |  |
| Magical Leaf | grass | Especial | 60 | 100% | 3 s | 0,2 s | 5 | — | 1 | 100% | — | 20 | C | B | nível (3) |  |
| Swift | normal | Especial | 60 | 100% | 3 s | 0,2 s | 5 | — | 1 | 100% | — | 20 | C | B | nível (22) + TM |  |
| Confusion | psychic | Especial | 50 | 100% | 4 s | 0,2 s | 5 | — | 1 | 100% | — | 12,5 | C | C | nível (37) + TM | 10% de chance de confundir o alvo por 4 s: às vezes ele bate em si mesmo. |
| Absorb | grass | Especial | 20 | 100% | 2 s | 0,2 s | 5 | — | 1 | 100% | — | 10 | D | C | nível (21) + TM | Recupera metade do dano que causar. |
| Mega Drain | grass | Especial | 40 | 100% | 4 s | 0,2 s | 5 | — | 1 | 100% | — | 10 | D | C | nível (14) | Recupera metade do dano que causar. |
| Giga Drain | grass | Especial | 60 | 100% | 8 s | 0,2 s | 5 | — | 1 | 100% | — | 7,5 | D | D | nível (7) + TM | Recupera metade do dano que causar. |
| Attract | normal | Status | — | 100% | 8 s | 0,2 s | 5 | — | — | — | — | — | — | — | nível (5) | Deixa o alvo apaixonado por 5 s: 1 em cada 4 golpes dele falha. |
| Beat Up | dark | Físico | 10 | 100% | 4 s | 0,2 s | 5 | — | 1 | 100% | — | — | — | — | nível (1) |  |
| Block | normal | Status | — | 100% | 24 s | 0,2 s | 5 | — | — | — | — | — | — | — | nível (3) | Impede o alvo de andar por 4 s. |
| Charm | normal | Status | — | 100% | 6 s | 0,2 s | 5 | — | — | — | — | — | — | — | nível (14) | Baixa muito o ATAQUE do alvo por 10 s. |
| Curse | mystery | Status | — | 100% | 12 s | 0,2 s | 5 | — | — | — | — | — | — | — | nível (14) | Sobe o ATAQUE e a DEFESA e baixa a VELOCIDADE do seu Pokémon por 10 s. |
| Disable | normal | Status | — | 55% | 6 s | 0,2 s | 5 | — | — | — | — | — | — | — | nível (19) | Trava por 6 s o último golpe que o alvo usou. |
| Dream Eater | psychic | Especial | 100 | 100% | 2,7 s | 0,4 s | 7 | — | 1 | 100% | — | 37 | — | — | nível (8) | Só acerta um alvo dormindo; recupera metade do dano que causar. |
| Encore | normal | Status | — | 100% | 24 s | 0,2 s | 5 | — | — | — | — | — | — | — | nível (18) | Faz o alvo só repetir o último golpe que usou, por 4 s. |
| Fake Tears | dark | Status | — | 100% | 6 s | 0,2 s | 5 | — | — | — | — | — | — | — | nível (6) | Baixa muito a DEF. ESP. do alvo por 10 s. |
| Flatter | dark | Status | — | 100% | 8 s | 0,2 s | 5 | — | — | — | — | — | — | — | nível (5) | Sobe o AT. ESP. do alvo por 10 s. Confunde o alvo por 4 s: às vezes ele bate em si mesmo. |
| Foresight | normal | Status | — | 100% | 3 s | 0,2 s | 5 | — | — | — | — | — | — | — | nível (15) | Ainda não faz nada neste jogo: usá-lo só gasta a recarga. |
| Glare | normal | Status | — | 75% | 4 s | 0,2 s | 5 | — | — | — | — | — | — | — | nível (4) | Paralisa o alvo por 6 s: mais lento, e 1 em cada 4 golpes dele falha. |
| Kinesis | psychic | Status | — | 80% | 8 s | 0,2 s | 5 | — | — | — | — | — | — | — | nível (2) | Baixa a PRECISÃO do alvo por 10 s. |
| Lock-On | normal | Status | — | 100% | 24 s | 0,2 s | 5 | — | — | — | — | — | — | — | nível (9) | Ainda não faz nada neste jogo: usá-lo só gasta a recarga. |
| Mean Look | normal | Status | — | 100% | 24 s | 0,2 s | 5 | — | — | — | — | — | — | — | nível (14) | Impede o alvo de andar por 4 s. |
| Memento | dark | Status | — | 100% | 30 s | 0,2 s | 5 | — | — | — | — | — | — | — | nível (5) | Baixa muito o ATAQUE e o AT. ESP. do alvo por 10 s. |
| Mimic | normal | Status | — | 100% | 20 s | 0,2 s | 5 | — | — | — | — | — | — | — | nível (2) | Ainda não faz nada neste jogo: usá-lo só gasta a recarga. |
| Mind Reader | normal | Status | — | 100% | 24 s | 0,2 s | 5 | — | — | — | — | — | — | — | nível (9) | Ainda não faz nada neste jogo: usá-lo só gasta a recarga. |
| Odor Sleuth | normal | Status | — | 100% | 3 s | 0,2 s | 5 | — | — | — | — | — | — | — | nível (17) | Ainda não faz nada neste jogo: usá-lo só gasta a recarga. |
| Pain Split | normal | Status | — | 100% | 6 s | 0,2 s | 5 | — | — | — | — | — | — | — | nível (1) | Ainda não faz nada neste jogo: usá-lo só gasta a recarga. |
| Psych Up | normal | Status | — | 100% | 12 s | 0,2 s | 5 | — | — | — | — | — | — | — | nível (11) | Ainda não faz nada neste jogo: usá-lo só gasta a recarga. |
| Psywave | psychic | Especial | — | 80% | 2,7 s | 0,2 s | 6 | — | — | — | — | — | — | — | nível (8) | Dano ao acaso pelo nível do seu Pokémon (de metade a 1,5 vez). |
| Role Play | psychic | Status | — | 100% | 12 s | 0,2 s | 5 | — | — | — | — | — | — | — | nível (2) | Ainda não faz nada neste jogo: usá-lo só gasta a recarga. |
| Scary Face | normal | Status | — | 90% | 12 s | 0,2 s | 5 | — | — | — | — | — | — | — | nível (35) | Baixa muito a VELOCIDADE do alvo por 10 s. |
| Sheer Cold | ice | Especial | — | 30% | 15 s | 0,8 s | 7 | — | — | — | — | — | — | — | nível (8) | Derruba de uma vez um selvagem do nível do seu Pokémon ou menor (acerta 30% mais a diferença de nível); de um chefe ou de um treinador, tira 1/4 da vida. |
| Sketch | normal | Status | — | 100% | 30 s | 0,2 s | 5 | — | — | — | — | — | — | — | nível (1) | Ainda não faz nada neste jogo: usá-lo só gasta a recarga. |
| Spider Web | bug | Status | — | 100% | 12 s | 0,2 s | 5 | — | — | — | — | — | — | — | nível (2) | Impede o alvo de andar por 4 s. |
| Spite | ghost | Status | — | 100% | 12 s | 0,2 s | 5 | — | — | — | — | — | — | — | nível (8) | Ainda não faz nada neste jogo: usá-lo só gasta a recarga. |
| Swagger | normal | Status | — | 90% | 8 s | 0,2 s | 5 | — | — | — | — | — | — | — | nível (10) | Sobe muito o ATAQUE do alvo por 10 s. Confunde o alvo por 4 s: às vezes ele bate em si mesmo. |
| Taunt | dark | Status | — | 100% | 6 s | 0,2 s | 5 | — | — | — | — | — | — | — | nível (9) | Faz o alvo usar só golpes de dano por 5 s. |
| Torment | dark | Status | — | 100% | 8 s | 0,2 s | 5 | — | — | — | — | — | — | — | nível (1) | Impede o alvo de repetir o mesmo golpe por 8 s. |
| Transform | normal | Status | — | 100% | 30 s | 0,2 s | 5 | — | — | — | — | — | — | — | nível (2) | Ainda não faz nada neste jogo: usá-lo só gasta a recarga. |
| Trick | psychic | Status | — | 100% | 12 s | 0,2 s | 5 | — | — | — | — | — | — | — | nível (3) | Ainda não faz nada neste jogo: usá-lo só gasta a recarga. |
| Yawn | normal | Status | — | 100% | 12 s | 0,2 s | 5 | — | — | — | — | — | — | — | nível (17) | Faz o alvo dormir por 2,5 s, 2 s depois de acertar. |

## Fúria (vários golpes seguidos) (3)

| Golpe | Tipo | Cat. | Poder | Prec. | Recarga | Preparo | Alcance | Raio | Alvos na caça | Dano na caça | Desvio PvP | Poder/s | Caça | PvP | Origem | Descrição do jogo |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|:-:|:-:|---|---|
| Thrash | normal | Físico | 90×3 | 100% | 2,3 s | 2,4 s | 1 | — | 1 | 100% | — | 95,6 | S | S | nível (13) | Depois, o seu Pokémon fica confuso por 4 s. |
| Outrage | dragon | Físico | 90×3 | 100% | 2,7 s | 2,4 s | 1 | — | 1 | 100% | — | 85 | S | S | nível (4) | Depois, o seu Pokémon fica confuso por 4 s. |
| Petal Dance | grass | Especial | 70×3 | 100% | 2 s | 2,4 s | 1 | — | 1 | 100% | — | 74,4 | S | S | nível (6) | Depois, o seu Pokémon fica confuso por 4 s. |

## No próprio Pokémon (56)

| Golpe | Tipo | Cat. | Poder | Prec. | Recarga | Preparo | Alcance | Raio | Alvos na caça | Dano na caça | Desvio PvP | Poder/s | Caça | PvP | Origem | Descrição do jogo |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|:-:|:-:|---|---|
| Acid Armor | poison | Status | — | 100% | 3 s | — | — | — | — | — | — | — | — | — | nível (3) | Sobe muito a DEFESA do seu Pokémon por 10 s. |
| Agility | psychic | Status | — | 100% | 4 s | — | — | — | — | — | — | — | — | — | nível (58) | Sobe muito a VELOCIDADE do seu Pokémon por 10 s. |
| Amnesia | psychic | Status | — | 100% | 6 s | — | — | — | — | — | — | — | — | — | nível (28) | Sobe muito a DEF. ESP. do seu Pokémon por 10 s. |
| Aromatherapy | grass | Status | — | 100% | 20 s | — | — | — | — | — | — | — | — | — | nível (4) | Cura o estado do seu Pokémon (veneno, queimadura, paralisia...). |
| Barrier | psychic | Status | — | 100% | 4 s | — | — | — | — | — | — | — | — | — | nível (4) | Sobe muito a DEFESA do seu Pokémon por 10 s. |
| Baton Pass | normal | Status | — | 100% | 15 s | — | — | — | — | — | — | — | — | — | nível (13) | Não troca Pokémon: durante o combate, o próximo só entra após um desmaio |
| Belly Drum | normal | Status | — | 100% | 30 s | — | — | — | — | — | — | — | — | — | nível (7) | Gasta metade da vida e leva o ATAQUE do seu Pokémon ao máximo por 10 s. |
| Bulk Up | fighting | Status | — | 100% | 6 s | — | — | — | — | — | — | — | — | — | nível (3) | Sobe o ATAQUE e a DEFESA do seu Pokémon por 10 s. |
| Calm Mind | psychic | Status | — | 100% | 6 s | — | — | — | — | — | — | — | — | — | nível (11) | Sobe o AT. ESP. e a DEF. ESP. do seu Pokémon por 10 s. |
| Camouflage | normal | Status | — | 100% | 6 s | — | — | — | — | — | — | — | — | — | nível (1) | Ainda não faz nada neste jogo: usá-lo só gasta a recarga. |
| Charge | electric | Status | — | 100% | 6 s | — | — | — | — | — | — | — | — | — | nível (9) | Ainda não faz nada neste jogo: usá-lo só gasta a recarga. |
| Conversion | normal | Status | — | 100% | 4 s | — | — | — | — | — | — | — | — | — | nível (2) | Ainda não faz nada neste jogo: usá-lo só gasta a recarga. |
| Conversion 2 | normal | Status | — | 100% | 4 s | — | — | — | — | — | — | — | — | — | nível (2) | Ainda não faz nada neste jogo: usá-lo só gasta a recarga. |
| Cosmic Power | psychic | Status | — | 100% | 6 s | — | — | — | — | — | — | — | — | — | nível (7) | Sobe a DEFESA e a DEF. ESP. do seu Pokémon por 10 s. |
| Counter | fighting | Físico | — | 100% | 10 s | — | — | — | — | — | — | — | — | — | nível (9) | Ainda não faz nada neste jogo: usá-lo só gasta a recarga. |
| Defense Curl | normal | Status | — | 100% | 3 s | — | — | — | — | — | — | — | — | — | nível (22) | Sobe a DEFESA do seu Pokémon por 10 s. |
| Destiny Bond | ghost | Status | — | 100% | 20 s | — | — | — | — | — | — | — | — | — | nível (7) | Somente no manual: aura azul por 4 s, recarga de 20 s. Devolve ao agressor 50% do HP perdido em cada golpe direto ao qual sobreviver, sem reduzir o dano recebido. Golpes fatais, veneno, recuo e outros reflexos não ativam o efeito. Não funciona contra lendários nem bosses. |
| Detect | fighting | Status | — | 100% | 8 s | — | — | — | — | — | — | — | — | — | nível (11) | Sai mesmo logo depois de outro golpe (não espera a vez). Protege o seu Pokémon de todo golpe por 1 s; de novo em menos de 10 s, pode falhar. |
| Double Team | normal | Status | — | 100% | 8 s | — | — | — | — | — | — | — | — | — | nível (15) | Sobe a EVASÃO do seu Pokémon por 10 s. |
| Dragon Dance | dragon | Status | — | 100% | 6 s | — | — | — | — | — | — | — | — | — | nível (7) | Sobe o ATAQUE e a VELOCIDADE do seu Pokémon por 10 s. |
| Endure | normal | Status | — | 100% | 12 s | — | — | — | — | — | — | — | — | — | nível (12) | Sai mesmo logo depois de outro golpe (não espera a vez). Aguenta por 1,5 s: nenhum golpe deixa o seu Pokémon com menos de 1 de vida. |
| Focus Energy | normal | Status | — | 100% | 4 s | — | — | — | — | — | — | — | — | — | nível (34) | Ainda não faz nada neste jogo: usá-lo só gasta a recarga. |
| Growth | normal | Status | — | 100% | 3 s | — | — | — | — | — | — | — | — | — | nível (18) | Sobe o ATAQUE e o AT. ESP. do seu Pokémon por 10 s. |
| Grudge | ghost | Status | — | 100% | 20 s | — | — | — | — | — | — | — | — | — | nível (5) | Ainda não faz nada neste jogo: usá-lo só gasta a recarga. |
| Harden | normal | Status | — | 100% | 4 s | — | — | — | — | — | — | — | — | — | nível (38) | Sobe a DEFESA do seu Pokémon por 10 s. |
| Heal Bell | normal | Status | — | 100% | 20 s | — | — | — | — | — | — | — | — | — | nível (4) | Cura o estado do seu Pokémon (veneno, queimadura, paralisia...). |
| Helping Hand | normal | Status | — | 100% | 6 s | — | — | — | — | — | — | — | — | — | nível (20) | Ainda não faz nada neste jogo: usá-lo só gasta a recarga. |
| Howl | normal | Status | — | 100% | 3 s | — | — | — | — | — | — | — | — | — | nível (9) | Sobe o ATAQUE do seu Pokémon por 10 s. |
| Ingrain | grass | Status | — | 100% | 20 s | — | — | — | — | — | — | — | — | — | nível (8) | Enraíza o seu Pokémon por 10 s: não anda, mas recupera vida aos poucos. |
| Iron Defense | steel | Status | — | 100% | 8 s | — | — | — | — | — | — | — | — | — | nível (10) | Sobe muito a DEFESA do seu Pokémon por 10 s. |
| Magic Coat | psychic | Status | — | 100% | 8 s | — | — | — | — | — | — | — | — | — | nível (2) | Ainda não faz nada neste jogo: usá-lo só gasta a recarga. |
| Meditate | psychic | Status | — | 100% | 3 s | — | — | — | — | — | — | — | — | — | nível (6) | Sobe o ATAQUE do seu Pokémon por 10 s. |
| Milk Drink | normal | Status | — | 100% | 20 s | — | — | — | — | — | — | — | — | — | nível (1) | Recupera metade da vida do seu Pokémon. |
| Minimize | normal | Status | — | 100% | 6 s | — | — | — | — | — | — | — | — | — | nível (8) | Sobe a EVASÃO do seu Pokémon por 10 s. |
| Mirror Coat | psychic | Especial | — | 100% | 10 s | — | — | — | — | — | — | — | — | — | nível (6) | Ainda não faz nada neste jogo: usá-lo só gasta a recarga. |
| Moonlight | normal | Status | — | 100% | 20 s | — | — | — | — | — | — | — | — | — | nível (7) | Recupera metade da vida do seu Pokémon. |
| Morning Sun | normal | Status | — | 100% | 20 s | — | — | — | — | — | — | — | — | — | nível (2) | Recupera metade da vida do seu Pokémon. |
| Protect | normal | Status | — | 100% | 8 s | — | — | — | — | — | — | — | — | — | nível (30) | Sai mesmo logo depois de outro golpe (não espera a vez). Protege o seu Pokémon de todo golpe por 1 s; de novo em menos de 10 s, pode falhar. |
| Recover | normal | Status | — | 100% | 20 s | — | — | — | — | — | — | — | — | — | nível (17) | Recupera metade da vida do seu Pokémon. |
| Recycle | normal | Status | — | 100% | 12 s | — | — | — | — | — | — | — | — | — | nível (3) | Ainda não faz nada neste jogo: usá-lo só gasta a recarga. |
| Refresh | normal | Status | — | 100% | 6 s | — | — | — | — | — | — | — | — | — | nível (10) | Cura o estado do seu Pokémon (veneno, queimadura, paralisia...). |
| Rest | psychic | Status | — | 100% | 30 s | — | — | — | — | — | — | — | — | — | nível (30) | Recupera toda a vida e cura o estado, mas o seu Pokémon dorme 3 s. |
| Sharpen | normal | Status | — | 100% | 4 s | — | — | — | — | — | — | — | — | — | nível (1) | Sobe o ATAQUE do seu Pokémon por 10 s. |
| Slack Off | normal | Status | — | 100% | 20 s | — | — | — | — | — | — | — | — | — | nível (2) | Recupera metade da vida do seu Pokémon. |
| Snatch | dark | Status | — | 100% | 10 s | — | — | — | — | — | — | — | — | — | nível (2) | Ainda não faz nada neste jogo: usá-lo só gasta a recarga. |
| Softboiled | normal | Status | — | 100% | 20 s | — | — | — | — | — | — | — | — | — | nível (2) | Recupera metade da vida do seu Pokémon. |
| Splash | normal | Status | — | 100% | 3 s | — | — | — | — | — | — | — | — | — | nível (11) | Ainda não faz nada neste jogo: usá-lo só gasta a recarga. |
| Stockpile | normal | Status | — | 100% | 4 s | — | — | — | — | — | — | — | — | — | nível (8) | Sobe a DEFESA e a DEF. ESP. do seu Pokémon por 20 s. |
| Substitute | normal | Status | — | 100% | 20 s | — | — | — | — | — | — | — | — | — | nível (2) | Gasta 1/4 da vida num boneco que leva os golpes no lugar do seu Pokémon, por até 15 s. |
| Swallow | normal | Status | — | 100% | 12 s | — | — | — | — | — | — | — | — | — | nível (8) | Ainda não faz nada neste jogo: usá-lo só gasta a recarga. |
| Swords Dance | normal | Status | — | 100% | 4 s | — | — | — | — | — | — | — | — | — | nível (9) | Sobe muito o ATAQUE do seu Pokémon por 10 s. |
| Synthesis | grass | Status | — | 100% | 20 s | — | — | — | — | — | — | — | — | — | nível (13) | Recupera metade da vida do seu Pokémon. |
| Tail Glow | bug | Status | — | 100% | 6 s | — | — | — | — | — | — | — | — | — | nível (1) | Sobe muito o AT. ESP. do seu Pokémon por 10 s. |
| Teleport | psychic | Status | — | 100% | 8 s | — | 4 | — | — | — | — | — | — | — | nível (9) | Ainda não faz nada neste jogo: usá-lo só gasta a recarga. |
| Wish | normal | Status | — | 100% | 20 s | — | — | — | — | — | — | — | — | — | nível (7) | 2 s depois, recupera metade da vida do seu Pokémon. |
| Withdraw | water | Status | — | 100% | 3 s | — | — | — | — | — | — | — | — | — | nível (9) | Sobe a DEFESA do seu Pokémon por 10 s. |

## Usa outro golpe (5)

| Golpe | Tipo | Cat. | Poder | Prec. | Recarga | Preparo | Alcance | Raio | Alvos na caça | Dano na caça | Desvio PvP | Poder/s | Caça | PvP | Origem | Descrição do jogo |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|:-:|:-:|---|---|
| Assist | normal | Status | — | 100% | 6 s | — | — | — | — | — | — | — | — | — | nível (1) | Ainda não faz nada neste jogo: usá-lo só gasta a recarga. |
| Metronome | normal | Status | — | 100% | 6 s | — | — | — | — | — | — | — | — | — | nível (5) | Ainda não faz nada neste jogo: usá-lo só gasta a recarga. |
| Mirror Move | flying | Status | — | 100% | 6 s | — | — | — | — | — | — | — | — | — | nível (9) | Ainda não faz nada neste jogo: usá-lo só gasta a recarga. |
| Nature Power | normal | Status | — | 95% | 4 s | — | — | — | — | — | — | — | — | — | nível (6) | Ainda não faz nada neste jogo: usá-lo só gasta a recarga. |
| Sleep Talk | normal | Status | — | 100% | 3 s | — | — | — | — | — | — | — | — | — | nível (3) | Ainda não faz nada neste jogo: usá-lo só gasta a recarga. |

## Armadilha (1)

| Golpe | Tipo | Cat. | Poder | Prec. | Recarga | Preparo | Alcance | Raio | Alvos na caça | Dano na caça | Desvio PvP | Poder/s | Caça | PvP | Origem | Descrição do jogo |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|:-:|:-:|---|---|
| Spikes | ground | Status | — | 100% | 20 s | 0,3 s | 5 | 1 | — | — | — | — | — | — | nível (7) | Ainda não faz nada neste jogo: usá-lo só gasta a recarga. |
