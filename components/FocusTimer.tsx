/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect, useRef } from 'react';
import Tooltip from './Tooltip';

const FOCUS_DURATION = 25 * 60; // 25 minutes in seconds

const FocusTimer: React.FC = () => {
  const [timeLeft, setTimeLeft] = useState(FOCUS_DURATION);
  const [isActive, setIsActive] = useState(false);
  const intervalRef = useRef<number | null>(null);

  // Effect to handle the countdown interval itself
  useEffect(() => {
    if (!isActive) {
      return;
    }

    intervalRef.current = window.setInterval(() => {
      setTimeLeft(prevTime => prevTime - 1);
    }, 1000);

    // Cleanup function to clear the interval when component unmounts or isActive becomes false
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isActive]);
  
  // Effect to handle what happens when the timer finishes
  useEffect(() => {
    if (timeLeft <= 0) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setIsActive(false);
      // Silently reset the timer without a blocking alert
      setTimeLeft(FOCUS_DURATION);
    }
  }, [timeLeft]);

  const toggleTimer = () => setIsActive(!isActive);
  
  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(FOCUS_DURATION);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const displayTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return (
    <div className="control-group">
      <Tooltip text="A 25-minute Pomodoro timer to help you stay focused on your exploration.">
        <span>Focus: {displayTime}</span>
      </Tooltip>
      <button onClick={toggleTimer} aria-label={isActive ? 'Pause timer' : 'Start timer'}>
        {isActive ? 'Pause' : 'Start'}
      </button>
      <button onClick={resetTimer} aria-label="Reset timer">Reset</button>
    </div>
  );
};

export default FocusTimer;