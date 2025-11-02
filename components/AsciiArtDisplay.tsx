/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect } from 'react';
import type { AsciiArtData } from '../services/geminiService';

interface AsciiArtDisplayProps {
  artData: AsciiArtData | null;
  topic: string;
  error?: string | null;
}

const AsciiArtDisplay: React.FC<AsciiArtDisplayProps> = ({ artData, topic, error }) => {
  const [visibleContent, setVisibleContent] = useState<string>('*'); // Start with placeholder
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [copyButtonText, setCopyButtonText] = useState<string>('Copy');

  useEffect(() => {
    let intervalId: number;

    if (artData) {
      setVisibleContent(''); // Clear the initial '*' placeholder
      setIsStreaming(true);
      setCopyButtonText('Copy'); // Reset copy button on new art

      const fullText = artData.art;
      let currentIndex = 0;
      
      intervalId = window.setInterval(() => {
        const char = fullText[currentIndex];
        if (char !== undefined) {
          setVisibleContent(prev => prev + char);
          currentIndex++;
        } else {
          window.clearInterval(intervalId);
          setIsStreaming(false);
        }
      }, 5); 

    } else {
      setVisibleContent('*');
      setIsStreaming(false);
    }
    
    return () => window.clearInterval(intervalId);
  }, [artData]);

  const handleCopy = () => {
    if (artData?.art) {
      navigator.clipboard.writeText(artData.art)
        .then(() => {
          setCopyButtonText('Copied!');
          setTimeout(() => setCopyButtonText('Copy'), 2000);
        })
        .catch(err => {
          console.error('Failed to copy text: ', err);
          setCopyButtonText('Error');
        });
    }
  };
  
  if (error) {
    return (
      <div className="ascii-art-container">
        <div className="component-error">{error}</div>
      </div>
    );
  }

  const accessibilityLabel = `ASCII art for ${topic}`;

  return (
    <div className="ascii-art-container">
      <div className="ascii-art-scroller">
        <pre className="ascii-art" aria-label={accessibilityLabel}>
          {visibleContent}
          {isStreaming && <span className="blinking-cursor">|</span>}
        </pre>
      </div>
      {artData && !isStreaming && (
        <button 
          onClick={handleCopy}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            zIndex: 2,
            background: '#333',
            border: '1px solid #555',
            color: '#e0e0e0',
            padding: '0.25rem 0.5rem',
            fontSize: '0.8em',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          {copyButtonText}
        </button>
      )}
    </div>
  );
};

export default AsciiArtDisplay;