# ⚓ Alvo Certo: Tabuada

Jogo de batalha naval educativo para praticar multiplicação. Antes de cada disparo, o jogador tem **10 segundos** para resolver a conta formada pela linha e pela coluna escolhidas.

## Como executar

Não é necessário instalar dependências. Abra `index.html` diretamente no navegador ou inicie um servidor local:

```bash
python3 -m http.server 8000
```

Depois, acesse `http://localhost:8000`.

## Folha impressa

O botão **Folha impressa**, no cabeçalho do jogo, abre uma página A4 preparada para impressão. Cada aluno recebe uma folha com:

- um tabuleiro principal para posicionar secretamente a própria frota;
- um radar menor para registrar os disparos contra o adversário;
- marcações sugeridas de **× para fogo** e **○ para água**;
- um retângulo horizontal para a pontuação total;
- uma tabela para registrar as tabuadas dos acertos e seus bônus de 5 pontos;
- legenda da frota e uma dica estratégica.

Também é possível abrir `folha-impressao.html` diretamente e usar o botão **Imprimir folha**.

## Modos de partida

- **Contra o computador:** a frota adversária é criada automaticamente. No nível fácil, a máquina atira aleatoriamente; no médio e difícil, procura casas vizinhas depois de um acerto.
- **Dois jogadores:** os participantes usam o mesmo dispositivo e os mapas permanecem ocultos durante a troca de jogador.
- **Posicionamento automático:** distribui toda a frota imediatamente.
- **Posicionamento manual:** permite escolher cada navio e cada baú, visualizar a posição antes de confirmar, girar a peça em tempo real e desfazer enganos.

## Níveis da tabuada

| Nível | Forma de responder |
| --- | --- |
| Fácil | Escolher a resposta correta entre 3 alternativas |
| Médio | Escolher a resposta correta entre 5 alternativas |
| Difícil | Digitar o resultado da multiplicação |

No jogo digital, a tabuada aparece somente depois de um acerto. O jogador tem 10 segundos para ganhar 5 pontos extras; errar ou deixar o tempo acabar não cancela o tiro nem os pontos do alvo.

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

Durante o posicionamento, os navios são desenhados diretamente no mapa. A prévia verde indica uma posição válida e a vermelha avisa que a peça não cabe ou se sobrepõe a outra. Também é possível desfazer a última peça, limpar o mapa ou gerar outra distribuição automática.

## Rodada

1. O jogador escolhe uma coordenada ainda não atacada e o disparo acontece imediatamente.
2. Um disparo na água passa a vez, exceto quando ainda houver tiro extra disponível, e não exige resposta de tabuada.
3. Ao acertar um navio, o jogador marca 5 pontos e continua jogando.
4. Ao encontrar um tesouro, o jogador marca 20 pontos e recebe um tiro extra, acumulado com a continuação normal do turno.
5. Depois de um acerto, a linha e a coluna formam uma multiplicação. Por exemplo, linha 6 e coluna 7 representam `6 × 7`.
6. Uma resposta correta acrescenta 5 pontos. Uma resposta errada mantém o tiro e a pontuação que o alvo já concedeu.
7. Apenas no jogo digital há limite de 10 segundos para conquistar o bônus da tabuada; na folha impressa, os participantes registram as contas sem cronômetro obrigatório.

## Condições de vitória

A configuração inicial oferece duas opções:

- **Afundar a frota:** vence quem atingir as 25 casas de navios do adversário. Os tesouros podem ser desativados.
- **Alcançar pontos:** vence quem primeiro atingir a meta configurada, a partir de **50 pontos**.

A aplicação calcula e valida o limite máximo alcançável. A frota vale 125 pontos, pode render mais 125 em tabuadas, e cada tesouro pode valer 20 pontos mais 5 de bônus. Assim, o máximo varia entre **250 pontos sem tesouros** e **350 pontos com quatro tesouros**.

## Tecnologias

- HTML semântico;
- CSS responsivo, com suporte a movimento reduzido;
- JavaScript puro, sem bibliotecas externas.
