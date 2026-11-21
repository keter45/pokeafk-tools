# pokeAFK Tools

Ferramentas para o [pokeAFK](https://pokeafk.io/): um userscript que ajuda no Mercado da Comunidade, na escolha de Pokémon e no daily de treinadores, e uma tier list on-line.

**Tier list:** https://keter45.github.io/pokeafk-tools/

> Projeto de fã, sem ligação com o pokeAFK. As tiers são estimativas de um modelo de simulação, não dados oficiais do jogo.

## Instalação

1. Instale o [Tampermonkey](https://www.tampermonkey.net/) no Chrome ou no Firefox.
2. Abra o link do script e clique em **Instalar**:
   https://raw.githubusercontent.com/keter45/pokeafk-tools/main/pokeafk-market-filtros.user.js
3. Recarregue a página do pokeAFK.

O Tampermonkey busca as versões novas no mesmo link. Para atualizar na hora, use **Procurar atualizações de scripts** no menu da extensão.

## O que o script faz

### Mercado da Comunidade
- Filtra os anúncios de Pokémon por natureza e IV mínimo.
- Mostra o selo de tier **PvE** e **Competitivo** ao lado do nome da espécie (lista, cartões e página da espécie).
- Ordena a lista agrupada por tier.
- Painel com a natureza, os IVs prioritários e o moveset de 4 golpes recomendados. O botão **Preencher natureza e IVs** marca as naturezas sugeridas e IV mínimo 28 nos IVs que mais importam.
- Abre a tier list completa num diálogo.

### MAPA e ficha do Pokémon
- Selo de tier na lista de hunts e no cartão da hunt selecionada.
- Selo de tier na ficha do Pokémon e uma seção **Moveset recomendado**.

### Daily de treinadores
O botão **⚔ Daily** fica no HUD, abaixo de "Poke Market". Ele luta com os treinadores do dia que ainda não foram vencidos:

- **Faixa de nível:** do nível do Pokémon principal até N níveis abaixo. Você escolhe o N no card; o sugerido é 10.
- **Ordem:** do treinador de nível mais baixo ao mais alto, e treinadores do mesmo lugar ficam juntos.
- **Vantagem de tipo:** com **Evitar times com vantagem de tipo** ligado, pula os treinadores cujo time tem um tipo super efetivo contra o seu principal. O time de cada treinador é aprendido na primeira luta contra ele.
- **Cura e caça:** cura no Centro Pokémon quando a vida está abaixo de 50% ou depois de uma derrota, e para a caça antes de começar.
- **Progresso:** mostra quantos faltam e a rota com o resultado de cada luta.
- **Card:** pode ser arrastado; um duplo clique no título volta ele ao lugar.
- **Treinadores inacessíveis:** pula, sem parar o daily, os treinadores de lugares fechados (como um Ginásio que pede insígnias) e os que não respondem depois do teleporte. Se quatro seguidos não respondem, o daily para.
- **Parar:** qualquer clique ou tecla sua fora do card para o daily, assim como o botão **Parar**.

## Tier list

São duas listas:
- **PvE:** dano por segundo na caça.
- **Competitivo:** desempenho em duelos longos, como a Ranqueada automática, combinado com a referência da Gen 3 (Smogon e Pokémon Showdown).

As tiers vão por percentil das espécies normais: S são os 8% melhores, A até 25%, B até 50%, C até 80% e D o resto. Lendários, míticos e Megas ficam numa categoria separada.

Os golpes considerados são os aprendidos por nível na linha evolutiva e as 7 HMs vendidas na Loja de Celadon. TMs ficam de fora, porque só saem ao acaso da TM Box. Uma HM só entra no moveset quando melhora o resultado em mais de 3%.

## Para desenvolver

É preciso ter o Node.js 18 ou mais recente; o projeto não tem dependências.

```sh
node collect-pokepedia.mjs        # baixa o catálogo do jogo (pokepedia-data.json)
node collect-competitive.mjs      # baixa as referências da Gen 3 (competitive-data.json)
node build-userscript.mjs         # recompila o bloco de dados do userscript
node build-tierlist-page.mjs      # regenera tierlist.html
node --check pokeafk-market-filtros.user.js
```

| Arquivo | Papel |
|---|---|
| `pokeafk-market-filtros.user.js` | O userscript. O bloco entre `GUIDE_DATA_START` e `GUIDE_DATA_END` é gerado; não edite à mão. |
| `rank-pokemon.mjs` | Motor do ranking: simula caça e duelos e escolhe golpes, natureza e IVs. |
| `collect-pokepedia.mjs`, `collect-competitive.mjs` | Coletores de dados. |
| `build-userscript.mjs`, `build-tierlist-page.mjs` | Geram o bloco de dados do script e a página da tier list. |
| `tierlist.html`, `index.html` | Página publicada no GitHub Pages. |

Ao mudar o userscript, suba o `@version` no cabeçalho; o Tampermonkey só atualiza quando o número aumenta. Os detalhes do modelo e dos seletores do jogo estão em [AGENTS.md](AGENTS.md).
