
import { useEffect } from 'react';

const setStyleProperty = (name: string, value: string) => {
    if (typeof window !== 'undefined') {
        document.documentElement.style.setProperty(name, value);
    }
};

export const useGlitchEffect = () => {
    useEffect(() => {
        const glitchInterval = setInterval(() => {
            if (Math.random() > 0.8) {
                const mainX = (Math.random() - 0.5) * 6;
                const mainY = (Math.random() - 0.5) * 6;
                setStyleProperty('--glitch-main-x', `${mainX}px`);
                setStyleProperty('--glitch-main-y', `${mainY}px`);

                setStyleProperty('--glitch-r-x1', `${3 + (Math.random() - 0.5) * 6}px`);
                setStyleProperty('--glitch-r-y1', `${3 + (Math.random() - 0.5) * 6}px`);
                setStyleProperty('--glitch-c-x1', `${-(3 + (Math.random() - 0.5) * 6)}px`);
                setStyleProperty('--glitch-c-y1', `${-(3 + (Math.random() - 0.5) * 6)}px`);
                
                setStyleProperty('--glitch-r-x2', `${-2 + (Math.random() - 0.5) * 4}px`);
                setStyleProperty('--glitch-r-y2', `${2 + (Math.random() - 0.5) * 4}px`);
                setStyleProperty('--glitch-c-x2', `${2 + (Math.random() - 0.5) * 4}px`);
                setStyleProperty('--glitch-c-y2', `${-2 + (Math.random() - 0.5) * 4}px`);
            } else {
                setStyleProperty('--glitch-main-x', '0px');
                setStyleProperty('--glitch-main-y', '0px');
                setStyleProperty('--glitch-r-x1', '2.5px');
                setStyleProperty('--glitch-r-y1', '2.5px');
                setStyleProperty('--glitch-c-x1', '-2.5px');
                setStyleProperty('--glitch-c-y1', '-2.5px');
                setStyleProperty('--glitch-r-x2', '-1.5px');
                setStyleProperty('--glitch-r-y2', '1.5px');
                setStyleProperty('--glitch-c-x2', '1.5px');
                setStyleProperty('--glitch-c-y2', '-1.5px');
            }
        }, 120);

        return () => {
            clearInterval(glitchInterval);
            // Reset to default values on unmount
            setStyleProperty('--glitch-main-x', '0px');
            setStyleProperty('--glitch-main-y', '0px');
            setStyleProperty('--glitch-r-x1', '2.5px');
            setStyleProperty('--glitch-r-y1', '2.5px');
            setStyleProperty('--glitch-c-x1', '-2.5px');
            setStyleProperty('--glitch-c-y1', '-2.5px');
            setStyleProperty('--glitch-r-x2', '-1.5px');
            setStyleProperty('--glitch-r-y2', '1.5px');
            setStyleProperty('--glitch-c-x2', '1.5px');
            setStyleProperty('--glitch-c-y2', '-1.5px');
        };
    }, []);
};
