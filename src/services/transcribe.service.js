import * as dotenv from 'dotenv';
dotenv.config();

import {
  TranscribeClient,
  GetTranscriptionJobCommand,
  StartTranscriptionJobCommand,
  DeleteTranscriptionJobCommand,
} from '@aws-sdk/client-transcribe';

const transcribeClient = new TranscribeClient({
  region: process.env.REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_KEY,
});

export const startTranscriptionJob = async (jobName, fileUrl) => {
  try {
    const command = new StartTranscriptionJobCommand({
      TranscriptionJobName: jobName,
      Media: {
        MediaFileUri: fileUrl,
      },
      IdentifyMultipleLanguages: true,
    });

    const { TranscriptionJob } = await transcribeClient.send(command);

    return TranscriptionJob?.TranscriptionJobName;
  } catch (error) {
    console.error('startTranscriptionJob ::', error);
  }
};

export const getTranscriptionJob = async (jobName) => {
  try {
    const resp = await transcribeClient.send(
      new GetTranscriptionJobCommand({ TranscriptionJobName: jobName })
    );

    return resp?.TranscriptionJob;
  } catch (error) {
    console.error('getTranscriptionJob ::', error);
  }
};

export const deleteTranscriptionJob = async (jobName) => {
  try {
    await transcribeClient.send(
      new DeleteTranscriptionJobCommand({ TranscriptionJobName: jobName })
    );
  } catch (error) {
    console.error('deleteTranscriptionJob ::', error);
  }
};
