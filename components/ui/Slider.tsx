
import React from 'react';

interface SliderProps {
    label: string;
    value: number;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    min?: number;
    max?: number;
    step?: number;
    disabled?: boolean;
}

export const Slider: React.FC<SliderProps> = ({ label, value, onChange, min = 0, max = 1, step = 0.01, disabled = false }) => {
    return (
        <div className="slider-container">
            <label className="slider-label">{label}</label>
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={onChange}
                className="minimal-slider"
                aria-label={label}
                disabled={disabled}
            />
        </div>
    );
};
