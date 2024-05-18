// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

// pull in the required packages.
import * as sdk from "microsoft-cognitiveservices-speech-sdk";
//import * as readline from "readline";

export async function synthesis (  text: string) {

    // now create the audio-config pointing to the output file.
    // You can also use audio output stream to initialize the audio config, see the docs for details.
    //var audioConfig = sdk.AudioConfig.fromAudioFileOutput(filename);
    var subscriptionKey = "your azure subscriptionKey" ;
    var serviceRegion =  "your serviceRegion e.g eastasia"  ;
    //console.log("import.meta.env.SPEECH_KEY",import.meta.env.SPEECH_KEY)
    var speechConfig = sdk.SpeechConfig.fromSubscription(subscriptionKey, serviceRegion);

    // setting the synthesis language, voice name, and output audio format.
    // see https://aka.ms/speech/tts-languages for available languages and voices
    speechConfig.speechSynthesisLanguage = "en-US";//settings.language;
    //"Microsoft Server Speech Text to Speech Voice (zh-CN, XiaoxiaoNeural)"
    speechConfig.speechSynthesisVoiceName = "en-US-AvaMultilingualNeural";//"zh-CN-XiaoxiaoNeural";//
    speechConfig.speechSynthesisOutputFormat = sdk.SpeechSynthesisOutputFormat.Audio16Khz32KBitRateMonoMp3;

    // create the speech synthesizer.
    var synthesizer = new sdk.SpeechSynthesizer(speechConfig);

    // Before beginning speech synthesis, setup the callbacks to be invoked when an event occurs.

    // The event synthesizing signals that a synthesized audio chunk is received.
    // You will receive one or more synthesizing events as a speech phrase is synthesized.
    // You can use this callback to streaming receive the synthesized audio.
    synthesizer.synthesizing = function (s:any, e:any) {
        var str = "(synthesizing) Reason: " + sdk.ResultReason[e.result.reason] + " Audio chunk length: " + e.result.audioData.byteLength;
        //console.log(str);
    };

    // The event visemeReceived signals that a viseme is detected.
    // a viseme is the visual description of a phoneme in spoken language. It defines the position of the face and mouth when speaking a word.
    synthesizer.visemeReceived = function(s:any, e:any) {
        //var str = "(viseme) : Viseme event received. Audio offset: " + (e.audioOffset / 10000) + "ms, viseme id: " + e.visemeId;
        //console.log(str);
    }
    
    // The event synthesis completed signals that the synthesis is completed.
    synthesizer.synthesisCompleted = function (s:any, e:any) {
        //console.log("(synthesized)  Reason: " + sdk.ResultReason[e.result.reason] + " Audio length: " + e.result.audioData.byteLength);
    };

    // The synthesis started event signals that the synthesis is started.
    synthesizer.synthesisStarted = function (s:any, e:any) {
        //console.log("(synthesis started)");
    };

    // The event signals that the service has stopped processing speech.
    // This can happen when an error is encountered.
    synthesizer.SynthesisCanceled = function (s:any, e:any) {
        var cancellationDetails = sdk.CancellationDetails.fromResult(e.result);
        var str = "(cancel) Reason: " + sdk.CancellationReason[cancellationDetails.reason];
        if (cancellationDetails.reason === sdk.CancellationReason.Error) {
            str += ": " + e.result.errorDetails;
        }
        //console.log(str);
    };

    // This event signals that word boundary is received. This indicates the audio boundary of each word.
    // The unit of e.audioOffset is tick (1 tick = 100 nanoseconds), divide by 10,000 to convert to milliseconds.
    synthesizer.wordBoundary = function (s:any, e:any) {
       // console.log("(WordBoundary), Text: " + e.text + ", Audio offset: " + e.audioOffset / 10000 + "ms.");
    };

    synthesizer.speakTextAsync(text,
        function (result:any) {
            synthesizer.close();
            synthesizer = undefined;
        },
        function (err:any) {
            console.trace("err - " + err);
            synthesizer.close();
            synthesizer = undefined;
    })

    // rl.question("Type some text that you want to speak...\n> ", function (text) {
    //     rl.close();
    //     // start the synthesizer and wait for a result.
    //     synthesizer.speakTextAsync(text,
    //         function (result) {
    //         synthesizer.close();
    //         synthesizer = undefined;
    //         },
    //         function (err) {
    //         console.trace("err - " + err);
    //         synthesizer.close();
    //         synthesizer = undefined;
    //     })
    // });
}