# ⚓ Alvo Certo: Tabuada

Jogo de batalha naval educativo para praticar multiplicação. Antes de cada disparo, o jogador tem **10 segundos** para resolver a conta formada pela linha e pela coluna escolhidas.

## Como executar

Não é necessário instalar dependências. Abra `index.html` diretamente no navegador ou inicie um servidor local:

```bash
python3 -m http.server 8000
```

Depois, acesse `http://localhost:8000`.

## Modos de partida

- **Contra o computador:** a frota adversária é criada automaticamente. No nível fácil, a máquina atira aleatoriamente; no médio e difícil, procura casas vizinhas depois de um acerto.
- **Dois jogadores:** os participantes usam o mesmo dispositivo e os mapas permanecem ocultos durante a troca de jogador.
- **Posicionamento automático:** distribui toda a frota imediatamente.
- **Posicionamento manual:** permite escolher cada navio, girá-lo e completar a preparação automaticamente.

## Níveis da tabuada

| Nível | Forma de responder |
| --- | --- |
| Fácil | Escolher a resposta correta entre 3 alternativas |
| Médio | Escolher a resposta correta entre 5 alternativas |
| Difícil | Digitar o resultado da multiplicação |

Em todos os níveis, uma resposta incorreta ou o fim dos 10 segundos cancela o tiro e passa a vez.

## Frota e tesouros

Cada jogador possui **25 casas de navios**:

| Elemento | Quantidade | Tamanho | Pontuação |
| --- | ---: | ---: | ---: |
| Porta-aviões | 1 | 5 casas | 5 pontos por casa |
| Encouraçado | 2 | 4 casas | 5 pontos por casa |
| Cruzador | 2 | 3 casas | 5 pontos por casa |
| Submarino | 3 | 2 casas | 5 pontos por casa |
| Tesouro | 0 a 4 | 1 casa | 20 pontos + tiro extra |

Os navios podem ficar na horizontal ou vertical, nunca na diagonal, e não podem se sobrepor. Os tesouros são opcionais e distribuídos em casas livres.

## Rodada

1. O jogador escolhe uma coordenada ainda não atacada.
2. A linha e a coluna formam uma multiplicação. Por exemplo, linha 6 e coluna 7 representam `6 × 7`.
3. Uma resposta correta autoriza o disparo. Uma resposta errada ou atrasada encerra a vez sem disparar.
4. Ao acertar um navio, o jogador marca 5 pontos e continua jogando.
5. Ao encontrar um tesouro, o jogador marca 20 pontos e recebe um tiro extra, acumulado com a continuação normal do turno.
6. Um disparo na água passa a vez, exceto quando ainda houver tiro extra disponível.

## Condições de vitória

A configuração inicial oferece duas opções:

- **Afundar a frota:** vence quem atingir as 25 casas de navios do adversário. Os tesouros podem ser desativados.
- **Alcançar pontos:** vence quem primeiro atingir a meta configurada, a partir de **50 pontos**.

A aplicação calcula e valida o limite máximo alcançável. A frota vale 125 pontos e cada tesouro acrescenta 20, portanto o máximo varia entre **125 pontos sem tesouros** e **205 pontos com quatro tesouros**.

## Tecnologias

- HTML semântico;
- CSS responsivo, com suporte a movimento reduzido;
- JavaScript puro, sem bibliotecas externas.
