import * as dotenv from 'dotenv';
dotenv.config();

import fs from 'fs';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const generateSummary = async (transcript) => {
  const content = `Provide a summary and next steps if there are any for the following transcript of the call.\n${transcript}`;

  const resp = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content }],
    temperature: 0.5,
    max_tokens: 1024,
  });

  console.debug('DEBUG ::', JSON.stringify(resp, null, 2));
};

export async function transcribe(fileUrl) {
  const resp = await openai.audio.transcriptions.create({
    file: fs.createReadStream(fileUrl),
    model: 'whisper-1',
    response_format: 'verbose_json',
    timestamp_granularities: ['word'],
  });

  return resp;
}
