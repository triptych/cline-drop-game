import { GAME_CONFIG, CANVAS_CONFIG, DOM_IDS, EVENTS } from './constants.js';
import { scaleCanvas, preventScrolling, createParticles, updateParticles, drawParticles, formatScore } from './utils.js';
import storage from './storage.js';
import themeManager from './themes.js';
import physicsEngine from './physics.js';

class EmojiDropGame {
    constructor() {
        this.canvas = document.getElementById(DOM_IDS.GAME_CANVAS);
        this.ctx = this.canvas.getContext('2d');
        this.score = 0;
        this.nextEmoji = null;
        this.particles = [];
        this.gameOver = false;
        this.autoSaveInterval = null;
        this.canvasWidth = CANVAS_CONFIG.WIDTH;
        this.canvasHeight = CANVAS_CONFIG.HEIGHT;
        this.isInitialized = false;
        this.isDropping = false;

        this.setupCanvas();
        this.bindEvents();
        this.initializeGame();
    }

    async initializeGame() {
        if (this.isInitialized) {
            physicsEngine.cleanup();
        }

        await themeManager.loadThemes();
        const savedTheme = storage.getCurrentTheme();
        themeManager.setTheme(savedTheme);

        // Initialize physics with fixed dimensions
        physicsEngine.initialize(this.canvasWidth, this.canvasHeight);
        physicsEngine.onMerge(this.handleMerge.bind(this));

        // Always start a new game on initialization
        this.startNewGame();

        // Start game loop
        this.gameLoop();
        this.setupAutoSave();
        this.isInitialized = true;
    }

    setupCanvas() {
        // Set fixed dimensions
        this.canvas.width = this.canvasWidth;
        this.canvas.height = this.canvasHeight;

        // Scale canvas for retina displays
        const dpr = window.devicePixelRatio || 1;
        this.canvas.style.width = `${this.canvasWidth}px`;
        this.canvas.style.height = `${this.canvasHeight}px`;
        this.canvas.width = this.canvasWidth * dpr;
        this.canvas.height = this.canvasHeight * dpr;
        this.ctx.scale(dpr, dpr);

        preventScrolling(this.canvas);
    }

    bindEvents() {
        // Touch and mouse events for emoji dropping
        this.canvas.addEventListener('mousemove', this.handlePointerMove.bind(this));
        this.canvas.addEventListener('mouseup', this.handlePointerUp.bind(this));
        this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this));
        this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this));

        // Button events
        document.getElementById(DOM_IDS.NEW_GAME).addEventListener('click', () => this.startNewGame());
        document.getElementById(DOM_IDS.SAVE_GAME).addEventListener('click', () => this.saveGame());
        document.getElementById(DOM_IDS.LOAD_GAME).addEventListener('click', () => this.loadGame());

        // Theme selection
        document.getElementById(DOM_IDS.THEME_SELECT).addEventListener('change', (e) => {
            themeManager.setTheme(e.target.value);
            storage.saveCurrentTheme(e.target.value);
        });
    }

    startNewGame() {
        this.score = 0;
        this.gameOver = false;
        this.particles = [];
        this.isDropping = false;

        // Clear saved game state when starting new game
        storage.clearGameState();

        physicsEngine.reset();
        this.updateScore();
        this.prepareNextEmoji();

        // Remove any existing game over screen
        const existingGameOver = document.querySelector('.game-over');
        if (existingGameOver) {
            existingGameOver.remove();
        }
    }

    cleanupDropZone() {
        // Get all bodies and remove any that are stuck in the drop zone
        const bodies = physicsEngine.getBodies();
        bodies.forEach(body => {
            if (!body.isStatic && // Skip the current dropping emoji
                body.position.y <= GAME_CONFIG.DROP_ZONE_HEIGHT + body.circleRadius &&
                Math.abs(body.velocity.y) < 0.1) { // Only remove if nearly stationary
                physicsEngine.removeBody(body);
            }
        });
    }

    prepareNextEmoji() {
        if (this.isDropping) return; // Don't prepare new emoji if still dropping

        // Clean up any stuck emojis in the drop zone
        this.cleanupDropZone();

        const emoji = this.nextEmoji || themeManager.getRandomStarterEmoji();
        const x = this.canvasWidth / 2;
        const y = GAME_CONFIG.DROP_ZONE_HEIGHT;

        const body = physicsEngine.createEmoji(x, y, emoji);
        physicsEngine.setCurrentEmoji(body);

        this.nextEmoji = themeManager.getRandomStarterEmoji();
        this.updateNextEmojiDisplay();
    }

    handlePointerMove(e) {
        if (this.gameOver || this.isDropping) return;
        const rect = this.canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) * (this.canvasWidth / rect.width);
        physicsEngine.moveCurrentEmoji(x);
        this.cleanupDropZone(); // Clean up orphaned emojis during movement
    }

    handleTouchMove(e) {
        if (this.gameOver || this.isDropping) return;
        e.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
        const touch = e.touches[0];
        const x = (touch.clientX - rect.left) * (this.canvasWidth / rect.width);
        physicsEngine.moveCurrentEmoji(x);
        this.cleanupDropZone(); // Clean up orphaned emojis during movement
    }

    handlePointerUp() {
        if (this.gameOver || this.isDropping) return;
        this.dropEmoji();
    }

    handleTouchEnd() {
        if (this.gameOver || this.isDropping) return;
        this.dropEmoji();
    }

    dropEmoji() {
        if (this.isDropping) return;
        this.isDropping = true;

        physicsEngine.dropCurrentEmoji();

        // Give the emoji time to start falling
        setTimeout(() => {
            const dropCheck = setInterval(() => {
                const currentBodies = physicsEngine.getBodies();
                let shouldContinue = true;

                currentBodies.forEach(body => {
                    if (!body.isStatic &&
                        body.position.y <= GAME_CONFIG.DROP_ZONE_HEIGHT + body.circleRadius) {
                        // If the body is moving significantly, don't consider it stuck
                        if (Math.abs(body.velocity.y) >= 0.1) {
                            shouldContinue = false;
                        }
                    }
                });

                if (shouldContinue) {
                    clearInterval(dropCheck);
                    this.isDropping = false;
                    this.prepareNextEmoji();
                }
            }, 100);

            // Failsafe: If the check doesn't complete within 3 seconds, force continue
            setTimeout(() => {
                if (this.isDropping) {
                    this.isDropping = false;
                    this.cleanupDropZone();
                    this.prepareNextEmoji();
                }
            }, 3000);
        }, 500); // Wait for physics to start applying
    }

    handleMerge(emoji, x, y) {
        const nextEmoji = themeManager.getNextEmoji(emoji);
        if (nextEmoji) {
            const mergedBody = physicsEngine.createEmoji(x, y, nextEmoji);
            this.updateScore(nextEmoji.points);
            this.createMergeEffect(x, y);
        }
    }

    createMergeEffect(x, y) {
        const newParticles = createParticles(x, y, '255, 255, 255', 15);
        this.particles.push(...newParticles);
    }

    updateScore(points = 0) {
        this.score += points;
        document.getElementById(DOM_IDS.SCORE_DISPLAY).textContent = formatScore(this.score);

        if (storage.saveHighScore(this.score)) {
            // Could add high score animation here
        }
    }

    updateNextEmojiDisplay() {
        const display = document.getElementById(DOM_IDS.NEXT_EMOJI_DISPLAY);
        display.textContent = this.nextEmoji.symbol;
        display.style.fontSize = `${this.nextEmoji.size}px`;
    }

    checkGameOver() {
        if (!this.gameOver && physicsEngine.isGameOver()) {
            this.gameOver = true;
            this.handleGameOver();
        }
    }

    handleGameOver() {
        storage.saveHighScore(this.score);
        // Clear saved game state on game over
        storage.clearGameState();

        // Clear auto-save interval
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
            this.autoSaveInterval = null;
        }

        const gameOverDiv = document.createElement('div');
        gameOverDiv.className = 'game-over';
        gameOverDiv.innerHTML = `
            <div class="game-over-content">
                <h2>Game Over!</h2>
                <p>Score: ${formatScore(this.score)}</p>
                <button onclick="document.querySelector('.game-over').remove(); new EmojiDropGame();">Play Again</button>
            </div>
        `;
        document.body.appendChild(gameOverDiv);
        setTimeout(() => gameOverDiv.classList.add('show'), 100);
    }

    saveGame() {
        if (!this.gameOver) {
            const gameState = {
                score: this.score,
                nextEmoji: this.nextEmoji,
                bodies: physicsEngine.getBodies().map(body => ({
                    x: body.position.x,
                    y: body.position.y,
                    emoji: body.emoji
                }))
            };
            storage.saveGameState(gameState);
        }
    }

    loadGame() {
        const savedState = storage.loadGameState();
        if (savedState) {
            this.restoreGameState(savedState);
        } else {
            this.startNewGame();
        }
    }

    restoreGameState(state) {
        this.score = state.score;
        this.nextEmoji = state.nextEmoji;
        this.updateScore();
        this.updateNextEmojiDisplay();

        physicsEngine.reset();
        state.bodies.forEach(bodyData => {
            physicsEngine.createEmoji(bodyData.x, bodyData.y, bodyData.emoji);
        });
    }

    setupAutoSave() {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
        }
        this.autoSaveInterval = setInterval(() => {
            if (!this.gameOver) {
                this.saveGame();
            }
        }, GAME_CONFIG.AUTO_SAVE_INTERVAL);
    }

    render() {
        // Clear canvas
        this.ctx.fillStyle = CANVAS_CONFIG.BACKGROUND_COLOR;
        this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);

        // Draw drop line
        this.ctx.beginPath();
        this.ctx.strokeStyle = CANVAS_CONFIG.DROP_LINE_COLOR;
        this.ctx.lineWidth = CANVAS_CONFIG.DROP_LINE_WIDTH;
        this.ctx.moveTo(0, GAME_CONFIG.DROP_ZONE_HEIGHT);
        this.ctx.lineTo(this.canvasWidth, GAME_CONFIG.DROP_ZONE_HEIGHT);
        this.ctx.stroke();

        // Draw emojis
        physicsEngine.getBodies().forEach(body => {
            this.ctx.save();
            this.ctx.translate(body.position.x, body.position.y);
            this.ctx.rotate(body.angle);
            this.ctx.font = `${body.emoji.size}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(body.emoji.symbol, 0, 0);
            this.ctx.restore();
        });

        // Update and draw particles
        this.particles = updateParticles(this.particles);
        drawParticles(this.ctx, this.particles);
    }

    gameLoop() {
        if (!this.gameOver) {
            this.checkGameOver();
        }

        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Start the game when the page loads
window.addEventListener('load', () => {
    new EmojiDropGame();
});
