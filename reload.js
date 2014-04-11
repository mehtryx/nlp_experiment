// testing the speed to reload the tfidf

var fs = require('fs'),					// access filesystem, load the json data from motehr_of_all_nlp.js output
	mathjs = require('mathjs'),			// math library with additional statistical functions (mediam, stddev, max)
	math = mathjs(),					// instance of the mathjs object
	crypto = require('crypto'),			// generate the sha1 hashes on our terms for elasticsearch id's
	util = require('util'),				// used to render objects on console.log output
	_ = require('underscore'),			// simplifies searching of complex lists, reduces for...next logic
	elastical = require('elastical'),	// node elastical client
	natural = require('natural');		// nlp tfidf scoring

var timing = new Date().getTime();

// loading old data
var docTfIdf = fs.readFileSync('tfidf_data.json');
var tfidf = new natural.TfIdf( JSON.parse(docTfIdf) );
var docData = fs.readFileSync('doc_data.json');
var docList = JSON.parse( docData );
var terms = []; // array of terms for termmap
var docLength = tfidf.documents.length;
var termsInMap = 0, termMap = [];


// elastical client -- Note only works because of my local host entry for sisyphus, actually aws instance
var client = new elastical.Client('sisyphus', { port: 9200 });

var loadedTime = new Date().getTime();
var loadedTimeResult = "Loaded in " + (loadedTime-timing)/1000.0 + " seconds...";

// compute hash for document identification
function sha_hash(d) {
	var shasum = crypto.createHash('sha1');
	shasum.update(d);
	return shasum.digest('hex');
}

for ( var doc = 0; doc < docLength; doc++ ) {
	
	// we will do a second loop to iterate 10 at a time for bluk indexing of posts.
	for ( var post = 0; post < 10 && doc < docLength; post++) {
		console.log("Processing Doc " + doc )
		// heavy lifting is in this loop.
		var termScores = [], keywords = [], keywords_sha = [];
		for ( var term in tfidf.documents[doc] ) {
			var score = tfidf.tfidf( term , doc ); // scores term in relation to the document it exists
			termScores.push( score );
			keywords.push( term );
			keywords_sha.push( sha_hash( term ) );
		}
		docList.keywords = keywords; // saves all the keywords for the document into this object.
		
		// Now query elasticsearch to populate the termMap object prior to score computation.
		
		
		// Now we need to know what terms must be mapped.
		var stdDev = math.std( termScores) ;
		var median = math.median( termScores );
		var maxScore = math.max( termScores );

		var termCounter = 0;
		console.log( "STD DEV: " + stdDev  + " MEDIAN: " + median + " MAX: " + maxScore + " CUTOFF: " + (median + stdDev*1.5) );
		for ( var term in tfidf.documents[doc] ){
			
			var score = tfidf.tfidf( term , doc ); // scores term in relation to the document it exists
			if ( score >= ( median + stdDev*1.5 ) ) { // allow terms with scores higher than one and a half standard deviations above average
				terms[termCounter] = { term: term, score:score };
				termCounter++;
			}
		}
		
		// now make the termMap, we need two loops, the primary term, then the secondary terms.
		for ( var primaryTerm=0; primaryTerm<termCounter; primaryTerm++ ) {
			var findTerm = _.findWhere( termMap, { term: terms[primaryTerm].term } );
			var termIndex = termsInMap;
			var flagNew = true;
			
			if ( findTerm === undefined ) {
				findTerm = {
					index: termsInMap,
					term: terms[primaryTerm].term,
					relatedTerms: []
				};
				termsInMap++; // increment for next insert point
			}
			else {
				flagNew = false;
			}
			
			for ( var secondaryTerm=0; secondaryTerm<termCounter; secondaryTerm++ ) {
				var scores = [ terms[primaryTerm].score, terms[secondaryTerm].score];
				
				var oldRelated = _.findWhere( findTerm.relatedTerms, { term: terms[secondaryTerm].term } );
				if ( oldRelated !== undefined ) {
					scores.push( oldRelated.score ); // add previous related score to mix
				}
				var relatedScore; // now we calculate the new related score
				if ( math.max( scores ) === terms[primaryTerm].score ) {
					relatedScore = terms[primaryTerm].score - ( math.std( scores ) );
				}
				else {
					relatedScore = terms[primaryTerm].score + ( math.std( scores ) );
				}
				
				// store relationship
				if ( oldRelated !== undefined ) {
					findTerm.relatedTerms[oldRelated.index].score = relatedScore; // overwrite old score
				}
				else {
					var relatedIndex = findTerm.relatedTerms.push( { index: 999999, term: terms[secondaryTerm].term, score: relatedScore } ) - 1; // insert data and get index of position
					findTerm.relatedTerms[relatedIndex].index= relatedIndex; // store the index value so it can be found again later.
				}
			}
			termMap[findTerm.index] = findTerm;
		}
		// increment doc on each iteration of this loop, lets us increment by 10 at a time on outer loop
		doc++;
		console.log("=================================================================");
	}
	// bulk insert to elasticsearch TBD, need to first add logic to pull term relationships from elastic and compare still
	
}

// lets find basketball
var basketball = _.where( termMap, { term: 'basketball' } );
console.log( util.inspect( basketball, false, null ) );
debugger;

var termsTime = new Date().getTime();
var termsTimeResult = "Terms processed in " + ( termsTime-timing)/1000.0 + " seconds....";

console.log( "\n\n=====================================\n" + loadedTimeResult + "\n" + termsTimeResult );