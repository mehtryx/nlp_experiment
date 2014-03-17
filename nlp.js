var request = require('request'),	// pull feed
	natural = require('natural'),	// process nlp terms and ngrams
	util = require('util'),			// helper lib to display content of complex objects
	crypto = require('crypto'),		// generate sha1 hashes for document uniqueness checks
	fs = require('fs');				// fs library

var timing = new Date().getTime();

// variables for controlling relevence
var relevence_score = 0.9,
	category_weight = .25,
	tag_weight = .5;

// natural node objects initialized
var stopwords = natural.stopwords;
stopwords.push("its", "go", "just", "weve", "cant", "so", "hes", "not", "if", "else", "when", "where", "what", "while");
var tokenizer = new natural.WordTokenizer();
var tfidf = new natural.TfIdf();
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
	console.log('===========================================================================================');
}

// compute hash for document identification
function sha_hash(d) {
	var shasum = crypto.createHash('sha1');
	shasum.update(d);
	return shasum.digest('hex');
}

// tokenizes string object
function tokenize_term_modifier( obj ) {
	var tokens = [];
	obj.forEach( function(key) {
		var temp = tokenizer.tokenize(key.title);
		temp.forEach( function (value) {
			tokens.push(value);
		});
	});
	return tokens;
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
		console.log('Elapsed time: ' + ( check_timing - request_timing )/1000.0 + ' seconds' );
		request_timing = check_timing;
		// initial blank structure
		var item_ngrams = {				// ngrams object, stores the various data lists for ngram processing
			raw_bigrams: [],			// raw bigram list used to process specific data arrays below
			tfidf_bigrams: {
				bigrams: [],			// stores all bigrams (removes those that are stop words)
				score: [],				// stores all bigrams with score
				bigrams_score: []		// stores up to top 20 scoring bigrams as long as not duplicated and score > relevence*2.0
			}
		};

		var item_terms = {				// Terms object, stores the various data lists for term processing
			raw_terms: [],				// raw term list used to process specific data arrays below
			tfidf_terms: {
				terms: [],				// stores all terms (removes stop words)
				score: [],				// stores all terms with the tdidf score if score >= relevance score
				terms_score: []			// stores all terms with score, used to help generate bigram scores
			},
			term_modifiers: {
				tags: [],				// stores all unique tags
				categories: []			// stores all unique categories
			}
		};
			
		// strip html, entity codes, and new line characters
		var cleanText = item.content.replace( /(<([^>]+)>)|&([a-zA-Z0-9#]+);|\\n/gi, "" );
		
		// tokenize content
		item_terms.raw_terms = tokenizer.tokenize( cleanText );
		
		// tokenize and store tags
		item_terms.term_modifiers.tags = tokenize_term_modifier( item.tags );
		
		// tokenize and store categories
		item_terms.term_modifiers.categories = tokenize_term_modifier( item.categories );
		
		// process each token, if word is not a duplicate, not in the stopwords and has a length > 1 we add it to wordTokens
		item_terms.raw_terms.forEach( function( token ) {
			if ( item_terms.tfidf_terms.terms.indexOf( token ) === -1 && stopwords.indexOf( token.toLowerCase() ) === -1 ) {
				if ( token.length > 1 )
					item_terms.tfidf_terms.terms.push( token );
			}
		});
		
		// calculate tfidf scores
		tfidf = new natural.TfIdf();
		tfidf.addDocument( cleanText );
		item_terms.tfidf_terms.terms.forEach( function ( term ) {
			var score = tfidf.tfidf( term, doc_id );
			
			// check if word is in tags
			if ( item_terms.term_modifiers.tags.indexOf(  term ) !== -1 )
				score += tag_weight;
				
			if ( item_terms.term_modifiers.categories.indexOf( term ) !== -1)
				score += category_weight;
			
			if ( score >= relevence_score )
				item_terms.tfidf_terms.score.push( { term: term, tfidf: score } );
			
			// tracks score of all words for our ngrams scoring
			item_terms.tfidf_terms.terms_score[term] = score;
			
		});
		
		// sort scores in descending order
		item_terms.tfidf_terms.score = score_sort( item_terms.tfidf_terms.score );
		
		
		// N-Grams
		item_ngrams.raw_bigrams = NGrams.bigrams( cleanText );
		var temp_ngram_tracker = []; // easier to remove multi dimensional associative array elements by using this as a key
		var temp_bigram_score = [];
		item_ngrams.raw_bigrams.forEach( function( bigram ) {
			// check if not already present and not a stopword in either position
			if ( stopwords.indexOf( bigram[0].toLowerCase() ) === -1  && stopwords.indexOf( bigram[1].toLowerCase() ) === -1  && temp_ngram_tracker.indexOf( bigram[0] + bigram[1] ) === -1) {
				temp_ngram_tracker.push( bigram[0] + bigram[1] );
				item_ngrams.tfidf_bigrams.bigrams.push( bigram );
				
				// calculate the bigram's combined tfidf score as a sum
				item_ngrams.tfidf_bigrams.bigrams_score[( bigram[0].toLowerCase() + '|' + bigram[1].toLowerCase() )] = item_terms.tfidf_terms.terms_score[bigram[0]] + item_terms.tfidf_terms.terms_score[bigram[1]];
				
			}
		});
		
		// sort and generate the final bigram list
		var counter=0; // only take top 20 at most
		bySortedValue( item_ngrams.tfidf_bigrams.bigrams_score, function ( key, value ) {
			item_ngrams.tfidf_bigrams.score.push( { bigram: key, score: value } );
			if ( value >= ( relevence_score * 2.0 ) && temp_bigram_score.indexOf( key ) === -1 && counter++ < 20 )
				temp_bigram_score[key] = value;
		});
		item_ngrams.tfidf_bigrams.bigrams_score = temp_bigram_score; // sorts this list
		
		// Hash generation
		//
		// First Hash - which is the hash of high scoring words in item_terms.tfidf_terms.score[{term: , score: }]
		var firstHashSource = '', firstHash;
		item_terms.tfidf_terms.score.forEach( function( term ) {
			firstHashSource += term.term;
		});
		firstHash = sha_hash(firstHashSource);
		console.log('1 - ' + firstHash);
		
		// Second Hash - which is the hash of ngrams list in item_ngrams.raw_bigrams[]
		var secondHashSource = '', secondHash;
		secondHashSource = item_ngrams.raw_bigrams.join('|');
		secondHash = sha_hash(secondHashSource);
		console.log('2 - ' + secondHash);
		
		
		// Third Hash - which is the hash of the high scoring ngrams in item_ngrams.tfidf_bigrams.bigrams_score[]
		var thirdHashSource = '', thirdHash;
		var high_scoring_ngrams= []; // processing this at same time to make a clean array for our sav function
		bySortedValue( item_ngrams.tfidf_bigrams.bigrams_score, function ( key, value ) {
			thirdHashSource += key + '|' + value;
			high_scoring_ngrams.push( { ngram: key, tfidf: value });
		});
		thirdHash = sha_hash(thirdHashSource);
		console.log('3 - ' + thirdHash);
		
		// end of this item processing
		sep();
		
		// for testing lets save these as json objects into a text file.  But first we'll need to make a larger object containing all of the data
		jsonData.posts.push( {
			postid: item.id,
			title: item.title,
			hashes: {
				term: firstHash,
				ngram: secondHash,
				scored_ngram: thirdHash
			},
			high_scoring_ngrams: high_scoring_ngrams,
			high_scoring_terms: item_terms.tfidf_terms.score,
			tags: item_terms.term_modifiers.tags,
			categories: item_terms.term_modifiers.categories
		});
		
	});
	
	// save jsonData to a file
	var output = JSON.stringify(jsonData, null, 4);
	var outputFilename = 'nlp.json';
	fs.writeFile( outputFilename, output, function(err) {
		if (err) {
			console.log(err);
		}
		else {
			console.log('Results saved to ./nlp.json');
		}
	});
	
	var finished_time = new Date().getTime();
	console.log('Total Elapsed time: ' + (finished_time - timing)/1000.0 + 's  Request time: ' +  (request_timing - timing)/1000.0 + 's  NLP Time: ' + (finished_time - request_timing)/1000.0 + 's' );
	
}

// Pull data and pass to nlp function if present.
var cacheBuster = new Date().getTime();
var url = 'http://smrt.wpengine.com/?feed=json&jsonp&paged=1&tc=' + cacheBuster;
console.log ('uri: ' + url);
request( { uri: url }, function( error, response, body ) {
	var request_timing = new Date().getTime();
	console.log('Request time: ' + ( request_timing - timing )/1000.0 + ' seconds' );
	if (error) {
		console.log(error);
	}
	else {
		var feed = JSON.parse( body );
		nlp( feed, request_timing );
	}
});


