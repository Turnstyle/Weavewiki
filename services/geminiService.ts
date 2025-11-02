/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import {GoogleGenAI, Type} from '@google/genai';

// In a client-side browser environment proxied by a service like aistudio/applet-proxy,
// the API key is injected by the proxy on the server-side. However, the GenAI SDK
// requires a non-empty API key string in its constructor for client-side validation.
// We provide a placeholder value which will be replaced by the proxy.
const ai = new GoogleGenAI({apiKey: 'placeholder'});

const artModelName = 'gemini-2.5-flash';
const textModelName = 'gemini-flash-lite-latest';

export interface AsciiArtData {
  art: string;
}

export interface AnimatedAsciiArtData {
  frames: string[];
}

export async function* streamDefinition(
  topic: string,
): AsyncGenerator<string, void, undefined> {
  const prompt = `Provide a concise, single-paragraph encyclopedia-style definition for the term: "${topic}". Be informative and neutral. Do not use markdown, titles, or any special formatting. Respond with only the text of the definition itself.`;

  try {
    const response = await ai.models.generateContentStream({
      model: textModelName,
      contents: prompt,
      config: { thinkingConfig: { thinkingBudget: 0 } },
    });

    for await (const chunk of response) {
      if (chunk.text) {
        yield chunk.text;
      }
    }
  } catch (error) {
    console.error('Error streaming from Gemini:', error);
    const errorMessage = `Could not generate content for "${topic}".`;
    yield `Error: ${errorMessage}`;
    throw new Error(errorMessage);
  }
}

export async function generateAsciiArt(topic: string): Promise<AsciiArtData> {
  const prompt = `Generate an ASCII art visualization for the topic "${topic}". The visualization's form should embody the word's essence. Use this character palette: │─┌┐└┘├┤┬┴┼►◄▲▼○●◐◑░▒▓█▀▄■□▪▫★☆♦♠♣♥⟨⟩/\\_|.`;

  try {
    const response = await ai.models.generateContent({
      model: artModelName,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        thinkingConfig: { thinkingBudget: 0 },
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            art: {
              type: Type.STRING,
              description: 'A string containing the ASCII art visualization.'
            }
          },
          required: ['art']
        }
      },
    });
    const text = response.text.trim();
    if (!text) throw new Error('API returned an empty response.');
    const parsedData = JSON.parse(text);
    if (typeof parsedData?.art !== 'string' || parsedData.art.trim().length === 0) {
      throw new Error('Invalid or empty ASCII art in response');
    }
    return parsedData as AsciiArtData;
  } catch (error) {
    console.error(`Could not generate ASCII art for "${topic}":`, error);
    throw new Error('Could not load art.');
  }
}

export async function generateAnimatedAsciiArt(topic: string): Promise<AnimatedAsciiArtData> {
    const prompt = `Generate a 3-frame ASCII art animation about "${topic}". Use this character palette: │─┌┐└┘├┤┬┴┼►◄▲▼○●◐◑░▒▓█▀▄■□▪▫★☆♦♠♣♥⟨⟩/\\_|.`;
  
  try {
    const response = await ai.models.generateContent({
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
    const text = response.text.trim();
    if (!text) throw new Error('API returned an empty response.');
    const parsedData = JSON.parse(text);
    if (!Array.isArray(parsedData?.frames) || parsedData.frames.length === 0 || !parsedData.frames.every((f: unknown) => typeof f === 'string')) {
      throw new Error('Invalid or empty frames array in response');
    }
    return parsedData as AnimatedAsciiArtData;
  } catch (error) {
    console.error(`Could not generate animated ASCII art for "${topic}":`, error);
    throw new Error('Could not load animation.');
  }
}

export async function getRelatedTopics(topic: string): Promise<string[]> {
  const prompt = `Given the topic "${topic}", suggest 4 tangentially related but interesting concepts for further exploration. For example, for 'Photosynthesis', you might return ["Chlorophyll", "Cellular Respiration", "Carbon Cycle", "Stomata"].`;

  try {
    const response = await ai.models.generateContent({
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
    const text = response.text.trim();
    if (!text) throw new Error('API returned an empty response.');
    const parsedData = JSON.parse(text);
    if (!Array.isArray(parsedData) || !parsedData.every((t: unknown) => typeof t === 'string')) {
      throw new Error('Response was not a JSON array of strings.');
    }
    return (parsedData as string[]).slice(0, 4);
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
    const response = await ai.models.generateContent({
      model: textModelName,
      contents: prompt,
      config: { thinkingConfig: { thinkingBudget: 0 } },
    });
    return response.text.trim();
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
    const response = await ai.models.generateContent({
      model: textModelName,
      contents: prompt,
      config: { thinkingConfig: { thinkingBudget: 0 } },
    });
    const fact = response.text.trim();
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
    const response = await ai.models.generateContent({
      model: textModelName,
      contents: prompt,
      config: { thinkingConfig: { thinkingBudget: 0 } },
    });
    return response.text.trim();
  } catch (error) {
    console.error(`Could not translate text to ${targetLanguage}:`, error);
    throw new Error('Could not translate text.');
  }
}

export async function validateApiKey(): Promise<{isValid: boolean, error?: string}> {
  try {
    // Perform a lightweight, inexpensive API call to verify the key is being
    // injected correctly by the Cloud Run proxy.
    await ai.models.generateContent({
        model: textModelName,
        contents: 'test',
        config: { maxOutputTokens: 1 } // Ensure minimal processing
    });
    return { isValid: true };
  } catch (error) {
    console.error("API Key validation failed:", error);
    let errorMessage = 'Could not connect to the AI service. The service may be temporarily unavailable.';
    if (error instanceof Error) {
        const lowerCaseMessage = error.message.toLowerCase();
        // Check for specific error messages that indicate a configuration problem.
        if (lowerCaseMessage.includes('api key') || 
            lowerCaseMessage.includes('permission denied') ||
            lowerCaseMessage.includes('authentication')) {
            errorMessage = 'The application is not configured correctly. For administrators: please verify that the `API_KEY` environment variable is set correctly in your Cloud Run deployment settings and that the key is enabled for the Generative Language API.';
        }
    }
    return { isValid: false, error: errorMessage };
  }
}