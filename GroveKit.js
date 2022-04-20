import { GrovePi } from "grovepi";

var Commands = GrovePi.commands
var Board = GrovePi.board

export default class GroveKit {
    constructor() {
        this.board = new Board({
            debug: true,
            onError: function (err) {
                console.log('Something wrong just happened')
                console.log(err)
            },
            onInit: function (res) {
                if (res) {
                    console.log('GrovePi Version :: ' + board.version())
                }
            }
        })
    }
}