import {
  listTranscriptionJobs,
  deleteTranscriptionJob,
} from '../../services/transcribe.service.js';

const run = async () => {
  const transcriptions = await listTranscriptionJobs();
  console.log(`Total Transcriptions ::`, transcriptions.length);

  console.debug(transcriptions[0]);
  const dateNow = new Date();
  dateNow.setDate(28);

  //   const promise = [];
  for (const transcription of transcriptions) {
    if (transcription.CompletionTime <= dateNow) {
      await deleteTranscriptionJob(transcription.TranscriptionJobName);
      console.log(transcriptions.indexOf(transcription), `DONE`);
    }
  }

  //   await Promise.allSettled(promise);
};

run();
