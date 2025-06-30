import React from 'react';
import { MinoBoard, Player } from '../../../types';
import './styles.css';

interface GameboardProps {
    board: MinoBoard;
    player: Player;
}

const Gameboard: React.FC<GameboardProps> = ({ board, player }) => {
    const visibleBoard = board.slice(2);

    return (
        <div className="gameboard-grid">
            {/* Render the board */}
            {visibleBoard.map((row, y) => (
                <React.Fragment key={y}>
                    {row.map((cell, x) => {
                        const minoKey = cell[0];
                        const cellState = cell[1];
                        const className = `gameboard-cell ${cellState} mino-${minoKey}`;
                        return <div key={x} className={className} />;
                    })}
                </React.Fragment>
            ))}
            {/* Render the player's piece */}
            {player.mino.shape.map((row, y) => {
                return row.map((cell, x) => {
                    if (cell !== 0) {
                        const playerY = player.pos.y + y;
                        if (playerY >= 2) {
                            return (
                                <div
                                    key={`${y}-${x}`}
                                    className="player-piece"
                                    style={{
                                        gridRowStart: playerY - 1,
                                        gridColumnStart: player.pos.x + x + 1,
                                    }}
                                />
                            );
                        }
                    }
                    return null;
                });
            })}
        </div>
    );
};

export default Gameboard;
