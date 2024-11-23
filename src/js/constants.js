export const GAME_CONFIG = {
    MIN_EMOJI_SIZE: 40,
    MAX_EMOJI_SIZE: 120,
    MERGE_THRESHOLD: 5,
    DROP_SPEED: 1,
    GRAVITY: 0.5,
    AUTO_SAVE_INTERVAL: 30000,
    MAX_ACTIVE_EMOJIS: 50,
    WALL_THICKNESS: 20,
    DROP_ZONE_HEIGHT: 150  // Increased to give more space at the top
};

export const PHYSICS_CONFIG = {
    FRICTION: 0.3,
    RESTITUTION: 0.2,
    DENSITY: 0.001,
    ANGULAR_DAMPING: 0.1,
    VELOCITY_ITERATIONS: 6,
    POSITION_ITERATIONS: 2
};

export const CANVAS_CONFIG = {
    WIDTH: 400,  // Adjusted for better mobile experience
    HEIGHT: 600,  // Adjusted for better mobile experience
    BACKGROUND_COLOR: '#ffffff',
    DROP_LINE_COLOR: 'rgba(255, 0, 0, 0.3)',
    DROP_LINE_WIDTH: 2
};

export const STORAGE_KEYS = {
    GAME_STATE: 'emojiDrop_gameState',
    HIGH_SCORE: 'emojiDrop_highScore',
    CURRENT_THEME: 'emojiDrop_theme'
};

export const EVENTS = {
    MERGE: 'merge',
    GAME_OVER: 'gameOver',
    SCORE_UPDATE: 'scoreUpdate',
    THEME_CHANGE: 'themeChange'
};

export const ERROR_MESSAGES = {
    STORAGE_UNAVAILABLE: 'Local storage is not available',
    LOAD_FAILED: 'Failed to load game state',
    SAVE_FAILED: 'Failed to save game state',
    INVALID_THEME: 'Invalid theme selected',
    PHYSICS_ERROR: 'Physics engine error occurred'
};

export const DOM_IDS = {
    GAME_CANVAS: 'gameCanvas',
    SCORE_DISPLAY: 'scoreDisplay',
    NEXT_EMOJI_DISPLAY: 'nextEmojiDisplay',
    THEME_SELECT: 'themeSelect',
    NEW_GAME: 'newGame',
    LOAD_GAME: 'loadGame',
    SAVE_GAME: 'saveGame'
};
