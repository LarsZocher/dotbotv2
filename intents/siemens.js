import Bot from "../bot.js"

export const registerIntents = () => {
    Bot.getInstance().da.onIntent("SIEMENS_APPOINTMENT", async (result) => {
        if(result.allRequiredParamsPresent){
            let time = result.parameters.fields.time.stringValue;
            let date = result.parameters.fields.date.stringValue;
            let person = result.parameters.fields["siemens-person"].stringValue;

            let datetime = new Date(date.split("T")[0] +"T"+ time.split("T")[1]);

            console.log(datetime.toLocaleString(), person);
            Bot.getInstance().tts.synthesizeSpeech("Ich habe dir einen Termin für "+person+" am "+datetime.toLocaleString()+" gespeichert");
        }
    });
}