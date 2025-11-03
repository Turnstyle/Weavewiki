/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { Type, GenerateContentResponse } from '@google/genai';

// API calls are now proxied through our own server to protect the API key.
const PROXY_ENDPOINT = '/api/generate';

const artModelName = 'gemini-2.5-flash';
const textModelName = 'gemini-flash-lite-latest';

export interface AsciiArtData {
  art: string;
}

export interface AnimatedAsciiArtData {
  frames: string[];
}

async function postToProxy<T>(body: object): Promise<T> {
  const response = await fetch(PROXY_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ error: 'An unknown server error occurred.' }));
    throw new Error(errorBody.error || `Server responded with status ${response.status}`);
  }
  
  const fullResponse: GenerateContentResponse = await response.json();
  const text = fullResponse.text;
  if (!text) throw new Error('API returned an empty response.');
  return JSON.parse(text) as T;
}

export async function* streamDefinition(
  topic: string,
): AsyncGenerator<string, void, undefined> {
  const prompt = `Provide a concise, single-paragraph encyclopedia-style definition for the term: "${topic}". Be informative and neutral. Do not use markdown, titles, or any special formatting. Respond with only the text of the definition itself.`;
  
  try {
    const response = await fetch(PROXY_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        stream: true,
        model: textModelName,
        contents: prompt,
        config: { thinkingConfig: { thinkingBudget: 0 } },
      }),
    });

    if (!response.ok || !response.body) {
      const errorBody = await response.json().catch(() => ({ error: 'An unknown server error occurred.' }));
      throw new Error(errorBody.error || `Server responded with status ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      yield decoder.decode(value, { stream: true });
    }

  } catch (error) {
    const errorMessage = `Could not generate content for "${topic}".`;
    console.error('Error streaming from proxy:', error);
    yield `Error: ${errorMessage}`;
    throw new Error(errorMessage);
  }
}

export async function generateAsciiArt(topic: string): Promise<AsciiArtData> {
  const prompt = `Generate an ASCII art visualization for the topic "${topic}". The visualization's form should embody the word's essence. Use this character palette: │─┌┐└┘├┤┬┴┼►◄▲▼○●◐◑░▒▓█▀▄■□▪▫★☆♦♠♣♥⟨⟩/\\_|.`;
  try {
    return await postToProxy<AsciiArtData>({
      model: artModelName,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        thinkingConfig: { thinkingBudget: 0 },
        responseSchema: {
          type: Type.OBJECT,
          properties: { art: { type: Type.STRING, description: 'A string containing the ASCII art visualization.' } },
          required: ['art']
        }
      },
    });
  } catch (error) {
    console.error(`Could not generate ASCII art for "${topic}":`, error);
    throw new Error('Could not load art.');
  }
}

export async function generateAnimatedAsciiArt(topic: string): Promise<AnimatedAsciiArtData> {
    const prompt = `Generate a 3-frame ASCII art animation about "${topic}". Use this character palette: │─┌┐└┘├┤┬┴┼►◄▲▼○●◐◑░▒▓█▀▄■□▪▫★☆♦♠♣♥⟨⟩/\\_|.`;
  try {
    return await postToProxy<AnimatedAsciiArtData>({
      model: artModelName,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        thinkingConfig: { thinkingBudget: 0 },
        responseSchema: {
            type: Type.OBJECT,
            properties: {
                frames: {
                    type: Type.ARRAY,
                    description: 'An array of exactly 3 strings, where each string is a frame of the animation.',
                    items: {
                        type: Type.STRING
                    }
                }
            },
            required: ['frames']
        }
      },
    });
  } catch (error) {
    console.error(`Could not generate animated ASCII art for "${topic}":`, error);
    throw new Error('Could not load animation.');
  }
}

export async function getRelatedTopics(topic: string): Promise<string[]> {
  const prompt = `Given the topic "${topic}", suggest 4 tangentially related but interesting concepts for further exploration. For example, for 'Photosynthesis', you might return ["Chlorophyll", "Cellular Respiration", "Carbon Cycle", "Stomata"].`;

  try {
    const topics = await postToProxy<string[]>({
      model: textModelName,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        thinkingConfig: { thinkingBudget: 0 },
        responseSchema: {
            type: Type.ARRAY,
            description: 'An array of 4 strings representing related topics.',
            items: {
                type: Type.STRING
            }
        }
      },
    });
    return (topics as string[]).slice(0, 4);
  } catch (error) {
    console.error(`Could not get related topics for "${topic}":`, error);
    throw new Error('Could not load related topics.');
  }
}

export async function rateDifficulty(text: string): Promise<string> {
  const prompt = `Analyze the following text and rate its reading complexity on this 12-point scale: "Very Simple", "Simple", "General Audience", "High School", "Advanced High School", "Undergraduate", "Advanced Undergraduate", "Graduate (Master's)", "Graduate (Doctoral)", "Specialist", "Scholarly", "Pioneering".
Respond with ONLY the chosen rating string.
Text: "${text}"`;

  try {
    const response = await fetch(PROXY_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: textModelName,
        contents: prompt,
        config: { thinkingConfig: { thinkingBudget: 0 } },
      }),
    });
    if (!response.ok) throw new Error('Server error rating difficulty');
    const fullResponse: GenerateContentResponse = await response.json();
    return fullResponse.text.trim();
  } catch (error) {
    console.error('Could not rate difficulty:', error);
    throw new Error('Could not rate difficulty.');
  }
}

export async function getHistoricalFact(topic: string): Promise<string | null> {
  const prompt = `Does the topic "${topic}" relate to a specific, significant historical event?
If so, provide a single, concise sentence about what happened on this day in history related to it, and include a verifiable date.
If there is no direct, significant event, respond with the exact text "NO_EVENT".
Example response: "On this day, July 20, 1969, Apollo 11's lunar module landed on the moon."
Only respond with the sentence or "NO_EVENT".`;
  
  try {
    const response = await fetch(PROXY_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: textModelName,
        contents: prompt,
        config: { thinkingConfig: { thinkingBudget: 0 } },
      }),
    });
    if (!response.ok) throw new Error('Server error getting historical fact');
    const fullResponse: GenerateContentResponse = await response.json();
    const fact = fullResponse.text.trim();
    return fact === 'NO_EVENT' ? null : fact;
  } catch (error) {
    console.error(`Could not get historical fact for "${topic}":`, error);
    throw new Error('Could not load historical fact.');
  }
}

export async function translateText(text: string, targetLanguage: string): Promise<string> {
  if (targetLanguage === 'en') return text;
  
  const prompt = `Translate the following text into ${targetLanguage}.
Return only the translated text, with no additional commentary or formatting.
Text: "${text}"`;
  
  try {
    const response = await fetch(PROXY_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: textModelName,
        contents: prompt,
        config: { thinkingConfig: { thinkingBudget: 0 } },
      }),
    });
    if (!response.ok) throw new Error('Server error translating text');
    const fullResponse: GenerateContentResponse = await response.json();
    return fullResponse.text.trim();
  } catch (error) {
    console.error(`Could not translate text to ${targetLanguage}:`, error);
    throw new Error('Could not translate text.');
  }
}

export async function validateApiKey(): Promise<{isValid: boolean, error?: string}> {
  try {
    // This now tests connectivity to our own server, which in turn
    // is responsible for having the API key.
    const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: textModelName,
            contents: 'test',
            config: { maxOutputTokens: 1 }
        })
    });

    if (!response.ok) {
        const errorBody = await response.json().catch(() => ({ error: 'Could not connect to the backend service.' }));
        throw new Error(errorBody.error);
    }

    return { isValid: true };
  } catch (error) {
    console.error("Backend service validation failed:", error);
    let errorMessage = 'Could not connect to the Weavewiki backend service. Please check your network connection or try again later.';
    if (error instanceof Error && error.message.includes('API key is not configured')) {
        errorMessage = 'Configuration Error: The server is missing its API key.\n\nPlease contact the site administrator. The `API_KEY` must be set as a runtime environment variable in the hosting environment.';
    }
    return { isValid: false, error: errorMessage };
  }
}