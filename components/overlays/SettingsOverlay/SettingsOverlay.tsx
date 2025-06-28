import React from 'react';
import { OverlayContainer } from '../../ui/OverlayContainer/OverlayContainer';
import { MinimalButton } from '../../ui/MinimalButton/MinimalButton';
import { Slider } from '../../ui/Slider/Slider';
import { ToggleSwitch } from '../../ui/ToggleSwitch/ToggleSwitch';
import './styles.css';

interface SettingsOverlayProps {
    onClose: () => void;
    musicVolume: number;
    onMusicVolumeChange: (value: number) => void;
    effectsVolume: number;
    onEffectsVolumeChange: (value: number) => void;
    melodyVolume: number;
    onMelodyVolumeChange: (value: number) => void;
    bassVolume: number;
    onBassVolumeChange: (value: number) => void;
    percussionVolume: number;
    onPercussionVolumeChange: (value: number) => void;
    padVolume: number;
    onPadVolumeChange: (value: number) => void;
    otherVolume: number;
    onOtherVolumeChange: (value: number) => void;
    lowMotionEnabled: boolean;
    onLowMotionChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export const SettingsOverlay: React.FC<SettingsOverlayProps> = ({
    onClose,
    musicVolume,
    onMusicVolumeChange,
    effectsVolume,
    onEffectsVolumeChange,
    melodyVolume,
    onMelodyVolumeChange,
    bassVolume,
    onBassVolumeChange,
    percussionVolume,
    onPercussionVolumeChange,
    padVolume,
    onPadVolumeChange,
    otherVolume,
    onOtherVolumeChange,
    lowMotionEnabled,
    onLowMotionChange,
}) => {
    return (
        <OverlayContainer>
            <button onClick={onClose} className="close-button chromatic-text" aria-label="Close settings">&times;</button>
            <h1 className="overlay-title chromatic-text">SETTINGS</h1>

            <div className="settings-section">
                <ToggleSwitch
                    label="Low Motion"
                    checked={lowMotionEnabled}
                    onChange={onLowMotionChange}
                    id="low-motion-toggle"
                />
            </div>

            <div className="settings-section">
                <Slider 
                    label="Music Volume"
                    value={musicVolume}
                    onChange={(e) => onMusicVolumeChange(parseFloat(e.target.value))}
                />

                <div className="sub-sliders">
                    <Slider 
                        label="Melody"
                        value={melodyVolume}
                        onChange={(e) => onMelodyVolumeChange(parseFloat(e.target.value))}
                        disabled={musicVolume === 0}
                    />
                     <Slider 
                        label="Bass"
                        value={bassVolume}
                        onChange={(e) => onBassVolumeChange(parseFloat(e.target.value))}
                        disabled={musicVolume === 0}
                    />
                     <Slider 
                        label="Percussion"
                        value={percussionVolume}
                        onChange={(e) => onPercussionVolumeChange(parseFloat(e.target.value))}
                        disabled={musicVolume === 0}
                    />
                     <Slider 
                        label="Pad"
                        value={padVolume}
                        onChange={(e) => onPadVolumeChange(parseFloat(e.target.value))}
                        disabled={musicVolume === 0}
                    />
                     <Slider 
                        label="Other FX"
                        value={otherVolume}
                        onChange={(e) => onOtherVolumeChange(parseFloat(e.target.value))}
                        disabled={musicVolume === 0}
                    />
                </div>

                <Slider 
                    label="SFX Volume"
                    value={effectsVolume}
                    onChange={(e) => onEffectsVolumeChange(parseFloat(e.target.value))}
                />
            </div>
            
            <MinimalButton onClick={() => onClose()}>OKAY</MinimalButton>
        </OverlayContainer>
    );
};
