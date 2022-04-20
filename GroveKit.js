import gpio from "rpi-gpio";
import {GrovePi} from 'grovepi';
import Bot from './bot.js'

var Commands = GrovePi.commands
const Board = GrovePi.board
const DigitalButtonSensor = GrovePi.sensors.DigitalButton
const DigitalOutput = GrovePi.sensors.DigitalOutput

const PIN_LED = 7;
const PIN_BUTTON = 11;

export default class GroveKit {
    constructor() {
        let instance = this;

        gpio.setup(PIN_LED, gpio.DIR_OUT, (err) => {
            if (err) throw err;
        })

        gpio.on('change', function(channel, value) {
            if(channel == PIN_BUTTON && value){
                Bot.getInstance().isMuted = !Bot.getInstance().isMuted;
                let muted = Bot.getInstance().isMuted;
                instance.setLED(muted);
                if(muted){
                    Bot.getInstance().mute();
                    console.log("Muted!");
                }else{
                    Bot.getInstance().unmute();
                    console.log("Unmuted!");
                }
            }
        });
        gpio.setup(PIN_BUTTON, gpio.DIR_IN, gpio.EDGE_BOTH);
    }

    setLED = (enabled = true) => {
        gpio.write(PIN_LED, enabled, function (err) {
            if (err) throw err;
        });
    }

    // constructor() {
    //     this.board = new Board({
    //         debug: true,
    //         onError: function (err) {
    //             console.log('Something wrong just happened')
    //             console.log(err)
    //         },
    //         onInit: this.onInit
    //     });
    //     this.board.init();
    // }

    // onInit = (res) => {
    //     if (res) {
    //         console.log('GrovePi Version :: ' + this.board.version())
    //         for(let i = 0; i<30; i++){
    //             console.log(i);
    //             var buttonSensor = new DigitalOutput(i)
    //             buttonSensor.turnOn();
    //             setTimeout(()=>{
    //                 buttonSensor.turnOff();
    //             }, 2000);
    //         }
    //     }
    // }
}