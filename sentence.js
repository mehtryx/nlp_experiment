var testSentence  = "Crashlytics, the testing and analytics company that was acquired by Twitter last year, is firing up a new beta distribution tool. The timing is pretty on-point as one of the major two players in the business — TestFlight — was just acquired by Apple along with its parent analytics company Burstly. The new distribution tool is cross-platform — meaning that it works on both Android and iOS. That puts it on rough parity with Hockey, the other major player in the beta distribution space, though Hockey also supports Windows Phone. The new tool comes out of Crashlytics Labs, the experimental arm of the crash reporting and analytics firm. It’s been in private beta for a bit but is now expanding into public beta, and you can sign up here if you’re interested. Of the developers I communicate with and those I polled after TestFlight was acquired, many had switched to Hockey in recent months. The ease of integration and better analytics tools were often cited as reasons that they liked Hockey over Testflight, though the latter had been more popular for some time. Crashlytics also has a good rep among developers for how easy it is to integrate into their apps, and for the quality and detail of its analytics. If this gets off the ground in a big way, it could become a big player in the space very quickly, especially given the void that Testflight will leave if Apple shuts down the iOS portions eventually. Of course, there’s always the possibility that Apple will integrate the improvements to the beta distribution system that Testflight made into its own developer offerings — which would provide a significant incentive to utilize its in-house platform. Either way, Crashlytics has the resources and the know-how to put out an interesting product here, so let’s see how this goes.";

var sentences = testSentence.split('. ');

debugger;
var WordPOS = require('wordpos'),
    wordpos = new WordPOS();

sentences.forEach( function( sentence ) {

	wordpos.getAdjectives( sentence, function( adjectives ) {

		wordpos.getNouns( sentence, function( nouns ) {

			wordpos.getVerbs( sentence, function( verbs ) {

				wordpos.getAdverbs( sentence, function( adverbs ) {
					console.log( 'Sentence: ' + sentence );
					console.log( 'nouns: ' + nouns );
				    console.log( 'verbs: ' + verbs );
				    console.log( 'adjectives: ' + adjectives );
				    console.log( 'adverbs: ' + adverbs );
					console.log( '========================================================================');
				});
			});
		});
	});
});
