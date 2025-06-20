import * as dotenv from 'dotenv';
dotenv.config();

import fs from 'fs';
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function uploadBatchJSONLFileToGroq(filePath) {
  console.info(`uploading file to GROQ SERVER ::`, filePath);
  const response = await groq.files.create({
    purpose: 'batch',
    file: fs.createReadStream(filePath),
  });

  console.log(`uploadBatchJSONLFileToGroq ::`, response);
  return response;
}

export async function createBatchJob(inputFileId) {
  const response = await groq.batches.create({
    completion_window: '24h',
    endpoint: '/v1/audio/transcriptions',
    input_file_id: inputFileId,
  });
  console.log(`createBatchJob ::`, response);
  return response;
}

export async function getBatchStatus(batchId, pollingCount) {
  const response = await groq.batches.retrieve(batchId);
  console.log(
    `getBatchStatus[${pollingCount}] ::`,
    JSON.stringify(response, null, 2)
  );
  return response;
}

export async function retrieveBatchResults(fileId, outputFilePath) {
  const response = await groq.files.content(fileId);
  fs.writeFileSync(outputFilePath, await response.text());
}

export async function transcribe(url) {
  const transcription = await groq.audio.transcriptions.create({
    url,
    model: 'whisper-large-v3-turbo',
    response_format: 'verbose_json',
    timestamp_granularities: ['word'],
    // language: 'en', // Optional
    // temperature: 0.0, // Optional
  });

  // console.log(JSON.stringify(transcription, null, 2));
  return transcription;
}
