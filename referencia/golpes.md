# Golpes por forma

Gerado por `build-reference.mjs` a partir de `pokepedia-data.json` (340 golpes de nível, HM e TM). Não edite à mão.

- **Recarga**: espera do próprio golpe. A espera real é o maior entre ela, o intervalo do Pokémon (pela Velocidade) e o preparo.
- **Preparo**: tempo até o golpe sair (cast + duração dos acertos). Na caça só atrasa; no PvP dá tempo de desviar.
- **Alcance / Raio**: em quadrados (1 passo = 1 quadrado).
- **Alvos na caça**: quantos do bando de 3 a forma alcança, em média; **Dano na caça**: dano total em relação a um alvo (75% em cada com 2 ou mais).
- **Desvio PvP**: chance estimada de o alvo sair da marca a tempo (só formas que marcam o chão; corpo a corpo e "segue o alvo" nunca).
- **Poder/s**: poder × acertos × precisão ÷ max(1,2 s, recarga, preparo). Só para comparar golpes; não conta atributos, mesmo tipo nem área.
- **Origem**: nível (quantas espécies aprendem), HM (Loja de Celadon) ou TM (TM Box; entra só na lista com TMs).

## Cone (à frente do usuário) (41)

| Golpe | Tipo | Cat. | Poder | Prec. | Recarga | Preparo | Alcance | Raio | Alvos na caça | Dano na caça | Desvio PvP | Poder/s | Origem |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| ViceGrip | normal | Físico | 55 | 100% | 2,1 s | 0,3 s | 2 | 2 | 1,5 | 125% | 7% | 26,2 | nível (6) |
| Flamethrower | fire | Especial | 95 | 100% | 4 s | 0,3 s | 4 | 4 | 3 | 225% | — | 23,8 | nível (20) + TM |
| Surf | water | Especial | 95 | 100% | 4 s | 0,3 s | 4 | 4 | 3 | 225% | — | 23,8 | nível (2) + HM |
| Gust | flying | Especial | 40 | 100% | 1,7 s | 0,3 s | 3 | 3 | 2,17 | 163% | — | 23,5 | nível (13) + TM |
| Air Cutter | flying | Especial | 55 | 95% | 2,4 s | 0,3 s | 3 | 3 | 2,17 | 163% | — | 21,8 | nível (4) |
| Razor Leaf | grass | Físico | 55 | 95% | 2,4 s | 0,3 s | 3 | 3 | 2,17 | 163% | — | 21,8 | nível (11) + TM |
| Acid | poison | Especial | 40 | 100% | 2 s | 0,3 s | 2 | 2 | 1,5 | 125% | 7% | 20 | nível (10) + TM |
| DragonBreath | dragon | Especial | 60 | 100% | 3 s | 0,3 s | 3 | 3 | 2,17 | 163% | — | 20 | nível (8) |
| Powder Snow | ice | Especial | 40 | 100% | 2,4 s | 0,3 s | 3 | 3 | 2,17 | 163% | — | 16,7 | nível (11) + TM |
| Heat Wave | fire | Especial | 100 | 90% | 6 s | 0,5 s | 4 | 4 | 3 | 225% | — | 15 | nível (2) |
| Hyper Voice | normal | Especial | 90 | 100% | 6 s | 0,3 s | 4 | 4 | 3 | 225% | — | 15 | nível (4) |
| Muddy Water | water | Especial | 95 | 85% | 6 s | 0,3 s | 4 | 4 | 3 | 225% | — | 13,5 | nível (2) |
| Razor Wind | normal | Especial | 80 | 100% | 6 s | 1,2 s | 4 | 4 | 3 | 225% | 70% | 13,3 | nível (2) |
| Twister | dragon | Especial | 40 | 100% | 3 s | 0,3 s | 3 | 3 | 2,17 | 163% | — | 13,3 | nível (9) + TM |
| Icy Wind | ice | Especial | 55 | 95% | 4 s | 0,3 s | 3 | 3 | 2,17 | 163% | — | 13,1 | nível (6) |
| Rolling Kick | fighting | Físico | 60 | 85% | 4 s | 0,3 s | 2 | 2 | 1,5 | 125% | 7% | 12,8 | nível (2) |
| Pin Missile | bug | Físico | 14×3 | 85% | 3 s | 0,3 s | 5 | 5 | 3 | 225% | — | 11,9 | nível (6) |
| Overheat | fire | Especial | 140 | 90% | 12 s | 0,5 s | 4 | 4 | 3 | 225% | — | 10,5 | TM |
| Bubble | water | Especial | 20 | 100% | 2 s | 0,3 s | 3 | 3 | 2,17 | 163% | — | 10 | nível (19) |
| Snore | normal | Especial | 40 | 100% | 4 s | 0,3 s | 2 | 2 | 1,5 | 125% | 7% | 10 | nível (10) |
| Uproar | normal | Especial | 50 | 100% | 6 s | 0,3 s | 3 | 3 | 2,17 | 163% | — | 8,3 | nível (11) |
| Cross Chop | fighting | Físico | 100 | 80% | 12 s | 0,5 s | 3 | 3 | 2,17 | 163% | — | 6,7 | nível (5) |
| Silver Wind | bug | Especial | 60 | 100% | 12 s | 0,3 s | 3 | 3 | 2,17 | 163% | — | 5 | nível (5) |
| Cotton Spore | grass | Status | — | 85% | 3 s | 0,3 s | 3 | 3 | — | — | — | — | nível (8) |
| FeatherDance | flying | Status | — | 100% | 8 s | 0,3 s | 3 | 3 | — | — | — | — | nível (3) |
| GrassWhistle | grass | Status | — | 55% | 10 s | 0,3 s | 3 | 3 | — | — | — | — | nível (1) |
| Growl | normal | Status | — | 100% | 3 s | 0,3 s | 3 | 3 | — | — | — | — | nível (78) |
| Leer | normal | Status | — | 100% | 4 s | 0,3 s | 3 | 3 | — | — | — | — | nível (82) |
| Metal Sound | steel | Status | — | 85% | 3 s | 0,3 s | 3 | 3 | — | — | — | — | nível (8) |
| Poison Gas | poison | Status | — | 55% | 3 s | 0,3 s | 2 | 2 | — | — | 7% | — | nível (8) |
| PoisonPowder | poison | Status | — | 75% | 3,4 s | 0,3 s | 2 | 2 | — | — | 7% | — | nível (21) |
| Roar | normal | Status | — | 100% | 6 s | 0,9 s | 3 | 3 | — | — | 54% | — | nível (19) |
| Sand-Attack | ground | Status | — | 100% | 8 s | 0,3 s | 2 | 2 | — | — | 7% | — | nível (37) |
| Screech | normal | Status | — | 85% | 3 s | 0,3 s | 3 | 3 | — | — | — | — | nível (51) |
| Sing | normal | Status | — | 55% | 10 s | 0,3 s | 3 | 3 | — | — | — | — | nível (14) |
| Sleep Powder | grass | Status | — | 75% | 10 s | 0,3 s | 2 | 2 | — | — | 7% | — | nível (16) |
| Smokescreen | normal | Status | — | 100% | 6 s | 0,3 s | 2 | 2 | — | — | 7% | — | nível (14) |
| String Shot | bug | Status | — | 95% | 3 s | 0,3 s | 3 | 3 | — | — | — | — | nível (5) |
| Stun Spore | grass | Status | — | 75% | 4 s | 0,3 s | 2 | 2 | — | — | 7% | — | nível (21) |
| Tail Whip | normal | Status | — | 100% | 4 s | 0,3 s | 3 | 3 | — | — | — | — | nível (47) |
| Whirlwind | normal | Status | — | 100% | 6 s | 0,9 s | 3 | 3 | — | — | 54% | — | nível (12) |

## Círculo em volta do usuário (15)

| Golpe | Tipo | Cat. | Poder | Prec. | Recarga | Preparo | Alcance | Raio | Alvos na caça | Dano na caça | Desvio PvP | Poder/s | Origem |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| Spark | electric | Físico | 65 | 100% | 3 s | 0,4 s | — | 2 | 2,83 | 213% | 21% | 21,7 | nível (11) |
| Stomp | normal | Físico | 65 | 100% | 3 s | 0,4 s | — | 2 | 2,83 | 213% | 21% | 21,7 | nível (16) |
| Earthquake | ground | Físico | 100 | 100% | 6 s | 0,6 s | — | 3 | 3 | 225% | 12% | 16,7 | nível (20) + TM |
| Rapid Spin | normal | Físico | 20 | 100% | 1,5 s | 0,4 s | — | 1 | 1,5 | 125% | 21% | 13,3 | nível (11) |
| Explosion | normal | Físico | 250 | 100% | 30 s | 1 s | — | 4 | 3 | 225% | 68% | 8,3 | nível (17) |
| Selfdestruct | normal | Físico | 200 | 100% | 30 s | 1 s | — | 3 | 3 | 225% | 68% | 6,7 | nível (11) |
| Bide | normal | Físico | 60 | 100% | 15 s | 0,4 s | — | 1 | 1,5 | 125% | 21% | 4 | nível (10) |
| Eruption | fire | Especial | — | 100% | 12 s | 0,6 s | — | 4 | — | — | 12% | — | nível (2) |
| Follow Me | normal | Status | — | 100% | 12 s | — | — | 4 | — | — | — | — | nível (5) |
| Haze | ice | Status | — | 100% | 12 s | 0,4 s | — | 4 | — | — | — | — | nível (13) |
| Magnitude | ground | Físico | — | 100% | 2,7 s | 0,4 s | — | 3 | — | — | — | — | nível (9) |
| Perish Song | normal | Status | — | 100% | 30 s | 0,4 s | — | 4 | — | — | — | — | nível (9) |
| Sweet Scent | normal | Status | — | 100% | 6 s | 0,4 s | — | 3 | — | — | — | — | nível (15) |
| Teeter Dance | normal | Status | — | 100% | 6 s | 0,4 s | — | 3 | — | — | — | — | nível (1) |
| Water Spout | water | Especial | — | 100% | 12 s | 0,6 s | — | 4 | — | — | 12% | — | nível (3) |

## Campo em volta do usuário (11)

| Golpe | Tipo | Cat. | Poder | Prec. | Recarga | Preparo | Alcance | Raio | Alvos na caça | Dano na caça | Desvio PvP | Poder/s | Origem |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| Hail | ice | Status | — | 100% | 30 s | 0,3 s | — | 5 | — | — | — | — | nível (6) |
| Imprison | psychic | Status | — | 100% | 20 s | 0,3 s | — | 5 | — | — | — | — | nível (4) |
| Light Screen | psychic | Status | — | 100% | 20 s | 0,3 s | — | 2 | — | — | — | — | nível (20) |
| Mist | ice | Status | — | 100% | 20 s | 0,3 s | — | 2 | — | — | — | — | nível (16) |
| Mud Sport | ground | Status | — | 100% | 20 s | 0,3 s | — | 2 | — | — | — | — | nível (13) |
| Rain Dance | water | Status | — | 100% | 30 s | 0,3 s | — | 5 | — | — | — | — | nível (16) |
| Reflect | psychic | Status | — | 100% | 20 s | 0,3 s | — | 2 | — | — | — | — | nível (13) |
| Safeguard | normal | Status | — | 100% | 20 s | 0,3 s | — | 2 | — | — | — | — | nível (32) |
| Sandstorm | rock | Status | — | 100% | 30 s | 0,3 s | — | 5 | — | — | — | — | nível (15) |
| Sunny Day | fire | Status | — | 100% | 30 s | 0,3 s | — | 5 | — | — | — | — | nível (7) |
| Water Sport | water | Status | — | 100% | 20 s | 0,3 s | — | 2 | — | — | — | — | nível (12) |

## Área no ponto mirado (16)

| Golpe | Tipo | Cat. | Poder | Prec. | Recarga | Preparo | Alcance | Raio | Alvos na caça | Dano na caça | Desvio PvP | Poder/s | Origem |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| Sludge | poison | Especial | 65 | 100% | 3 s | 0,6 s | 6 | 1 | 1,67 | 133% | 49% | 21,7 | nível (6) |
| Water Pulse | water | Especial | 60 | 100% | 3 s | 0,6 s | 6 | 1 | 1,67 | 133% | 49% | 20 | nível (7) + TM |
| Sludge Bomb | poison | Especial | 90 | 100% | 6 s | 0,6 s | 6 | 1 | 1,67 | 133% | 49% | 15 | nível (5) + TM |
| Thunder | electric | Especial | 120 | 70% | 6 s | 0,8 s | 6 | 1 | 1,67 | 133% | 70% | 14 | nível (13) + TM |
| Egg Bomb | normal | Físico | 100 | 75% | 6 s | 0,8 s | 6 | 1 | 1,67 | 133% | 70% | 12,5 | nível (3) |
| Future Sight | psychic | Especial | 80 | 90% | 6 s | 0,3 s | 6 | 1 | 1,67 | 133% | 7% | 12 | nível (20) |
| Rock Slide | rock | Físico | 75 | 90% | 6 s | 0,6 s | 6 | 1 | 1,67 | 133% | 49% | 11,3 | nível (9) |
| Psycho Boost | psychic | Especial | 140 | 90% | 12 s | 0,8 s | 6 | 2 | 3 | 225% | 40% | 10,5 | nível (1) |
| Doom Desire | steel | Especial | 120 | 85% | 12 s | 0,3 s | 6 | 1 | 1,67 | 133% | 7% | 8,5 | nível (1) |
| Fire Blast | fire | Especial | 120 | 85% | 12 s | 0,8 s | 6 | 2 | 3 | 225% | 40% | 8,5 | nível (7) + TM |
| Blizzard | ice | Especial | 120 | 70% | 12 s | 0,8 s | 6 | 2 | 3 | 225% | 40% | 7 | nível (10) + TM |
| Rock Tomb | rock | Físico | 50 | 80% | 6 s | 0,6 s | 6 | 1 | 1,67 | 133% | 49% | 6,7 | nível (3) |
| Fire Spin | fire | Especial | 15 | 70% | 4 s | 0,6 s | 6 | 1 | 1,67 | 133% | 49% | 2,6 | nível (13) |
| Sand Tomb | ground | Físico | 15 | 70% | 4 s | 0,6 s | 6 | 1 | 1,67 | 133% | 49% | 2,6 | nível (7) |
| Whirlpool | water | Especial | 15 | 70% | 4 s | 0,6 s | 6 | 1 | 1,67 | 133% | 49% | 2,6 | nível (6) |
| Present | normal | Físico | — | 90% | 4 s | 0,6 s | 6 | 1 | — | — | 49% | — | nível (1) |

## Salto (área onde cai) (4)

| Golpe | Tipo | Cat. | Poder | Prec. | Recarga | Preparo | Alcance | Raio | Alvos na caça | Dano na caça | Desvio PvP | Poder/s | Origem |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| Dig | ground | Físico | 60 | 100% | 4 s | 1 s | 5 | 1 | 1,67 | 133% | 70% | 15 | nível (4) |
| Bounce | flying | Físico | 85 | 85% | 8 s | 1 s | 5 | 1 | 1,67 | 133% | 70% | 9 | nível (4) |
| Fly | flying | Físico | 70 | 95% | 8 s | 1 s | 5 | 1 | 1,67 | 133% | 70% | 8,3 | nível (2) + HM |
| Dive | water | Físico | 60 | 100% | 8 s | 1 s | 5 | 1 | 1,67 | 133% | 70% | 7,5 | HM |

## Feixe (linha reta) (17)

| Golpe | Tipo | Cat. | Poder | Prec. | Recarga | Preparo | Alcance | Raio | Alvos na caça | Dano na caça | Desvio PvP | Poder/s | Origem |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| Thunderbolt | electric | Especial | 95 | 100% | 4 s | 0,4 s | 8 | — | 2,17 | 163% | 21% | 23,8 | nível (4) + TM |
| Aurora Beam | ice | Especial | 65 | 100% | 3 s | 0,4 s | 7 | — | 2 | 150% | 21% | 21,7 | nível (11) |
| BubbleBeam | water | Especial | 65 | 100% | 3 s | 0,4 s | 7 | — | 2 | 150% | 21% | 21,7 | nível (13) |
| Psybeam | psychic | Especial | 65 | 100% | 3 s | 0,4 s | 7 | — | 2 | 150% | 21% | 21,7 | nível (20) |
| SolarBeam | grass | Especial | 120 | 100% | 6 s | 1,5 s | 8 | — | 2,17 | 163% | 70% | 20 | nível (12) + TM |
| Signal Beam | bug | Especial | 75 | 100% | 4 s | 0,4 s | 7 | — | 2 | 150% | 21% | 18,8 | nível (1) |
| Psychic | psychic | Especial | 90 | 100% | 5 s | 0,4 s | 7 | — | 2 | 150% | 21% | 18 | nível (32) + TM |
| Water Gun | water | Especial | 40 | 100% | 2,4 s | 0,4 s | 6 | — | 1,83 | 142% | 21% | 16,7 | nível (51) + TM |
| Ice Beam | ice | Especial | 95 | 100% | 6 s | 0,4 s | 8 | — | 2,17 | 163% | 21% | 15,8 | nível (10) + TM |
| Hyper Beam | normal | Especial | 150 | 90% | 10 s | 0,6 s | 8 | — | 2,17 | 163% | 49% | 13,5 | nível (22) + TM |
| Tri Attack | normal | Especial | 80 | 100% | 6 s | 0,4 s | 4 | — | 1,5 | 125% | 21% | 13,3 | nível (6) |
| Comet Punch | normal | Físico | 18×3 | 85% | 4 s | 0,4 s | 3 | — | 1,33 | 117% | 21% | 11,5 | nível (4) |
| Hydro Pump | water | Especial | 120 | 80% | 12 s | 0,6 s | 8 | — | 2,17 | 163% | 49% | 8 | nível (38) |
| Aeroblast | flying | Especial | 100 | 95% | 12 s | 0,6 s | 8 | — | 2,17 | 163% | 49% | 7,9 | nível (1) |
| Smog | poison | Especial | 20 | 70% | 3 s | 0,4 s | 3 | — | 1,33 | 117% | 21% | 4,7 | nível (10) |
| Dragon Rage | dragon | Especial | — | 100% | 6 s | 0,4 s | 6 | — | — | — | 21% | — | nível (7) |
| Fissure | ground | Físico | — | 30% | 15 s | 0,8 s | 5 | — | — | — | 70% | — | nível (6) |

## Projétil (34)

| Golpe | Tipo | Cat. | Poder | Prec. | Recarga | Preparo | Alcance | Raio | Alvos na caça | Dano na caça | Desvio PvP | Poder/s | Origem |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| ThunderShock | electric | Especial | 40 | 100% | 1,3 s | 0,2 s | 5 | — | 1 | 100% | — | 30,8 | nível (11) + TM |
| Shadow Ball | ghost | Especial | 80 | 100% | 2,7 s | 0,2 s | 6 | — | 1 | 100% | — | 29,6 | nível (7) + TM |
| Bone Club | ground | Físico | 65 | 85% | 2 s | 0,2 s | 6 | — | 1 | 100% | — | 27,6 | nível (2) |
| Ember | fire | Especial | 40 | 100% | 1,6 s | 0,2 s | 5 | — | 1 | 100% | — | 25 | nível (31) + TM |
| Twineedle | bug | Físico | 25×2 | 100% | 2 s | 0,2 s | 5 | — | 1 | 100% | — | 25 | nível (1) |
| Bullet Seed | grass | Físico | 10×3 | 100% | 1,3 s | 0,2 s | 5 | — | 1 | 100% | — | 23,1 | nível (1) |
| Bonemerang | ground | Físico | 50×2 | 90% | 4 s | 0,2 s | 5 | — | 1 | 100% | — | 22,5 | nível (2) |
| Spike Cannon | normal | Físico | 20×3 | 100% | 2,7 s | 0,2 s | 5 | — | 1 | 100% | — | 22,2 | nível (3) |
| Pay Day | normal | Físico | 40 | 100% | 2 s | 0,2 s | 5 | — | 1 | 100% | — | 20 | nível (2) |
| Mud Shot | ground | Especial | 55 | 95% | 2,7 s | 0,2 s | 5 | — | 1 | 100% | — | 19,4 | nível (11) |
| Barrage | normal | Físico | 15×3 | 85% | 2 s | 0,2 s | 5 | — | 1 | 100% | — | 19,1 | nível (2) |
| Rock Throw | rock | Físico | 50 | 90% | 2,7 s | 0,2 s | 5 | — | 1 | 100% | — | 16,7 | nível (12) + TM |
| Spit Up | normal | Especial | 100 | 100% | 6 s | 0,2 s | 7 | — | 1 | 100% | — | 16,7 | nível (8) |
| Bone Rush | ground | Físico | 25×3 | 80% | 4 s | 0,2 s | 5 | — | 1 | 100% | — | 15 | nível (2) |
| Rock Blast | rock | Físico | 25×3 | 80% | 4 s | 0,2 s | 5 | — | 1 | 100% | — | 15 | nível (8) |
| Octazooka | water | Especial | 65 | 85% | 4 s | 0,2 s | 6 | — | 1 | 100% | — | 13,8 | nível (1) |
| Poison Sting | poison | Físico | 15 | 100% | 1,1 s | 0,2 s | 5 | — | 1 | 100% | — | 12,5 | nível (21) + TM |
| Weather Ball | normal | Especial | 50 | 100% | 4 s | 0,2 s | 5 | — | 1 | 100% | — | 12,5 | nível (1) |
| Sacred Fire | fire | Físico | 100 | 95% | 8 s | 0,2 s | 7 | — | 1 | 100% | — | 11,9 | nível (1) |
| Luster Purge | psychic | Especial | 70 | 100% | 8 s | 0,2 s | 6 | — | 1 | 100% | — | 8,8 | nível (1) |
| Mist Ball | psychic | Especial | 70 | 100% | 8 s | 0,2 s | 6 | — | 1 | 100% | — | 8,8 | nível (1) |
| AncientPower | rock | Especial | 60 | 100% | 8 s | 0,2 s | 5 | — | 1 | 100% | — | 7,5 | nível (24) |
| Zap Cannon | electric | Especial | 100 | 50% | 8 s | 0,2 s | 7 | — | 1 | 100% | — | 6,3 | nível (8) |
| Mud-Slap | ground | Especial | 20 | 100% | 4 s | 0,2 s | 5 | — | 1 | 100% | — | 5 | nível (13) + TM |
| Confuse Ray | ghost | Status | — | 100% | 12 s | 0,2 s | 5 | — | — | — | — | — | nível (29) |
| Hidden Power | normal | Especial | — | 100% | 2,7 s | 0,2 s | 5 | — | — | — | — | — | nível (3) |
| Hypnosis | psychic | Status | — | 60% | 10 s | 0,2 s | 5 | — | — | — | — | — | nível (19) |
| Leech Seed | grass | Status | — | 90% | 12 s | 0,2 s | 5 | — | — | — | — | — | nível (13) |
| Night Shade | ghost | Especial | — | 100% | 2,7 s | 0,2 s | 5 | — | — | — | — | — | nível (14) |
| SonicBoom | normal | Especial | — | 90% | 2 s | 0,2 s | 5 | — | — | — | — | — | nível (5) |
| Supersonic | normal | Status | — | 55% | 6 s | 0,2 s | 5 | — | — | — | — | — | nível (27) |
| Thunder Wave | electric | Status | — | 100% | 6 s | 0,2 s | 5 | — | — | — | — | — | nível (19) |
| Toxic | poison | Status | — | 85% | 12 s | 0,2 s | 5 | — | — | — | — | — | nível (4) |
| Will-O-Wisp | fire | Status | — | 75% | 8 s | 0,2 s | 5 | — | — | — | — | — | nível (5) |

## Investida (16)

| Golpe | Tipo | Cat. | Poder | Prec. | Recarga | Preparo | Alcance | Raio | Alvos na caça | Dano na caça | Desvio PvP | Poder/s | Origem |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| Double-Edge | normal | Físico | 120 | 100% | 3 s | 0,5 s | 5 | — | 1 | 100% | 35% | 40 | nível (34) |
| Flame Wheel | fire | Físico | 60 | 100% | 1,6 s | 0,3 s | 3 | — | 1 | 100% | 7% | 37,5 | nível (4) |
| Skull Bash | normal | Físico | 100 | 100% | 2,7 s | 1 s | 4 | — | 1 | 100% | 70% | 37 | nível (4) |
| Jump Kick | fighting | Físico | 70 | 95% | 1,8 s | 0,3 s | 4 | — | 1 | 100% | 7% | 36,9 | nível (1) |
| Hi Jump Kick | fighting | Físico | 85 | 90% | 2,1 s | 0,3 s | 4 | — | 1 | 100% | 7% | 36,4 | nível (3) |
| Take Down | normal | Físico | 90 | 85% | 2,3 s | 0,3 s | 4 | — | 1 | 100% | 7% | 33,3 | nível (45) |
| Mach Punch | fighting | Físico | 40 | 100% | 1,3 s | — | 2 | — | 1 | 100% | — | 30,8 | nível (2) |
| Quick Attack | normal | Físico | 40 | 100% | 1,3 s | — | 3 | — | 1 | 100% | — | 30,8 | nível (48) |
| Aerial Ace | flying | Físico | 60 | 100% | 2 s | 0,3 s | 3 | — | 1 | 100% | 7% | 30 | nível (3) + TM |
| Wing Attack | flying | Físico | 60 | 100% | 2,3 s | 0,3 s | 4 | — | 1 | 100% | 7% | 26,1 | nível (17) |
| Low Kick | fighting | Físico | 60 | 100% | 3 s | 0,3 s | 3 | — | 1 | 100% | 7% | 20 | nível (6) |
| Megahorn | bug | Físico | 120 | 85% | 6 s | 0,5 s | 4 | — | 1 | 100% | 35% | 17 | nível (3) |
| Sky Attack | flying | Físico | 140 | 90% | 8 s | 1,5 s | 6 | — | 1 | 100% | 70% | 15,8 | nível (2) |
| Ice Ball | ice | Físico | 30 | 90% | 2 s | 0,3 s | 3 | — | 1 | 100% | 7% | 13,5 | nível (3) |
| Rollout | rock | Físico | 30 | 90% | 2 s | 0,3 s | 3 | — | 1 | 100% | 7% | 13,5 | nível (14) |
| ExtremeSpeed | normal | Físico | 80 | 100% | 8 s | — | 5 | — | 1 | 100% | — | 10 | nível (3) |

## Corpo a corpo (79)

| Golpe | Tipo | Cat. | Poder | Prec. | Recarga | Preparo | Alcance | Raio | Alvos na caça | Dano na caça | Desvio PvP | Poder/s | Origem |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| Double Kick | fighting | Físico | 30×2 | 100% | 1,3 s | — | 1 | — | 1 | 100% | — | 46,2 | nível (10) |
| Horn Attack | normal | Físico | 65 | 100% | 1,6 s | — | 1 | — | 1 | 100% | — | 40,6 | nível (10) |
| Drill Peck | flying | Físico | 80 | 100% | 2 s | — | 1 | — | 1 | 100% | — | 40 | nível (5) |
| Bite | dark | Físico | 60 | 100% | 1,6 s | — | 1 | — | 1 | 100% | — | 37,5 | nível (53) |
| Metal Claw | steel | Físico | 50 | 95% | 1,3 s | — | 1 | — | 1 | 100% | — | 36,5 | nível (11) + TM |
| Slash | normal | Físico | 70 | 100% | 2 s | — | 1 | — | 1 | 100% | — | 35 | nível (35) |
| Steel Wing | steel | Físico | 70 | 90% | 1,8 s | — | 1 | — | 1 | 100% | — | 35 | nível (1) |
| Mega Punch | normal | Físico | 80 | 85% | 2 s | — | 1 | — | 1 | 100% | — | 34 | nível (3) |
| Covet | normal | Físico | 40 | 100% | 1 s | — | 1 | — | 1 | 100% | — | 33,3 | nível (7) |
| False Swipe | normal | Físico | 40 | 100% | 1 s | — | 1 | — | 1 | 100% | — | 33,3 | nível (9) |
| Pound | normal | Físico | 40 | 100% | 1,1 s | — | 1 | — | 1 | 100% | — | 33,3 | nível (24) |
| Scratch | normal | Físico | 40 | 100% | 1,1 s | — | 1 | — | 1 | 100% | — | 33,3 | nível (44) |
| Submission | fighting | Físico | 80 | 80% | 2 s | — | 1 | — | 1 | 100% | — | 32 | nível (5) |
| Cut | normal | Físico | 50 | 95% | 1,5 s | — | 1 | — | 1 | 100% | — | 31,7 | HM |
| Body Slam | normal | Físico | 85 | 100% | 2,7 s | — | 1 | — | 1 | 100% | — | 31,5 | nível (20) |
| Karate Chop | fighting | Físico | 50 | 100% | 1,6 s | — | 1 | — | 1 | 100% | — | 31,3 | nível (5) + TM |
| Poison Tail | poison | Físico | 50 | 100% | 1,6 s | — | 1 | — | 1 | 100% | — | 31,3 | nível (1) |
| Shadow Punch | ghost | Físico | 60 | 100% | 2 s | — | 1 | — | 1 | 100% | — | 30 | nível (3) |
| Slam | normal | Físico | 80 | 75% | 2 s | — | 1 | — | 1 | 100% | — | 30 | nível (19) |
| Crunch | dark | Físico | 80 | 100% | 2,7 s | — | 1 | — | 1 | 100% | — | 29,6 | nível (28) |
| Dragon Claw | dragon | Físico | 80 | 100% | 2,7 s | — | 1 | — | 1 | 100% | — | 29,6 | nível (4) + TM |
| Peck | flying | Físico | 35 | 100% | 1,1 s | — | 1 | — | 1 | 100% | — | 29,2 | nível (24) |
| Sky Uppercut | fighting | Físico | 85 | 90% | 2,7 s | — | 1 | — | 1 | 100% | — | 28,3 | nível (4) |
| Brick Break | fighting | Físico | 75 | 100% | 2,7 s | — | 1 | — | 1 | 100% | — | 27,8 | nível (3) + TM |
| Iron Tail | steel | Físico | 100 | 75% | 2,7 s | — | 1 | — | 1 | 100% | — | 27,8 | nível (5) + TM |
| Tackle | normal | Físico | 35 | 95% | 1,1 s | — | 1 | — | 1 | 100% | — | 27,7 | nível (106) |
| Hyper Fang | normal | Físico | 80 | 90% | 2,7 s | — | 1 | — | 1 | 100% | — | 26,7 | nível (2) |
| Strength | normal | Físico | 80 | 100% | 3 s | — | 1 | — | 1 | 100% | — | 26,7 | HM |
| Headbutt | normal | Físico | 70 | 100% | 2,7 s | — | 1 | — | 1 | 100% | — | 25,9 | nível (22) |
| Leaf Blade | grass | Físico | 70 | 100% | 2,7 s | — | 1 | — | 1 | 100% | — | 25,9 | nível (2) |
| Focus Punch | fighting | Físico | 150 | 100% | 6 s | 1 s | 1 | — | 1 | 100% | — | 25 | nível (1) + TM |
| Arm Thrust | fighting | Físico | 15×3 | 100% | 2 s | — | 1 | — | 1 | 100% | — | 22,5 | nível (2) |
| Needle Arm | grass | Físico | 60 | 100% | 2,7 s | — | 1 | — | 1 | 100% | — | 22,2 | nível (2) |
| Meteor Mash | steel | Físico | 100 | 85% | 4 s | — | 1 | — | 1 | 100% | — | 21,3 | nível (3) |
| Pursuit | dark | Físico | 40 | 100% | 2 s | — | 1 | — | 1 | 100% | — | 20 | nível (25) + TM |
| Waterfall | water | Físico | 80 | 100% | 4 s | — | 1 | — | 1 | 100% | — | 20 | nível (2) + HM |
| Blaze Kick | fire | Físico | 85 | 90% | 4 s | — | 1 | — | 1 | 100% | — | 19,1 | nível (1) |
| Crabhammer | water | Físico | 90 | 85% | 4 s | — | 1 | — | 1 | 100% | — | 19,1 | nível (4) |
| Fury Attack | normal | Físico | 15×3 | 85% | 2 s | — | 1 | — | 1 | 100% | — | 19,1 | nível (19) |
| Fire Punch | fire | Físico | 75 | 100% | 4 s | — | 1 | — | 1 | 100% | — | 18,8 | nível (5) + TM |
| Ice Punch | ice | Físico | 75 | 100% | 4 s | — | 1 | — | 1 | 100% | — | 18,8 | nível (3) + TM |
| ThunderPunch | electric | Físico | 75 | 100% | 4 s | — | 1 | — | 1 | 100% | — | 18,8 | nível (5) + TM |
| Poison Fang | poison | Físico | 50 | 100% | 2,7 s | — | 1 | — | 1 | 100% | — | 18,5 | nível (4) |
| Crush Claw | normal | Físico | 75 | 95% | 4 s | — | 1 | — | 1 | 100% | — | 17,8 | nível (1) |
| Dizzy Punch | normal | Físico | 70 | 100% | 4 s | — | 1 | — | 1 | 100% | — | 17,5 | nível (2) |
| Vital Throw | fighting | Físico | 70 | 100% | 4 s | 0,2 s | 1 | — | 1 | 100% | — | 17,5 | nível (5) |
| Fury Swipes | normal | Físico | 18×3 | 80% | 2,7 s | — | 1 | — | 1 | 100% | — | 16 | nível (26) |
| Lick | ghost | Físico | 20 | 100% | 1,3 s | — | 1 | — | 1 | 100% | — | 15,4 | nível (12) |
| Revenge | fighting | Físico | 60 | 100% | 4 s | 0,6 s | 1 | — | 1 | 100% | — | 15 | nível (7) |
| SmellingSalt | normal | Físico | 60 | 100% | 4 s | — | 1 | — | 1 | 100% | — | 15 | nível (2) |
| Superpower | fighting | Físico | 120 | 100% | 8 s | — | 1 | — | 1 | 100% | — | 15 | nível (3) |
| Vine Whip | grass | Físico | 45 | 100% | 3 s | — | 1 | — | 1 | 100% | — | 15 | nível (7) + TM |
| Mega Kick | normal | Físico | 120 | 75% | 8 s | — | 1 | — | 1 | 100% | — | 11,3 | nível (1) |
| Astonish | ghost | Físico | 30 | 100% | 2,7 s | — | 1 | — | 1 | 100% | — | 11,1 | nível (26) + TM |
| Knock Off | dark | Físico | 20 | 100% | 2 s | — | 1 | — | 1 | 100% | — | 10 | nível (10) |
| Rage | normal | Físico | 20 | 100% | 2 s | — | 1 | — | 1 | 100% | — | 10 | nível (24) |
| Rock Smash | fighting | Físico | 20 | 100% | 2 s | — | 1 | — | 1 | 100% | — | 10 | HM |
| Thief | dark | Físico | 40 | 100% | 4 s | — | 1 | — | 1 | 100% | — | 10 | nível (4) |
| DoubleSlap | normal | Físico | 15×3 | 85% | 4 s | — | 1 | — | 1 | 100% | — | 9,6 | nível (14) |
| Constrict | normal | Físico | 10 | 100% | 1,1 s | — | 1 | — | 1 | 100% | — | 8,3 | nível (11) |
| Leech Life | bug | Físico | 20 | 100% | 2,7 s | — | 1 | — | 1 | 100% | — | 7,4 | nível (12) + TM |
| Triple Kick | fighting | Físico | 10×3 | 90% | 4 s | — | 1 | — | 1 | 100% | — | 6,8 | nível (1) |
| Clamp | water | Físico | 35 | 75% | 4 s | — | 1 | — | 1 | 100% | — | 6,6 | nível (2) |
| Wrap | normal | Físico | 15 | 85% | 2 s | — | 1 | — | 1 | 100% | — | 6,4 | nível (15) |
| DynamicPunch | fighting | Físico | 100 | 50% | 8 s | — | 1 | — | 1 | 100% | — | 6,3 | nível (4) |
| Bind | normal | Físico | 15 | 75% | 2 s | — | 1 | — | 1 | 100% | — | 5,6 | nível (6) |
| Fury Cutter | bug | Físico | 10 | 95% | 2 s | — | 1 | — | 1 | 100% | — | 4,8 | nível (9) |
| Fake Out | normal | Físico | 40 | 100% | 10 s | — | 1 | — | 1 | 100% | — | 4 | nível (8) |
| Endeavor | normal | Físico | — | 100% | 8 s | — | 1 | — | — | — | — | — | nível (11) |
| Flail | normal | Físico | — | 100% | 2,7 s | — | 1 | — | — | — | — | — | nível (15) |
| Guillotine | normal | Físico | — | 30% | 15 s | 0,8 s | 1 | — | — | — | — | — | nível (6) |
| Horn Drill | normal | Físico | — | 30% | 15 s | 0,8 s | 1 | — | — | — | — | — | nível (6) |
| Lovely Kiss | normal | Status | — | 75% | 10 s | — | 1 | — | — | — | — | — | nível (1) |
| Reversal | fighting | Físico | — | 100% | 2,7 s | — | 1 | — | — | — | — | — | nível (8) |
| Seismic Toss | fighting | Físico | — | 100% | 2 s | — | 1 | — | — | — | — | — | nível (8) |
| Spore | grass | Status | — | 100% | 10 s | — | 1 | — | — | — | — | — | nível (3) |
| Super Fang | normal | Físico | — | 90% | 4 s | — | 1 | — | — | — | — | — | nível (2) |
| Sweet Kiss | normal | Status | — | 75% | 12 s | — | 1 | — | — | — | — | — | nível (7) |
| Tickle | normal | Status | — | 100% | 6 s | — | 1 | — | — | — | — | — | nível (5) |

## Segue o alvo (42)

| Golpe | Tipo | Cat. | Poder | Prec. | Recarga | Preparo | Alcance | Raio | Alvos na caça | Dano na caça | Desvio PvP | Poder/s | Origem |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| Extrasensory | psychic | Especial | 80 | 100% | 2 s | 0,2 s | 6 | — | 1 | 100% | — | 40 | nível (1) |
| Dream Eater | psychic | Especial | 100 | 100% | 2,7 s | 0,4 s | 7 | — | 1 | 100% | — | 37 | nível (8) |
| Faint Attack | dark | Físico | 60 | 100% | 2 s | 0,2 s | 5 | — | 1 | 100% | — | 30 | nível (26) |
| Magical Leaf | grass | Especial | 60 | 100% | 3 s | 0,2 s | 5 | — | 1 | 100% | — | 20 | nível (3) |
| Swift | normal | Especial | 60 | 100% | 3 s | 0,2 s | 5 | — | 1 | 100% | — | 20 | nível (22) + TM |
| Confusion | psychic | Especial | 50 | 100% | 4 s | 0,2 s | 5 | — | 1 | 100% | — | 12,5 | nível (37) + TM |
| Absorb | grass | Especial | 20 | 100% | 2 s | 0,2 s | 5 | — | 1 | 100% | — | 10 | nível (21) + TM |
| Mega Drain | grass | Especial | 40 | 100% | 4 s | 0,2 s | 5 | — | 1 | 100% | — | 10 | nível (14) |
| Giga Drain | grass | Especial | 60 | 100% | 8 s | 0,2 s | 5 | — | 1 | 100% | — | 7,5 | nível (7) + TM |
| Beat Up | dark | Físico | 10 | 100% | 4 s | 0,2 s | 5 | — | 1 | 100% | — | 2,5 | nível (1) |
| Attract | normal | Status | — | 100% | 8 s | 0,2 s | 5 | — | — | — | — | — | nível (5) |
| Block | normal | Status | — | 100% | 24 s | 0,2 s | 5 | — | — | — | — | — | nível (3) |
| Charm | normal | Status | — | 100% | 6 s | 0,2 s | 5 | — | — | — | — | — | nível (14) |
| Curse | mystery | Status | — | 100% | 12 s | 0,2 s | 5 | — | — | — | — | — | nível (14) |
| Disable | normal | Status | — | 55% | 6 s | 0,2 s | 5 | — | — | — | — | — | nível (19) |
| Encore | normal | Status | — | 100% | 24 s | 0,2 s | 5 | — | — | — | — | — | nível (18) |
| Fake Tears | dark | Status | — | 100% | 6 s | 0,2 s | 5 | — | — | — | — | — | nível (6) |
| Flatter | dark | Status | — | 100% | 8 s | 0,2 s | 5 | — | — | — | — | — | nível (5) |
| Foresight | normal | Status | — | 100% | 3 s | 0,2 s | 5 | — | — | — | — | — | nível (15) |
| Glare | normal | Status | — | 75% | 4 s | 0,2 s | 5 | — | — | — | — | — | nível (4) |
| Kinesis | psychic | Status | — | 80% | 8 s | 0,2 s | 5 | — | — | — | — | — | nível (2) |
| Lock-On | normal | Status | — | 100% | 24 s | 0,2 s | 5 | — | — | — | — | — | nível (9) |
| Mean Look | normal | Status | — | 100% | 24 s | 0,2 s | 5 | — | — | — | — | — | nível (14) |
| Memento | dark | Status | — | 100% | 30 s | 0,2 s | 5 | — | — | — | — | — | nível (5) |
| Mimic | normal | Status | — | 100% | 20 s | 0,2 s | 5 | — | — | — | — | — | nível (2) |
| Mind Reader | normal | Status | — | 100% | 24 s | 0,2 s | 5 | — | — | — | — | — | nível (9) |
| Odor Sleuth | normal | Status | — | 100% | 3 s | 0,2 s | 5 | — | — | — | — | — | nível (17) |
| Pain Split | normal | Status | — | 100% | 6 s | 0,2 s | 5 | — | — | — | — | — | nível (1) |
| Psych Up | normal | Status | — | 100% | 12 s | 0,2 s | 5 | — | — | — | — | — | nível (11) |
| Psywave | psychic | Especial | — | 80% | 2,7 s | 0,2 s | 6 | — | — | — | — | — | nível (8) |
| Role Play | psychic | Status | — | 100% | 12 s | 0,2 s | 5 | — | — | — | — | — | nível (2) |
| Scary Face | normal | Status | — | 90% | 12 s | 0,2 s | 5 | — | — | — | — | — | nível (35) |
| Sheer Cold | ice | Especial | — | 30% | 15 s | 0,8 s | 7 | — | — | — | — | — | nível (8) |
| Sketch | normal | Status | — | 100% | 30 s | 0,2 s | 5 | — | — | — | — | — | nível (1) |
| Spider Web | bug | Status | — | 100% | 12 s | 0,2 s | 5 | — | — | — | — | — | nível (2) |
| Spite | ghost | Status | — | 100% | 12 s | 0,2 s | 5 | — | — | — | — | — | nível (8) |
| Swagger | normal | Status | — | 90% | 8 s | 0,2 s | 5 | — | — | — | — | — | nível (10) |
| Taunt | dark | Status | — | 100% | 6 s | 0,2 s | 5 | — | — | — | — | — | nível (9) |
| Torment | dark | Status | — | 100% | 8 s | 0,2 s | 5 | — | — | — | — | — | nível (1) |
| Transform | normal | Status | — | 100% | 30 s | 0,2 s | 5 | — | — | — | — | — | nível (2) |
| Trick | psychic | Status | — | 100% | 12 s | 0,2 s | 5 | — | — | — | — | — | nível (3) |
| Yawn | normal | Status | — | 100% | 12 s | 0,2 s | 5 | — | — | — | — | — | nível (17) |

## Fúria (vários golpes seguidos) (3)

| Golpe | Tipo | Cat. | Poder | Prec. | Recarga | Preparo | Alcance | Raio | Alvos na caça | Dano na caça | Desvio PvP | Poder/s | Origem |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| Thrash | normal | Físico | 90×3 | 100% | 2,3 s | 2,4 s | 1 | — | 1 | 100% | — | 112,5 | nível (13) |
| Outrage | dragon | Físico | 90×3 | 100% | 2,7 s | 2,4 s | 1 | — | 1 | 100% | — | 100 | nível (4) |
| Petal Dance | grass | Especial | 70×3 | 100% | 2 s | 2,4 s | 1 | — | 1 | 100% | — | 87,5 | nível (6) |

## No próprio Pokémon (56)

| Golpe | Tipo | Cat. | Poder | Prec. | Recarga | Preparo | Alcance | Raio | Alvos na caça | Dano na caça | Desvio PvP | Poder/s | Origem |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| Acid Armor | poison | Status | — | 100% | 3 s | — | — | — | — | — | — | — | nível (3) |
| Agility | psychic | Status | — | 100% | 4 s | — | — | — | — | — | — | — | nível (58) |
| Amnesia | psychic | Status | — | 100% | 6 s | — | — | — | — | — | — | — | nível (28) |
| Aromatherapy | grass | Status | — | 100% | 20 s | — | — | — | — | — | — | — | nível (4) |
| Barrier | psychic | Status | — | 100% | 4 s | — | — | — | — | — | — | — | nível (4) |
| Baton Pass | normal | Status | — | 100% | 15 s | — | — | — | — | — | — | — | nível (13) |
| Belly Drum | normal | Status | — | 100% | 30 s | — | — | — | — | — | — | — | nível (7) |
| Bulk Up | fighting | Status | — | 100% | 6 s | — | — | — | — | — | — | — | nível (3) |
| Calm Mind | psychic | Status | — | 100% | 6 s | — | — | — | — | — | — | — | nível (11) |
| Camouflage | normal | Status | — | 100% | 6 s | — | — | — | — | — | — | — | nível (1) |
| Charge | electric | Status | — | 100% | 6 s | — | — | — | — | — | — | — | nível (9) |
| Conversion | normal | Status | — | 100% | 4 s | — | — | — | — | — | — | — | nível (2) |
| Conversion 2 | normal | Status | — | 100% | 4 s | — | — | — | — | — | — | — | nível (2) |
| Cosmic Power | psychic | Status | — | 100% | 6 s | — | — | — | — | — | — | — | nível (7) |
| Counter | fighting | Físico | — | 100% | 10 s | — | — | — | — | — | — | — | nível (9) |
| Defense Curl | normal | Status | — | 100% | 3 s | — | — | — | — | — | — | — | nível (22) |
| Destiny Bond | ghost | Status | — | 100% | 20 s | — | — | — | — | — | — | — | nível (7) |
| Detect | fighting | Status | — | 100% | 8 s | — | — | — | — | — | — | — | nível (11) |
| Double Team | normal | Status | — | 100% | 8 s | — | — | — | — | — | — | — | nível (15) |
| Dragon Dance | dragon | Status | — | 100% | 6 s | — | — | — | — | — | — | — | nível (7) |
| Endure | normal | Status | — | 100% | 12 s | — | — | — | — | — | — | — | nível (12) |
| Focus Energy | normal | Status | — | 100% | 4 s | — | — | — | — | — | — | — | nível (34) |
| Growth | normal | Status | — | 100% | 3 s | — | — | — | — | — | — | — | nível (18) |
| Grudge | ghost | Status | — | 100% | 20 s | — | — | — | — | — | — | — | nível (5) |
| Harden | normal | Status | — | 100% | 4 s | — | — | — | — | — | — | — | nível (38) |
| Heal Bell | normal | Status | — | 100% | 20 s | — | — | — | — | — | — | — | nível (4) |
| Helping Hand | normal | Status | — | 100% | 6 s | — | — | — | — | — | — | — | nível (20) |
| Howl | normal | Status | — | 100% | 3 s | — | — | — | — | — | — | — | nível (9) |
| Ingrain | grass | Status | — | 100% | 20 s | — | — | — | — | — | — | — | nível (8) |
| Iron Defense | steel | Status | — | 100% | 8 s | — | — | — | — | — | — | — | nível (10) |
| Magic Coat | psychic | Status | — | 100% | 8 s | — | — | — | — | — | — | — | nível (2) |
| Meditate | psychic | Status | — | 100% | 3 s | — | — | — | — | — | — | — | nível (6) |
| Milk Drink | normal | Status | — | 100% | 20 s | — | — | — | — | — | — | — | nível (1) |
| Minimize | normal | Status | — | 100% | 6 s | — | — | — | — | — | — | — | nível (8) |
| Mirror Coat | psychic | Especial | — | 100% | 10 s | — | — | — | — | — | — | — | nível (6) |
| Moonlight | normal | Status | — | 100% | 20 s | — | — | — | — | — | — | — | nível (7) |
| Morning Sun | normal | Status | — | 100% | 20 s | — | — | — | — | — | — | — | nível (2) |
| Protect | normal | Status | — | 100% | 8 s | — | — | — | — | — | — | — | nível (30) |
| Recover | normal | Status | — | 100% | 20 s | — | — | — | — | — | — | — | nível (17) |
| Recycle | normal | Status | — | 100% | 12 s | — | — | — | — | — | — | — | nível (3) |
| Refresh | normal | Status | — | 100% | 6 s | — | — | — | — | — | — | — | nível (10) |
| Rest | psychic | Status | — | 100% | 30 s | — | — | — | — | — | — | — | nível (30) |
| Sharpen | normal | Status | — | 100% | 4 s | — | — | — | — | — | — | — | nível (1) |
| Slack Off | normal | Status | — | 100% | 20 s | — | — | — | — | — | — | — | nível (2) |
| Snatch | dark | Status | — | 100% | 10 s | — | — | — | — | — | — | — | nível (2) |
| Softboiled | normal | Status | — | 100% | 20 s | — | — | — | — | — | — | — | nível (2) |
| Splash | normal | Status | — | 100% | 3 s | — | — | — | — | — | — | — | nível (11) |
| Stockpile | normal | Status | — | 100% | 4 s | — | — | — | — | — | — | — | nível (8) |
| Substitute | normal | Status | — | 100% | 20 s | — | — | — | — | — | — | — | nível (2) |
| Swallow | normal | Status | — | 100% | 12 s | — | — | — | — | — | — | — | nível (8) |
| Swords Dance | normal | Status | — | 100% | 4 s | — | — | — | — | — | — | — | nível (9) |
| Synthesis | grass | Status | — | 100% | 20 s | — | — | — | — | — | — | — | nível (13) |
| Tail Glow | bug | Status | — | 100% | 6 s | — | — | — | — | — | — | — | nível (1) |
| Teleport | psychic | Status | — | 100% | 8 s | — | 4 | — | — | — | — | — | nível (9) |
| Wish | normal | Status | — | 100% | 20 s | — | — | — | — | — | — | — | nível (7) |
| Withdraw | water | Status | — | 100% | 3 s | — | — | — | — | — | — | — | nível (9) |

## Usa outro golpe (5)

| Golpe | Tipo | Cat. | Poder | Prec. | Recarga | Preparo | Alcance | Raio | Alvos na caça | Dano na caça | Desvio PvP | Poder/s | Origem |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| Assist | normal | Status | — | 100% | 6 s | — | — | — | — | — | — | — | nível (1) |
| Metronome | normal | Status | — | 100% | 6 s | — | — | — | — | — | — | — | nível (5) |
| Mirror Move | flying | Status | — | 100% | 6 s | — | — | — | — | — | — | — | nível (9) |
| Nature Power | normal | Status | — | 95% | 4 s | — | — | — | — | — | — | — | nível (6) |
| Sleep Talk | normal | Status | — | 100% | 3 s | — | — | — | — | — | — | — | nível (3) |

## Armadilha (1)

| Golpe | Tipo | Cat. | Poder | Prec. | Recarga | Preparo | Alcance | Raio | Alvos na caça | Dano na caça | Desvio PvP | Poder/s | Origem |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| Spikes | ground | Status | — | 100% | 20 s | 0,3 s | 5 | 1 | — | — | — | — | nível (7) |
