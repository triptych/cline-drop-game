import { GAME_CONFIG, CANVAS_CONFIG, DOM_IDS, EVENTS } from './constants.js';
import { scaleCanvas, preventScrolling, createParticles, updateParticles, drawParticles, formatScore } from './utils.js';
import storage from './storage.js';
import themeManager from './themes.js';
import physicsEngine from './physics.js';
import soundManager from './sound.js';

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
        this.mouseX = this.canvasWidth / 2;
        this.mouseY = GAME_CONFIG.DROP_ZONE_HEIGHT;
        this.isPaused = true;

        // Background color handling
        this.pastelColors = [
            'rgba(255, 223, 223, 0.95)', // Soft pink
            'rgba(223, 255, 223, 0.95)', // Soft green
            'rgba(223, 223, 255, 0.95)', // Soft blue
            'rgba(255, 255, 223, 0.95)', // Soft yellow
            'rgba(255, 223, 255, 0.95)', // Soft purple
            'rgba(223, 255, 255, 0.95)'  // Soft cyan
        ];
        this.currentColorIndex = 0;
        this.backgroundColorStart = this.pastelColors[0];
        this.backgroundColorEnd = this.adjustAlpha(this.backgroundColorStart, 0.9);
        this.colorTransitionProgress = 0;
        this.isTransitioning = false;

        this.setupCanvas();
        this.bindEvents();
        this.initializeGame();
    }

    adjustAlpha(rgba, newAlpha) {
        return rgba.replace(/[\d.]+\)$/, `${newAlpha})`);
    }

    async initializeGame() {
        if (this.isInitialized) {
            physicsEngine.cleanup();
        }

        await themeManager.loadThemes();
        const savedTheme = storage.getCurrentTheme();
        themeManager.setTheme(savedTheme);

        // Update the theme dropdown to reflect the current theme
        document.getElementById(DOM_IDS.THEME_SELECT).value = savedTheme;

        // Initialize physics with fixed dimensions
        physicsEngine.initialize(this.canvasWidth, this.canvasHeight);
        physicsEngine.onMerge(this.handleMerge.bind(this));

        // Start game loop but stay paused
        this.gameLoop();
        this.isInitialized = true;
    }

    startGame() {
        // Remove splash screen
        const splashScreen = document.querySelector('.splash-screen');
        splashScreen.classList.add('hide');

        // Initialize sound
        soundManager.play('drop');

        this.isPaused = false;
        this.startNewGame();
        this.setupAutoSave();
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
        // Start game button
        document.querySelector('.start-button').addEventListener('click', () => this.startGame());

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

            // Update current dropping emoji to match new theme
            const currentEmoji = physicsEngine.getCurrentEmoji();
            if (currentEmoji) {
                const currentLevel = currentEmoji.emoji.level;
                const newEmoji = themeManager.getEmojiByLevel(currentLevel);
                currentEmoji.emoji = newEmoji;
            }

            // Update next emoji to match new theme
            if (this.nextEmoji) {
                const nextLevel = this.nextEmoji.level;
                this.nextEmoji = themeManager.getEmojiByLevel(nextLevel);
                this.updateNextEmojiDisplay();
            }
        });
    }

    startNewGame() {
        this.score = 0;
        this.gameOver = false;
        this.particles = [];
        this.isDropping = false;
        this.mouseX = this.canvasWidth / 2;
        this.mouseY = GAME_CONFIG.DROP_ZONE_HEIGHT;
        this.isPaused = false;
        this.currentColorIndex = 0;
        this.backgroundColorStart = this.pastelColors[0];
        this.backgroundColorEnd = this.adjustAlpha(this.backgroundColorStart, 0.9);
        this.colorTransitionProgress = 0;
        this.isTransitioning = false;

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
        // Clean up any stuck emojis in the drop zone before any other checks
        this.cleanupDropZone();

        if (this.isDropping || this.isPaused) return;

        const emoji = this.nextEmoji || themeManager.getRandomStarterEmoji();

        // Use the current mouse X position for spawning
        const x = Math.max(emoji.size, Math.min(this.mouseX, this.canvasWidth - emoji.size));

        const body = physicsEngine.createEmoji(x, this.mouseY, emoji);
        physicsEngine.setCurrentEmoji(body);

        this.nextEmoji = themeManager.getRandomStarterEmoji();
        this.updateNextEmojiDisplay();
    }

    handlePointerMove(e) {
        if (this.gameOver || this.isDropping || this.isPaused) return;
        const rect = this.canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) * (this.canvasWidth / rect.width);
        const y = (e.clientY - rect.top) * (this.canvasHeight / rect.height);
        this.mouseX = x;
        this.mouseY = Math.min(y, GAME_CONFIG.DROP_ZONE_HEIGHT);
        physicsEngine.moveCurrentEmoji(this.mouseX, this.mouseY);
    }

    handleTouchMove(e) {
        if (this.gameOver || this.isDropping || this.isPaused) return;
        e.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
        const touch = e.touches[0];
        const x = (touch.clientX - rect.left) * (this.canvasWidth / rect.width);
        const y = (touch.clientY - rect.top) * (this.canvasHeight / rect.height);
        this.mouseX = x;
        this.mouseY = Math.min(y, GAME_CONFIG.DROP_ZONE_HEIGHT);
        physicsEngine.moveCurrentEmoji(this.mouseX, this.mouseY);
    }

    handlePointerUp() {
        if (this.gameOver || this.isDropping || this.isPaused) return;
        this.dropEmoji();
    }

    handleTouchEnd() {
        if (this.gameOver || this.isDropping || this.isPaused) return;
        this.dropEmoji();
    }

    dropEmoji() {
        if (this.isDropping) return;
        this.isDropping = true;

        soundManager.play('drop');
        physicsEngine.dropCurrentEmoji();

        // Wait longer for initial physics to settle
        setTimeout(() => {
            let stableCount = 0;
            const requiredStableCounts = 3; // Number of consecutive stable checks required
            const dropCheck = setInterval(() => {
                const currentBodies = physicsEngine.getBodies();
                let allStable = true;

                currentBodies.forEach(body => {
                    if (!body.isStatic &&
                        body.position.y <= GAME_CONFIG.DROP_ZONE_HEIGHT + body.circleRadius) {
                        // If any body is moving significantly, reset stable count
                        if (Math.abs(body.velocity.y) >= 0.1) {
                            allStable = false;
                        }
                    }
                });

                if (allStable) {
                    stableCount++;
                } else {
                    stableCount = 0;
                }

                // Only proceed if we've seen stability for multiple consecutive checks
                if (stableCount >= requiredStableCounts) {
                    clearInterval(dropCheck);
                    this.isDropping = false;
                    this.cleanupDropZone();
                    this.prepareNextEmoji();
                }
            }, 100);

            // Increased failsafe timeout
            setTimeout(() => {
                if (this.isDropping) {
                    this.isDropping = false;
                    this.cleanupDropZone();
                    this.prepareNextEmoji();
                }
            }, 5000); // Increased from 3000 to 5000ms
        }, 1000); // Increased from 500 to 1000ms for initial settling
    }

    handleMerge(emoji, x, y) {
        const nextEmoji = themeManager.getNextEmoji(emoji);
        if (nextEmoji) {
            const mergedBody = physicsEngine.createEmoji(x, y, nextEmoji);
            this.updateScore(nextEmoji.points);
            this.createMergeEffect(x, y);
            soundManager.play('merge');

            // Change background color
            this.currentColorIndex = (this.currentColorIndex + 1) % this.pastelColors.length;
            this.backgroundColorStart = this.pastelColors[this.currentColorIndex];
            this.backgroundColorEnd = this.adjustAlpha(this.backgroundColorStart, 0.9);
            this.colorTransitionProgress = 0;
            this.isTransitioning = true;
        }
    }

    createMergeEffect(x, y) {
        const newParticles = createParticles(x, y, '255, 255, 255', 15);
        this.particles.push(...newParticles);
    }

    updateScore(points = 0) {
        this.score += points;
        const scoreDisplay = document.getElementById(DOM_IDS.SCORE_DISPLAY);
        scoreDisplay.textContent = formatScore(this.score);

        if (points > 0) {
            scoreDisplay.classList.remove('score-pop');
            void scoreDisplay.offsetWidth; // Trigger reflow
            scoreDisplay.classList.add('score-pop');
        }

        if (storage.saveHighScore(this.score)) {
            this.createHighScoreEffect();
        }
    }

    createHighScoreEffect() {
        const scoreBar = document.querySelector('.score-bar');
        for (let i = 0; i < 10; i++) {
            const sparkle = document.createElement('div');
            sparkle.className = 'sparkle';
            sparkle.style.left = `${Math.random() * 100}%`;
            sparkle.style.top = `${Math.random() * 100}%`;
            scoreBar.appendChild(sparkle);
            setTimeout(() => sparkle.remove(), 800);
        }
    }

    updateNextEmojiDisplay() {
        const display = document.getElementById(DOM_IDS.NEXT_EMOJI_DISPLAY);
        display.textContent = this.nextEmoji.symbol;
        display.style.fontSize = `${this.nextEmoji.size}px`;
    }

    checkGameOver() {
        if (!this.gameOver && !this.isPaused && physicsEngine.isGameOver()) {
            this.gameOver = true;
            this.handleGameOver();
        }
    }

    handleGameOver() {
        soundManager.play('gameOver');
        storage.saveHighScore(this.score);
        storage.clearGameState();

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
                <button class="start-button">Start Over</button>
            </div>
        `;
        document.body.appendChild(gameOverDiv);
        setTimeout(() => gameOverDiv.classList.add('show'), 100);

        // Add event listener to the new start button
        gameOverDiv.querySelector('.start-button').addEventListener('click', () => {
            gameOverDiv.remove();
            this.startNewGame();
        });
    }

    saveGame() {
        if (!this.gameOver && !this.isPaused) {
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
            if (!this.gameOver && !this.isPaused) {
                this.saveGame();
            }
        }, GAME_CONFIG.AUTO_SAVE_INTERVAL);
    }

    render() {
        // Clear canvas with gradient background
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvasHeight);
        gradient.addColorStop(0, this.backgroundColorStart);
        gradient.addColorStop(1, this.backgroundColorEnd);
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);

        // Draw drop line with gradient
        const lineGradient = this.ctx.createLinearGradient(0, GAME_CONFIG.DROP_ZONE_HEIGHT, this.canvasWidth, GAME_CONFIG.DROP_ZONE_HEIGHT);
        lineGradient.addColorStop(0, 'rgba(108, 92, 231, 0.2)');
        lineGradient.addColorStop(0.5, 'rgba(108, 92, 231, 0.5)');
        lineGradient.addColorStop(1, 'rgba(108, 92, 231, 0.2)');
        this.ctx.beginPath();
        this.ctx.strokeStyle = lineGradient;
        this.ctx.lineWidth = CANVAS_CONFIG.DROP_LINE_WIDTH;
        this.ctx.moveTo(0, GAME_CONFIG.DROP_ZONE_HEIGHT);
        this.ctx.lineTo(this.canvasWidth, GAME_CONFIG.DROP_ZONE_HEIGHT);
        this.ctx.stroke();

        // Draw emojis with shadow
        physicsEngine.getBodies().forEach(body => {
            this.ctx.save();
            this.ctx.translate(body.position.x, body.position.y);
            this.ctx.rotate(body.angle);
            this.ctx.font = `${body.emoji.size}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';

            // Draw shadow
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
            this.ctx.fillText(body.emoji.symbol, 2, 2);

            // Draw emoji
            this.ctx.fillStyle = '#000';
            this.ctx.fillText(body.emoji.symbol, 0, 0);
            this.ctx.restore();
        });

        // Update and draw particles
        this.particles = updateParticles(this.particles);
        drawParticles(this.ctx, this.particles);
    }

    gameLoop() {
        if (!this.gameOver && !this.isPaused) {
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
