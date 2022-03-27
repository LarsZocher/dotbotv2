'use strict';
const prompt = require('prompt');
const { PROJECT_ID, SESSION_ID, LANGUAGE_CODE } = require('./constants');
const SpotifyWeb = require('./spotify');

const spotify = new SpotifyWeb();

require('dotenv').config();

async function start(){
    await spotify.start();
    startNewPrompt();
}

async function startNewPrompt() {
    prompt.start();
    prompt.get(['query'], function (err, result) {
        if (err) {
            return onErr(err);
        }
        handleInput(result.query);
    });
}

async function handleIntent(result) {
    if (result.intent.displayName === 'SPOTIFY_PLAY') {
        let track = '';
        for (const key of Object.keys(result.parameters.fields)) {
            if (result.parameters.fields[key].stringValue) track += ' ' + result.parameters.fields[key].stringValue;
            if (result.parameters.fields[key].listValue && result.parameters.fields[key].listValue.values[0]) {
                track += ' ' + result.parameters.fields[key].listValue.values[0].stringValue;
            }
        }
        if (!result.parameters.fields.any.stringValue) await spotify.playArtist(track);
        else await spotify.playTrack(track);
    }
}

async function handleInput(query) {
    // [START dialogflow_detect_intent_with_sentiment_analysis]
    // Imports the Dialogflow client library
    const dialogflow = require('@google-cloud/dialogflow').v2;

    // Instantiate a DialogFlow client.
    const sessionClient = new dialogflow.SessionsClient();

    // Define session path
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
                if(result.parameters.fields[key].stringValue) console.log(`    ${key}: ${result.parameters.fields[key].stringValue}`);
                if(result.parameters.fields[key].listValue && result.parameters.fields[key].listValue.values[0]) console.log(`    ${key}: ${result.parameters.fields[key].listValue.values[0].stringValue}`);
            }
        }
        if (result.sentimentAnalysisResult) {
            console.log('Detected sentiment');
            console.log(`  Score: ${result.sentimentAnalysisResult.queryTextSentiment.score}`);
            console.log(`  Magnitude: ${result.sentimentAnalysisResult.queryTextSentiment.magnitude}`);
        } else {
            console.log('No sentiment Analysis Found');
        }

        await handleIntent(result);
        //console.log(result.parameters);
        // [END dialogflow_detect_intent_with_sentiment_analysis]
    }
    await detectIntentandSentiment();
    startNewPrompt();
}

start();
