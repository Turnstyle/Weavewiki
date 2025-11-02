/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  streamDefinition, 
  generateAsciiArt, 
  getRelatedTopics, 
  rateDifficulty, 
  getHistoricalFact, 
  translateText, 
  generateAnimatedAsciiArt,
  validateApiKey,
  AsciiArtData, 
  AnimatedAsciiArtData
} from './services/geminiService';

import ContentDisplay from './components/ContentDisplay';
import SearchBar from './components/SearchBar';
import LoadingSkeleton from './components/LoadingSkeleton';
import AsciiArtDisplay from './components/AsciiArtDisplay';
import HistoryTrail from './components/HistoryTrail';
import TimeTravelSlider from './components/TimeTravelSlider';
import AppControls from './components/AppControls';
import RelatedTopics from './components/RelatedTopics';
import AnimatedAsciiArt from './components/AnimatedAsciiArt';
import Tooltip from './components/Tooltip';

const getInitialHistory = (): string[] => {
  const params = new URLSearchParams(window.location.search);
  const journey = params.get('journey');
  if (journey) {
    try {
      return journey.split(',').map(decodeURIComponent).filter(Boolean);
    } catch (e) {
      console.error("Failed to parse journey from URL:", e);
      return ['Metacognition'];
    }
  }
  return ['Metacognition'];
};

const COMPLEXITY_LEVELS: Record<string, string> = {
  "Very Simple": "Akin to \"Explain Like I'm 5.\"",
  "Simple": "A basic, clear, and direct introduction.",
  "General Audience": "Accessible to anyone, like a popular science article.",
  "High School": "Standard textbook language.",
  "Advanced High School": "Requires some prior knowledge (e.g., AP/IB level).",
  "Undergraduate": "Introductory college-level concepts.",
  "Advanced Undergraduate": "Upper-division university material.",
  "Graduate (Master's)": "Assumes a solid foundation in the field.",
  "Graduate (Doctoral)": "Deeply technical and research-focused.",
  "Specialist": "For professionals actively working in the field.",
  "Scholarly": "For academic peers, highly theoretical.",
  "Pioneering": "At the absolute cutting-edge of current knowledge."
};

type ComponentErrorState = Record<string, string | null>;

const App: React.FC = () => {
  const initialHistory = getInitialHistory();
  const [history, setHistory] = useState<string[]>(initialHistory);
  const [historyIndex, setHistoryIndex] = useState<number>(initialHistory.length - 1);
  const [content, setContent] = useState<string>('');
  const [translatedContent, setTranslatedContent] = useState<string | null>(null);
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [componentErrors, setComponentErrors] = useState<ComponentErrorState>({});
  const [asciiArt, setAsciiArt] = useState<AsciiArtData | null>(null);
  const [isFading, setIsFading] = useState<boolean>(false);
  const [isMindMapView, setIsMindMapView] = useState<boolean>(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // New feature states
  const [relatedTopics, setRelatedTopics] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState<string | null>(null);
  const [historicalFact, setHistoricalFact] = useState<string | null>(null);
  const [animatedArt, setAnimatedArt] = useState<AnimatedAsciiArtData | null>(null);
  
  // State for API key validation
  const [isConfigValid, setIsConfigValid] = useState<boolean | null>(null);
  const [configError, setConfigError] = useState<string | null>(null);
  
  const currentTopic = history[historyIndex] ?? 'Metacognition';
  
  // This useEffect was the source of the crash and has been removed.
  // The logic is now handled inside the AppControls component's share button.
  
  // New Effect for API key validation on initial load
  useEffect(() => {
    const checkConfig = async () => {
      const { isValid, error } = await validateApiKey();
      if (!isValid && error) {
        setConfigError(error);
      }
      setIsConfigValid(isValid);
    };
    checkConfig();
  }, []); // Empty dependency array ensures this runs only once on mount.


  const setVisualDensity = useCallback((density: number) => {
    const lineHeight = 1.5 + (density * 0.5);
    const letterSpacing = density * 0.05;
    document.documentElement.style.setProperty('--line-height', `${lineHeight}`);
    document.documentElement.style.setProperty('--letter-spacing', `${letterSpacing}em`);
  }, []);

  const navigateToTopic = useCallback((newTopic: string) => {
    setIsMindMapView(false);
    const trimmedTopic = newTopic.trim();
    if (!trimmedTopic || trimmedTopic.toLowerCase() === currentTopic.toLowerCase()) {
      return;
    }
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(trimmedTopic);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex, currentTopic]);

  useEffect(() => {
    // Do not run if the config is invalid or still being checked
    if (isConfigValid !== true || !currentTopic) return;
    
    document.title = `${currentTopic} - Weavewiki`;
    let isCancelled = false;
    
    const fetchContentAndArt = async () => {
      setIsFading(true);
      
      setIsLoading(true);
      setError(null);
      setContent('');
      setAsciiArt(null);
      setRelatedTopics([]);
      setDifficulty(null);
      setHistoricalFact(null);
      setAnimatedArt(null);
      setTranslatedContent(null);
      setCurrentLanguage('en');
      setComponentErrors({}); // Reset all component errors
      
      await new Promise(resolve => setTimeout(resolve, 300));
      if (isCancelled) return;
      setIsFading(false);

      // --- Robust Auxiliary Data Fetching ---
      // Promise.allSettled allows all promises to complete, regardless of individual failures.
      // This makes the UI resilient: one failed component won't prevent others from loading.
      const settledPromises = await Promise.allSettled([
        generateAsciiArt(currentTopic),
        getRelatedTopics(currentTopic),
        getHistoricalFact(currentTopic),
        generateAnimatedAsciiArt(currentTopic)
      ]);

      if (isCancelled) return;

      const [asciiResult, relatedResult, factResult, animatedResult] = settledPromises;

      // Process results, setting state for successes and componentErrors for failures.
      if (asciiResult.status === 'fulfilled') setAsciiArt(asciiResult.value);
      else setComponentErrors(prev => ({ ...prev, asciiArt: asciiResult.reason.message }));

      if (relatedResult.status === 'fulfilled') setRelatedTopics(relatedResult.value);
      else setComponentErrors(prev => ({ ...prev, relatedTopics: relatedResult.reason.message }));
      
      if (factResult.status === 'fulfilled') setHistoricalFact(factResult.value);
      else setComponentErrors(prev => ({ ...prev, historicalFact: factResult.reason.message }));

      if (animatedResult.status === 'fulfilled') setAnimatedArt(animatedResult.value);
      else setComponentErrors(prev => ({ ...prev, animatedArt: animatedResult.reason.message }));

      // --- Main Content Streaming ---
      try {
        let accumulatedContent = '';
        for await (const chunk of streamDefinition(currentTopic)) {
          if (isCancelled) break;
          accumulatedContent += chunk;
          setContent(accumulatedContent);
        }
        if (!isCancelled && accumulatedContent) {
           rateDifficulty(accumulatedContent)
            .then(d => !isCancelled && setDifficulty(d))
            .catch(err => console.error("Difficulty rating failed:", err)); // Non-critical, so we don't set a component error
        }
      } catch (e: unknown) {
        if (!isCancelled) {
          setError(e instanceof Error ? e.message : 'An error occurred');
          setContent('');
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchContentAndArt();
    return () => { isCancelled = true; };
  }, [currentTopic, isConfigValid]);

  const handleTranslate = useCallback(async (language: string) => {
    if (!content || isLoading) return;
    setCurrentLanguage(language);
    if (language === 'en') {
      setTranslatedContent(null);
      return;
    }
    try {
      const translation = await translateText(content, language);
      setTranslatedContent(translation);
    } catch (err) {
      console.error("Translation failed:", err);
      setComponentErrors(prev => ({...prev, translation: "Translation failed."}))
    }
  }, [content, isLoading]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleHistoryNavigation = useCallback((index: number) => {
    setIsMindMapView(false);
    setHistoryIndex(index);
  }, []);

  const WordCloudView = () => {
    // Fix: Correctly typed the accumulator in the reduce function by passing a generic
    // type argument to .reduce(). This strongly types the accumulator and the final
    // result, ensuring `topicFrequencies` is correctly inferred as `Record<string, number>`.
    const topicFrequencies = history.reduce<Record<string, number>>((acc, topic) => {
      const cleanTopic = topic.trim().toLowerCase();
      if (cleanTopic) {
        acc[cleanTopic] = (acc[cleanTopic] || 0) + 1;
      }
      return acc;
    }, {});

    const maxFreq = Math.max(...Object.values(topicFrequencies), 1);

    return (
      <div className="word-cloud-view">
        <h3>Your Journey's Word Cloud</h3>
        <div className="word-cloud-container">
          {Object.entries(topicFrequencies).map(([topic, freq]) => (
            <span 
              key={topic}
              style={{
                fontSize: `${0.8 + (freq / maxFreq) * 1.5}em`,
                opacity: `${0.6 + (freq / maxFreq) * 0.4}`,
                fontWeight: freq > 1 ? 'bold' : 'normal',
              }}
              className="word-cloud-word"
            >
              {topic}
            </span>
          ))}
        </div>
      </div>
    );
  };

  const complexityTooltipText = difficulty && COMPLEXITY_LEVELS[difficulty]
    ? `AI-estimated reading complexity for this topic — ${difficulty}: ${COMPLEXITY_LEVELS[difficulty]}`
    : "AI-estimated reading complexity for this topic.";

  // Conditional rendering based on validation state
  if (isConfigValid === null) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <h1 style={{ letterSpacing: '0.2em', textTransform: 'uppercase' }}>WEAVEWIKI</h1>
        <p style={{ color: '#aaa' }}>Validating connection to AI service...</p>
      </div>
    );
  }

  if (!isConfigValid) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', maxWidth: '600px', margin: 'auto' }}>
        <h1 style={{ color: '#ffab91', letterSpacing: '0.1em' }}>Configuration Error</h1>
        <p style={{ marginTop: '1rem', color: '#e0e0e0', lineHeight: '1.6' }}>{configError}</p>
        <p style={{ marginTop: '2rem', color: '#aaa', fontSize: '0.9em' }}>
          This error usually means the application's API key has not been set up correctly by the administrator. Please try refreshing the page, or contact the site owner if the problem persists.
        </p>
      </div>
    );
  }

  return (
    <div>
      <SearchBar ref={searchInputRef} onSearch={navigateToTopic} isLoading={isLoading} />
      <HistoryTrail history={history} currentIndex={historyIndex} onHistoryClick={handleHistoryNavigation} />
      {history.length > 1 && <TimeTravelSlider max={history.length - 1} value={historyIndex} onChange={handleHistoryNavigation} />}
      
      <div className={`content-wrapper ${isFading ? 'content-fade-out' : 'content-fade-in'}`}>
        <header style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ letterSpacing: '0.2em', textTransform: 'uppercase' }}>
            WEAVEWIKI
          </h1>
          <p className="subtitle">Any word below links to a new definition page!</p>
          <AsciiArtDisplay artData={asciiArt} topic={currentTopic} error={componentErrors.asciiArt} />
        </header>
        
        <main>
          {isMindMapView ? <WordCloudView /> : (
            <div>
              <h2 style={{ marginBottom: '0.5rem', textTransform: 'capitalize' }}>
                {currentTopic}
              </h2>

              <div className="meta-container">
                <span className="meta-info">
                  Depth:{' '}
                  <Tooltip text="Your current position in this exploration journey. Go back using the slider above.">
                    {historyIndex + 1}
                  </Tooltip>
                </span>
                {difficulty && (
                  <span className="meta-info">
                    Complexity:{' '}
                    <Tooltip text={complexityTooltipText}>
                      {difficulty}
                    </Tooltip>
                  </span>
                )}
              </div>

              {error && <p className="component-error main-error">{error}</p>}
              {isLoading && content.length === 0 && !error && <LoadingSkeleton />}
              {content.length > 0 && !error && (
                <ContentDisplay 
                  content={translatedContent || content} 
                  isLoading={isLoading} 
                  onWordClick={navigateToTopic} 
                />
              )}
              {historicalFact && <div className="historical-fact">{historicalFact}</div>}
              {componentErrors.historicalFact && <div className="component-error">{componentErrors.historicalFact}</div>}
              <RelatedTopics topics={relatedTopics} onTopicClick={navigateToTopic} error={componentErrors.relatedTopics} />
            </div>
          )}
        </main>
        
        <AnimatedAsciiArt artData={animatedArt} error={componentErrors.animatedArt} />
      </div>

      <footer className="sticky-footer">
        <AppControls 
          history={history}
          isMindMapView={isMindMapView}
          onToggleMindMap={() => setIsMindMapView(v => !v)}
          onTranslate={handleTranslate}
          currentLanguage={currentLanguage}
          onSetVisualDensity={setVisualDensity}
        />
      </footer>
    </div>
  );
};

export default App;