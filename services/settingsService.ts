import { HighScoreEntry } from "@/types";

export interface AppSettings {
    musicVolume: number;
    effectsVolume: number;
    melodyVolume: number;
    bassVolume: number;
    percussionVolume: number;
    padVolume: number;
    otherVolume: number;
    pieceSuggestionWeights: number[];
    physicsEnabled: boolean;
    lowMotionEnabled: boolean;
    hapticsEnabled: boolean;
    highScores: HighScoreEntry[];
    lastPlayerName: string;
    ghostPiece: boolean;
    autoRestart: boolean;
}

const STORAGE_KEY = 'tetrais-settings';
const MAX_HIGH_SCORES = 5;

class SettingsService {
    private settings: AppSettings;
    private readonly defaultSettings: AppSettings = {
        musicVolume: 0.5,
        effectsVolume: 1.0,
        melodyVolume: 1.0,
        bassVolume: 1.0,
        percussionVolume: 0.8,
        padVolume: 1.0,
        otherVolume: 0.7,
        pieceSuggestionWeights: [0.60, 0.15, 0.10, 0.05, 0.05, 0.025, 0.025],
        physicsEnabled: false,
        lowMotionEnabled: false,
        hapticsEnabled: true,
        highScores: [],
        lastPlayerName: 'Player',
        ghostPiece: true,
        autoRestart: false
    };

    constructor() {
        this.settings = this.loadSettings();
    }

    private loadSettings(): AppSettings {
        try {
            const storedSettings = localStorage.getItem(STORAGE_KEY);
            if (storedSettings) {
                const parsed = JSON.parse(storedSettings);
                // Merge with defaults to handle cases where new settings are added
                return { ...this.defaultSettings, ...parsed };
            }
        } catch (error) {
            console.error("Failed to load settings from localStorage", error);
        }
        return { ...this.defaultSettings };
    }

    private saveSettings(): void {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.settings));
        } catch (error) {
            console.error("Failed to save settings to localStorage", error);
        }
    }

    public getSettings(): AppSettings {
        return { ...this.settings };
    }

    public updateSetting<K extends keyof AppSettings>(key: K, value: AppSettings[K]): void {
        (this.settings[key] as AppSettings[K]) = value;
        this.saveSettings();
    }
    
    public isHighScore(score: number): boolean {
        if (score <= 0) return false;
        const highScores = this.settings.highScores;
        if (highScores.length < MAX_HIGH_SCORES) {
            return true;
        }
        const lowestHighScore = highScores[highScores.length - 1]?.score ?? 0;
        return score > lowestHighScore;
    }

    public addHighScore(name: string, score: number, lines: number): void {
        const newEntry: HighScoreEntry = {
            name,
            score,
            lines,
            date: new Date().toISOString().split('T')[0],
        };
        
        const newHighScores = [...this.settings.highScores, newEntry];
        newHighScores.sort((a, b) => b.score - a.score);
        this.settings.highScores = newHighScores.slice(0, MAX_HIGH_SCORES);
        this.updateSetting('lastPlayerName', name);
        this.saveSettings();
    }

    public clearHighScores(): void {
        this.settings.highScores = [];
        this.saveSettings();
    }
}

export const settingsService = new SettingsService();
