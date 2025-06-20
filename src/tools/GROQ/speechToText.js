import { transcribe } from '../../services/groq.service.js';
import { getPreSignedUrl } from '../../services/s3.service.js';
import { appendToFile } from '../../utils/fileUtil.js';

export async function handler(fileId, accountId, interactionId) {
  const directory = `output/${fileId}-${interactionId}`;
  const outputFileLeft = `${directory}/leftChannel.mp3`;
  const outputFileRight = `${directory}/rightChannel.mp3`;
  const s3RootDirectory = `accounts/${accountId}/${interactionId}`;

  const outputFilePath = `${directory}/batchResults.jsonl`;
  const callerName = 'CHRISTOPHER CASSI';
  const calleeName = 'JASON BAUMER';

  const [leftPreSignedURL, rightPreSignedURL] = await Promise.all([
    getPreSignedUrl(`${s3RootDirectory}/leftChannel.mp3`),
    getPreSignedUrl(`${s3RootDirectory}/rightChannel.mp3`),
  ]);

  console.log(`left :: ${leftPreSignedURL}\n`);
  console.log(`right :: ${rightPreSignedURL}\n`);

  const [leftTranscription, rightTranscription] = await Promise.all([
    transcribe(leftPreSignedURL),
    transcribe(rightPreSignedURL),
  ]);

  appendToFile(leftTranscription, `${directory}/leftTranscriptResp.txt`);
  appendToFile(rightTranscription, `${directory}/rightTranscriptResp.txt`);

  //   /**
  //    * [6]. Generate Transcription
  //    */
  //   await prepareTranscript(
  //     outputFilePath,
  //     interactionId,
  //     callerName,
  //     calleeName
  //   );
}
