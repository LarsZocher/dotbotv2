import recorder from 'node-record-lpcm16';
import speech from '@google-cloud/speech';
import { ENCODING, SAMPLE_RATE_HZ, LANGUAGE_CODE } from './constants.js';
import Bot from './bot.js';

export default class SpeechToText {
    constructor() {
        this.config = {
            encoding: ENCODING,
            sampleRateHertz: SAMPLE_RATE_HZ,
            languageCode: LANGUAGE_CODE
        };
        this.request = {
            config: this.config,
            interimResults: false
        };
        this.client = new speech.SpeechClient();
    }

    async recordStream(callback) {
        this.isRecording = true;
        const recognizeStream = this.client
            .streamingRecognize(this.request)
            .on('error', console.error)
            .on('data', (data) => {
                if (data.results[0] && data.results[0].alternatives[0]) {
                    callback(data, data.results[0].alternatives[0].transcript);
                    this.recording.stop();
                }
            });
        this.recording = recorder.record({
            sampleRateHertz: SAMPLE_RATE_HZ,
            threshold: 0, //silence threshold
            recordProgram: 'rec',
            silence: '5.0' //seconds of silence before ending
            //device: 'default:'+parseInt(process.env.MIC_DEVICE_INDEX)
        });
        this.recording.stream().on('error', console.error).pipe(recognizeStream);
    }

    stopRecording() {
        if(!this.isRecording) return;
        this.recording.stop();
        this.isRecording = false;
    }
}
