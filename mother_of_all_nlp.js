var request = require('request'),		// pull feed
	natural = require('natural'),		// process nlp terms and ngrams
	util = require('util'),				// helper lib to display content of complex objects
	crypto = require('crypto'),			// generate sha1 hashes for document uniqueness checks
	fs = require('fs'),					// fs library used to save json data for local validation
	elastical = require('elastical'),	// connect to sisyphus:9200 ( which is a host entry to our aws instance runing elasticsearch 1.0 )
	_ = require('underscore'),			// Used to iterate through json objects and find related values quickly
	async = require('async');			// async library to handle multiple parallel requests

	
// elastical client -- Note only works because of my local host entry
var client = new elastical.Client('sisyphus', { port: 9200 });

var		documentCounter = 0,   // track number of documents loaded
		documentsTfIdf = new natural.TfIdf(), // all of the documents
		documentList = [], // all of the docs with added info ( title, postid, keywords)
		masterTiming = new Date().getTime(), // for tracking total time to operate.
		failureCount = 0; // track errors

// process json feed
function nlp( feed, request_timing ) {

	feed.forEach( function ( item ) {
		var check_timing = new Date().getTime();
		var storyTokens = [], tags = [], categories = [];
		
		// strip html, entity codes, and new line characters
		var cleanText = item.title.replace( /(<([^>]+)>)|&([a-zA-Z0-9#]+);|\\n/gi, "" ).toLowerCase() + ' ' + item.content.replace( /(<([^>]+)>)|&([a-zA-Z0-9#]+);|\\n/gi, "" ).toLowerCase();
		
		var tags = _.pluck( item.tags, 'title' );
		var categories = _.pluck( item.categories, 'title' );
		
		cleanText = ( cleanText + ' ' + tags.join(' ').toLowerCase() + ' ' + categories.join(' ').toLowerCase() ).trim();
		
		documentsTfIdf.addDocument( cleanText ); // store document in tfidf object
		documentList.push( { tfidfID: documentCounter, postID: item.id, title: item.title, author: item.author } ); // store document meta needed it index later 
		
		documentCounter++;
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

function doRequest(start, callback) {
	pullFeed( start , function( err, results ) {
		if ( err ) {
			console.log("failed, retrying request " + start);
			failureCount++;
			doRequest( start, function( err, result ) {
				callback( null, start);
			});
		}
		else {
			console.log( "\t\tRequest " + start + " results:\n\nurl: " + results.url + "\n" + results.request_time + "\n" + results.finished_time + "\nErrors: " + results.error );
			if ( start == 139 ) {
				debugger;
				fs.writeFileSync( 'tfidf_data.json', JSON.stringify( documentsTfIdf ) );
				fs.writeFileSync( 'doc_data.json', JSON.stringify( documentList ) );
				//saved...
			}
			
			// memory check
			var mem = process.memoryUsage();
			mem.rss = mem.rss/1024/1024;
			mem.heapTotal = mem.heapTotal/1024/1024;
			mem.heapUsed = mem.heapUsed/1024/1024;
			console.log( "\t\tCurrent memory usage: " + JSON.stringify( mem ) );
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
			if (start<139) { // there are 139 pages in our instance.
				populate(start+1);
			}
			else if ( start >= 139 ) { // final loop lets show stats...
				var totalTimeToComplete = new Date().getTime();
				console.log("Finished state\n\nNumber of Documents: " + documentCounter + "\nFailures: " + failureCount + "\n\n");
				console.log('Total Elapsed time: ' + (totalTimeToComplete - masterTiming)/1000.0 + 's' );
			}
		}
	);
}

populate(1); // call page 1 and process
debugger;