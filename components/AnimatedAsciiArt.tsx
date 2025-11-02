/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect } from 'react';
import type { AnimatedAsciiArtData } from '../services/geminiService';

interface AnimatedAsciiArtProps {
  artData: AnimatedAsciiArtData | null;
  error?: string | null;
}

const AnimatedAsciiArt: React.FC<AnimatedAsciiArtProps> = ({ artData, error }) => {
  const [currentFrame, setCurrentFrame] = useState(0);

  useEffect(() => {
    if (artData && artData.frames.length > 1) {
      const intervalId = setInterval(() => {
        setCurrentFrame(prevFrame => (prevFrame + 1) % artData.frames.length);
      }, 500); // Change frame every 500ms

      return () => clearInterval(intervalId);
    }
  }, [artData]);

  if (error) {
    return (
      <div className="animated-ascii-art">
        <div className="component-error">{error}</div>
      </div>
    );
  }

  if (!artData || artData.frames.length === 0) {
    return null;
  }

  return (
    <div className="animated-ascii-art">
      <pre className="ascii-art" aria-live="polite">
        {artData.frames[currentFrame]}
      </pre>
    </div>
  );
};

export default AnimatedAsciiArt;