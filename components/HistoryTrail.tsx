/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';

interface HistoryTrailProps {
  history: string[];
  currentIndex: number;
  onHistoryClick: (index: number) => void;
}

const HistoryTrail: React.FC<HistoryTrailProps> = ({ history, currentIndex, onHistoryClick }) => {
  if (history.length <= 1) {
    return null;
  }

  return (
    <nav className="history-trail" aria-label="Breadcrumb">
      {history.map((topic, index) => (
        <React.Fragment key={`${topic}-${index}`}>
          <button 
            onClick={() => onHistoryClick(index)}
            className={index === currentIndex ? 'active-topic' : ''}
            aria-current={index === currentIndex ? 'page' : undefined}
          >
            {topic}
          </button>
          {index < history.length - 1 && <span>&gt;</span>}
        </React.Fragment>
      ))}
    </nav>
  );
};

export default HistoryTrail;