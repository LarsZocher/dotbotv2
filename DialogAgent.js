import { v2 as dialogflow } from '@google-cloud/dialogflow';
import { PROJECT_ID, SESSION_ID, LANGUAGE_CODE } from './constants.js';

export default class DialogAgent {
    constructor() {
        this.registeredIntentHandlers = {};
    }

    onIntent(intentName, callback) {
        this.registeredIntentHandlers[intentName] = callback;
    }

    async handleIntent(result) {
        const intentName = result.intent.displayName;
        if (intentName in this.registeredIntentHandlers) {
            this.registeredIntentHandlers[intentName](result);
        }
    }

    async detectIntent(query) {
        // Instantiate a DialogFlow client.
        const sessionClient = new dialogflow.SessionsClient();
        const sessionPath = sessionClient.projectAgentSessionPath(PROJECT_ID, SESSION_ID);

        async function detectIntentandSentiment() {
            // The text query request.
            const request = {
                session: sessionPath,
                queryInput: {
                    text: {
                        text: query,
                        languageCode: LANGUAGE_CODE
                    }
                },
                queryParams: {
                    sentimentAnalysisRequestConfig: {
                        analyzeQueryTextSentiment: true
                    }
                }
            };

            // Send request and log result
            const responses = await sessionClient.detectIntent(request);
            console.log('Detected intent');
            const result = responses[0].queryResult;
            console.log(`  Query: ${result.queryText}`);
            console.log(`  Response: ${result.fulfillmentText}`);
            if (result.intent) {
                console.log(`  Intent: ${result.intent.displayName}`);
                console.log(`  Confidence: ${result.intentDetectionConfidence}`);
            } else {
                console.log('  No intent matched.');
            }
            if (Object.keys(result.parameters.fields).length) {
                console.log(`  Parameters:`);
                for (const key of Object.keys(result.parameters.fields)) {
                    if (result.parameters.fields[key].stringValue)
                        console.log(`    ${key}: ${result.parameters.fields[key].stringValue}`);
                    if (result.parameters.fields[key].listValue && result.parameters.fields[key].listValue.values[0])
                        console.log(`    ${key}: ${result.parameters.fields[key].listValue.values[0].stringValue}`);
                }
            }
            if (result.sentimentAnalysisResult) {
                console.log('Detected sentiment');
                console.log(`  Score: ${result.sentimentAnalysisResult.queryTextSentiment.score}`);
                console.log(`  Magnitude: ${result.sentimentAnalysisResult.queryTextSentiment.magnitude}`);
            } else {
                console.log('No sentiment Analysis Found');
            }

            return result;
            //console.log(result.parameters);
        }
        return await detectIntentandSentiment();
    }
}
