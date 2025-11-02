/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState } from 'react';
import FocusTimer from './FocusTimer';
import Tooltip from './Tooltip';

interface AppControlsProps {
  history: string[];
  isMindMapView: boolean;
  onToggleMindMap: () => void;
  onTranslate: (language: string) => void;
  currentLanguage: string;
  onSetVisualDensity: (density: number) => void;
}

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'ja', name: 'Japanese' },
  { code: 'de', name: 'German' },
];

const AppControls: React.FC<AppControlsProps> = ({ 
  history,
  isMindMapView, 
  onToggleMindMap,
  onTranslate,
  currentLanguage,
  onSetVisualDensity
}) => {
  const [shareText, setShareText] = useState('Share Journey');

  const handleShare = () => {
    // Construct the shareable URL on-demand. This is safer than
    // constantly trying to update the browser history.
    const url = new URL(window.location.href);
    url.search = `?journey=${history.map(encodeURIComponent).join(',')}`;
    
    navigator.clipboard.writeText(url.href).then(() => {
      setShareText('Copied!');
      setTimeout(() => setShareText('Share Journey'), 2000);
    });
  };

  return (
    <div className="app-controls">
      <div className="control-group">
        <label htmlFor="language-select" style={{marginRight: '0.5ch'}}>Translate:</label>
        <select 
          id="language-select"
          value={currentLanguage} 
          onChange={(e) => onTranslate(e.target.value)}
        >
          {LANGUAGES.map(lang => (
            <option key={lang.code} value={lang.code}>{lang.name}</option>
          ))}
        </select>
      </div>
      
      <FocusTimer />
      
      <div className="control-group">
        <Tooltip text="Adjusts line height and letter spacing for comfortable reading.">
          <span>Density:</span>
        </Tooltip>
        <input 
          type="range" 
          min="0" 
          max="1" 
          step="0.1" 
          defaultValue="0.2" 
          onChange={(e) => onSetVisualDensity(Number(e.target.value))}
          aria-label="Adjust reading density"
        />
      </div>

      <button onClick={onToggleMindMap}>
        {isMindMapView ? 'Content View' : 'Word Cloud'}
      </button>
      
      <button onClick={handleShare}>{shareText}</button>
    </div>
  );
};

export default AppControls;