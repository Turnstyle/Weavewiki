/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

// Fix: Use ES module import for Express to resolve type errors when targeting ECMAScript modules.
import express, { Request, Response } from 'express';
import path from 'path';
import { GoogleGenAI, GenerateContentResponse } from '@google/genai';

const app = express();
const port = process.env.PORT || 8080;

app.use(express.json());

// API Proxy Route
app.post('/api/generate', async (req: Request, res: Response) => {
  const { model, contents, config, stream } = req.body;

  if (!process.env.API_KEY) {
    return res.status(500).json({ error: 'API key is not configured on the server.' });
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    if (stream) {
      const responseStream = await ai.models.generateContentStream({
        model,
        contents,
        config,
      });
      
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      for await (const chunk of responseStream) {
        if (chunk.text) {
          res.write(chunk.text);
        }
      }
      res.end();

    } else {
      const response: GenerateContentResponse = await ai.models.generateContent({
        model,
        contents,
        config,
      });
      res.json(response);
    }
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    res.status(500).json({ error: `Failed to generate content from the AI service: ${errorMessage}` });
  }
});

// Determine the correct path to the 'dist' directory.
// __dirname is not available in ES modules, so we use an alternative.
// However, since tsconfig.server.json compiles to CommonJS, __dirname will be available.
const currentModuleDir = __dirname;
const distPath = path.join(currentModuleDir, '..', 'dist');

// Serve static files from the React app
app.use(express.static(distPath));

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get('*', (req: Request, res: Response) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});