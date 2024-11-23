import { PHYSICS_CONFIG, GAME_CONFIG, CANVAS_CONFIG } from './constants.js';
import { createCircle, isColliding } from './utils.js';

class PhysicsEngine {
    constructor() {
        this.Matter = window.Matter;
        this.engine = this.Matter.Engine.create({
            enableSleeping: false,
            gravity: { x: 0, y: GAME_CONFIG.GRAVITY }  // Set constant gravity
        });
        this.world = this.engine.world;
        this.bodies = new Map();
        this.walls = new Map();
        this.currentEmoji = null;
        this.mergeCallbacks = new Set();
        this.runner = null;
    }

    initialize(width, height) {
        // Clear any existing bodies
        this.Matter.World.clear(this.world);
        this.Matter.Engine.clear(this.engine);

        this.setupWalls(width, height);
        this.setupCollisionHandling();

        // Start the physics engine runner
        this.runner = this.Matter.Runner.create({
            isFixed: true,
            delta: 1000 / 60
        });
        this.Matter.Runner.run(this.runner, this.engine);
    }

    setupWalls(width, height) {
        const { WALL_THICKNESS } = GAME_CONFIG;

        // Create walls with proper collision properties
        const walls = {
            left: this.Matter.Bodies.rectangle(
                WALL_THICKNESS/2, height/2, WALL_THICKNESS, height,
                { isStatic: true, friction: 0.2, restitution: 0.5 }
            ),
            right: this.Matter.Bodies.rectangle(
                width - WALL_THICKNESS/2, height/2, WALL_THICKNESS, height,
                { isStatic: true, friction: 0.2, restitution: 0.5 }
            ),
            bottom: this.Matter.Bodies.rectangle(
                width/2, height - WALL_THICKNESS/2, width, WALL_THICKNESS,
                { isStatic: true, friction: 0.2, restitution: 0.5 }
            )
        };

        // Add walls to world and store references
        Object.entries(walls).forEach(([key, wall]) => {
            this.Matter.World.add(this.world, wall);
            this.walls.set(key, wall);
        });
    }

    setupCollisionHandling() {
        this.Matter.Events.on(this.engine, 'collisionStart', (event) => {
            event.pairs.forEach(pair => {
                const bodyA = pair.bodyA;
                const bodyB = pair.bodyB;

                if (bodyA.emoji && bodyB.emoji &&
                    !bodyA.isStatic && !bodyB.isStatic) {
                    this.handleEmojiCollision(bodyA, bodyB);
                }
            });
        });
    }

    createEmoji(x, y, emojiData) {
        const body = createCircle(this.Matter, x, y, emojiData.size / 2);
        body.emoji = emojiData;
        body.restitution = PHYSICS_CONFIG.RESTITUTION;
        body.friction = PHYSICS_CONFIG.FRICTION;
        body.density = PHYSICS_CONFIG.DENSITY;
        body.frictionAir = 0.001;
        body.angularDamping = 0.1;

        this.bodies.set(body.id, body);
        this.Matter.World.add(this.world, body);

        return body;
    }

    setCurrentEmoji(body) {
        this.currentEmoji = body;
        this.Matter.Body.setStatic(body, true);
    }

    dropCurrentEmoji() {
        if (this.currentEmoji) {
            this.Matter.Body.setStatic(this.currentEmoji, false);
            this.currentEmoji = null;
        }
    }

    moveCurrentEmoji(x) {
        if (this.currentEmoji) {
            const radius = this.currentEmoji.circleRadius;
            const minX = radius + GAME_CONFIG.WALL_THICKNESS;
            const maxX = CANVAS_CONFIG.WIDTH - radius - GAME_CONFIG.WALL_THICKNESS;
            x = Math.max(minX, Math.min(maxX, x));

            this.Matter.Body.setPosition(this.currentEmoji, {
                x: x,
                y: GAME_CONFIG.DROP_ZONE_HEIGHT
            });
        }
    }

    handleEmojiCollision(bodyA, bodyB) {
        if (!bodyA.emoji || !bodyB.emoji) return;

        if (bodyA.emoji.symbol === bodyB.emoji.symbol &&
            isColliding(bodyA, bodyB, GAME_CONFIG.MERGE_THRESHOLD)) {
            this.mergeEmojis(bodyA, bodyB);
        }
    }

    mergeEmojis(bodyA, bodyB) {
        const midX = (bodyA.position.x + bodyB.position.x) / 2;
        const midY = (bodyA.position.y + bodyB.position.y) / 2;

        this.removeBody(bodyA);
        this.removeBody(bodyB);

        this.mergeCallbacks.forEach(callback => {
            callback(bodyA.emoji, midX, midY);
        });
    }

    removeBody(body) {
        this.Matter.World.remove(this.world, body);
        this.bodies.delete(body.id);
    }

    update() {
        // Matter.js Runner handles the updates now
    }

    onMerge(callback) {
        this.mergeCallbacks.add(callback);
    }

    offMerge(callback) {
        this.mergeCallbacks.delete(callback);
    }

    reset() {
        // Remove all emoji bodies
        this.bodies.forEach(body => {
            this.Matter.World.remove(this.world, body);
        });
        this.bodies.clear();

        // Clear current emoji
        this.currentEmoji = null;
    }

    isGameOver() {
        return Array.from(this.bodies.values()).some(body => {
            // Skip the current dropping emoji in the game over check
            if (this.currentEmoji && body.id === this.currentEmoji.id) {
                return false;
            }

            return !body.isStatic && // Don't check static bodies
                   body.position.y <= GAME_CONFIG.DROP_ZONE_HEIGHT &&
                   Math.abs(body.velocity.y) < 0.1; // Only check settled emojis
        });
    }

    getBodies() {
        return Array.from(this.bodies.values());
    }

    cleanup() {
        if (this.runner) {
            this.Matter.Runner.stop(this.runner);
        }
        this.Matter.World.clear(this.world);
        this.Matter.Engine.clear(this.engine);
    }
}

export default new PhysicsEngine();
