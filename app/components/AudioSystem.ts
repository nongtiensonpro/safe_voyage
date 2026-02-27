// A lightweight, dependency-free Web Audio API synthesizer for the game

class GameAudioSystem {
    private ctx: AudioContext | null = null;
    private masterGain: GainNode | null = null;
    private isMuted: boolean = false;
    private ambianceNode: AudioBufferSourceNode | null = null;
    private ambianceGain: GainNode | null = null;

    public init() {
        if (this.ctx) return;
        try {
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            this.ctx = new AudioContextClass();
            this.masterGain = this.ctx.createGain();
            this.masterGain.connect(this.ctx.destination);
            this.masterGain.gain.value = 0.5; // Default volume
            this.startAmbiance();
        } catch (e) {
            console.error("Web Audio API not supported", e);
        }
    }

    public toggleMute(): boolean {
        this.isMuted = !this.isMuted;
        if (this.masterGain) {
            this.masterGain.gain.value = this.isMuted ? 0 : 0.5;
        }
        return this.isMuted;
    }

    public getIsMuted(): boolean {
        return this.isMuted;
    }

    public resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    // White noise filtered for ocean waves
    private startAmbiance() {
        if (!this.ctx || !this.masterGain) return;

        const bufferSize = this.ctx.sampleRate * 2; // 2 seconds
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        this.ambianceNode = this.ctx.createBufferSource();
        this.ambianceNode.buffer = buffer;
        this.ambianceNode.loop = true;

        // Bandpass filter to make noise sound like waves 
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 400; // Deep rumble

        this.ambianceGain = this.ctx.createGain();
        this.ambianceGain.gain.value = 0.3; // low volume bg

        this.ambianceNode.connect(filter);
        filter.connect(this.ambianceGain);
        this.ambianceGain.connect(this.masterGain);

        this.ambianceNode.start();

        // Modulate filter to simulate waves crashing
        setInterval(() => {
            if (!this.ctx || !this.ambianceGain || this.isMuted) return;
            const now = this.ctx.currentTime;
            this.ambianceGain.gain.cancelScheduledValues(now);
            // Swell up
            this.ambianceGain.gain.linearRampToValueAtTime(0.5, now + 1.5);
            // Fade down
            this.ambianceGain.gain.linearRampToValueAtTime(0.2, now + 3.0);
        }, 4000);
    }

    public playSuccessChime() {
        if (!this.ctx || !this.masterGain || this.isMuted) return;
        const now = this.ctx.currentTime;

        const playTone = (freq: number, start: number, duration: number) => {
            const osc = this.ctx!.createOscillator();
            const gain = this.ctx!.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, start);

            gain.gain.setValueAtTime(0, start);
            gain.gain.linearRampToValueAtTime(0.6, start + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.01, start + duration);

            osc.connect(gain);
            gain.connect(this.masterGain!);

            osc.start(start);
            osc.stop(start + duration);
        };

        // Arpeggio up
        playTone(523.25, now, 0.2);       // C5
        playTone(659.25, now + 0.1, 0.2); // E5
        playTone(783.99, now + 0.2, 0.4); // G5 
    }

    public playErrorBuzz() {
        if (!this.ctx || !this.masterGain || this.isMuted) return;
        const now = this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.3); // Drop pitch

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.5, now + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + 0.3);
    }

    public playClick() {
        if (!this.ctx || !this.masterGain || this.isMuted) return;
        const now = this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(800, now);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.3, now + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + 0.05);
    }

    public playWarningBlip() {
        if (!this.ctx || !this.masterGain || this.isMuted) return;
        const now = this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(440, now);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.2, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + 0.1);
    }

    public playAccidentSplash() {
        if (!this.ctx || !this.masterGain || this.isMuted) return;
        const now = this.ctx.currentTime;

        // Noise burst
        const bufferSize = this.ctx.sampleRate * 0.5; // 0.5 seconds
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        // Bandpass to sound like splash
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(400, now);
        filter.frequency.linearRampToValueAtTime(100, now + 0.5);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(1.0, now + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        noise.start(now);
        noise.stop(now + 0.5);
    }
}

export const audioSystem = new GameAudioSystem();
