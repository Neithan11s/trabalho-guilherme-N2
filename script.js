// ---------------------------------------------
// JOGO DA COBRINHA - lógica principal
// ---------------------------------------------

(function () {
  'use strict';

  // ---- Configuração do jogo ----
  const GRID_SIZE = 20; // número de células por lado
  const INITIAL_SPEED_MS = 130; // intervalo inicial entre passos
  const MIN_SPEED_MS = 70; // velocidade máxima (intervalo mínimo)
  const SPEED_STEP_MS = 3; // quanto a velocidade aumenta a cada fruta comida

  // ---- Elementos do DOM ----
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');

  const scoreEl = document.getElementById('score');
  const highScoreEl = document.getElementById('highScore');
  const finalScoreText = document.getElementById('finalScoreText');

  const startOverlay = document.getElementById('startOverlay');
  const gameOverOverlay = document.getElementById('gameOverOverlay');
  const pauseOverlay = document.getElementById('pauseOverlay');

  const startBtn = document.getElementById('startBtn');
  const restartBtn = document.getElementById('restartBtn');
  const touchControls = document.getElementById('touchControls');

  // Tamanho de cada célula em pixels (canvas é quadrado: width / GRID_SIZE)
  let cellSize = canvas.width / GRID_SIZE;

  // ---- Estado do jogo ----
  let snake = [];
  let direction = { x: 1, y: 0 };
  let nextDirection = { x: 1, y: 0 };
  let food = { x: 0, y: 0 };
  let score = 0;
  let highScore = Number(localStorage.getItem('cobrinha_highscore')) || 0;
  let speedMs = INITIAL_SPEED_MS;
  let loopTimer = null;
  let isRunning = false;
  let isPaused = false;
  let isGameOver = false;

  highScoreEl.textContent = padScore(highScore);

  // ---- Funções utilitárias ----
  function padScore(value) {
    return String(value).padStart(3, '0');
  }

  function randomCell() {
    return Math.floor(Math.random() * GRID_SIZE);
  }

  function cellsEqual(a, b) {
    return a.x === b.x && a.y === b.y;
  }

  // ---- Inicialização / reinício ----
  function resetState() {
    const mid = Math.floor(GRID_SIZE / 2);
    snake = [
      { x: mid - 1, y: mid },
      { x: mid - 2, y: mid },
      { x: mid - 3, y: mid },
    ];
    direction = { x: 1, y: 0 };
    nextDirection = { x: 1, y: 0 };
    score = 0;
    speedMs = INITIAL_SPEED_MS;
    isGameOver = false;
    isPaused = false;
    scoreEl.textContent = padScore(score);
    placeFood();
  }

  function placeFood() {
    let candidate;
    do {
      candidate = { x: randomCell(), y: randomCell() };
    } while (snake.some((segment) => cellsEqual(segment, candidate)));
    food = candidate;
  }

  // ---- Loop principal ----
  function startGame() {
    resetState();
    hideAllOverlays();
    isRunning = true;
    scheduleNextStep();
  }

  function scheduleNextStep() {
    clearTimeout(loopTimer);
    loopTimer = setTimeout(step, speedMs);
  }

  function step() {
    if (!isRunning || isPaused || isGameOver) return;

    direction = nextDirection;
    const head = snake[0];
    const newHead = { x: head.x + direction.x, y: head.y + direction.y };

    if (isWallCollision(newHead) || isSelfCollision(newHead)) {
      endGame();
      return;
    }

    snake.unshift(newHead);

    if (cellsEqual(newHead, food)) {
      score += 1;
      scoreEl.textContent = padScore(score);
      speedMs = Math.max(MIN_SPEED_MS, speedMs - SPEED_STEP_MS);
      placeFood();
    } else {
      snake.pop();
    }

    draw();
    scheduleNextStep();
  }

  function isWallCollision(cell) {
    return cell.x < 0 || cell.x >= GRID_SIZE || cell.y < 0 || cell.y >= GRID_SIZE;
  }

  function isSelfCollision(cell) {
    // o corpo inteiro conta, a cabeça atual ainda não foi adicionada
    return snake.some((segment) => cellsEqual(segment, cell));
  }

  function endGame() {
    isGameOver = true;
    isRunning = false;
    clearTimeout(loopTimer);

    if (score > highScore) {
      highScore = score;
      localStorage.setItem('cobrinha_highscore', String(highScore));
      highScoreEl.textContent = padScore(highScore);
    }

    finalScoreText.textContent = `Você fez ${score} ponto${score === 1 ? '' : 's'}`;
    showOverlay(gameOverOverlay);
  }

  // ---- Desenho ----
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGrid();
    drawFood();
    drawSnake();
  }

  function drawGrid() {
    ctx.strokeStyle = 'rgba(74, 222, 128, 0.06)';
    ctx.lineWidth = 1;
    for (let i = 1; i < GRID_SIZE; i++) {
      const pos = i * cellSize;
      ctx.beginPath();
      ctx.moveTo(pos, 0);
      ctx.lineTo(pos, canvas.height);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, pos);
      ctx.lineTo(canvas.width, pos);
      ctx.stroke();
    }
  }

  function drawFood() {
    const x = food.x * cellSize + cellSize / 2;
    const y = food.y * cellSize + cellSize / 2;
    const radius = cellSize * 0.32;

    ctx.save();
    ctx.shadowColor = 'rgba(251, 191, 36, 0.85)';
    ctx.shadowBlur = 12;
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawSnake() {
    snake.forEach((segment, index) => {
      const isHead = index === 0;
      const padding = isHead ? 1 : 2;
      const x = segment.x * cellSize + padding;
      const y = segment.y * cellSize + padding;
      const size = cellSize - padding * 2;

      ctx.save();
      ctx.shadowColor = 'rgba(74, 222, 128, 0.6)';
      ctx.shadowBlur = isHead ? 10 : 4;
      ctx.fillStyle = isHead ? '#bbf7d0' : '#4ade80';
      drawRoundedRect(x, y, size, size, 4);
      ctx.fill();
      ctx.restore();
    });
  }

  function drawRoundedRect(x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + width, y, x + width, y + height, radius);
    ctx.arcTo(x + width, y + height, x, y + height, radius);
    ctx.arcTo(x, y + height, x, y, radius);
    ctx.arcTo(x, y, x + width, y, radius);
    ctx.closePath();
  }

  // ---- Overlays ----
  function hideAllOverlays() {
    startOverlay.classList.add('overlay--hidden');
    gameOverOverlay.classList.add('overlay--hidden');
    pauseOverlay.classList.add('overlay--hidden');
  }

  function showOverlay(overlayEl) {
    hideAllOverlays();
    overlayEl.classList.remove('overlay--hidden');
  }

  // ---- Pausa ----
  function togglePause() {
    if (!isRunning || isGameOver) return;
    isPaused = !isPaused;
    if (isPaused) {
      clearTimeout(loopTimer);
      showOverlay(pauseOverlay);
    } else {
      hideAllOverlays();
      scheduleNextStep();
    }
  }

  // ---- Controle de direção (impede reverter sobre o próprio corpo) ----
  function setDirection(x, y) {
    const isReversing = x === -direction.x && y === -direction.y;
    if (isReversing) return;
    nextDirection = { x, y };
  }

  function handleKeydown(event) {
    switch (event.key) {
      case 'ArrowUp':
      case 'w':
      case 'W':
        setDirection(0, -1);
        break;
      case 'ArrowDown':
      case 's':
      case 'S':
        setDirection(0, 1);
        break;
      case 'ArrowLeft':
      case 'a':
      case 'A':
        setDirection(-1, 0);
        break;
      case 'ArrowRight':
      case 'd':
      case 'D':
        setDirection(1, 0);
        break;
      case ' ':
        event.preventDefault();
        togglePause();
        break;
      default:
        return;
    }
    event.preventDefault();
  }

  // ---- Controles por toque (D-pad e swipe) ----
  function handleTouchButton(event) {
    const dir = event.currentTarget.dataset.dir;
    if (dir === 'up') setDirection(0, -1);
    if (dir === 'down') setDirection(0, 1);
    if (dir === 'left') setDirection(-1, 0);
    if (dir === 'right') setDirection(1, 0);
  }

  let touchStartX = 0;
  let touchStartY = 0;

  function handleTouchStart(event) {
    const touch = event.changedTouches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
  }

  function handleTouchEnd(event) {
    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - touchStartX;
    const deltaY = touch.clientY - touchStartY;

    if (Math.abs(deltaX) < 24 && Math.abs(deltaY) < 24) return; // toque curto, ignora

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      setDirection(deltaX > 0 ? 1 : -1, 0);
    } else {
      setDirection(0, deltaY > 0 ? 1 : -1);
    }
  }

  // ---- Eventos ----
  startBtn.addEventListener('click', startGame);
  restartBtn.addEventListener('click', startGame);
  document.addEventListener('keydown', handleKeydown);

  touchControls.querySelectorAll('.touch-btn').forEach((btn) => {
    btn.addEventListener('click', handleTouchButton);
  });

  canvas.addEventListener('touchstart', handleTouchStart, { passive: true });
  canvas.addEventListener('touchend', handleTouchEnd, { passive: true });

  // ---- Estado inicial na tela ----
  resetState();
  draw();
  showOverlay(startOverlay);
})();
