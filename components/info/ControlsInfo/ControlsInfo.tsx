import React from 'react';
import './styles.css';

export const ControlsInfo: React.FC = () => (
    <div className="minimal-panel controls-info">
        <h2 className="panel-title">CONTROLS</h2>
        <table className="controls-table">
            <tbody>
                <tr>
                    <td>Move</td>
                    <td>[A/D] or [←/→]</td>
                </tr>
                 <tr>
                    <td>Rotate CW</td>
                    <td>[E] or [↑]</td>
                </tr>
                 <tr>
                    <td>Rotate CCW</td>
                    <td>[Q]</td>
                </tr>
                <tr>
                    <td>Soft Drop</td>
                    <td>[S] or [↓]</td>
                </tr>
                <tr>
                    <td>Hard Drop</td>
                    <td>[W] or [Space]</td>
                </tr>
                <tr>
                    <td>Pause</td>
                    <td>[P]</td>
                </tr>
            </tbody>
        </table>
    </div>
);
