export interface AppSettings {
    musicVolume: number;
    effectsVolume: number;
    highScore: number;
    highLines: number;
    melodyVolume: number;
    bassVolume: number;
    percussionVolume: number;
    padVolume: number;
    otherVolume: number;
}

const STORAGE_KEY = 'tetrais-settings';

class SettingsService {
    private settings: AppSettings;
    private readonly defaultSettings: AppSettings = {
        musicVolume: 0.5,
        effectsVolume: 1.0,
        highScore: 0,
        highLines: 0,
        melodyVolume: 1.0,
        bassVolume: 1.0,
        percussionVolume: 0.8,
        padVolume: 1.0,
        otherVolume: 0.7,
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

    public checkAndSetHighScore(score: number, lines: number): boolean {
        let updated = false;
        if (score > this.settings.highScore) {
            this.settings.highScore = score;
            updated = true;
        }
        if (lines > this.settings.highLines) {
            this.settings.highLines = lines;
            updated = true;
        }
        if (updated) {
            this.saveSettings();
        }
        return updated;
    }
}

export const settingsService = new SettingsService();