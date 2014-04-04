// testing the speed to reload the tfidf

var fs = require('fs'),					// access filesystem, load the json data from motehr_of_all_nlp.js output
	mathjs = require('mathjs'),			// math library with additional statistical functions (mediam, stddev, max)
	math = mathjs(),					// instance of the mathjs object
	crypto = require('crypto'),			// generate the sha1 hashes on our terms for elasticsearch id's
	util = require('util'),				// used to render objects on console.log output
	_ = require('underscore'),			// simplifies searching of complex lists, reduces for...next logic
	elastical = require('elastical'),	// node elastical client
	async = require('async'),			// for the async.series calls when making many requests into elasticsearch
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
	console.log("Processing Doc " + doc )
	// heavy lifting is in this loop.
	var termScores = [], keywords = [];
	for ( var term in tfidf.documents[doc] ) {
		var score = tfidf.tfidf( term , doc ); // scores term in relation to the document it exists
		termScores.push( score );
		keywords.push( term );
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
		//	console.log( term + " - " + score );
			termCounter++;
		}
	}
	
	// now make the termMap, we need two loops, the primary term, then the secondary terms.
	for ( var primaryTerm=0; primaryTerm<termCounter; primaryTerm++ ) {
		var findTerm = _.findWhere( termMap, { term: terms[primaryTerm].term } );
		var termIndex = termsInMap;
		
		if ( findTerm === undefined ) {
			findTerm = {
				index: termsInMap,
				hash: sha_hash( terms[primaryTerm].term ),
				term: terms[primaryTerm].term,
				score: terms[primaryTerm].score,
				relatedTerms: []
			};
			termsInMap++; // increment for next insert point
		}
		
		for ( var secondaryTerm=0; secondaryTerm<termCounter; secondaryTerm++ ) {
			
			var oldRelated = _.findWhere( findTerm.relatedTerms, { term: terms[secondaryTerm].term } );
			// store relationship
			if ( oldRelated === undefined ) {
				// insert data and get index of position
				var relatedIndex = findTerm.relatedTerms.push( { index: 999999, count: 1, term: terms[secondaryTerm].term, score: 0, scores: [ terms[secondaryTerm].score ] } ) - 1; 
				findTerm.relatedTerms[relatedIndex].index = relatedIndex; // store the index value so it can be found again later.
			}
			else {
				findTerm.relatedTerms[oldRelated.index].count += 1;
				findTerm.relatedTerms[oldRelated.index].scores.push( terms[secondaryTerm].score ); // add this score
			}
		}
		termMap[findTerm.index] = findTerm;
	}
	console.log("=================================================================");
} // end main for loop


var termsTime = new Date().getTime();
var termsTimeResult = "Terms processed in " + ( termsTime-timing)/1000.0 + " seconds....";

// at this point we have termMap which contains each term with its base score, the scores array contains all of the scores to do stddev on. 
// we have all the terms, and we have all of the keywords for each document in the doclist variable
//
// next step is to load data from elasticsearch, we need the async libraries now.

function esTerms( start, callback ) {
	async.series(
		[
		function ( callback ) {
			// first step lets query elastic search for our terms
			var termsToQuery = [], termCounter = start;
			for ( var term=start; term<start+10 && term<termsInMap; term++ ) {
				termsToQuery.push( termMap[term].hash );
				termCounter++; // returned as result to track next term processed/
			}
			var querystringQuery = termsToQquery.join(' OR ');
			var termQuery = {
				"index": "cortex",
				"query": {
					"bool": {
						"must": [
							{
								"query_string": {
									"default_field": "terms.id",
									"query": querystringQuery
								}
							}
						],
						"must_not": [],
						"should": []
					},
					"from": 0,
					"size": 10,
					"sort": [],
					"facets": {}
				}
			};
			client.search( termQuery, function( err, res ) {
				if ( res !== null && err === null ) {
					// now we compare whats in res with what we have.
					for( termResult in res.hits ) {
						
						// Is term present in both ES and termMap?
						var termToModify =  _.findWhere( termMap, { term: termResult._source.term} );
						if ( termToModify !== undefined ) {
							
							// Is related term present in both ES and termMap?
							for( relatedTerm in termResult._source.relatedTerms ){
								var relatedToModify = _.findWhere( termToModify.relatedTerms, { term: relatedTerm.term } );
								
								if ( relatedToModify !== undefined ) {
									// found, we now need to store the score into the termMap.scores and increment relatedterm counter
									termMap[termToModify.index].relatedTerms[relatedToModify.index].scores.push( relatedTerm.score );
									termMap[termToModify.index].relatedTerms[relatedToModify.index].count += 1;
								}
							}
						}
						
					}
					callback( null, termCounter ); // proceed to next group
				}
				else {
					callback( err, start ); // ending due to error.
				}
			});
		}
		],
		function (err, results) {
			if ( err === null && results < termsInMap ) {
				esTerms( results ); // next iteration
			}
			else if ( results === start ){
				esTerms( start ); // retry
			}
			else {
				debugger; // at this point all terms should have been processed and we now need to do the actual scoring.
				scoreTerms();
				// end of program
				console.log( "\n\n=====================================\n" + loadedTimeResult + "\n" + termsTimeResult );		
			}
		});
	);
}

function scoreTerms() {
	// step one, lets build scoring logic.  Step two we'll make an asycn recursive function to upload results to ES
	for( term in termMap ) {
		for ( related in term.relatedTerms ) {
			var scoreDeviation = math.std( related.scores ), relatedScore = 0;
			if ( math.max( related.scores ) === term.score ) {
				relatedScore = term.score - ( scoreDeviation );
			}
			else {
				relatedScore = term.score + ( scoreDeviation );
			}
			termMap[term.index].relatedTerms[related.index].score = relatedScore;
		}
	}
}

esTerms( 1 );
