# pokeAFK Tools

Ferramentas para o [pokeAFK](https://pokeafk.io/): um userscript que ajuda no Mercado da Comunidade, na escolha de Pokémon, no daily de treinadores e no acompanhamento de várias contas, e uma tier list on-line.

**Tier list:** https://keter45.github.io/pokeafk-tools/

> Projeto de fã, sem ligação com o pokeAFK. As tiers são estimativas de um modelo de simulação, não dados oficiais do jogo.

## Instalação

1. Instale o [Tampermonkey](https://www.tampermonkey.net/) no Chrome ou no Firefox.
2. Abra o link do script e clique em **Instalar**:
   https://raw.githubusercontent.com/keter45/pokeafk-tools/main/poke-tools.user.js
3. Recarregue a página do pokeAFK.

O Tampermonkey busca as versões novas no mesmo link. Para atualizar na hora, use **Procurar atualizações de scripts** no menu da extensão.

**Ligar e desligar partes.** No menu do Tampermonkey, com a página do jogo aberta, aparecem quatro opções: **Tiers, filtros do mercado e ficha**, **Daily de treinadores**, **Monitor de contas** e **Desvio de golpes em área (experimental)**. ✅ indica que a parte está ligada e ⬜ que está desligada. O desvio vem desligado. Clique para trocar; a mudança vale depois de recarregar a página e para todas as abas.

**Vindo dos scripts antigos?** "PokeAFK — Filtros do Mercado" e "PokeAFK — Monitor de contas" viraram um só. Instale o PokeAFK Tools e desinstale os dois antigos no painel do Tampermonkey. Os filtros, as opções do daily e os times aprendidos continuam salvos. Os apelidos das contas precisam ser dados de novo.

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
- **Treinadores que andam:** se o treinador saiu do lugar e não responde, o script procura o sprite dele na tela e clica nele, e o jogo anda até lá.
- **Treinadores inacessíveis:** pula, sem parar o daily, os treinadores de lugares fechados (como um Ginásio que pede insígnias) e os que não respondem depois do teleporte. Se quatro seguidos não respondem, o daily para.
- **Parar:** qualquer clique ou tecla sua fora do card para o daily, assim como o botão **Parar**. Cliques no painel **Contas** não param o daily.

### Monitor de contas

Para quem joga com várias contas abertas, cada uma numa aba.

**Título e ícone da aba.** Cada aba do jogo passa a mostrar a conta, o que ela está fazendo e quantas bolas e poções tem, por exemplo `🟢 Keter · ◓1104 ✚1995`. O ícone da aba é um círculo com a inicial da conta, na cor do estado:

| Cor | Estado |
|---|---|
| 🟢 verde | Caçando ou pescando |
| 🔵 azul | Fazendo o daily (o título mostra quantos faltam) |
| 🟣 roxo | Em batalha |
| 🟡 amarelo (laranja no ícone) | Parado |
| ⚪ cinza | Fora do jogo, sem sinal ou aba fechada |

`◓` é o total de Poké Ball, Great Ball, Super Ball e Ultra Ball (a AFK Ball, usada nos shinies, fica fora e aparece separada no painel); `✚` é a soma de Poção, Superpoção e Hiperpoção. Com menos de 50 bolas ou 20 poções, aparece um `⚠` depois da bolinha de estado.

**Painel Contas.** O botão **Contas**, à esquerda do botão AUTO, mostra um quadradinho colorido por conta. Clique para abrir o painel, que usa a moldura e a fonte do HUD do jogo e tem dois modos:
- **Completo:** um cartão por conta, com o sprite do Pokémon principal sobre o fundo do tipo dele, o estado e há quanto tempo, a barra de HP, a **XP por hora** do treinador e do Pokémon principal, o Pokémon selvagem que está sendo caçado (ícone animado, nome e nível) ou o progresso do daily, as bolas, as poções, o dinheiro e a hora da última leitura.
- **Compacto:** uma linha por conta, com o sprite, o estado, o selvagem que está sendo caçado, as bolas, as poções e a XP por hora do treinador.

**XP por hora.** É o ganho de XP nos últimos 10 minutos, como o "ritmo atual" do Analisador de caça do jogo, e aparece depois de 3 minutos de medida (antes disso, "medindo…"). Passe o mouse sobre o número para ver a XP do nível e quanto falta para o próximo nível. Recarregar a aba não zera a medida; trocar o Pokémon principal zera a dele.

Passe o mouse em cima dos números para ver cada tipo de bola e de poção. O modo escolhido vale para todas as abas. O painel pode ser arrastado; um duplo clique no título volta ele ao lugar.

**Apelidos.** O título usa o nome da conta lido do HUD. Para trocar por um apelido, clique em ✎ ao lado da conta no modo Completo ou use **Dar um apelido a esta conta** no menu do Tampermonkey. Deixe o campo vazio para voltar ao nome da conta. O ✕ tira uma conta da lista; ela volta quando a aba dela atualizar.

**Contêineres do Firefox.** As contas se enxergam mesmo em contêineres diferentes (Firefox Multi-Account Containers), porque o script guarda os dados no armazenamento do Tampermonkey, que é um só para todas as abas.

**Limitações:**
- Só aparecem as contas que estão abertas numa aba com o script. Uma aba fechada fica como **Aba fechada**, e uma aba que não manda notícias há mais de 2 min e meio fica como **Sem sinal**. Isso acontece quando o navegador descarrega uma aba parada há muito tempo para economizar memória.
- As poções vêm do painel AUTOMAÇÕES do HUD. Se a conta não tiver esse painel, abra a Bolsa uma vez para o script ler as poções.
- O script não troca de aba: ele só mostra o estado das outras contas.

### Desvio de golpes em área (experimental)
Vem desligado. Para usar, ligue **Desvio de golpes em área (experimental)** no menu do Tampermonkey e recarregue a página. Aparece o botão **DESVIO** ao lado de AUTO e MANUAL, na barra de COMBATE. Preenchido quer dizer ligado.

Com ele ligado, durante a caça, quando o aviso vermelho de um golpe em área inimigo cobre o seu Pokémon, o script anda 1 ou 2 quadrados para sair dele. No AUTO, o jogo passa para MANUAL durante o passo e o script volta para AUTO em seguida. No MANUAL, o servidor continua atacando sozinho ("AUTO POR INATIVIDADE") entre os desvios. Passe o mouse sobre o botão para ver quantos desvios deram certo.

**Limitações:**
- O aviso chega atrasado pela latência. Golpes rápidos (0,3 s, a maioria dos cones e linhas) não dá para evitar; só os mais lentos.
- Só funciona na aba em foco e com a janela visível. Em segundo plano o jogo não aceita movimento.
- Avisos de outros jogadores atacando os próprios selvagens também são vermelhos, e o script pode desviar deles sem necessidade.
- Qualquer tecla de movimento, de golpe (1 a 4) ou clique seu no mapa pausa o desvio por 3 s.

## Tier list

São duas listas:
- **PvE:** dano por segundo na caça.
- **Competitivo:** desempenho em duelos longos, como a Ranqueada automática, combinado com a referência da Gen 3 (Smogon e Pokémon Showdown).

As tiers vão por percentil das espécies normais: S são os 8% melhores, A até 25%, B até 50%, C até 80% e D o resto. Lendários, míticos e Megas ficam numa categoria separada.

A aba **Farms early game** lista as hunts de Kanto onde aparece um Pokémon de primeiro estágio cuja evolução final é tier S ou A. Esses Pokémon são os mais baratos de capturar. Cada card mostra:
- o lugar e o nível dos selvagens;
- as insígnias necessárias;
- o nível em que o Pokémon chega;
- o preço de captura estimado pela regra do guia "Captura" do jogo;
- as tiers das evoluções.

Os golpes considerados são os aprendidos por nível na linha evolutiva e as 7 HMs vendidas na Loja de Celadon. TMs ficam de fora, porque só saem ao acaso da TM Box. Uma HM só entra no moveset quando melhora o resultado em mais de 3%.

## Para desenvolver

É preciso ter o Node.js 18 ou mais recente; o projeto não tem dependências.

```sh
node collect-pokepedia.mjs        # baixa o catálogo do jogo (pokepedia-data.json)
node collect-competitive.mjs      # baixa as referências da Gen 3 (competitive-data.json)
node build-data.mjs               # recompila os dados do script (src/data/)
node build-userscript.mjs         # junta src/ em poke-tools.user.js
node build-tierlist-page.mjs      # regenera tierlist.html
node --check poke-tools.user.js
```

| Arquivo | Papel |
|---|---|
| `src/` | Código do userscript, dividido por módulo: `tiers/` e `market/` (tiers, mercado, MAPA e ficha), `daily.js`, `monitor.js`, `dodge.js` (desvio), `settings.js` (menu de módulos), `meta.js` (cabeçalho) e `data/` (gerado). |
| `poke-tools.user.js` | O userscript instalado, gerado a partir de `src/`; não edite à mão. |
| `pokeafk-market-filtros.user.js`, `pokeafk-monitor.user.js` | Scripts antigos, que agora só avisam para trocar pelo PokeAFK Tools. |
| `rank-pokemon.mjs` | Motor do ranking: simula caça e duelos e escolhe golpes, natureza e IVs. |
| `collect-pokepedia.mjs`, `collect-competitive.mjs` | Coletores de dados. |
| `build-data.mjs`, `build-userscript.mjs`, `build-tierlist-page.mjs` | Geram os dados do script, o userscript e a página da tier list. |
| `farms.mjs` | Monta a lista de farms do early game (hunts, evoluções e preço de captura). |
| `tierlist.html`, `index.html` | Página publicada no GitHub Pages. |

Ao mudar o userscript, edite `src/`, suba o `@version` em `src/meta.js` e rode `node build-userscript.mjs`; o Tampermonkey só atualiza quando o número aumenta. Os detalhes do modelo e dos seletores do jogo estão em [AGENTS.md](AGENTS.md).
