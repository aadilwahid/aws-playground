import fs, { createReadStream } from 'fs';
import { Readable } from 'stream';
import { createInterface } from 'readline';

export const appendToFile = (data, filename) => {
  return fs.appendFileSync(filename, JSON.stringify(data));
};

export const readFile = (fileName) => {
  return fs.readFileSync(fileName, 'utf8');
};

export function getFileNamesInDirectory(directoryPath) {
  return new Promise((resolve, reject) => {
    fs.readdir(directoryPath, (err, files) => {
      if (err) {
        reject(err);
        return;
      }

      resolve(files);
    });
  });
}

export async function saveAudioFile(directory, fileName, fileData) {
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }

  const fileStream = Readable.from(fileData);
  const localFileStream = fs.createWriteStream(`${directory}/${fileName}`);

  fileStream.pipe(localFileStream);

  return new Promise((resolve, reject) => {
    localFileStream.on('finish', resolve);
    localFileStream.on('error', reject);
  });
}

export const writeToJSONLFile = (data, filePath) =>
  fs.promises.writeFile(filePath, data);

export async function readJsonlFile(filePath) {
  const fileStream = createReadStream(filePath);
  const rl = createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  const results = [];
  for await (const line of rl) {
    if (line.trim()) {
      results.push(JSON.parse(line));
    }
  }
  return results;
}
