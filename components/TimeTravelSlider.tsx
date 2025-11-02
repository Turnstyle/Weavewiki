/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';

interface TimeTravelSliderProps {
  max: number;
  value: number;
  onChange: (value: number) => void;
}

const TimeTravelSlider: React.FC<TimeTravelSliderProps> = ({ max, value, onChange }) => {
  if (max <= 0) {
    return null;
  }

  return (
    <input
      type="range"
      min="0"
      max={max}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="time-travel-slider"
      aria-label="Time travel through history"
    />
  );
};

export default TimeTravelSlider;
