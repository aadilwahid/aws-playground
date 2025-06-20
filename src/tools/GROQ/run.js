// import { handler } from './batchProcessing.js';
import { handler } from './speechToText.js';

const fileId = 'callRecording';
const accountId = '6797b23aa5f1fec03842a77822b66b02';
const interactionId = 'testing-transcribe';

handler(fileId, accountId, interactionId);
