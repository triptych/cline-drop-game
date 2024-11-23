import { STORAGE_KEYS, ERROR_MESSAGES } from './constants.js';
import { storageAvailable, handleStorageError } from './utils.js';

class GameStorage {
    constructor() {
        if (!storageAvailable()) {
            throw new Error(ERROR_MESSAGES.STORAGE_UNAVAILABLE);
        }
        this.storage = window.localStorage;
    }

    saveGameState(gameState) {
        try {
            const serializedState = JSON.stringify({
                ...gameState,
                timestamp: Date.now()
            });
            this.storage.setItem(STORAGE_KEYS.GAME_STATE, serializedState);
        } catch (error) {
            handleStorageError(error);
        }
    }

    loadGameState() {
        try {
            const serializedState = this.storage.getItem(STORAGE_KEYS.GAME_STATE);
            if (!serializedState) return null;

            const gameState = JSON.parse(serializedState);

            // Check if the saved state is too old (more than 24 hours)
            if (Date.now() - gameState.timestamp > 24 * 60 * 60 * 1000) {
                this.clearGameState();
                return null;
            }

            return gameState;
        } catch (error) {
            handleStorageError(error);
        }
    }

    clearGameState() {
        try {
            this.storage.removeItem(STORAGE_KEYS.GAME_STATE);
        } catch (error) {
            handleStorageError(error);
        }
    }

    saveHighScore(score) {
        try {
            const currentHighScore = this.getHighScore();
            if (score > currentHighScore) {
                this.storage.setItem(STORAGE_KEYS.HIGH_SCORE, score.toString());
                return true;
            }
            return false;
        } catch (error) {
            handleStorageError(error);
        }
    }

    getHighScore() {
        try {
            const highScore = this.storage.getItem(STORAGE_KEYS.HIGH_SCORE);
            return highScore ? parseInt(highScore, 10) : 0;
        } catch (error) {
            handleStorageError(error);
        }
    }

    saveCurrentTheme(themeName) {
        try {
            this.storage.setItem(STORAGE_KEYS.CURRENT_THEME, themeName);
        } catch (error) {
            handleStorageError(error);
        }
    }

    getCurrentTheme() {
        try {
            return this.storage.getItem(STORAGE_KEYS.CURRENT_THEME) || 'fantasy';
        } catch (error) {
            handleStorageError(error);
        }
    }

    clearAll() {
        try {
            Object.values(STORAGE_KEYS).forEach(key => {
                this.storage.removeItem(key);
            });
        } catch (error) {
            handleStorageError(error);
        }
    }
}

// Export a singleton instance
export default new GameStorage();
