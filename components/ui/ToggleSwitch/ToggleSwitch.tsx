import React from 'react';
import './styles.css';

interface ToggleSwitchProps {
    label: string;
    checked: boolean;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    id?: string;
}

export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
    label,
    checked,
    onChange,
    id,
}) => {
    const switchId = id || `toggle-${label.replace(/\s+/g, '-').toLowerCase()}`;

    return (
        <div className="toggle-switch-container">
            <label htmlFor={switchId} className="toggle-switch-label">{label}</label>
            <div className="toggle-switch">
                <input
                    type="checkbox"
                    id={switchId}
                    className="toggle-switch-checkbox"
                    checked={checked}
                    onChange={onChange}
                />
                <label htmlFor={switchId} className="toggle-switch-slider"></label>
            </div>
        </div>
    );
};
