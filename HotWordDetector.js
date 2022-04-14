import * as Porcupine from '@picovoice/porcupine-node';
import { PICOVOICE_ACCESS_KEY } from './constants.js';
import PvRecorder from '@picovoice/pvrecorder-node';
import 'dotenv/config'

const { ALEXA, BUMBLEBEE } = Porcupine.BuiltinKeyword;

export default class HotWordDetector {
    record = false;

    constructor() {
        const devices = PvRecorder.getAudioDevices();
        console.log(`Available devices:`);
        for (let i = 0; i < devices.length; i++) {
            console.log(`index: ${i}, device name: ${devices[i]}`);
        }
        this.handle = new Porcupine.Porcupine(PICOVOICE_ACCESS_KEY, [ALEXA, BUMBLEBEE], [0.5, 0.65]);
        this.recorder = new PvRecorder(parseInt(process.env.MIC_DEVICE_INDEX), this.handle.frameLength);
    }

    async start() {
        this.record = true;

        console.log(`Started HotWord Detection, device: ${this.recorder.getSelectedDevice()}`);
        this.recorder.start();

        while (this.record) {
            const pcm = await this.recorder.read();
            const keywordIndex = this.handle.process(pcm);
            if(keywordIndex !== -1) {
                this.callback(keywordIndex);
            }
        }
    }

    onDetected(callback) {
        this.callback = callback;
    }

    stop() {
        this.record = false;
        this.recorder.stop();
        console.log("Stopped HotWord Detection");
    }
}