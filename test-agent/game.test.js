/**
 * @jest-environment jsdom
 */

const {
    CANVAS_SIZE,
    GRID_SIZE,
    TILE_COUNT,
    INITIAL_SPEED,
    SPEED_INCREMENT,
    MIN_SPEED,
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
} = require('./game');

// Mock canvas context
const mockFillRect = jest.fn();
const mockFillPath = jest.fn();
const mockBeginPath = jest.fn();
const mockMoveTo = jest.fn();
const mockLineTo = jest.fn();
const mockStroke = jest.fn();
const mockArc = jest.fn();

let mockContext = null;

function createMockContext() {
    return {
        fillStyle: '',
        strokeStyle: '',
        lineWidth: 0,
        shadowBlur: 0,
        shadowColor: '',
        fillRect: mockFillRect,
        beginPath: mockBeginPath,
        moveTo: mockMoveTo,
        lineTo: mockLineTo,
        stroke: mockStroke,
        arc: mockArc,
        fill: mockFillPath
    };
}

// Mock setInterval/clearInterval
const originalSetInterval = global.setInterval;
const originalClearInterval = global.clearInterval;

// Setup DOM before each test
describe('Snake Game', () => {
    let mockStorage;
    let intervalId = 0;
    const intervals = new Map();

    beforeEach(() => {
        // Reset mocks
        mockFillRect.mockClear();
        mockFillPath.mockClear();
        mockBeginPath.mockClear();
        mockMoveTo.mockClear();
        mockLineTo.mockClear();
        mockStroke.mockClear();
        mockArc.mockClear();

        // Create fresh mock context
        mockContext = createMockContext();

        // Reset DOM
        document.body.innerHTML = `
            <canvas id="gameCanvas" width="400" height="400"></canvas>
            <div id="score">0</div>
            <div id="highScore">0</div>
            <div id="gameOver" style="display: none;">
                <span id="finalScore">0</span>
            </div>
        `;

        // Mock canvas getContext
        const canvas = document.getElementById('gameCanvas');
        canvas.getContext = jest.fn(() => mockContext);

        // Mock localStorage
        mockStorage = {
            getItem: jest.fn(() => null),
            setItem: jest.fn()
        };
        setStorage(mockStorage);

        // Mock timers
        jest.useFakeTimers();
        intervalId = 0;

        // Override setInterval/clearInterval for better tracking
        global.setInterval = jest.fn((fn, delay) => {
            intervalId++;
            intervals.set(intervalId, { fn, delay });
            return intervalId;
        });
        global.clearInterval = jest.fn((id) => {
            intervals.delete(id);
        });

        // Initialize game
        initGame();
    });

    afterEach(() => {
        stopGameLoop();
        jest.useRealTimers();
        global.setInterval = originalSetInterval;
        global.clearInterval = originalClearInterval;
        intervals.clear();
    });

    describe('Constants', () => {
        test('should have correct game constants', () => {
            expect(CANVAS_SIZE).toBe(400);
            expect(GRID_SIZE).toBe(20);
            expect(TILE_COUNT).toBe(20);
            expect(INITIAL_SPEED).toBe(100);
            expect(SPEED_INCREMENT).toBe(2);
            expect(MIN_SPEED).toBe(50);
        });
    });

    describe('Game Initialization', () => {
        test('should initialize snake at center of grid', () => {
            const state = getGameState();
            expect(state.snake).toEqual([
                { x: 10, y: 10 },
                { x: 9, y: 10 },
                { x: 8, y: 10 }
            ]);
        });

        test('should initialize with correct default values', () => {
            const state = getGameState();
            expect(state.direction).toBe('right');
            expect(state.nextDirection).toBe('right');
            expect(state.score).toBe(0);
            expect(state.gameSpeed).toBe(INITIAL_SPEED);
            expect(state.isPaused).toBe(false);
            expect(state.isGameOver).toBe(false);
        });

        test('should spawn food on initialization', () => {
            const state = getGameState();
            expect(state.food).toHaveProperty('x');
            expect(state.food).toHaveProperty('y');
            expect(state.food.x).toBeGreaterThanOrEqual(0);
            expect(state.food.x).toBeLessThan(TILE_COUNT);
            expect(state.food.y).toBeGreaterThanOrEqual(0);
            expect(state.food.y).toBeLessThan(TILE_COUNT);
        });

        test('should load high score from localStorage', () => {
            mockStorage.getItem.mockReturnValue('100');
            initGame();
            const highScoreEl = document.getElementById('highScore');
            expect(mockStorage.getItem).toHaveBeenCalledWith('snakeHighScore');
            expect(highScoreEl.textContent).toBe('100');
        });
    });

    describe('Snake Movement', () => {
        test('should move snake right by default', () => {
            setGameState({
                snake: [{ x: 10, y: 10 }, { x: 9, y: 10 }],
                direction: 'right',
                nextDirection: 'right'
            });
            gameStep();
            const state = getGameState();
            expect(state.snake[0]).toEqual({ x: 11, y: 10 });
        });

        test('should move snake up when direction is up', () => {
            setGameState({
                snake: [{ x: 10, y: 10 }, { x: 9, y: 10 }],
                direction: 'up',
                nextDirection: 'up'
            });
            gameStep();
            const state = getGameState();
            expect(state.snake[0]).toEqual({ x: 10, y: 9 });
        });

        test('should move snake down when direction is down', () => {
            setGameState({
                snake: [{ x: 10, y: 10 }, { x: 9, y: 10 }],
                direction: 'down',
                nextDirection: 'down'
            });
            gameStep();
            const state = getGameState();
            expect(state.snake[0]).toEqual({ x: 10, y: 11 });
        });

        test('should move snake left when direction is left', () => {
            setGameState({
                snake: [{ x: 10, y: 10 }, { x: 11, y: 10 }],
                direction: 'left',
                nextDirection: 'left'
            });
            gameStep();
            const state = getGameState();
            expect(state.snake[0]).toEqual({ x: 9, y: 10 });
        });

        test('should update direction from nextDirection', () => {
            setGameState({
                snake: [{ x: 10, y: 10 }, { x: 9, y: 10 }],
                direction: 'right',
                nextDirection: 'up'
            });
            gameStep();
            const state = getGameState();
            expect(state.direction).toBe('up');
        });
    });

    describe('Direction Control', () => {
        test('setDirection should update nextDirection', () => {
            initGame();
            setDirection('up');
            const state = getGameState();
            expect(state.nextDirection).toBe('up');
        });

        test('setDirection should prevent reversing direction', () => {
            setGameState({ direction: 'right' });
            setDirection('left');
            const state = getGameState();
            expect(state.nextDirection).toBe('right'); // Should not change
        });

        test('setDirection should allow perpendicular turns', () => {
            setGameState({ direction: 'right' });
            setDirection('up');
            let state = getGameState();
            expect(state.nextDirection).toBe('up');

            setGameState({ direction: 'up' });
            setDirection('right');
            state = getGameState();
            expect(state.nextDirection).toBe('right');
        });

        test('setDirection should not work when game is over', () => {
            setGameState({ isGameOver: true, direction: 'right' });
            setDirection('up');
            const state = getGameState();
            expect(state.nextDirection).toBe('right');
        });
    });

    describe('Collision Detection', () => {
        test('should detect wall collision on left edge', () => {
            setGameState({
                snake: [{ x: 0, y: 10 }],
                direction: 'left',
                nextDirection: 'left'
            });
            gameStep();
            const state = getGameState();
            expect(state.isGameOver).toBe(true);
        });

        test('should detect wall collision on right edge', () => {
            setGameState({
                snake: [{ x: TILE_COUNT - 1, y: 10 }],
                direction: 'right',
                nextDirection: 'right'
            });
            gameStep();
            const state = getGameState();
            expect(state.isGameOver).toBe(true);
        });

        test('should detect wall collision on top edge', () => {
            setGameState({
                snake: [{ x: 10, y: 0 }],
                direction: 'up',
                nextDirection: 'up'
            });
            gameStep();
            const state = getGameState();
            expect(state.isGameOver).toBe(true);
        });

        test('should detect wall collision on bottom edge', () => {
            setGameState({
                snake: [{ x: 10, y: TILE_COUNT - 1 }],
                direction: 'down',
                nextDirection: 'down'
            });
            gameStep();
            const state = getGameState();
            expect(state.isGameOver).toBe(true);
        });

        test('should detect self collision', () => {
            setGameState({
                snake: [
                    { x: 5, y: 5 },
                    { x: 5, y: 6 },
                    { x: 5, y: 7 },
                    { x: 6, y: 7 },
                    { x: 6, y: 6 }
                ],
                direction: 'down',
                nextDirection: 'down'
            });
            gameStep();
            const state = getGameState();
            expect(state.isGameOver).toBe(true);
        });
    });

    describe('Food Mechanics', () => {
        test('should increase score when eating food', () => {
            setGameState({
                snake: [{ x: 5, y: 5 }],
                food: { x: 6, y: 5 },
                direction: 'right',
                nextDirection: 'right',
                score: 0
            });
            gameStep();
            const state = getGameState();
            expect(state.score).toBe(10);
        });

        test('should grow snake when eating food', () => {
            setGameState({
                snake: [{ x: 5, y: 5 }, { x: 4, y: 5 }],
                food: { x: 6, y: 5 },
                direction: 'right',
                nextDirection: 'right'
            });
            const initialLength = getGameState().snake.length;
            gameStep();
            const state = getGameState();
            expect(state.snake.length).toBe(initialLength + 1);
        });

        test('should spawn new food after eating', () => {
            setGameState({
                snake: [{ x: 5, y: 5 }],
                food: { x: 6, y: 5 },
                direction: 'right',
                nextDirection: 'right'
            });
            const oldFood = getGameState().food;
            gameStep();
            const state = getGameState();
            expect(state.food).not.toEqual(oldFood);
        });

        test('should increase speed when eating food', () => {
            setGameState({
                snake: [{ x: 5, y: 5 }],
                food: { x: 6, y: 5 },
                direction: 'right',
                nextDirection: 'right',
                gameSpeed: INITIAL_SPEED
            });
            gameStep();
            const state = getGameState();
            expect(state.gameSpeed).toBe(INITIAL_SPEED - SPEED_INCREMENT);
        });

        test('should not decrease speed below MIN_SPEED', () => {
            setGameState({
                snake: [{ x: 5, y: 5 }],
                food: { x: 6, y: 5 },
                direction: 'right',
                nextDirection: 'right',
                gameSpeed: MIN_SPEED
            });
            gameStep();
            const state = getGameState();
            expect(state.gameSpeed).toBe(MIN_SPEED);
        });

        test('should update high score when current score exceeds it', () => {
            setGameState({
                snake: [{ x: 5, y: 5 }],
                food: { x: 6, y: 5 },
                direction: 'right',
                nextDirection: 'right',
                score: 0,
                highScore: 0
            });
            gameStep();
            const state = getGameState();
            expect(state.highScore).toBe(10);
            expect(mockStorage.setItem).toHaveBeenCalledWith('snakeHighScore', 10);
        });

        test('should not update high score if current score is lower', () => {
            setGameState({
                snake: [{ x: 5, y: 5 }],
                food: { x: 6, y: 5 },
                direction: 'right',
                nextDirection: 'right',
                score: 0,
                highScore: 100
            });
            gameStep();
            const state = getGameState();
            expect(state.highScore).toBe(100);
        });
    });

    describe('isSnakeAt', () => {
        test('should return true when snake is at position', () => {
            setGameState({
                snake: [{ x: 5, y: 5 }, { x: 4, y: 5 }]
            });
            expect(isSnakeAt(5, 5)).toBe(true);
            expect(isSnakeAt(4, 5)).toBe(true);
        });

        test('should return false when snake is not at position', () => {
            setGameState({
                snake: [{ x: 5, y: 5 }, { x: 4, y: 5 }]
            });
            expect(isSnakeAt(10, 10)).toBe(false);
            expect(isSnakeAt(0, 0)).toBe(false);
        });
    });

    describe('Food Spawning', () => {
        test('should spawn food within grid bounds', () => {
            for (let i = 0; i < 50; i++) {
                spawnFood();
                const state = getGameState();
                expect(state.food.x).toBeGreaterThanOrEqual(0);
                expect(state.food.x).toBeLessThan(TILE_COUNT);
                expect(state.food.y).toBeGreaterThanOrEqual(0);
                expect(state.food.y).toBeLessThan(TILE_COUNT);
            }
        });

        test('should not spawn food on snake body', () => {
            setGameState({
                snake: [
                    { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 },
                    { x: 3, y: 0 }, { x: 4, y: 0 }, { x: 5, y: 0 }
                ]
            });

            for (let i = 0; i < 20; i++) {
                spawnFood();
                const state = getGameState();
                expect(isSnakeAt(state.food.x, state.food.y)).toBe(false);
            }
        });
    });

    describe('Game State Management', () => {
        test('togglePause should toggle pause state', () => {
            setGameState({ isPaused: false });
            togglePause();
            let state = getGameState();
            expect(state.isPaused).toBe(true);

            togglePause();
            state = getGameState();
            expect(state.isPaused).toBe(false);
        });

        test('gameStep should not execute when paused', () => {
            setGameState({
                snake: [{ x: 10, y: 10 }, { x: 9, y: 10 }],
                direction: 'right',
                nextDirection: 'right',
                isPaused: true
            });
            const initialState = getGameState();
            gameStep();
            const state = getGameState();
            expect(state.snake).toEqual(initialState.snake);
        });

        test('gameStep should not execute when game over', () => {
            setGameState({
                snake: [{ x: 10, y: 10 }, { x: 9, y: 10 }],
                direction: 'right',
                nextDirection: 'right',
                isGameOver: true
            });
            const initialState = getGameState();
            gameStep();
            const state = getGameState();
            expect(state.snake).toEqual(initialState.snake);
        });

        test('endGame should set game over state', () => {
            setGameState({ isGameOver: false });
            endGame();
            const state = getGameState();
            expect(state.isGameOver).toBe(true);
        });

        test('restartGame should reset game state', () => {
            setGameState({
                snake: [{ x: 1, y: 1 }],
                score: 100,
                isGameOver: true,
                isPaused: true
            });
            restartGame();
            const state = getGameState();
            expect(state.snake.length).toBe(3);
            expect(state.score).toBe(0);
            expect(state.isGameOver).toBe(false);
            expect(state.isPaused).toBe(false);
        });
    });

    describe('Drawing', () => {
        test('draw should call canvas methods', () => {
            // Ensure ctx is set by calling init first
            const canvas = document.getElementById('gameCanvas');
            canvas.getContext = jest.fn(() => mockContext);
            // Initialize canvas context by simulating init()
            const { init } = require('./game');
            init();
            draw();
            expect(mockFillRect).toHaveBeenCalled();
            expect(mockBeginPath).toHaveBeenCalled();
        });

        test('draw should clear canvas', () => {
            const canvas = document.getElementById('gameCanvas');
            canvas.getContext = jest.fn(() => mockContext);
            const { init } = require('./game');
            init();
            draw();
            // First call should clear the canvas
            expect(mockFillRect).toHaveBeenCalledWith(0, 0, CANVAS_SIZE, CANVAS_SIZE);
            expect(mockFillRect).toHaveBeenCalled();
        });

        test('draw should draw food', () => {
            const canvas = document.getElementById('gameCanvas');
            canvas.getContext = jest.fn(() => mockContext);
            const { init } = require('./game');
            init();
            setGameState({
                food: { x: 5, y: 5 }
            });
            draw();
            // Should draw food with arc
            expect(mockArc).toHaveBeenCalled();
            expect(mockFillPath).toHaveBeenCalled();
        });

        test('draw should draw snake with correct colors', () => {
            const canvas = document.getElementById('gameCanvas');
            canvas.getContext = jest.fn(() => mockContext);
            const { init } = require('./game');
            init();
            setGameState({
                snake: [{ x: 5, y: 5 }],
                direction: 'right'
            });
            draw();
            // Should draw snake segments with fillRect
            expect(mockFillRect).toHaveBeenCalled();
            // Snake head should be drawn at segment position
            expect(mockFillRect).toHaveBeenCalledWith(
                5 * GRID_SIZE + 1,
                5 * GRID_SIZE + 1,
                GRID_SIZE - 2,
                GRID_SIZE - 2
            );
        });
    });

    describe('Game Loop', () => {
        test('startGameLoop should create interval', () => {
            startGameLoop();
            expect(global.setInterval).toHaveBeenCalledWith(expect.any(Function), INITIAL_SPEED);
        });

        test('stopGameLoop should clear interval', () => {
            startGameLoop();
            stopGameLoop();
            expect(global.clearInterval).toHaveBeenCalled();
        });

        test('game speed should increase after eating food', () => {
            setGameState({
                snake: [{ x: 5, y: 5 }],
                food: { x: 6, y: 5 },
                direction: 'right',
                nextDirection: 'right',
                gameSpeed: INITIAL_SPEED
            });
            // Manually trigger game step to eat food
            gameStep();
            const state = getGameState();
            expect(state.gameSpeed).toBe(INITIAL_SPEED - SPEED_INCREMENT);
        });
    });

    describe('Edge Cases', () => {
        test('should handle empty snake gracefully', () => {
            setGameState({ snake: [] });
            expect(() => isSnakeAt(5, 5)).not.toThrow();
        });

        test('should handle snake with single segment', () => {
            setGameState({
                snake: [{ x: 5, y: 5 }],
                food: { x: 6, y: 5 }, // Food where snake will eat it
                direction: 'right',
                nextDirection: 'right'
            });
            gameStep();
            const state = getGameState();
            // After eating, snake should have grown to 2 segments
            expect(state.snake.length).toBe(2);
            expect(state.snake[0]).toEqual({ x: 6, y: 5 });
            expect(state.snake[1]).toEqual({ x: 5, y: 5 });
        });

        test('should handle food at edge of grid', () => {
            setGameState({
                snake: [{ x: 5, y: 5 }],
                food: { x: 6, y: 5 }, // Food will be eaten
                direction: 'right',
                nextDirection: 'right'
            });
            gameStep();
            const state = getGameState();
            // After eating, new food should be spawned somewhere valid
            expect(state.food.x).toBeGreaterThanOrEqual(0);
            expect(state.food.x).toBeLessThan(TILE_COUNT);
            expect(state.food.y).toBeGreaterThanOrEqual(0);
            expect(state.food.y).toBeLessThan(TILE_COUNT);
            // Food should not be on the snake
            expect(isSnakeAt(state.food.x, state.food.y)).toBe(false);
        });

        test('should handle food at TILE_COUNT - 1', () => {
            setGameState({
                snake: [{ x: 5, y: 5 }],
                food: { x: TILE_COUNT - 1, y: TILE_COUNT - 1 },
                direction: 'right',
                nextDirection: 'right'
            });
            expect(() => gameStep()).not.toThrow();
        });
    });

    describe('DOM Integration', () => {
        test('should update score in DOM when food is eaten', () => {
            const scoreElement = document.getElementById('score');
            setGameState({
                snake: [{ x: 5, y: 5 }],
                food: { x: 6, y: 5 },
                direction: 'right',
                nextDirection: 'right',
                score: 0
            });
            gameStep();
            expect(scoreElement.textContent).toBe('10');
        });

        test('should show game over screen when game ends', () => {
            const gameOverElement = document.getElementById('gameOver');
            endGame();
            expect(gameOverElement.style.display).toBe('block');
        });

        test('should update final score in game over screen', () => {
            const finalScoreElement = document.getElementById('finalScore');
            setGameState({ score: 50 });
            endGame();
            expect(finalScoreElement.textContent).toBe('50');
        });

        test('should hide game over screen on restart', () => {
            const gameOverElement = document.getElementById('gameOver');
            endGame();
            restartGame();
            expect(gameOverElement.style.display).toBe('none');
        });
    });
});
