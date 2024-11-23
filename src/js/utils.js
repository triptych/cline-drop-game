import { ERROR_MESSAGES } from './constants.js';

export const storageAvailable = () => {
    try {
        const storage = window.localStorage;
        const x = '__storage_test__';
        storage.setItem(x, x);
        storage.removeItem(x);
        return true;
    } catch (e) {
        return false;
    }
};

export const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

export const calculateDistance = (bodyA, bodyB) => {
    const dx = bodyA.position.x - bodyB.position.x;
    const dy = bodyA.position.y - bodyB.position.y;
    return Math.sqrt(dx * dx + dy * dy);
};

export const isColliding = (bodyA, bodyB, threshold) => {
    const distance = calculateDistance(bodyA, bodyB);
    const combinedRadius = bodyA.circleRadius + bodyB.circleRadius;
    return distance <= combinedRadius + threshold;
};

export const getRandomEmoji = (theme, level = 1) => {
    const availableEmojis = theme.emojis.filter(emoji => emoji.level <= level);
    const randomIndex = Math.floor(Math.random() * availableEmojis.length);
    return availableEmojis[randomIndex];
};

export const formatScore = (score) => {
    return score.toString().padStart(6, '0');
};

export const createCircle = (Matter, x, y, radius) => {
    return Matter.Bodies.circle(x, y, radius, {
        restitution: 0.5,
        friction: 0.1,
        density: 0.001,
        render: {
            visible: true
        }
    });
};

export const handleStorageError = (error) => {
    console.error('Storage operation failed:', error);
    throw new Error(ERROR_MESSAGES.STORAGE_UNAVAILABLE);
};

export const scaleCanvas = (canvas, context) => {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    context.scale(dpr, dpr);

    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
};

export const preventScrolling = (element) => {
    element.addEventListener('touchmove', (e) => {
        e.preventDefault();
    }, { passive: false });
};

export const lerp = (start, end, t) => {
    return start * (1 - t) + end * t;
};

export const easeOutQuad = (t) => {
    return t * (2 - t);
};

export const createParticles = (x, y, color, count = 10) => {
    const particles = [];
    for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count;
        const velocity = 5;
        particles.push({
            x,
            y,
            vx: Math.cos(angle) * velocity,
            vy: Math.sin(angle) * velocity,
            life: 1,
            color
        });
    }
    return particles;
};

export const updateParticles = (particles) => {
    return particles
        .map(particle => ({
            ...particle,
            x: particle.x + particle.vx,
            y: particle.y + particle.vy,
            life: particle.life - 0.02
        }))
        .filter(particle => particle.life > 0);
};

export const drawParticles = (context, particles) => {
    particles.forEach(particle => {
        context.beginPath();
        context.arc(particle.x, particle.y, 3, 0, Math.PI * 2);
        context.fillStyle = `rgba(${particle.color}, ${particle.life})`;
        context.fill();
    });
};
