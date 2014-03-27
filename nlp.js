var request = require('request'),		// pull feed
	natural = require('natural'),		// process nlp terms and ngrams
	util = require('util'),				// helper lib to display content of complex objects
	crypto = require('crypto'),			// generate sha1 hashes for document uniqueness checks
	fs = require('fs'),					// fs library used to save json data for local validation
	elastical = require('elastical'),	// connect to sisyphus:9200 ( which is a host entry to our aws instance runing elasticsearch 1.0 )
	async = require('async');			// async library to handle multiple parallel requests

// elastical client -- Note only works because of my local host entry
var client = new elastical.Client('sisyphus', { port: 9200 });


// variables for controlling relevence
var relevence_score = 0.9,
	category_weight = 2.0,
	tag_weight = 5.0;

// natural node objects initialized
var stopwords = natural.stopwords;
stopwords.push("its", "go", "just", "weve", "cant", "so", "hes", "not", "if", "else", "when", "where", "what", "while", "dont", "length");
var tokenizer = new natural.WordTokenizer();
var NGrams = natural.NGrams;

var jsonData = {
	posts: []
}
var document_hashes = [];
var term_map = {
	termCount: 0,
	terms: []
};

// Utility functions
var sep = function() {
	//console.log('===========================================================================================');
}

// compute hash for document identification
function sha_hash(d) {
	var shasum = crypto.createHash('sha1');
	shasum.update(d);
	return shasum.digest('hex');
}

// tokenizes string object - lets redo this, lets not tokenize...just return array.
function tokenize_term_modifier( obj ) {
	//var tokens = [];
	var terms = [];
	obj.forEach( function(key) {
		key = key.title.toLowerCase();
		if ( terms.indexOf( key ) === -1 )
			terms.push( key )
	//	var temp = tokenizer.tokenize(key.title);
	//	temp.forEach( function (value) {
	//		tokens.push(value);
	//	});
	});
	return terms;
	//return tokens;
}

// custom sort for term scores
function score_sort( tfidf_terms ) {
	var temp_terms = [], return_terms = [];
	
	tfidf_terms.forEach( function( term ) {
		temp_terms[term.term] = term.tfidf;
	});
	bySortedValue( temp_terms, function( key, value ) {
		return_terms.push( { term: key, tfidf: value } );
	});
	return return_terms;

}

// handles sorts and iterations over associative arrays in javascript
function bySortedValue(obj, callback, context) {
	var tuples = [];
	
	for (var key in obj) {
		tuples.push([key, obj[key]]);
	}
	tuples.sort(function(a, b) { return a[1] < b[1] ? -1 : a[1] > b[1] ? 1 : 0 });
	
	var length = tuples.length;
	while (length--) callback.call(context, tuples[length][0], tuples[length][1]);
}

// process json feed
function nlp( feed, request_timing ) {
	var doc_id = 0;
	feed.forEach( function ( item ) {
		var check_timing = new Date().getTime();
		//console.log('Elapsed time: ' + ( check_timing - request_timing )/1000.0 + ' seconds' );
		request_timing = check_timing;
		// initial blank structure
		var item_ngrams = {				// ngrams object, stores the various data lists for ngram processing
			raw_trigrams: [],			// raw trigram list used to process specific data arrays below
			tfidf_trigrams: {
				trigrams: [],			// stores all trigrams (removes those that are stop words)
				score: [],				// stores all trigrams with score
				trigrams_score: []		// stores up to top 20 scoring trigrams as long as not duplicated and score > relevence*2.0
			}
		};

		var item_terms = {				// Terms object, stores the various data lists for term processing
			raw_terms: [],				// raw term list used to process specific data arrays below
			tfidf_terms: {
				terms: [],				// stores all terms (removes stop words)
				score: [],				// stores all terms with the tdidf score if score >= relevance score
				terms_score: []			// stores all terms with score, used to help generate trigram scores
			},
			term_modifiers: {
				tags: [],				// stores all unique tags tokenized from tag array
				tags_raw: [],			// original tags, just lowercased, duplicates removed
				categories: [],			// stores all unique categories tokenized from category array
				categories_raw: []		// original categories, just lowercased, duplicates removed
			}
		};
			
		// strip html, entity codes, and new line characters
		var cleanText = item.title.replace( /(<([^>]+)>)|&([a-zA-Z0-9#]+);|\\n/gi, "" ).toLowerCase() + ' ' + item.content.replace( /(<([^>]+)>)|&([a-zA-Z0-9#]+);|\\n/gi, "" ).toLowerCase();
		// Attach stemmer - still deciding on this.... word need to stem trigrams as well...
		//natural.LancasterStemmer.attach();
		//item_terms.raw_terms = cleanText.tokenizeAndStem();
		
		// tokenize content
		item_terms.raw_terms = tokenizer.tokenize( cleanText );
		
		// tokenize and store tags
		item_terms.term_modifiers.tags_raw = tokenize_term_modifier( item.tags );
		var temp_tags = []; // remove stop words, tokenize
		item_terms.term_modifiers.tags_raw.forEach( function (tag ) {
			var tokens = tokenizer.tokenize( tag );
			tokens.forEach( function ( token ) {
				if ( temp_tags.indexOf( token ) === -1 && stopwords.indexOf( token ) === -1 ) {
					temp_tags.push( token );
				}
			});
		});
		item_terms.term_modifiers.tags = temp_tags;
		
		var tag_importance_offset = 0;
		if ( (item_terms.term_modifiers.tags.length / item_terms.raw_terms.length * 100.0) > 80.0 )
			tag_importance_offset =- tag_weight;  // too many tags, no longer important, negats tag offset in term score
		
		// tokenize and store categories
		item_terms.term_modifiers.categories_raw = tokenize_term_modifier( item.categories );
		var temp_cat = [];
		item_terms.term_modifiers.categories_raw.forEach( function( category ) { 
			var tokens = tokenizer.tokenize( category );
			tokens.forEach( function ( token ) {
				if ( temp_cat.indexOf( token ) === -1 && stopwords.indexOf( token ) === -1 ) {
					temp_cat.push( token );
				}
			});
		});
		item_terms.term_modifiers.categories = temp_cat;
		
		// process each token, if word is not a duplicate, not in the stopwords and has a length > 1 we add it to wordTokens
		item_terms.raw_terms.forEach( function( token ) {
			//token = natural.PorterStemmer.stem( token );
			if ( item_terms.tfidf_terms.terms.indexOf( token ) === -1 && stopwords.indexOf( token ) === -1 ) {
				if ( token.length > 1 ) 
					item_terms.tfidf_terms.terms.push( token );
			}
		});
		
		// calculate tfidf scores
		var tfidf = new natural.TfIdf();
		tfidf.addDocument( cleanText );
		tfidf.addDocument( stopwords.join(' ') ); // adding a document full of stop words to allow idf to compute without LOG 1/1 = 0
		var termcounter = 0;
		item_terms.tfidf_terms.terms.forEach( function ( term ) {
			var score = tfidf.tfidf( term, doc_id );
			
			// check if word is in tags
			if ( item_terms.term_modifiers.tags.indexOf( term ) !== -1 ) {
				score += tag_weight;
			}
				
			if ( item_terms.term_modifiers.categories.indexOf( term ) !== -1) {
				score += category_weight;
			}
			
			if ( score >= relevence_score ) {
				item_terms.tfidf_terms.score.push( { term: term, tfidf: score } );
				termcounter++;
			}
			
			// tracks score of all words for our ngrams scoring
			item_terms.tfidf_terms.terms_score[term] = score;
			
		});
		
		// sort scores in descending order
		item_terms.tfidf_terms.score = score_sort( item_terms.tfidf_terms.score );
		item_terms.tfidf_terms.score = item_terms.tfidf_terms.score.slice(0, 20);
		
		// N-Grams
		item_ngrams.raw_trigrams = NGrams.trigrams( cleanText );
		var temp_ngram_tracker = []; // easier to remove multi dimensional associative array elements by using this as a key
		var temp_trigram_score = [];
		item_ngrams.raw_trigrams.forEach( function( trigram ) {
			var trigram1 = trigram[0],
				trigram2 = trigram[1],
				trigram3 = trigram[2],
				combined = trigram.join(' ');
				
			
			// check if not already present and not a stopword in either position
			if ( 	stopwords.indexOf( trigram1 ) === -1 && stopwords.indexOf( trigram2 ) === -1 && stopwords.indexOf( trigram3 ) === -1
					&& temp_ngram_tracker.indexOf( combined ) === -1) {
				temp_ngram_tracker.push( combined );
				item_ngrams.tfidf_trigrams.trigrams.push( combined.split() );
				
				// calculate the trigram's combined tfidf score as an average
				item_ngrams.tfidf_trigrams.trigrams_score[ combined ] = (item_terms.tfidf_terms.terms_score[trigram1] + item_terms.tfidf_terms.terms_score[trigram2] + item_terms.tfidf_terms.terms_score[trigram3] )/3.0;
				
			}
		});
		
		// sort and generate the final trigram list
		var counter=0; // only take top 20 at most
		bySortedValue( item_ngrams.tfidf_trigrams.trigrams_score, function ( key, value ) {
			item_ngrams.tfidf_trigrams.score.push( { trigram: key, score: value } );
			if ( value >= ( relevence_score * 2.0 ) && temp_trigram_score.indexOf( key ) === -1 && counter++ < 20 )
				temp_trigram_score[key] = value;
		});
		item_ngrams.tfidf_trigrams.trigrams_score = temp_trigram_score; // sorts this list
		
		// now we are going to flatten this out....
		var flattened_terms = '';
		var flattened_array = []; //temp holding to route out duplicates
		
		// Hash generation
		//
		// First Hash - which is the hash of high scoring words in item_terms.tfidf_terms.score[{term: , score: }]
		var firstHashSource = '', firstHash;
		item_terms.tfidf_terms.score.forEach( function( term ) {
			firstHashSource += term.term;
			flattened_terms += term.term + ' ';
		});
		firstHash = sha_hash(firstHashSource);
		//console.log('1 - ' + firstHash);
		
		// Second Hash - which is the hash of ngrams list in item_ngrams.raw_trigrams[]
		var secondHashSource = '', secondHash;
		secondHashSource = item_ngrams.raw_trigrams.join('|');
		secondHash = sha_hash(secondHashSource);
		//console.log('2 - ' + secondHash);
		
				
		// Third Hash - which is the hash of the high scoring ngrams in item_ngrams.tfidf_trigrams.trigrams_score[]
		var thirdHashSource = '', thirdHash;
		var high_scoring_ngrams= []; // processing this at same time to make a clean array for our sav function
		bySortedValue( item_ngrams.tfidf_trigrams.trigrams_score, function ( key, value ) {
			thirdHashSource += key + '|' + value;
			high_scoring_ngrams.push( { ngram: key, tfidf: value });
			flattened_terms = key + ' ' + flattened_terms; // pushing these onto front.
		});
		thirdHash = sha_hash(thirdHashSource);
		//console.log('3 - ' + thirdHash);
		
		// end of this item processing
		sep();
		
		// split out, check for duplicates and delete.
		flattened_terms.split(' ').forEach( function (term ) {
			if ( flattened_array.indexOf( term ) === -1 )
				flattened_array.push( term);
		});
		
		var final_terms = flattened_array.join(' ') + ' ' + item_terms.term_modifiers.tags_raw.join(' ') + ' ' + item_terms.term_modifiers.categories_raw.join(' ');

		// for testing lets save these as json objects into a text file.  But first we'll need to make a larger object containing all of the data
		var jsonDoc = {
			postid: item.id,
			title: item.title,
			hashes: {
				term: firstHash,
				ngram: secondHash,
				scored_ngram: thirdHash
			},
			keywords: final_terms
		};
		jsonData.posts.push(jsonDoc);
		
		// now elastical
		
		//termmap
		theTerms(item_terms);
		
		// Does it exist?
		var searchQuery = {
			"index": "cortex",
			"query": {
				"bool": {
					"must": [
					{
						"term": {
							"posts.postid": jsonDoc.postid
						}
					},
					{
						"term": {
							"posts.hashes.term": jsonDoc.hashes.term
						}
					},
					{
						"term": {
							"posts.hashes.ngram": jsonDoc.hashes.ngram
						}
					},
					{
						"term": {
							"posts.hashes.scored_ngram": jsonDoc.hashes.scored_ngram
						}
					}
					],
					"must_not": [],
					"should": []
				}
			},
			"from": 0,
			"size": 10,
			"sort": [],
			"facets": {}
		};
		client.search( searchQuery, function( err, res) {
			if ( res.total <= 0 && err === null ) {
				// then this doesn't exist....good
						client.index( 'cortex', 'posts', jsonDoc, function(err, res) {
							if (err)
								console.log(err);
						});
			}
		});

	});
	
}

function pullFeed( paged, callback ) {
	var timing = new Date().getTime();
	var url = 'http://smrt.wpengine.com/?feed=json&jsonp&tc=' + timing + ( paged !== 1 ? '&paged=' + paged : '');
	
	var status = {
		url: url,
		request_time: '',
		error: '',
		finished_time: ''
	};
	request( { uri: url }, function( error, response, body ) {
		var request_timing = new Date().getTime();
		status.request_time = 'Request time: ' + ( request_timing - timing )/1000.0 + ' seconds';
		if (error) {
			status.error = error;
		}
		else {
			try {
				var feed = JSON.parse( body );
				nlp( feed, request_timing );
				var finished_time = new Date().getTime();
				status.finished_time = 'Total Elapsed time: ' + (finished_time - timing)/1000.0 + 's  Request time: ' +  (request_timing - timing)/1000.0 + 's  NLP Time: ' + (finished_time - request_timing)/1000.0 + 's';
				callback( null, status );
			}
			catch (err) {
				callback( err, null );
			}
		}

	});
}
console.log("\n\n=========================================================================================\n\n");

function doRequest(start, callback) {
	pullFeed( start , function( err, results ) {
		if ( err ) {
			console.log("failed, retrying request " + start);
			doRequest( start, function( err, result ) {
				callback( null, start);
			});
		}
		else {
			console.log( "\t\tRequest " + start + " results:\n\nurl: " + results.url + "\n" + results.request_time + "\n" + results.finished_time + "\nErrors: " + results.error );
			callback( null, start );
		}
	});
}

function populate(start){
	console.log("trying request " + start );
	async.series( [
		function(callback) {
			doRequest( start, function( err, result ) {
				callback( null, start);
			});
		}
		],
		function(err, result) {
			if (start<1)
				populate(start+1);
		}
	);
}

function theTerms( item_terms ) {
	// lets build our term map.
	//starting with tags
	var temp_terms = []; // store terms in a index of the term id and score as value
	var termmap = {
		"terms": []
	};
	
	// construct initial structure of tags and categories as a 1 to 1 map of score and tag name
	item_terms.term_modifiers.tags_raw.forEach( function ( tag ) {
		temp_terms[tag] = { score: 1.0 , relationships: [] }; // default importance to each other ( 1 is equal importance, or indifferent ) 
	});
	item_terms.term_modifiers.categories_raw.forEach( function (category ) {
		if (temp_terms[category] !== undefined ) {
			temp_terms[category].score = 1/0.33; // hard coded since we know if it is there its a tag with a value of 1, 1/0.33 = 3.030303
		}
		else {
			temp_terms[category] = { score: 0.33, relationships: [] }; // default importance of categories is 1/3 that of tags
		}
	});
	
	item_terms.tfidf_terms.score.forEach( function( term) {
		if ( temp_terms[term.term] !== undefined ) {
			// exists, so lets mod it.  new value = term_score/old_score * old_score  so score adjusts based on importance of word
			temp_terms[term.term].score = ( term.tfidf / temp_terms[term.term].score ) * temp_terms[term.term].score;
		}
		else {
			temp_terms[term.term] = { score: term.tfidf, relationships: [] };
		}
	});
	
	// now we nest two loops to add relationships
	for (var term in temp_terms) {
		var related = [];
		for (var secondTerm in temp_terms){
			var relatedScore = temp_terms[secondTerm].score / temp_terms[term].score * temp_terms[secondTerm].score;
			related.push( 
				{
					related_id: secondTerm,
					score: relatedScore
				}
			);
		}
		termmap.terms.push(
			{
				id: term,
				relationships: related
			}
		);
	}
	
	console.log("\n\n---------=========-----------============----------========----------\n\n");
	console.log(util.inspect(termmap,false,null));
	console.log("\n\n");
}



populate(1);


