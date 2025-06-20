import { appendToFile } from '../../utils/fileUtil.js';

export function generateTranscript(
  fileId,
  leftChannel,
  rightChannel,
  callerName,
  calleeName
) {
  const leftItems = getMappedData(leftChannel, callerName);
  const rightItems = getMappedData(rightChannel, calleeName);
  const sortedCombinedItems = sortByTimestamp([...leftItems, ...rightItems]);

  let finalTranscript = mergeToDialogFormat(sortedCombinedItems);
  appendToFile(finalTranscript, `output/${fileId}/transcript.txt`);

  console.info('-.:: Transcript Generated ::.-');
  console.debug(finalTranscript);

  //   appendToFile(leftItems, "docs/leftItems.txt");
  //   appendToFile(rightItems, "docs/rightItems.txt");
}

/**
 *
 * @param {*} channel - leftChannel/rightChannel
 * @param {*} name - Name of the speaker: 'Caller/Callee' OR 'John/Jake'
 * @returns
 */
const getMappedData = (channel, name) => {
  const words = channel.results.items;

  const result = [];
  let currentEntry = {};

  words.forEach((word) => {
    if (word.type === 'punctuation') {
      // Append punctuation to the previous entry's content
      if (currentEntry.content) {
        currentEntry.content += word.alternatives[0].content;
      }
    } else {
      if (currentEntry.startTime) {
        result.push(currentEntry);
        currentEntry = {};
      }

      currentEntry.channelName = name;
      currentEntry.startTime = Number(word.start_time);
      currentEntry.endTime = Number(word.end_time);
      currentEntry.content = word.alternatives[0].content;
    }
  });

  // Push the last entry to result arrayAdd commentMore actions
  if (Object.keys(currentEntry).length !== 0) {
    result.push(currentEntry);
  }

  return result;
};

const sortByTimestamp = (arr) => arr.sort((a, b) => a.endTime - b.endTime);

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
