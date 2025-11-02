/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';

interface RelatedTopicsProps {
  topics: string[];
  onTopicClick: (topic: string) => void;
  error?: string | null;
}

const RelatedTopics: React.FC<RelatedTopicsProps> = ({ topics, onTopicClick, error }) => {
  
  const hasContent = topics && topics.length > 0;

  if (!hasContent && !error) {
    return null;
  }

  return (
    <div className="related-topics">
      <h3>Explore Related</h3>
      {error && <div className="component-error">{error}</div>}
      {hasContent && (
        <div className="related-topics-grid">
          {topics.map(topic => (
            <button
              key={topic}
              onClick={() => onTopicClick(topic)}
              className="related-topic-button"
            >
              {topic}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default RelatedTopics;