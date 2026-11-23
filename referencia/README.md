# Referência da tier list

Dados do jogo e regras do ranking, já categorizados, para atualizar a tier list sem refazer a pesquisa.

| Arquivo | O que tem | Como atualizar |
|---|---|---|
| [`mecanicas.md`](mecanicas.md) | Regras de combate, com a fonte de cada uma (código, texto do jogo, usuário ou estimativa) e onde achar no cliente. | À mão |
| [`golpes.md`](golpes.md) | Golpes por forma: tipo, categoria, poder, precisão, recarga, preparo, alcance, raio, alvos na caça, desvio no PvP, poder por segundo e origem (nível, HM, TM). | `node build-reference.mjs` |
| [`especies.md`](especies.md) | Espécies e Megas por ataque principal (físico, especial, misto), com atributos base e intervalo entre golpes. | `node build-reference.mjs` |
| [`constantes.md`](constantes.md) | Constantes do modelo (`MODEL` em `rank-pokemon.mjs`). | `node build-reference.mjs` |
| [`dados.json`](dados.json) | Os mesmos dados de golpes e espécies em JSON, para scripts. | `node build-reference.mjs` |

Os arquivos gerados vêm de `pokepedia-data.json`; rode `node collect-pokepedia.mjs` antes se o jogo mudou.
