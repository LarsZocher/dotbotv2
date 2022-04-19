import speech from '@google-cloud/text-to-speech';
import player from 'node-wav-player';
import fs from 'fs';
import util from 'util';
import { LANGUAGE_CODE } from './constants.js';

export default class TextToSpeech {
    constructor() {
        this.client = new speech.TextToSpeechClient();
    }

    async synthesizeSpeech(text) {
        const input = { text };
        const voiceSelection = {
            languageCode: LANGUAGE_CODE,
            name: 'de-DE-Wavenet-F'
        };
        const audioConfigSelection = { audioEncoding: 'LINEAR16' };
        const request = { input, voice: voiceSelection, audioConfig: audioConfigSelection };
        const [response] = await this.client.synthesizeSpeech(request);
        const writeFile = util.promisify(fs.writeFile);
        await writeFile('./speech.wav', response.audioContent, 'binary');
        console.log(`Audio content written to file: speech.wav`);

        await player.play({path: './speech.wav', sync: true});
        console.log(`Audio content played`);
    }
}