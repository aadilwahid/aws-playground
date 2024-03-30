import * as dotenv from 'dotenv';
dotenv.config();

import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3';

const s3Client = new S3Client({
  region: process.env.REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_KEY,
});

const S3_CALL_AUDIO_BUCKET = process.env.S3_CALL_AUDIO_BUCKET;

export const getAudioFileFromS3 = async (key) => {
  const command = new GetObjectCommand({
    Bucket: S3_CALL_AUDIO_BUCKET,
    Key: key,
  });

  const resp = await s3Client.send(command);
  return resp.Body;
  // Save the file data to a local file
};

export const uploadToS3Bucket = async (key, body, contentType) => {
  const command = new PutObjectCommand({
    Bucket: S3_CALL_AUDIO_BUCKET,
    Key: key,
    Body: body,
  });

  if (contentType) command.input.ContentType = contentType;

  try {
    await s3Client.send(command);
  } catch (error) {
    console.error('uploadToS3Bucket ::', error);
  }
};
