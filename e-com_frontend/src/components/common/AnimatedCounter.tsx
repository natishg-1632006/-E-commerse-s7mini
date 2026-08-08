import React, { useState, useEffect } from 'react';

interface AnimatedCounterProps {
  value: string | number;
  duration?: number; // duration in ms
}

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  duration = 800,
}) => {
  const [displayValue, setDisplayValue] = useState('0');

  useEffect(() => {
    const valueString = String(value);
    // Find the first sequence of numbers (including commas/dots)
    const match = valueString.match(/([\d,.]+)/);
    if (!match) {
      setDisplayValue(valueString);
      return;
    }

    const numberString = match[1];
    // Remove commas to get raw number
    const rawNumber = parseFloat(numberString.replace(/,/g, ''));
    if (isNaN(rawNumber)) {
      setDisplayValue(valueString);
      return;
    }

    const prefix = valueString.slice(0, match.index);
    const suffix = valueString.slice((match.index || 0) + numberString.length);
    const hasCommas = numberString.includes(',');
    const decimalPlaces = (numberString.split('.')[1] || '').length;

    let startTimestamp: number | null = null;
    const startValue = 0;
    const endValue = rawNumber;

    let animationFrameId: number;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const currentNumber = progress * (endValue - startValue) + startValue;
      
      let formattedNumber = currentNumber.toFixed(decimalPlaces);
      if (hasCommas) {
        const parts = formattedNumber.split('.');
        parts[0] = parseInt(parts[0]).toLocaleString('en-IN');
        formattedNumber = parts.join('.');
      }
      
      setDisplayValue(`${prefix}${formattedNumber}${suffix}`);
      
      if (progress < 1) {
        animationFrameId = window.requestAnimationFrame(step);
      }
    };

    animationFrameId = window.requestAnimationFrame(step);

    return () => {
      if (animationFrameId) {
        window.cancelAnimationFrame(animationFrameId);
      }
    };
  }, [value, duration]);

  return <>{displayValue}</>;
};

export default AnimatedCounter;
