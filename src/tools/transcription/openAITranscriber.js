import { appendToFile, readFile } from '../../utils/fileUtil.js';
import { transcribe } from '../../services/openai.service.js';
import { sortByTimestamp, mergeToDialogFormat } from './awsTranscriptHelper.js';

const fileId = 'call_recording_8a22ff43-93b8-4d42-9c8b-749b5f215f2f';

export async function handler() {
  //   const leftChannelUrl = `output/${fileId}/leftChannel.mp3`;
  //   const rightChannelUrl = `output/${fileId}/rightChannel.mp3`;

  //   const [leftTranscript, rightTranscript] = await Promise.all([
  //     transcribe(leftChannelUrl),
  //     transcribe(rightChannelUrl),
  //   ]);

  //   appendToFile(leftTranscript, `output/${fileId}/leftTranscript.txt`);
  //   appendToFile(rightTranscript, `output/${fileId}/rightTranscript.txt`);

  const leftTranscript = JSON.parse(
    readFile(`output/${fileId}/leftTranscript.txt`)
  );
  const rightTranscript = JSON.parse(
    readFile(`output/${fileId}/rightTranscript.txt`)
  );

  mergeOpenAITranscripts(
    leftTranscript,
    rightTranscript,
    'Christopher Cassi',
    'Jason Baumer'
  );
}

function mergeOpenAITranscripts(
  leftChannel,
  rightChannel,
  callerName,
  calleeName
) {
  const leftItems = getMappedData(leftChannel, callerName);
  const rightItems = getMappedData(rightChannel, calleeName);

  const sortedCombinedItems = sortByTimestamp([...leftItems, ...rightItems]);
  let finalTranscript = mergeToDialogFormat(sortedCombinedItems);
  appendToFile(finalTranscript, `output/${fileId}/openAI-transcript.txt`);

  console.info('-.:: Transcript Generated ::.-');
  console.debug(finalTranscript);
}

/**
 *
 * @param {*} channel - leftChannel/rightChannel
 * @param {*} name - Name of the speaker: 'Caller/Callee' OR 'John/Jake'
 * @returns
 */
const getMappedData = (channel, name) => {
  const { words } = channel;

  const result = [];

  words.forEach((segment) => {
    result.push({
      channelName: name,
      startTime: Number(segment.start),
      endTime: Number(segment.end),
      content: segment.word, //segment.text,
    });
  });

  return result;
};

handler();
