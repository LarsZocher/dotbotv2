import 'dotenv/config';
import HotWordDetector from './HotWordDetector.js';
import SpeechToText from './STT.js';
import SpotifyWeb from './spotify.js';
import DialogAgent from './DialogAgent.js';

let hwd = new HotWordDetector();
let stt = new SpeechToText();
let da = new DialogAgent();
let spotify = new SpotifyWeb(da);

(async () => {
    await spotify.start();

    hwd.onDetected((index) => {
        console.log(index);
        hwd.stop();
        stt.recordStream(async(data, transcript) => {
            console.log(data);
            console.log('STT: ', transcript);
            let result = await da.detectIntent(transcript);
            da.handleIntent(result);
            hwd.start();
        });
    });

    hwd.start();
})();
