var _ = require( 'underscore' ),
	util = require( 'util' ),
	crypto = require( 'crypto'),
	elastical = require( 'elastical' );

// compute hash for document identification
function sha_hash(d) {
	var shasum = crypto.createHash('sha1');
	shasum.update(d);
	return shasum.digest('hex');
}

var rootTerm = 'basketball', // hardcoded for now, enter term to show
	rootTermHash = sha_hash( rootTerm ), // hash for query
	terms = []; // store all terms retrieved, reduce calls to elasticsearch

// where we will construct the term relations 
var	termMap = {
		name: rootTerm,
		children: []
};

var client = new elastical.Client('sisyphus', { port: 9200 });

client.search( { "index": "cortex", "query": { "bool": { "must": [ { "term": { "terms.id": rootTermHash } } ] }, "from": 0, "size": 1 } }, function ( err, result ) {
	try {
		terms[rootTermHash] = result.hits[0]._source; // this is our term data, stored in associative array by term hash
		var termsToQuery = [], relatedTermsCount = _.size( terms[rootTermHash].relatedTerms );
		
		// sort by score
		terms[rootTermHash].relatedTerms = _.sortBy( terms[rootTermHash].relatedTerms, function ( related ) { return related.score; } );
		
		for ( var termX = 0; termX < relatedTermsCount; termX++ ) {
			if ( terms[rootTermHash].relatedTerms[termX].term !== rootTerm ) {
				termsToQuery.push( sha_hash( terms[rootTermHash].relatedTerms[termX].term ) );
			}
		}
		
		var query = {
			"index": "cortex",
			"query": {
				"bool": {
					"must": [
						{
							"query_string": {
								"default_field": "terms.id",
								"query": termsToQuery.join(' OR ')
							}
						}
					]
				},
				"from": 0,
				"size": relatedTermsCount
			}
		}
		client.search( query, function( err, result ) {
			// this is one level deep. for testing lets see the results
			debugger;
			var hits = _.size( result.hits );
			for( var relatedX = 0; relatedX < hits; relatedX++ ) {
				var hash = result.hits[relatedX]._id;
				if ( terms[hash] !== undefined ) {
					// already stored
					continue;
				}
				else {
					terms[hash] = result.hits[relatedX]._source; // store term data
					terms[hash].relatedTerms = _.sortBy( terms[hash].relatedTerms, function ( related ) { return related.score; } );
				}
			}
			debugger;
			
			// build json object for term map
			for ( var termX = 0; termX < relatedTermsCount; termX++ ) {
				var related = terms[rootTermHash].relatedTerms[termX];
				if ( related.term !== rootTerm ) {
					var childTerm = {
						name: related.term,
						size: related.score/terms[rootTermHash].score,
						children: []
					};
					var relatedHash = sha_hash( related.term );
					var relatedRelatedCount = _.size( terms[relatedHash].relatedTerms );
					for ( var relatedRelatedX = 0; relatedRelatedX < relatedRelatedCount; relatedRelatedX++ ) {
						var relatedRelated = terms[relatedHash].relatedTerms[relatedRelatedX];
						childTerm.children.push(
							{
								name: relatedRelated.term,
								size: relatedRelated.score / terms[relatedHash].score
							}
						);
					}
					termMap.root.children.push( childTerm );
				}
			}
			
		});
	}
	catch ( error ) {
		console.log( error );
	}
});

