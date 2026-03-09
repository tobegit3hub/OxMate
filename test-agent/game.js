// Game constants
const CANVAS_SIZE = 400;
const GRID_SIZE = 20;
const TILE_COUNT = CANVAS_SIZE / GRID_SIZE;
const INITIAL_SPEED = 100; // milliseconds
const SPEED_INCREMENT = 2; // ms faster per food eaten
const MIN_SPEED = 50; // fastest allowed speed

// Game state
let canvas, ctx;
let snake = [];
let food = {};
let direction = 'right';
let nextDirection = 'right';
let score = 0;
let highScore = 0;
let gameLoop = null;
let gameSpeed = INITIAL_SPEED;
let isPaused = false;
let isGameOver = false;

// For testing - allow injection of localStorage mock
let storage = typeof localStorage !== 'undefined' ? localStorage : null;

function setStorage(mockStorage) {
    storage = mockStorage;
}

// Initialize the game when page loads
function init() {
    canvas = document.getElementById('gameCanvas');
    if (canvas) {
        ctx = canvas.getContext('2d');
    }
    if (storage) {
        const stored = storage.getItem('snakeHighScore');
        highScore = stored ? parseInt(stored, 10) : 0;
    }
    const highScoreEl = document.getElementById('highScore');
    if (highScoreEl) highScoreEl.textContent = highScore;
    initGame();
}

// Initialize game state
function initGame() {
    // Initialize snake in the center
    snake = [
        { x: 10, y: 10 },
        { x: 9, y: 10 },
        { x: 8, y: 10 }
    ];

    direction = 'right';
    nextDirection = 'right';
    score = 0;
    gameSpeed = INITIAL_SPEED;
    isPaused = false;
    isGameOver = false;

    // Load high score from storage
    if (storage) {
        const stored = storage.getItem('snakeHighScore');
        highScore = stored ? parseInt(stored, 10) : 0;
    } else {
        highScore = 0;
    }

    const scoreEl = document.getElementById('score');
    const gameOverEl = document.getElementById('gameOver');
    const highScoreEl = document.getElementById('highScore');

    if (scoreEl) scoreEl.textContent = score;
    if (gameOverEl) gameOverEl.style.display = 'none';
    if (highScoreEl) highScoreEl.textContent = highScore;

    spawnFood();
    startGameLoop();
}

// Start the game loop
function startGameLoop() {
    if (gameLoop) clearInterval(gameLoop);
    gameLoop = setInterval(gameStep, gameSpeed);
}

// Stop the game loop (for cleanup)
function stopGameLoop() {
    if (gameLoop) {
        clearInterval(gameLoop);
        gameLoop = null;
    }
}

// Main game step
function gameStep() {
    if (isPaused || isGameOver) return;

    // Update direction
    direction = nextDirection;

    // Move snake
    const head = { ...snake[0] };

    switch(direction) {
        case 'up': head.y--; break;
        case 'down': head.y++; break;
        case 'left': head.x--; break;
        case 'right': head.x++; break;
    }

    // Check wall collision
    if (head.x < 0 || head.x >= TILE_COUNT || head.y < 0 || head.y >= TILE_COUNT) {
        endGame();
        return;
    }

    // Check self collision
    for (let segment of snake) {
        if (head.x === segment.x && head.y === segment.y) {
            endGame();
            return;
        }
    }

    // Add new head
    snake.unshift(head);

    // Check food collision
    if (head.x === food.x && head.y === food.y) {
        // Ate food - increase score
        score += 10;
        const scoreEl = document.getElementById('score');
        if (scoreEl) scoreEl.textContent = score;

        // Update high score
        if (score > highScore) {
            highScore = score;
            if (storage) {
                storage.setItem('snakeHighScore', highScore);
            }
            const highScoreEl = document.getElementById('highScore');
            if (highScoreEl) highScoreEl.textContent = highScore;
        }

        // Increase speed
        if (gameSpeed > MIN_SPEED) {
            gameSpeed -= SPEED_INCREMENT;
            startGameLoop(); // Restart with new speed
        }

        spawnFood();
    } else {
        // Didn't eat - remove tail
        snake.pop();
    }

    if (ctx) draw();
}

// Spawn food at random location
function spawnFood() {
    do {
        food = {
            x: Math.floor(Math.random() * TILE_COUNT),
            y: Math.floor(Math.random() * TILE_COUNT)
        };
    } while (isSnakeAt(food.x, food.y));
}

// Check if snake occupies a position
function isSnakeAt(x, y) {
    return snake.some(segment => segment.x === x && segment.y === y);
}

// Draw the game
function draw() {
    // Clear canvas
    ctx.fillStyle = '#0f0f23';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Draw grid (subtle)
    ctx.strokeStyle = '#1a1a3a';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= TILE_COUNT; i++) {
        ctx.beginPath();
        ctx.moveTo(i * GRID_SIZE, 0);
        ctx.lineTo(i * GRID_SIZE, CANVAS_SIZE);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i * GRID_SIZE);
        ctx.lineTo(CANVAS_SIZE, i * GRID_SIZE);
        ctx.stroke();
    }

    // Draw food
    ctx.fillStyle = '#ff6b6b';
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#ff6b6b';
    ctx.beginPath();
    ctx.arc(
        food.x * GRID_SIZE + GRID_SIZE/2,
        food.y * GRID_SIZE + GRID_SIZE/2,
        GRID_SIZE/2 - 2,
        0,
        Math.PI * 2
    );
    ctx.fill();
    ctx.shadowBlur = 0;

    // Draw snake
    snake.forEach((segment, index) => {
        // Head is different color
        if (index === 0) {
            ctx.fillStyle = '#4ecca3';
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#4ecca3';
        } else {
            // Gradient from head to tail
            const green = Math.floor(204 - (index * 2));
            const blue = Math.floor(163 - (index * 2));
            ctx.fillStyle = `rgb(78, ${Math.max(green, 100)}, ${Math.max(blue, 100)})`;
            ctx.shadowBlur = 0;
        }

        ctx.fillRect(
            segment.x * GRID_SIZE + 1,
            segment.y * GRID_SIZE + 1,
            GRID_SIZE - 2,
            GRID_SIZE - 2
        );

        // Draw eyes on head
        if (index === 0) {
            ctx.fillStyle = '#0f0f23';
            let eye1, eye2;
            const eyeSize = 3;
            const offset = 5;

            switch(direction) {
                case 'up':
                    eye1 = { x: segment.x * GRID_SIZE + offset, y: segment.y * GRID_SIZE + offset };
                    eye2 = { x: segment.x * GRID_SIZE + GRID_SIZE - offset - eyeSize, y: segment.y * GRID_SIZE + offset };
                    break;
                case 'down':
                    eye1 = { x: segment.x * GRID_SIZE + offset, y: segment.y * GRID_SIZE + GRID_SIZE - offset - eyeSize };
                    eye2 = { x: segment.x * GRID_SIZE + GRID_SIZE - offset - eyeSize, y: segment.y * GRID_SIZE + GRID_SIZE - offset - eyeSize };
                    break;
                case 'left':
                    eye1 = { x: segment.x * GRID_SIZE + offset, y: segment.y * GRID_SIZE + offset };
                    eye2 = { x: segment.x * GRID_SIZE + offset, y: segment.y * GRID_SIZE + GRID_SIZE - offset - eyeSize };
                    break;
                case 'right':
                    eye1 = { x: segment.x * GRID_SIZE + GRID_SIZE - offset - eyeSize, y: segment.y * GRID_SIZE + offset };
                    eye2 = { x: segment.x * GRID_SIZE + GRID_SIZE - offset - eyeSize, y: segment.y * GRID_SIZE + GRID_SIZE - offset - eyeSize };
                    break;
            }

            ctx.fillRect(eye1.x, eye1.y, eyeSize, eyeSize);
            ctx.fillRect(eye2.x, eye2.y, eyeSize, eyeSize);
        }
    });

    ctx.shadowBlur = 0;
}

// End the game
function endGame() {
    isGameOver = true;
    clearInterval(gameLoop);
    gameLoop = null;
    const finalScoreEl = document.getElementById('finalScore');
    const gameOverEl = document.getElementById('gameOver');
    if (finalScoreEl) finalScoreEl.textContent = score;
    if (gameOverEl) gameOverEl.style.display = 'block';
}

// Restart the game
function restartGame() {
    initGame();
}

// Set direction (for mobile controls)
function setDirection(newDir) {
    if (isGameOver) return;

    const opposites = {
        'up': 'down',
        'down': 'up',
        'left': 'right',
        'right': 'left'
    };

    // Prevent reversing direction
    if (opposites[newDir] !== direction) {
        nextDirection = newDir;
    }
}

// Toggle pause state
function togglePause() {
    isPaused = !isPaused;
}

// Get current game state (for testing)
function getGameState() {
    return {
        snake: [...snake],
        food: { ...food },
        direction,
        nextDirection,
        score,
        highScore,
        gameSpeed,
        isPaused,
        isGameOver
    };
}

// Set game state (for testing)
function setGameState(state) {
    if (state.snake) snake = state.snake;
    if (state.food) food = state.food;
    if (state.direction) direction = state.direction;
    if (state.nextDirection) nextDirection = state.nextDirection;
    if (state.score !== undefined) score = state.score;
    if (state.highScore !== undefined) highScore = state.highScore;
    if (state.gameSpeed) gameSpeed = state.gameSpeed;
    if (state.isPaused !== undefined) isPaused = state.isPaused;
    if (state.isGameOver !== undefined) isGameOver = state.isGameOver;
}

// Export for testing
/* eslint-env node */
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        CANVAS_SIZE,
        GRID_SIZE,
        TILE_COUNT,
        INITIAL_SPEED,
        SPEED_INCREMENT,
        MIN_SPEED,
        init,
        initGame,
        startGameLoop,
        stopGameLoop,
        gameStep,
        spawnFood,
        isSnakeAt,
        draw,
        endGame,
        restartGame,
        setDirection,
        togglePause,
        getGameState,
        setGameState,
        setStorage
    };
}
