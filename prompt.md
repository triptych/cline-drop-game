# Emoji Drop Game - Technical Requirements

## Overview

Create a Suika-style merging game using emojis, where players drop emojis from the top of the screen and combine matching ones to create larger emojis. The game should be portrait-oriented and mobile-friendly, with theme customization options.

## Technical Stack

- Vanilla JavaScript with modern ES6+ features
- HTML5 Canvas for game rendering
- CSS Grid for layout
- Local Storage for game persistence
- Matter.js for physics engine

## Code Structure

```
/src
  /js
    game.js         # Main game logic
    physics.js      # Physics engine integration
    storage.js      # Save/load functionality
    themes.js       # Theme management
    constants.js    # Game constants
    utils.js        # Utility functions
  /css
    styles.css      # Main styles
    layout.css      # Grid layout
    animations.css  # Game animations
  /assets
    themes.json     # Theme configurations
index.html          # Main entry point
```

## Core Features

### Game Mechanics

- Physics-based emoji dropping and collision
- Matching emojis merge into larger ones when they collide
- Score increases based on successful merges
- Game over when emojis stack above the drop line

### Theme System

- Multiple theme options:
  - Fantasy (🧙‍♂️ → 🧝‍♀️ → 🦄 → 🐉)
  - Sports (⚽ → 🏀 → 🏈 → ⚾)
  - Travel (🚗 → ✈️ → 🚢 → 🚀)
  - Food (🍇 → 🍎 → 🍉 → 🍊)
- Each theme should have 8-10 progression levels
- Themes stored in themes.json for easy management

### UI Requirements

- Portrait mode orientation (9:16 ratio)
- Responsive design for all screen sizes
- Minimum width: 320px
- Maximum width: 600px
- Center-aligned on larger screens

### Layout

```
+----------------+
|  Menu Bar      |
|  [New|Load|Save]|
+----------------+
|                |
|   Next Emoji   |
|                |
|   Game Area    |
|                |
|                |
|                |
+----------------+
|  Score: 000    |
+----------------+
```

### Menu System

- New Game: Reset game state
- Load Game: Restore from localStorage
- Save Game: Manual save to localStorage
- Theme Selection: Dropdown menu
- Auto-save every 30 seconds

### Storage Structure

```javascript
{
  score: number,
  currentTheme: string,
  gameState: {
    emojis: [
      {
        type: string,
        size: number,
        position: {x: number, y: number},
        velocity: {x: number, y: number}
      }
    ],
    nextEmoji: string,
    timestamp: number
  }
}
```

## Technical Requirements

### JavaScript Features

- Use ES6+ features:
  - Arrow functions
  - Destructuring
  - Modules (import/export)
  - Classes
  - Async/await for storage operations
  - Template literals
  - Optional chaining

### CSS Requirements

- CSS Grid for layout
- CSS Custom Properties for theming
- Mobile-first approach
- Hardware acceleration for animations
- Touch event handling
- Viewport meta tags for mobile

### Responsive Design

```css
/* Base mobile styles */
@media screen and (min-width: 320px) {
  .game-container {
    width: 100%;
    height: 100vh;
  }
}

/* Tablet/Desktop containment */
@media screen and (min-width: 600px) {
  .game-container {
    width: 600px;
    height: 800px;
    margin: 0 auto;
  }
}
```

### Performance Considerations

- RequestAnimationFrame for smooth animations
- Asset preloading
- Efficient collision detection
- Debounced save operations
- Memory management for removed emojis
- Canvas optimization techniques

### Mobile Optimizations

- Touch events for dropping emojis
- Prevent scrolling while playing
- Proper viewport settings
- Fast tap response (300ms delay removal)
- Appropriate touch target sizes (min 44px)

## Game Constants

```javascript
const GAME_CONFIG = {
  MIN_EMOJI_SIZE: 40,
  MAX_EMOJI_SIZE: 120,
  MERGE_THRESHOLD: 5,
  DROP_SPEED: 1,
  GRAVITY: 0.5,
  AUTO_SAVE_INTERVAL: 30000,
  MAX_ACTIVE_EMOJIS: 50
};
```

## Error Handling

- Graceful fallback for localStorage
- Error boundaries for game crashes
- Offline support
- Invalid state recovery
- Console error logging

## Testing Considerations

- Touch event simulation
- Physics engine accuracy
- Storage persistence
- Theme switching
- Responsive layout
- Performance metrics

## Future Enhancements

- Multiplayer support
- Additional themes
- Achievement system
- Sound effects
- Particle effects
- Power-ups

## Development Guidelines

1. Mobile-first development approach
2. Regular performance monitoring
3. Clean, documented code
4. Modular architecture
5. Consistent error handling
6. Regular testing across devices
