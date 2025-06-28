import { useRef, useEffect, useCallback } from 'react';

interface TouchControlProps {
    targetRef: React.RefObject<HTMLElement>;
    enabled: boolean;
    movePlayer: (dir: -1 | 1) => void;
    rotatePlayer: (direction: 'cw' | 'ccw') => void;
    hardDrop: () => void;
    softDropStart: () => void;
    softDropEnd: () => void;
}

// --- Gesture Timing & Sensitivity Settings ---
// The minimum pixel distance to qualify as a swipe.
const SWIPE_THRESHOLD_PX = 40;
// The maximum duration in ms for a gesture to be considered a tap.
const TAP_TIME_THRESHOLD_MS = 200;
// The maximum pixel distance a touch can move to still be a tap.
const TAP_DISTANCE_THRESHOLD_PX = 20;
// The time window in ms after a downward swipe where a tap will trigger a hard drop.
const HARD_DROP_TAP_WINDOW_MS = 300;


export const useTouchControls = ({
    targetRef,
    enabled,
    movePlayer,
    rotatePlayer,
    hardDrop,
    softDropStart,
    softDropEnd,
}: TouchControlProps) => {
    const touchStartX = useRef(0);
    const touchStartY = useRef(0);
    const touchStartTime = useRef(0);
    const isSwipingDown = useRef(false);
    const justSwipedDown = useRef(false);
    const hardDropTimeout = useRef<number | null>(null);

    const handleTouchStart = useCallback((e: TouchEvent) => {
        if (!enabled || e.touches.length !== 1) return;
        
        // If a tap occurs shortly after a downward swipe, trigger a hard drop.
        if (justSwipedDown.current) {
            e.preventDefault();
            hardDrop();
            justSwipedDown.current = false;
            if (hardDropTimeout.current) clearTimeout(hardDropTimeout.current);
            return;
        }

        // Record initial touch properties.
        touchStartX.current = e.touches[0].clientX;
        touchStartY.current = e.touches[0].clientY;
        touchStartTime.current = new Date().getTime();
        isSwipingDown.current = false;

    }, [enabled, hardDrop]);

    const handleTouchMove = useCallback((e: TouchEvent) => {
        if (!enabled || e.touches.length !== 1) return;
        
        const deltaX = e.touches[0].clientX - touchStartX.current;
        const deltaY = e.touches[0].clientY - touchStartY.current;

        // If moving down significantly more than horizontally, start a soft drop.
        if (deltaY > SWIPE_THRESHOLD_PX && deltaY > Math.abs(deltaX)) {
             if (!isSwipingDown.current) {
                isSwipingDown.current = true;
                softDropStart();
            }
        }

        // Prevent page scroll while swiping on the game area.
        if (isSwipingDown.current || Math.abs(deltaX) > TAP_DISTANCE_THRESHOLD_PX || Math.abs(deltaY) > TAP_DISTANCE_THRESHOLD_PX) {
            e.preventDefault();
        }

    }, [enabled, softDropStart]);

    const handleTouchEnd = useCallback((e: TouchEvent) => {
        if (!enabled || e.changedTouches.length !== 1) return;

        // Clean up any pending hard drop state.
        if (hardDropTimeout.current) clearTimeout(hardDropTimeout.current);
        hardDropTimeout.current = null;
        
        // This is reset later by a timer, but good to clear here too.
        if (!justSwipedDown.current) {
             justSwipedDown.current = false;
        }
        
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        const touchEndTime = new Date().getTime();

        const deltaX = touchEndX - touchStartX.current;
        const deltaY = touchEndY - touchStartY.current;
        const deltaTime = touchEndTime - touchStartTime.current;

        // If we were swiping down, end the soft drop and start hard drop timer.
        if (isSwipingDown.current) {
            softDropEnd();
            isSwipingDown.current = false;
            
            justSwipedDown.current = true;
            hardDropTimeout.current = window.setTimeout(() => {
                justSwipedDown.current = false;
            }, HARD_DROP_TAP_WINDOW_MS);
            return;
        }

        // Tap Detection: If move time and distance are small.
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        if (deltaTime < TAP_TIME_THRESHOLD_MS && distance < TAP_DISTANCE_THRESHOLD_PX) {
            rotatePlayer('cw');
            return;
        }

        // Swipe Detection: If move distance is large.
        if (deltaTime < 500) { // Ignore slow drags
            if (Math.abs(deltaX) > Math.abs(deltaY)) { // Horizontal swipe
                if (deltaX > SWIPE_THRESHOLD_PX) {
                    movePlayer(1); // Right
                } else if (deltaX < -SWIPE_THRESHOLD_PX) {
                    movePlayer(-1); // Left
                }
            }
            // Vertical swipes up are ignored. Downward handled by touchMove/isSwipingDown.
        }

    }, [enabled, softDropEnd, rotatePlayer, movePlayer]);

     const handleTouchCancel = useCallback(() => {
        if (!enabled) return;

        // Ensure state is reset if the touch is interrupted (e.g., by system UI).
        if (isSwipingDown.current) {
            softDropEnd();
        }
        isSwipingDown.current = false;
        justSwipedDown.current = false;
        if (hardDropTimeout.current) clearTimeout(hardDropTimeout.current);

    }, [enabled, softDropEnd]);

    useEffect(() => {
        const targetElement = targetRef.current;
        if (!targetElement) return;

        // Use passive: false to allow preventDefault() to stop scrolling.
        const options = { passive: false };

        targetElement.addEventListener('touchstart', handleTouchStart, options);
        targetElement.addEventListener('touchmove', handleTouchMove, options);
        targetElement.addEventListener('touchend', handleTouchEnd);
        targetElement.addEventListener('touchcancel', handleTouchCancel);

        return () => {
            targetElement.removeEventListener('touchstart', handleTouchStart);
            targetElement.removeEventListener('touchmove', handleTouchMove);
            targetElement.removeEventListener('touchend', handleTouchEnd);
            targetElement.removeEventListener('touchcancel', handleTouchCancel);
        };
    }, [targetRef, enabled, handleTouchStart, handleTouchMove, handleTouchEnd, handleTouchCancel]);
};
