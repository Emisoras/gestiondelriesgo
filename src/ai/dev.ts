import { config } from 'dotenv';
config();

import { next } from '@genkit-ai/next';
import { dev } from 'genkit/dev';

import '@/ai/flows/generate-impact-statement.ts';

dev({
  plugins: [
    next({
      cmd: 'dev',
    }),
  ],
});
