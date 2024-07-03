Had a situation where audio calls needed to be transcribed.
We could have used the AWS Transcribe service with Speaker Diarization, which splits the speakers perfectly. But It labels them as Speaker 1, and Speaker 2.

The requirement was to label them by specific names. We knew the Caller's and Callee's Names.
We split the left and right channels of the Call audio, the left channel is always the Caller and the right channel is always the Callee. After splitting the left and right channels, we transcribe each of them, sort both channels' transcriptions by timestamp, and merge both transcriptions.
