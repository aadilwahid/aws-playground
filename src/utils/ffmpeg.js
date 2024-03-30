import { spawn } from 'child_process';

export const splitChannels = async (
  inputFile,
  outputFileLeft,
  outputFileRight
) => {
  const ffmpegCommand = [
    '-i',
    inputFile,
    '-filter_complex',
    '[0:0]channelsplit=channel_layout=stereo[left][right]',
    '-map',
    '[left]',
    outputFileLeft,
    '-map',
    '[right]',
    outputFileRight,
  ];

  await new Promise((resolve, reject) => {
    const ffmpeg = spawn('ffmpeg', ffmpegCommand);
    ffmpeg.on('close', (code) => {
      if (code === 0) {
        resolve(true);
      } else {
        reject(new Error(`FFmpeg process exited with code ${code}`));
      }
    });
  });

  console.info('2- Channels splitted successfully');
};
