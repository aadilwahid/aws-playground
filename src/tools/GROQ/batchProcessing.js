import fs from 'fs';
import {
  appendToFile,
  saveAudioFile,
  readJsonlFile,
  writeToJSONLFile,
} from '../../utils/fileUtil.js';
import {
  getPreSignedUrl,
  uploadToS3Bucket,
  getAudioFileFromS3,
} from '../../services/s3.service.js';
import {
  getBatchStatus,
  createBatchJob,
  retrieveBatchResults,
  uploadBatchJSONLFileToGroq,
} from '../../services/groq.service.js';
import { splitChannels } from '../../utils/ffmpeg.js';

const S3_CALL_AUDIO_BUCKET = process.env.S3_CALL_AUDIO_BUCKET;

export async function handler(fileId, accountId, interactionId) {
  const directory = `output/${fileId}-${interactionId}`;
  const outputFileLeft = `${directory}/leftChannel.mp3`;
  const outputFileRight = `${directory}/rightChannel.mp3`;
  const s3RootDirectory = `accounts/${accountId}/${interactionId}`;

  const outputFilePath = `${directory}/batchResults.jsonl`;
  const callerName = 'CHRISTOPHER CASSI';
  const calleeName = 'JASON BAUMER';

  /**
   * [1]. Get Audio file from S3 and save it to local directory
   */
  // const inputFileName = await downloadCallRecording(
  //   directory,
  //   fileId,
  //   s3RootDirectory
  // );

  /**
   * [2]. Split the Call Recording into Left, Right mono channels.
   */
  // await splitChannels(inputFileName, outputFileLeft, outputFileRight);

  /**
   * [3]. Upload Left and Right mono channels to S3.
   */
  // const { leftChannelKey, rightChannelKey } = await uploadMonoChannels(
  //   s3RootDirectory,
  //   outputFileLeft,
  //   outputFileRight
  // );

  const jsonLFilePath = `${directory}/batchJob.jsonl`;

  /**
   * [4]. build jsonL file
   */
  await buildJSONLFile(
    jsonLFilePath,
    interactionId,
    `${s3RootDirectory}/leftChannel.mp3`, //leftChannelKey,
    `${s3RootDirectory}/rightChannel.mp3` //rightChannelKey
  );

  /**
   * [5]. upload jsonL file to GROQ server
   */
  const groqFileObject = await uploadBatchJSONLFileToGroq(jsonLFilePath);

  /**
   * [6]. create batch job
   */
  const batchObject = await createBatchJob(groqFileObject.id);

  /**
   * [5]. Get Transcription Data.
   */
  await getTranscripts(batchObject.id, outputFilePath);

  /**
   * [6]. Generate Transcription
   */
  await prepareTranscript(
    outputFilePath,
    interactionId,
    callerName,
    calleeName
  );
}

/**
 * Downloads the file from s3.
 */
async function downloadCallRecording(localDirectory, fileId, s3RootDirectory) {
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

async function getTranscripts(batchId, outputFilePath) {
  let batchRetrieveResp;
  let pollingCount = 0;
  const allowedStatuses = ['validating', 'in_progress', 'finalizing'];

  do {
    await sleep(10000);
    batchRetrieveResp = await getBatchStatus(batchId, pollingCount);
  } while (
    batchRetrieveResp.status !== 'completed' &&
    allowedStatuses.includes(batchRetrieveResp.status) &&
    ++pollingCount < 100
  );

  if (batchRetrieveResp.output_file_id) {
    await retrieveBatchResults(
      batchRetrieveResp.output_file_id,
      outputFilePath
    );

    console.info('5- Transcriptions fetched');
  } else if (batchRetrieveResp.error_file_id) {
    await retrieveBatchResults(batchRetrieveResp.error_file_id, outputFilePath);
    console.error(`5- Error fetching batch results`);
  }
}

async function buildJSONLFile(
  filePath,
  interactionId,
  leftChannelKey,
  rightChannelKey
) {
  const [leftPreSignedURL, rightPreSignedURL] = await Promise.all([
    getPreSignedUrl(leftChannelKey),
    getPreSignedUrl(rightChannelKey),
  ]);

  console.log(`left-pre-signed :: ${leftPreSignedURL}\n`);
  console.log(`right-pre-signed :: ${rightPreSignedURL}\n`);

  const jsonlContent =
    [
      JSON.stringify(
        buildJSONLine(interactionId, 'leftChannel', leftPreSignedURL)
      ),
      JSON.stringify(
        buildJSONLine(interactionId, 'rightChannel', rightPreSignedURL)
      ),
    ].join('\n') + '\n';

  await writeToJSONLFile(jsonlContent, filePath);
}

const buildJSONLine = (interactionId, channelName, url) => ({
  custom_id: `${channelName}-${interactionId}`,
  method: 'POST',
  url: '/v1/audio/transcriptions',
  body: {
    model: 'whisper-large-v3',
    // language: 'en',
    url,
    response_format: 'verbose_json',
    timestamp_granularities: ['word'],
  },
});

const prepareTranscript = async (
  outputFilePath,
  interactionId,
  callerName,
  calleeName
) => {
  const channels = await readJsonlFile(outputFilePath);

  console.log(`total channels :: `, channels.length);
  if (channels?.length < 2) {
    console.warn(`failed to read results jsonl file`);
    return;
  }

  const leftCustomId = `leftChannel-testing-transcribe-1`; //`leftChannel_${interactionId}`;
  const rightCustomId = `rightChannel-testing-transcribe-1`; //`rightChannel_${interactionId}`;

  const leftChannelData = channels.find((c) => c.custom_id === leftCustomId);
  const rightChannelData = channels.find((c) => c.custom_id === rightCustomId);

  const leftItems = getMappedData(leftChannelData, callerName);
  const rightItems = getMappedData(rightChannelData, calleeName);

  const sortedCombinedItems = sortByTimestamp([...leftItems, ...rightItems]);
  const finalTranscript = mergeToDialogFormat(sortedCombinedItems);
  appendToFile(
    finalTranscript,
    `output/callRecording-testing-transcribe/final-transcript.txt`
  );
};

const getMappedData = (channel, name) => {
  const words = channel.response.body.words;

  const result = [];
  let currentEntry = {};

  words.forEach((word) => {
    if (currentEntry.startTime) {
      result.push(currentEntry);
      currentEntry = {};
    }

    currentEntry.channelName = name;
    currentEntry.startTime = Number(word.start);
    currentEntry.endTime = Number(word.end);
    currentEntry.content = word.word;
  });

  // Push the last entry to result array
  if (Object.keys(currentEntry).length !== 0) {
    result.push(currentEntry);
  }

  return result;
};

const getMappedDataSegments = (channel, name) => {
  const segments = channel.response.body.segments;

  const result = [];
  let currentEntry = {};

  segments.forEach((segment) => {
    if (currentEntry.startTime) {
      result.push(currentEntry);
      currentEntry = {};
    }

    currentEntry.channelName = name;
    currentEntry.startTime = Number(segment.start);
    currentEntry.endTime = Number(segment.end);
    currentEntry.content = segment.text;
  });

  // Push the last entry to result array
  if (Object.keys(currentEntry).length !== 0) {
    result.push(currentEntry);
  }

  return result;
};

function mergeToDialogFormat(arr) {
  let dialog = '';
  arr.forEach((obj, index) => {
    if (index === 0 || arr[index].channelName !== arr[index - 1].channelName) {
      dialog += '\n\n' + obj.channelName.toUpperCase() + ': ';
    }
    dialog += obj.content + ' ';
  });
  return dialog.trim();
}

const sortByTimestamp = (arr) => arr.sort((a, b) => a.endTime - b.endTime);

const sleep = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms || DEF_DELAY));
