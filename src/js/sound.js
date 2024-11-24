class SoundManager {
    constructor() {
        this.sounds = {};
        this.isMuted = false;
        this.loadSounds();
    }

    loadSounds() {
        // Using base64 encoded sounds for easy distribution
        const soundData = {
            drop: 'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQwAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAASAAAhIQAYGBgYJSUlJSUyMjIyMj4+Pj4+S0tLS0tXV1dXV2RkZGRkcHBwcHB9fX19fYmJiYmJlpaWlpajo6Ojo6+vr6+vvLy8vLzIyMjIyNXV1dXV4uLi4uLu7u7u7vv7+/v7//////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAYAAAAAAAAAISHCVqfKAAAAAAAAAAAAAAAAAAAA//sQxAADwAABpAAAACAAADSAAAAETEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVU=',
            merge: 'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQwAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAASAAAhIQAYGBgYJSUlJSUyMjIyMj4+Pj4+S0tLS0tXV1dXV2RkZGRkcHBwcHB9fX19fYmJiYmJlpaWlpajo6Ojo6+vr6+vvLy8vLzIyMjIyNXV1dXV4uLi4uLu7u7u7vv7+/v7//////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAYAAAAAAAAAISHCVqfKAAAAAAAAAAAAAAAAAAAA//sQxAADwAABpAAAACAAADSAAAAETEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVU=',
            gameOver: 'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQwAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAASAAAhIQAYGBgYJSUlJSUyMjIyMj4+Pj4+S0tLS0tXV1dXV2RkZGRkcHBwcHB9fX19fYmJiYmJlpaWlpajo6Ojo6+vr6+vvLy8vLzIyMjIyNXV1dXV4uLi4uLu7u7u7vv7+/v7//////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAYAAAAAAAAAISHCVqfKAAAAAAAAAAAAAAAAAAAA//sQxAADwAABpAAAACAAADSAAAAETEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVU='
        };

        Object.entries(soundData).forEach(([name, base64]) => {
            const audio = new Audio(base64);
            audio.volume = 0.3; // Set default volume
            this.sounds[name] = audio;
        });
    }

    play(soundName) {
        if (this.isMuted || !this.sounds[soundName]) return;

        // Clone and play to allow overlapping sounds
        const sound = this.sounds[soundName].cloneNode();
        sound.play().catch(e => console.log('Sound play failed:', e));
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        return this.isMuted;
    }
}

export default new SoundManager();
