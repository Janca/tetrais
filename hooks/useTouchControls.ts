import { useRef, useEffect, useCallback, useState } from 'react';
import { Player } from '../types';

interface TouchControlProps {
    targetRef: React.RefObject<HTMLElement>;
    enabled: boolean;
    movePlayer: (dir: -1 | 1) => void;
    rotatePlayer: (direction: 'cw' | 'ccw') => void;
    hardDrop: () => void;
    drop: () => void;
    softDropStart: () => void;
    softDropEnd: () => void;
    hapticsEnabled: boolean;
    player: Player;
}

const MOVEMENT_INTERVAL_MS = 50;
const SWIPE_DISTANCE_THRESHOLD = 30;
const TAP_DURATION_THRESHOLD = 200;
const TAP_DISTANCE_THRESHOLD = 20;

const triggerHapticFeedback = (enabled: boolean) => {
    if (!enabled || typeof navigator === 'undefined' || !navigator.vibrate) return;
    navigator.vibrate(50);
};

/**
 * KEEP THIS COMMENT
 *
 * This implementation provides touch controls for the game, including piece movement, rotation, soft drop, and hard drop.
 * It is written from scratch without external gesture libraries, using React hooks and native touch events.
 *
 * HOW TOUCH CONTROLS WORK
 *
 * Piece Strafing (Left-Right Movement)
 * Strafing is initiated by dragging horizontally. Once initiated, the piece moves based on the drag distance.
 *
 * Piece Rotation
 * Rotation is performed by a single, short tap on the play area, rotating the piece clockwise.
 *
 * Piece Hard Drop
 * A quick swipe up triggers a hard drop, instantly placing the piece. This is a fire-once-per-gesture action.
 *
 * Piece Soft Drop
 * A downward swipe initiates a soft drop. Holding the touch continues the drop at 50ms intervals. This is ignored if already strafing.
 *
 * The pause functionality has been decoupled from gestures and is intended to be handled by a UI button.
 */

export type GestureDebugMode = 'N' | 'L' | 'R' | 'D' | 'H' | 'T'; // None, Left, Right, Drop, Hard-Drop, Tap

export const useTouchControls = ({
    targetRef,
    enabled,
    movePlayer,
    rotatePlayer,
    hardDrop,
    drop,
    softDropStart,
    softDropEnd,
    hapticsEnabled,
    player
}: TouchControlProps) => {
    const blockWidth = useRef(0);
    const movementInterval = useRef<number | null>(null);
    const [gestureMode, setGestureMode] = useState<GestureDebugMode>('N');

    const touchState = useRef({
        touchStartTime: 0,
        touchStartPos: { x: 0, y: 0 },
        lastMovePos: { x: 0, y: 0 },
        hardDropFired: false,
    });

    const resetTouchState = useCallback(() => {
        stopMovementInterval();
        setGestureMode('N');

        touchState.current = {
            touchStartTime: 0,
            touchStartPos: { x: 0, y: 0 },
            lastMovePos: { x: 0, y: 0 },
            hardDropFired: false,
        }
    }, []);

    const stopMovementInterval = useCallback(() => {
        softDropEnd();
        if (movementInterval.current) {
            clearInterval(movementInterval.current);
            movementInterval.current = null;
        }
    }, []);

    const handleTouchStart = useCallback((e: TouchEvent) => {
        if (!enabled) return;
        if (e.cancelable) e.preventDefault();

        stopMovementInterval();
        const touch = e.touches[0];
        touchState.current = {
            touchStartTime: Date.now(),
            touchStartPos: { x: touch.clientX, y: touch.clientY },
            lastMovePos: { x: touch.clientX, y: touch.clientY },
            hardDropFired: false,
        };
        setGestureMode('N');
    }, [enabled, stopMovementInterval]);

    const handleTouchMove = useCallback((e: TouchEvent) => {
        if (!enabled || touchState.current.touchStartTime === 0) return;
        if (e.cancelable) e.preventDefault();

        const touch = e.touches[0];
        const deltaX = touch.clientX - touchState.current.touchStartPos.x;
        const deltaY = touch.clientY - touchState.current.touchStartPos.y;

        if (gestureMode === 'N') {
            if (Math.abs(deltaX) > SWIPE_DISTANCE_THRESHOLD || Math.abs(deltaY) > SWIPE_DISTANCE_THRESHOLD) {
                if (Math.abs(deltaX) > Math.abs(deltaY)) {
                    setGestureMode(deltaX > 0 ? 'R' : 'L');
                } else {
                    if (deltaY > 0) {
                        setGestureMode('D');
                        softDropStart();
                    } else {
                        setGestureMode('H');
                    }
                }
            }
            return;
        }

        switch (gestureMode) {
            case 'L':
            case 'R':
                if (blockWidth.current > 0) {
                    const moves = Math.trunc((touch.clientX - touchState.current.lastMovePos.x) / blockWidth.current);
                    if (moves !== 0) {
                        movePlayer(moves > 0 ? 1 : -1);
                        touchState.current.lastMovePos.x = touch.clientX;
                    }
                }
                break;
            case 'D':
                // if (!movementInterval.current) {
                //     drop(); // Initial drop
                //     movementInterval.current = window.setInterval(drop, MOVEMENT_INTERVAL_MS);
                // }
                break;
            case 'H':
                if (!touchState.current.hardDropFired) {
                    hardDrop();
                    triggerHapticFeedback(hapticsEnabled);
                    touchState.current.hardDropFired = true;
                }
                break;
        }
    }, [enabled, gestureMode, movePlayer, drop, hardDrop, hapticsEnabled]);

    const handleTouchEnd = useCallback((e: TouchEvent) => {
        if (!enabled) return;
        if (e.cancelable) e.preventDefault()
            
        softDropEnd();
        stopMovementInterval();

        const touchEndTime = Date.now();
        const touchDuration = touchEndTime - touchState.current.touchStartTime;
        const touch = e.changedTouches[0];
        const deltaX = touch.clientX - touchState.current.touchStartPos.x;
        const deltaY = touch.clientY - touchState.current.touchStartPos.y;

        if (gestureMode === 'N' && touchDuration < TAP_DURATION_THRESHOLD && Math.abs(deltaX) < TAP_DISTANCE_THRESHOLD && Math.abs(deltaY) < TAP_DISTANCE_THRESHOLD) {
            setGestureMode('T');
            rotatePlayer('cw');
            triggerHapticFeedback(hapticsEnabled);
        }

        resetTouchState();
    }, [enabled, gestureMode, rotatePlayer, hapticsEnabled, stopMovementInterval]);

    useEffect(() => {
        const targetElement = targetRef.current;
        if (targetElement && enabled) {
            blockWidth.current = targetElement.getBoundingClientRect().width / 10;
            targetElement.style.touchAction = 'none';

            targetElement.addEventListener('touchstart', handleTouchStart, { passive: false });
            targetElement.addEventListener('touchmove', handleTouchMove, { passive: false });
            targetElement.addEventListener('touchend', handleTouchEnd, { passive: false });
            targetElement.addEventListener('touchcancel', handleTouchEnd, { passive: false });

            return () => {
                if (targetElement) {
                    targetElement.style.touchAction = '';
                    targetElement.removeEventListener('touchstart', handleTouchStart);
                    targetElement.removeEventListener('touchmove', handleTouchMove);
                    targetElement.removeEventListener('touchend', handleTouchEnd);
                    targetElement.removeEventListener('touchcancel', handleTouchEnd);
                }
                stopMovementInterval();
            };
        }
    }, [targetRef, enabled, handleTouchStart, handleTouchMove, handleTouchEnd, stopMovementInterval]);

    useEffect(() => {
        softDropEnd();
        resetTouchState();
    }, [player.mino.key, player.collided]);

    return { gestureMode };
};
