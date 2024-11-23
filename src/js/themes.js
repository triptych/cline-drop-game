import { ERROR_MESSAGES } from './constants.js';

class ThemeManager {
    constructor() {
        // Initialize with fallback theme directly
        this.themes = {
            "fantasy": {
                "name": "Fantasy",
                "emojis": [
                    { "symbol": "🧙‍♂️", "size": 40, "level": 1, "points": 10 },
                    { "symbol": "🧝‍♀️", "size": 50, "level": 2, "points": 20 },
                    { "symbol": "🦄", "size": 60, "level": 3, "points": 40 },
                    { "symbol": "🐉", "size": 70, "level": 4, "points": 80 }
                ]
            },
            "sports": {
                "name": "Sports",
                "emojis": [
                    { "symbol": "⚽", "size": 40, "level": 1, "points": 10 },
                    { "symbol": "🏀", "size": 50, "level": 2, "points": 20 },
                    { "symbol": "🏈", "size": 60, "level": 3, "points": 40 },
                    { "symbol": "⚾", "size": 70, "level": 4, "points": 80 }
                ]
            },
            "food": {
                "name": "Food",
                "emojis": [
                    { "symbol": "🍇", "size": 40, "level": 1, "points": 10 },
                    { "symbol": "🍎", "size": 50, "level": 2, "points": 20 },
                    { "symbol": "🍊", "size": 60, "level": 3, "points": 40 },
                    { "symbol": "🍉", "size": 70, "level": 4, "points": 80 }
                ]
            },
            "travel": {
                "name": "Travel",
                "emojis": [
                    { "symbol": "🚗", "size": 40, "level": 1, "points": 10 },
                    { "symbol": "🚲", "size": 50, "level": 2, "points": 20 },
                    { "symbol": "✈️", "size": 60, "level": 3, "points": 40 },
                    { "symbol": "🚀", "size": 70, "level": 4, "points": 80 }
                ]
            }
        };
        this.currentTheme = null;
    }

    async loadThemes() {
        // No need to load themes, they're already initialized
        return this.themes;
    }

    setTheme(themeName) {
        if (!this.themes || !this.themes[themeName]) {
            throw new Error(ERROR_MESSAGES.INVALID_THEME);
        }
        this.currentTheme = this.themes[themeName];
        return this.currentTheme;
    }

    getCurrentTheme() {
        return this.currentTheme;
    }

    getThemeNames() {
        return Object.keys(this.themes || {});
    }

    getNextEmoji(currentEmoji) {
        if (!this.currentTheme) {
            throw new Error(ERROR_MESSAGES.INVALID_THEME);
        }

        const emojis = this.currentTheme.emojis;
        const currentIndex = emojis.findIndex(e => e.symbol === currentEmoji.symbol);

        if (currentIndex === -1 || currentIndex >= emojis.length - 1) {
            return null; // No next emoji available
        }

        return emojis[currentIndex + 1];
    }

    getRandomStarterEmoji() {
        if (!this.currentTheme) {
            this.setTheme('fantasy'); // Set default theme if none is set
        }

        // Get emojis from the first two levels only
        const starterEmojis = this.currentTheme.emojis.filter(emoji => emoji.level <= 2);
        const randomIndex = Math.floor(Math.random() * starterEmojis.length);
        return starterEmojis[randomIndex];
    }

    getEmojiBySymbol(symbol) {
        if (!this.currentTheme) {
            throw new Error(ERROR_MESSAGES.INVALID_THEME);
        }

        return this.currentTheme.emojis.find(emoji => emoji.symbol === symbol);
    }

    getEmojiByLevel(level) {
        if (!this.currentTheme) {
            throw new Error(ERROR_MESSAGES.INVALID_THEME);
        }

        return this.currentTheme.emojis.find(emoji => emoji.level === level);
    }

    calculatePoints(emoji) {
        const emojiData = this.getEmojiBySymbol(emoji.symbol);
        return emojiData ? emojiData.points : 0;
    }
}

// Export a singleton instance
export default new ThemeManager();
