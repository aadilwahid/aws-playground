import * as dotenv from 'dotenv';
dotenv.config();

import {
  BedrockRuntimeClient,
  InvokeModelCommand,
  // InvokeModelWithResponseStreamCommand
} from '@aws-sdk/client-bedrock-runtime';

const modelId = 'amazon.titan-text-express-v1';
const instructions = 'Provide a summary and next steps if there are any.';

const client = new BedrockRuntimeClient({
  region: 'us-west-2',
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_KEY,
});

//https://github.com/Depaa/amazon-bedrock-nodejs/blob/main/javascript/utils/client-bedrock-runtime.js

export const generateSummary = async (transcript) => {
  try {
    const command = new InvokeModelCommand({
      modelId,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify({
        inputText: `${instructions}\n${transcript}`,
        // textGenerationConfig: {
        //   maxTokenCount: 300,
        //   stopSequences: [],
        //   temperature: 0,
        //   topP: 0.9,
        // },
      }),
    });

    const res = await client.send(command);
    console.debug('Successfully invoke model');
    console.debug(res);

    const jsonString = new TextDecoder().decode(res.body);
    const modelRes = JSON.parse(jsonString);

    console.debug('modelRes ::', modelRes);
  } catch (error) {
    console.error(error);
  }
};
