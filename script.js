'use strict';

const BOARD_SIZE = 10;
const SHIPS = [
  { type: 'carrier', name: 'Porta-aviões', size: 5, icon: '🚢' },
  { type: 'battleship', name: 'Encouraçado 1', size: 4, icon: '⛴️' },
  { type: 'battleship', name: 'Encouraçado 2', size: 4, icon: '⛴️' },
  { type: 'cruiser', name: 'Cruzador 1', size: 3, icon: '🛥️' },
  { type: 'cruiser', name: 'Cruzador 2', size: 3, icon: '🛥️' },
  { type: 'submarine', name: 'Submarino 1', size: 2, icon: '🚤' },
  { type: 'submarine', name: 'Submarino 2', size: 2, icon: '🚤' },
  { type: 'submarine', name: 'Submarino 3', size: 2, icon: '🚤' }
];

const $ = selector => document.querySelector(selector);
const screens = ['setupScreen', 'placementScreen', 'handoffScreen', 'gameScreen'];
let state = null;
let placementPlayer = 0;
let placementDraft = null;
let selectedShip = 0;
let orientation = 'horizontal';
let placementHistory = [];
let pendingShot = null;
let timerId = null;
let deadline = 0;

function emptyBoard() { return Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(null)); }
function showScreen(id) { screens.forEach(screen => $(`#${screen}`).classList.toggle('hidden', screen !== id)); }
function shuffled(items) { return [...items].sort(() => Math.random() - .5); }
function maximumScore(treasures) { return 125 + treasures * 20; }

function updateSetup() {
  const local = $('[name="gameMode"]:checked').value === 'local';
  $('#player2Name').value = local ? ($('#player2Name').value === 'Computador' ? 'Capitão 2' : $('#player2Name').value) : 'Computador';
  $('#player2Name').disabled = !local;
  const scoreMode = $('[name="victory"]:checked').value === 'score';
  $('#targetField').classList.toggle('hidden', !scoreMode);
  const max = maximumScore(Number($('#treasures').value));
  $('#targetScore').max = max;
  if (Number($('#targetScore').value) > max) $('#targetScore').value = max;
  $('#scoreHelp').textContent = `Escolha de 50 a ${max} pontos para esta configuração.`;
}

document.querySelectorAll('[name="gameMode"], [name="victory"], #treasures').forEach(el => el.addEventListener('change', updateSetup));
$('#soundButton').addEventListener('click', event => { event.currentTarget.textContent = event.currentTarget.textContent === '🔊' ? '🔇' : '🔊'; });

$('#setupForm').addEventListener('submit', event => {
  event.preventDefault(); updateSetup();
  const config = {
    mode: $('[name="gameMode"]:checked').value, level: $('[name="level"]:checked').value,
    placement: $('#placement').value, treasures: Number($('#treasures').value),
    victory: $('[name="victory"]:checked').value, target: Number($('#targetScore').value)
  };
  if (config.victory === 'score' && (config.target < 50 || config.target > maximumScore(config.treasures))) {
    $('#targetScore').setCustomValidity(`Use uma meta entre 50 e ${maximumScore(config.treasures)}.`); $('#targetScore').reportValidity(); return;
  }
  $('#targetScore').setCustomValidity('');
  state = { config, current: 0, bonusShots: 0, history: [], gameOver: false, players: [createPlayer($('#player1Name').value.trim() || 'Capitão 1'), createPlayer($('#player2Name').value.trim() || 'Computador')] };
  if (config.mode === 'cpu') state.players[1].board = randomBoard(config.treasures);
  if (config.placement === 'auto') {
    state.players[0].board = randomBoard(config.treasures);
    if (config.mode === 'local') state.players[1].board = randomBoard(config.treasures);
    startGame();
  } else beginPlacement(0);
});

function createPlayer(name) { return { name, board: emptyBoard(), shots: new Set(), score: 0, stats: { hits: 0, misses: 0, correct: 0, wrong: 0 }, hunt: [] }; }
function canPlace(board, row, col, size, direction) {
  return Array.from({ length: size }, (_, i) => [row + (direction === 'vertical' ? i : 0), col + (direction === 'horizontal' ? i : 0)])
    .every(([r,c]) => r < BOARD_SIZE && c < BOARD_SIZE && !board[r][c]);
}
function placeShip(board, ship, row, col, direction, id) {
  if (!canPlace(board,row,col,ship.size,direction)) return false;
  for (let i=0;i<ship.size;i++) { const r=row+(direction==='vertical'?i:0), c=col+(direction==='horizontal'?i:0); board[r][c]={ kind:'ship', id, type:ship.type, name:ship.name, hit:false, direction, segment:i, size:ship.size }; } return true;
}
function randomBoard(treasureCount) {
  const board=emptyBoard();
  SHIPS.forEach((ship,index) => { let placed=false; while(!placed) placed=placeShip(board,ship,Math.floor(Math.random()*10),Math.floor(Math.random()*10),Math.random()<.5?'horizontal':'vertical',index); });
  for(let i=0;i<treasureCount;i++){ let r,c; do{r=Math.floor(Math.random()*10);c=Math.floor(Math.random()*10);}while(board[r][c]); board[r][c]={kind:'treasure',id:`t${i}`,hit:false}; }
  return board;
}
function addMissingTreasures(board, treasureCount) {
  const present = board.flat().filter(item => item?.kind === 'treasure').length;
  for (let i = present; i < treasureCount; i++) {
    let row, col;
    do { row = Math.floor(Math.random() * 10); col = Math.floor(Math.random() * 10); } while (board[row][col]);
    board[row][col] = { kind: 'treasure', id: `t${i}`, hit: false };
  }
}

function beginPlacement(playerIndex) {
  placementPlayer=playerIndex; placementDraft=emptyBoard(); selectedShip=0; orientation='horizontal'; placementHistory=[];
  $('#placementTitle').textContent=`${state.players[playerIndex].name}, monte sua frota`;
  renderShipPicker(); renderPlacementBoard(); showScreen('placementScreen');
}
function renderShipPicker() {
  const treasurePlaced=placementDraft.flat().filter(item=>item?.kind==='treasure').length;
  $('#shipPicker').innerHTML=SHIPS.map((ship,i)=>`<button type="button" class="ship-option ${i===selectedShip?'selected':''}" data-index="${i}" ${ship.placed?'disabled':''}>${ship.icon} <b>${ship.name}</b><span class="remaining">${ship.placed?'Pronto':ship.size+' casas'}</span></button>`).join('')+
    (state.config.treasures?`<button type="button" class="ship-option ${selectedShip==='treasure'?'selected':''}" data-index="treasure" ${treasurePlaced>=state.config.treasures?'disabled':''}>💰 <b>Baú do tesouro</b><span class="remaining">${treasurePlaced}/${state.config.treasures}</span></button>`:'');
  document.querySelectorAll('.ship-option').forEach(button=>button.addEventListener('click',()=>{selectedShip=button.dataset.index==='treasure'?'treasure':Number(button.dataset.index);renderShipPicker();renderPlacementPreview();}));
  renderPlacementPreview();
}
function boardMarkup(board, reveal=false, attack=false) {
  let html='<div class="axis"></div>'+Array.from({length:10},(_,i)=>`<div class="axis">${i+1}</div>`).join('');
  for(let r=0;r<10;r++){html+=`<div class="axis">${String.fromCharCode(65+r)}</div>`;for(let c=0;c<10;c++){const item=board[r][c];let cls='cell',label=`${String.fromCharCode(65+r)}${c+1}`,content='';if(reveal&&item){cls+=item.kind==='treasure'?' treasure':' ship';content=item.kind==='treasure'?'💰':`<i class="vessel ${item.direction} ${item.segment===0?'first':item.segment===item.size-1?'last':'mid'}"></i>`;}if(attack&&item?.hit){cls+=item.kind==='treasure'?' treasure':item.sunk?' sunk':' hit';content=item.kind==='treasure'?'💰':'💥';}else if(attack&&item?.miss){cls+=' miss';content='•';}html+=`<button class="${cls}" data-row="${r}" data-col="${c}" aria-label="${label}">${content}</button>`;}}return html;
}
function selectedPiece(){return selectedShip==='treasure'?{name:'Baú do tesouro',size:1,icon:'💰'}:SHIPS[selectedShip];}
function placementCells(row,col){const piece=selectedPiece();return Array.from({length:piece?.size||0},(_,i)=>[row+(orientation==='vertical'?i:0),col+(orientation==='horizontal'?i:0)]);}
function renderPlacementPreview(){const piece=selectedPiece();if(!piece)return;$('#shipPreview').className=`ship-preview ${orientation}`;$('#shipPreview').innerHTML=selectedShip==='treasure'?'<span class="mini-treasure">💰</span>':Array.from({length:piece.size},()=>'<i class="mini-segment"></i>').join('');}
function previewPlacement(row,col){const cells=placementCells(row,col),valid=cells.every(([r,c])=>r<10&&c<10&&!placementDraft[r][c]);cells.forEach(([r,c])=>{const cell=document.querySelector(`#placementBoard .cell[data-row="${r}"][data-col="${c}"]`);cell?.classList.add(valid?'preview-ok':'preview-bad');});}
function clearPlacementPreview(){document.querySelectorAll('#placementBoard .preview-ok, #placementBoard .preview-bad').forEach(cell=>cell.classList.remove('preview-ok','preview-bad'));}
function renderPlacementBoard(){ $('#placementBoard').innerHTML=boardMarkup(placementDraft,true);document.querySelectorAll('#placementBoard .cell').forEach(cell=>{const row=Number(cell.dataset.row),col=Number(cell.dataset.col);cell.addEventListener('click',()=>manualPlace(row,col));cell.addEventListener('mouseenter',()=>previewPlacement(row,col));cell.addEventListener('mouseleave',clearPlacementPreview);});const shipsPlaced=SHIPS.filter(s=>s.placed).length,treasuresPlaced=placementDraft.flat().filter(i=>i?.kind==='treasure').length,complete=shipsPlaced===SHIPS.length&&treasuresPlaced===state.config.treasures;$('#confirmPlacement').disabled=!complete;$('#rotateButton').disabled=selectedShip==='treasure';$('#rotateButton b').textContent=orientation==='horizontal'?'Horizontal':'Vertical';$('#undoButton').disabled=!placementHistory.length;$('#placementProgress').textContent=`${shipsPlaced} de ${SHIPS.length} navios · ${treasuresPlaced} de ${state.config.treasures} baús`;$('#placementProgressBar').style.width=`${((shipsPlaced+treasuresPlaced)/(SHIPS.length+state.config.treasures))*100}%`; }
function manualPlace(row,col){const piece=selectedPiece();if(!piece)return;if(selectedShip==='treasure'){if(placementDraft[row][col])return invalidPlacement();const id=`t${Date.now()}-${row}-${col}`;placementDraft[row][col]={kind:'treasure',id,hit:false};placementHistory.push({kind:'treasure',id});}else{if(piece.placed)return;if(!placeShip(placementDraft,piece,row,col,orientation,selectedShip))return invalidPlacement();piece.placed=true;placementHistory.push({kind:'ship',id:selectedShip});}$('#placementHint').textContent=`${piece.icon} ${piece.name} posicionado!`;const next=SHIPS.findIndex(s=>!s.placed);const treasureCount=placementDraft.flat().filter(i=>i?.kind==='treasure').length;selectedShip=next>=0?next:treasureCount<state.config.treasures?'treasure':selectedShip;renderShipPicker();renderPlacementBoard();}
function invalidPlacement(){$('#placementHint').textContent='⚠️ Essa peça não cabe aí ou ocupa uma casa usada.';}
$('#rotateButton').addEventListener('click',()=>{orientation=orientation==='horizontal'?'vertical':'horizontal';renderPlacementPreview();renderPlacementBoard();});
$('#clearButton').addEventListener('click',()=>{SHIPS.forEach(s=>delete s.placed);placementDraft=emptyBoard();placementHistory=[];selectedShip=0;renderShipPicker();renderPlacementBoard();$('#placementHint').textContent='Tabuleiro limpo. Escolha uma peça para recomeçar.';});
$('#undoButton').addEventListener('click',()=>{const last=placementHistory.pop();if(!last)return;if(last.kind==='ship'){placementDraft.forEach(row=>row.forEach((item,col)=>{if(item?.kind==='ship'&&item.id===last.id)row[col]=null;}));delete SHIPS[last.id].placed;selectedShip=last.id;}else{placementDraft.forEach(row=>row.forEach((item,col)=>{if(item?.kind==='treasure'&&item.id===last.id)row[col]=null;}));selectedShip='treasure';}renderShipPicker();renderPlacementBoard();$('#placementHint').textContent='Última peça removida.';});
$('#randomizeButton').addEventListener('click',()=>{placementDraft=randomBoard(state.config.treasures);placementHistory=[];SHIPS.forEach(s=>s.placed=true);selectedShip=state.config.treasures?'treasure':0;renderShipPicker();renderPlacementBoard();$('#placementHint').textContent='Frota distribuída! Você pode confirmar ou limpar para tentar novamente.';});
$('#confirmPlacement').addEventListener('click',()=>{addMissingTreasures(placementDraft,state.config.treasures);state.players[placementPlayer].board=placementDraft;SHIPS.forEach(s=>delete s.placed);if(state.config.mode==='local'&&placementPlayer===0){$('#handoffTitle').textContent=`Passe para ${state.players[1].name}`;showScreen('handoffScreen');}else startGame();});
$('#handoffButton').addEventListener('click',()=>beginPlacement(1));

function startGame(){state.current=0;showScreen('gameScreen');renderGame();}
function renderGame(){const attacker=state.players[state.current],defender=state.players[1-state.current];$('#turnName').textContent=attacker.name;$('#p1Name').textContent=state.players[0].name;$('#p2Name').textContent=state.players[1].name;$('#p1Score').textContent=state.players[0].score;$('#p2Score').textContent=state.players[1].score;$('#objective').textContent=state.config.victory==='fleet'?'Afundar a frota':`${state.config.target} pontos`;$('#bonusBadge').classList.toggle('hidden',state.bonusShots===0);$('#bonusBadge').textContent=`⭐ Tiros extras: ${state.bonusShots}`;$('#hitsStat').textContent=attacker.stats.hits;$('#missesStat').textContent=attacker.stats.misses;$('#correctStat').textContent=attacker.stats.correct;$('#wrongStat').textContent=attacker.stats.wrong;$('#attackBoard').innerHTML=boardMarkup(defender.board,false,true);document.querySelectorAll('#attackBoard .cell').forEach(cell=>cell.addEventListener('click',()=>selectShot(Number(cell.dataset.row),Number(cell.dataset.col))));$('#enemyFleet').innerHTML=fleetStatus(defender.board);$('#history').innerHTML=state.history.slice(0,5).map(h=>`<li>${h}</li>`).join('');}
function fleetStatus(board){return SHIPS.map((ship,id)=>{const cells=board.flat().filter(x=>x?.kind==='ship'&&x.id===id);const sunk=cells.every(x=>x.hit);return `<div><span>${ship.icon} ${ship.name}</span><b>${sunk?'Afundado':'Ativo'}</b></div>`;}).join('');}
function selectShot(row,col){if(state.gameOver||state.config.mode==='cpu'&&state.current===1)return;const target=state.players[1-state.current].board[row][col];if(target?.hit||target?.miss){$('#gameMessage').textContent='Essa coordenada já foi atacada. Escolha outra.';return;}pendingShot={row,col};openChallenge(row+1,col+1);}

function openChallenge(a,b){const correct=a*b;$('#question').textContent=`${a} × ${b} = ?`;$('#answerFeedback').textContent='';if(state.config.level==='hard'){$('#answerArea').innerHTML='<div class="typed-answer"><input id="typedAnswer" type="number" inputmode="numeric" aria-label="Sua resposta" autofocus><button class="primary" id="submitAnswer" type="button">Responder</button></div>';$('#submitAnswer').addEventListener('click',()=>answer(Number($('#typedAnswer').value),correct));$('#typedAnswer').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();answer(Number(e.currentTarget.value),correct);}});}else{const count=state.config.level==='easy'?3:5;const choices=makeChoices(correct,count);$('#answerArea').innerHTML=`<div class="answers">${choices.map(n=>`<button class="answer" type="button" data-value="${n}">${n}</button>`).join('')}</div>`;document.querySelectorAll('.answer').forEach(btn=>btn.addEventListener('click',()=>answer(Number(btn.dataset.value),correct)));}$('#challengeDialog').showModal();deadline=Date.now()+10000;updateTimer();clearInterval(timerId);timerId=setInterval(updateTimer,100);setTimeout(()=>$('#typedAnswer')?.focus(),30);}
function makeChoices(correct,count){const values=new Set([correct]);const offsets=shuffled([-10,-5,-3,-2,-1,1,2,3,5,10]);for(const offset of offsets){const candidate=correct+offset;if(candidate>=1)values.add(candidate);if(values.size===count)break;}return shuffled([...values]);}
function updateTimer(){const remaining=Math.max(0,deadline-Date.now());$('#timerNumber').textContent=Math.ceil(remaining/1000);$('#timerBar').style.transform=`scaleX(${remaining/10000})`;if(!remaining)finishChallenge(false,'O tempo acabou!');}
function answer(value,correct){if(!timerId)return;finishChallenge(value===correct,value===correct?'Resposta certa!':'Resposta incorreta!');}
function finishChallenge(success,message){clearInterval(timerId);timerId=null;$('#answerFeedback').textContent=message;const attacker=state.players[state.current];if(success){attacker.stats.correct++;setTimeout(()=>{$('#challengeDialog').close();resolveShot();},450);}else{attacker.stats.wrong++;state.history.unshift(`${attacker.name} perdeu a vez na tabuada.`);setTimeout(()=>{$('#challengeDialog').close();endTurn(false);},650);}}

function resolveShot(){const attacker=state.players[state.current],defender=state.players[1-state.current],{row,col}=pendingShot,item=defender.board[row][col],coord=`${String.fromCharCode(65+row)}${col+1}`;let message,hit=false;if(!item){defender.board[row][col]={kind:'water',miss:true};attacker.stats.misses++;message=`🌊 Água em ${coord}.`;state.history.unshift(`${attacker.name}: água em ${coord}.`);}else if(item.kind==='treasure'){item.hit=true;attacker.score+=20;attacker.stats.hits++;state.bonusShots++;hit=true;message=`💰 Tesouro em ${coord}! +20 pontos e um tiro extra.`;state.history.unshift(`${attacker.name} encontrou um tesouro!`);}else{item.hit=true;attacker.score+=5;attacker.stats.hits++;hit=true;const cells=defender.board.flat().filter(x=>x?.kind==='ship'&&x.id===item.id);const sunk=cells.every(x=>x.hit);if(sunk)cells.forEach(x=>x.sunk=true);message=sunk?`💥 ${item.name} afundado! +5 pontos.`:`🎯 Acertou em ${coord}! +5 pontos.`;state.history.unshift(`${attacker.name}: ${sunk?'afundou um navio':'acertou'} em ${coord}.`);}$('#gameMessage').textContent=message;renderGame();if(checkVictory())return;setTimeout(()=>endTurn(hit),850);}
function checkVictory(){const attacker=state.players[state.current],defender=state.players[1-state.current];const shipsGone=defender.board.flat().filter(x=>x?.kind==='ship').every(x=>x.hit);const won=state.config.victory==='fleet'?shipsGone:attacker.score>=state.config.target;if(won){state.gameOver=true;setTimeout(()=>showResult(attacker),600);return true;}return false;}
function continueCpuIfNeeded() { if (state.config.mode === 'cpu' && state.current === 1) setTimeout(cpuTurn, 850); }
function endTurn(hit){if(state.bonusShots>0){state.bonusShots--;$('#gameMessage').textContent='⭐ Use seu tiro extra!';renderGame();continueCpuIfNeeded();return;}if(hit){$('#gameMessage').textContent='Acertou: você continua no comando!';renderGame();continueCpuIfNeeded();return;}state.current=1-state.current;renderGame();$('#gameMessage').textContent=`Vez de ${state.players[state.current].name}.`;continueCpuIfNeeded();}
function cpuTurn(){if(state.gameOver)return;const cpu=state.players[1],human=state.players[0];let options=cpu.hunt.filter(([r,c])=>r>=0&&r<10&&c>=0&&c<10&&!human.board[r][c]?.hit&&!human.board[r][c]?.miss);cpu.hunt=options;let row,col;if(state.config.level!=='easy'&&options.length)[row,col]=options.shift();else{do{row=Math.floor(Math.random()*10);col=Math.floor(Math.random()*10);}while(human.board[row][col]?.hit||human.board[row][col]?.miss);}pendingShot={row,col};cpu.stats.correct++;const before=human.board[row][col];if(before?.kind==='ship'&&state.config.level!=='easy')cpu.hunt.push([row-1,col],[row+1,col],[row,col-1],[row,col+1]);resolveShot();}
function showResult(winner){$('#winnerTitle').textContent=`${winner.name} venceu!`;$('#winnerText').textContent=state.config.victory==='fleet'?'Toda a frota adversária foi afundada.':`A meta de ${state.config.target} pontos foi alcançada.`;$('#finalStats').innerHTML=`<div><b>${winner.score}</b>pontos</div><div><b>${winner.stats.hits}</b>acertos</div><div><b>${winner.stats.correct}</b>contas certas</div><div><b>${winner.stats.wrong}</b>erros/tempo</div>`;$('#resultDialog').showModal();}
$('#playAgain').addEventListener('click',()=>{location.reload();});
updateSetup();
