import fs from 'fs';
import {
  uploadToS3Bucket,
  getAudioFileFromS3,
} from '../../services/s3.service.js';
import {
  deleteTranscriptionJob,
  getTranscriptionJob,
  startTranscriptionJob,
} from '../../services/transcribe.service.js';
import { splitChannels } from '../../utils/ffmpeg.js';
import { generateTranscript } from './transcriptHelper.js';
import { appendToFile, saveAudioFile } from '../../utils/fileUtil.js';

const S3_CALL_AUDIO_BUCKET = process.env.S3_CALL_AUDIO_BUCKET;

export async function handler(fileId, accountId, interactionId) {
  const outputFileLeft = `output/${fileId}/leftChannel.mp3`;
  const outputFileRight = `output/${fileId}/rightChannel.mp3`;
  const s3RootDirectory = `accounts/${accountId}/${interactionId}`;

  /**
   * 1- Get Audio file from S3 and save it to local directory
   */
  const inputFileName = await downloadCallRecording(fileId, s3RootDirectory);

  /**
   * 2- Split the Call Recording into Left, Right mono channels.
   */
  await splitChannels(inputFileName, outputFileLeft, outputFileRight);

  /**
   * 3- Upload Left and Right mono channels to S3.
   */
  const { leftChannelKey, rightChannelKey } = await uploadMonoChannels(
    s3RootDirectory,
    outputFileLeft,
    outputFileRight
  );

  /**
   * 4- Start Transcription Job for Left, Right mono channels.
   */
  await transcribeMonoChannels(interactionId, leftChannelKey, rightChannelKey);

  /**
   * 5- Get Transcription Data.
   */
  const { leftTranscript, rightTranscript } = await getTranscripts(
    interactionId,
    fileId
  );

  /**
   * 6- Generate Transcription
   */
  if (leftTranscript && rightTranscript) {
    generateTranscript(
      fileId,
      leftTranscript,
      rightTranscript,
      'Reed Shepherd',
      'Corvum Help Desk'
    );

    await deleteTranscriptionJobs(interactionId);
  }
}

/**
 * Downloads the file from s3.
 */
async function downloadCallRecording(fileId, s3RootDirectory) {
  const localDirectory = `output/${fileId}`;

  const fileName = `${fileId}.mp3`;
  const s3FileKey = `${s3RootDirectory}/${fileName}`;

  const fileData = await getAudioFileFromS3(s3FileKey);

  await saveAudioFile(localDirectory, fileName, fileData);

  console.info('1- Call Audio downloaded successfully');
  return `${localDirectory}/${fileName}`;
}

/**
 * Upload the left and right mono channels
 * to the same S3 directory from which the
 * original call audio file was downloaded
 */
async function uploadMonoChannels(
  s3RootDirectory,
  outputFileLeft,
  outputFileRight
) {
  const leftChannelKey = `${s3RootDirectory}/leftChannel.mp3`;
  const leftFileData = fs.readFileSync(outputFileLeft);
  await uploadToS3Bucket(leftChannelKey, leftFileData, 'audio/mpeg');

  const rightChannelKey = `${s3RootDirectory}/rightChannel.mp3`;
  const rightFileData = fs.readFileSync(outputFileRight);
  await uploadToS3Bucket(rightChannelKey, rightFileData, 'audio/mpeg');

  console.info('3- Uploaded Mono channels successfully.');

  return { leftChannelKey, rightChannelKey };
}

/**
 * Start transcription of the left and right mono channels.
 */
async function transcribeMonoChannels(
  interactionId,
  leftChannelKey,
  rightChannelKey
) {
  const leftFileUrl = `s3://${S3_CALL_AUDIO_BUCKET}/${leftChannelKey}`;
  const rightFileUrl = `s3://${S3_CALL_AUDIO_BUCKET}/${rightChannelKey}`;

  await Promise.all([
    startTranscriptionJob(`leftChannel_${interactionId}`, leftFileUrl),
    startTranscriptionJob(`rightChannel_${interactionId}`, rightFileUrl),
  ]);

  console.info('4- Transcription Started ::');
}

function deleteTranscriptionJobs(interactionId) {
  return Promise.all([
    deleteTranscriptionJob(`leftChannel_${interactionId}`),
    deleteTranscriptionJob(`rightChannel_${interactionId}`),
  ]);
}

async function getTranscripts(interactionId, fileId) {
  console.info('waiting for 50 seconds, before fetching transcripts');
  await sleep(50000);

  const leftJobName = `leftChannel_${interactionId}`;
  const rightJobName = `rightChannel_${interactionId}`;

  let leftChannelTranscriptUrl = '';
  let rightChannelTranscriptUrl = '';

  do {
    const [leftTranscribeJob, rightTranscribeJob] = await Promise.all([
      getTranscriptionJob(leftJobName),
      getTranscriptionJob(rightJobName),
    ]);

    const leftJobStatus = leftTranscribeJob.TranscriptionJobStatus;
    const rightJobStatus = rightTranscribeJob.TranscriptionJobStatus;

    if (leftJobStatus === 'IN_PROGRESS' || rightJobStatus === 'IN_PROGRESS') {
      console.warn('-- Transcription is still in progress');
      await sleep(10000);
      continue;
    }

    if (leftJobStatus === 'FAILED' || rightJobStatus === 'FAILED') {
      console.warn('-- Transcription failed.');
      break;
    }

    leftChannelTranscriptUrl = leftTranscribeJob.Transcript.TranscriptFileUri;
    rightChannelTranscriptUrl = rightTranscribeJob.Transcript.TranscriptFileUri;
  } while (!leftChannelTranscriptUrl || !rightChannelTranscriptUrl);

  if (!leftChannelTranscriptUrl || !rightChannelTranscriptUrl) return;

  const [leftTranscript, rightTranscript] = await Promise.all([
    await downloadTranscript(
      leftChannelTranscriptUrl,
      `output/${fileId}`,
      'leftChannel'
    ),
    await downloadTranscript(
      rightChannelTranscriptUrl,
      `output/${fileId}`,
      'rightChannel'
    ),
  ]);

  console.info('5- Transcriptions fetched');

  return { leftTranscript, rightTranscript };
}

async function downloadTranscript(transcriptFileUrl, localDirectory, jobName) {
  const resp = await fetch(transcriptFileUrl);
  const respJson = await resp.json();

  appendToFile(respJson, `${localDirectory}/${jobName}.txt`);

  return respJson;
}

export const sleep = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms || DEF_DELAY));
