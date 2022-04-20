import 'dotenv/config';
import HotWordDetector from './HotWordDetector.js';
import SpeechToText from './STT.js';
import SpotifyWeb from './spotify.js';
import DialogAgent from './DialogAgent.js';
import * as SiemensFood from './siemens-food.js';
import * as Siemens from './intents/siemens.js';
import TextToSpeech from './TTS.js';
import GroveKit from './GroveKit.js';

export default class Bot {
    static instance;

    static getInstance = () => {
        return Bot.instance;
    };

    isMuted = false;

    constructor() {
        Bot.instance = this;

        this.hwd = new HotWordDetector();
        this.stt = new SpeechToText();
        this.da = new DialogAgent();
        this.tts = new TextToSpeech();
        this.spotify = new SpotifyWeb();
        if(process.env.ENABLE_GROVE_KIT == "true"){
            console.log("loading grove kit");
            this.groveKit = new GroveKit();
        }

        this.registerIntents();
    }

    async registerIntents() {
        this.spotify.registerIntents();
        SiemensFood.registerIntents();
        Siemens.registerIntents();
        console.log(Object.keys(this.da.registeredIntentHandlers).length + ' Intent handlers registered');
    }

    async mute() {
        this.hwd.stop();
        this.stt.stopRecording();
    }

    async unmute() {
        this.hwd.start();
    }

    async start() {
        await this.spotify.start();

        const recordStream = () => {
            this.stt.recordStream(async (data, transcript) => {
                if(this.isMuted) return;
                console.log(data);
                console.log('STT: ', transcript);
                let result = await this.da.detectIntent(transcript);
                if (result.allRequiredParamsPresent) {
                    if (result.fulfillmentText) this.tts.synthesizeSpeech(result.fulfillmentText);
                    this.hwd.start();
                } else {
                    if (result.fulfillmentText) await this.tts.synthesizeSpeech(result.fulfillmentText);
                    recordStream();
                }
                this.da.handleIntent(result);
            });
        };

        this.hwd.onDetected((index) => {
            console.log(index);
            this.hwd.stop();
            recordStream();
        });

        this.hwd.start();

        this.groveKit.setLED(true);
        setTimeout(()=>this.groveKit.setLED(false), 500);
        setTimeout(()=>this.groveKit.setLED(true), 1000);
        setTimeout(()=>this.groveKit.setLED(false), 1500);
    }
}

if(!Bot.getInstance()) {
    const bot = new Bot();
    bot.start();
}