var elastical = require('elastical'),
	util = require('util'),
	crypto = require('crypto'),	
	client = new elastical.Client( 'sisyphus', { port: 9200 } );
	
// compute hash for document identification
function sha_hash(d) {
	var shasum = crypto.createHash('sha1');
	shasum.update(d);
	return shasum.digest('hex');
}

var eve = sha_hash('vladimir'),
	another = sha_hash('another'),
	anotherfield = sha_hash('another field');

	// lets make a sample term
	
	var term = {
		"id": eve,
		"term": "vladimir",
		"relationships": [
			{ "related_id": "and media", "score": 0.15658532843209588 },
			          { "related_id": "arts", "score": 0.15658532843209588 },
			          { "related_id": "black sea", "score": 0.15658532843209588 },
			          { "related_id": "canada", "score": 6.386294361119891 },
			          { "related_id": "crimea", "score": 24.956726942625227 },
			          { "related_id": "crimean legislature",
			            "score": 0.15658532843209588 },
			          { "related_id": "eastern europe", "score": 0.15658532843209588 },
			          { "related_id": "elections and voting",
			            "score": 0.15658532843209588 },
			          { "related_id": "entertainment", "score": 0.15658532843209588 },
			          { "related_id": "european politics", "score": 0.15658532843209588 },
			          { "related_id": "getty images inc.", "score": 0.15658532843209588 },
			          { "related_id": "government and politics",
			            "score": 0.15658532843209588 },
			          { "related_id": "interpol", "score": 0.15658532843209588 },
			          { "related_id": "journalism", "score": 0.15658532843209588 },
			          { "related_id": "kiev", "score": 0.15658532843209588 },
			          { "related_id": "kyiv", "score": 9.45981065528196 },
			          { "related_id": "media", "score": 0.15658532843209588 },
			          { "related_id": "moscow", "score": 7.847820615220354 },
			          { "related_id": "oleg sluzarenko", "score": 0.15658532843209588 },
			          { "related_id": "pn", "score": 0.15658532843209588 },
			          { "related_id": "politics", "score": 0.15658532843209588 },
			          { "related_id": "postmedia network inc.",
			            "score": 0.15658532843209588 },
			          { "related_id": "pravda newspaper", "score": 0.15658532843209588 },
			          { "related_id": "protests and demonstrations",
			            "score": 0.15658532843209588 },
			          { "related_id": "referenda", "score": 0.15658532843209588 },
			          { "related_id": "rostov-on-don", "score": 0.15658532843209588 },
			          { "related_id": "russia", "score": 15.198563491233637 },
			          { "related_id": "russian politics", "score": 0.15658532843209588 },
			          { "related_id": "sergei aksenov", "score": 0.15658532843209588 },
			          { "related_id": "sevastopol", "score": 7.847820615220354 },
			          { "related_id": "simferopol", "score": 13.135182093288606 },
			          { "related_id": "simon castro", "score": 0.15658532843209588 },
			          { "related_id": "stalin-era ukraina hotel",
			            "score": 0.15658532843209588 },
			          { "related_id": "ukraine", "score": 37.122310969395116 },
			          { "related_id": "ukrainian politics", "score": 0.15658532843209588 },
			          { "related_id": "viktor yanukovych", "score": 0.15658532843209588 },
			          { "related_id": "vladimir konstantinov",
			            "score": 0.15658532843209588 },
			          { "related_id": "vladimir putin", "score": 0.15658532843209588 },
			          { "related_id": "world politics", "score": 0.15658532843209588 },
			          { "related_id": "news", "score": 0.017052142266255243 },
			          { "related_id": "world", "score": 0.017052142266255243 },
			          { "related_id": "russian", "score": 40.53986644099046 },
			          { "related_id": "yanukovych", "score": 19.776717645007146 },
			          { "related_id": "ukrainian", "score": 17.412408675139822 },
			          { "related_id": "crimean", "score": 13.135182093288606 },
			          { "related_id": "sluzarenko", "score": 11.22226448130471 },
			          { "related_id": "parliament", "score": 10.83339258920235 },
			          { "related_id": "government", "score": 9.45981065528196 },
			          { "related_id": "newspaper", "score": 7.847820615220354 },
			          { "related_id": "getty", "score": 6.386294361119891 },
			          { "related_id": "images", "score": 6.386294361119891 },
			          { "related_id": "oleg", "score": 6.386294361119891 },
			          { "related_id": "vladimir", "score": 6.386294361119891 }
		]
	};
	
	
//		client.index( 'cortex', 'terms', term, function(err, res) {
//			if (err)
//				console.log(err);
//		});

/*


/*	
	var term_query = {
		"index": "cortex",
		"query": {
			"filtered": {
				"query": {
					"bool": {
						"must": [
						{
							"match_all": {}
						}
						],
						"must_not": [],
						"should": []
					}
				},
				"filter": {
					"or": [
						{
							"term": {
								"terms.id": "eve online"
							}
						},
						{
							"term": {
								"terms.id": "nba"
							}
						},
						{
							"term": {
								"terms.id": "felton"
							}
						}
					]
				}
			},
			"from": 0,
			"size": 10,
			"sort": [],
			"facets": {}
		}
	};
*/	
	
/*
	var querystring_query = eve + ' OR ' + another;
	var term_query = {
		"index": "cortex",
		"query": {
			"bool": {
				"must": [
					{
						"query_string": {
							"default_field": "terms.id",
							"query": querystring_query
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
	
	client.search( term_query, function( err, res) {
		console.log( util.inspect( res,false,null)  );
		console.log(err);
	});
*/

	client.bulk( [
		{ index:
			{ _index: 'cortex',
			_type: 'terms',
			data:
				{ id: '34eb4c4ef005207e8b8f916b9f1fffacccd6945e',
				term: 'action',
				relationships:
				 [ { related_id: '8ca7c7a247049742c2efa88e294f5611ca72edb7',
					 term: 'blake leggette',
					 score: 0.48089834696298783 },
				   { related_id: '67e5e332d36437792b3bf67555ff75ede1a2daf1',
					 term: 'halifax',
					 score: 46.67719595655379 },
				   { related_id: '5c106e2b5976baac9a175ba6b929a1e9393ecd5c',
					 term: 'loretta saunders',
					 score: 0.48089834696298783 },
				   { related_id: 'a210d74529050c4e7096c844477080b982ca38df',
					 term: 'missing persons',
					 score: 0.48089834696298783 },
				   { related_id: '7eb08b348e5ca13b57ff3641e1d34513e7884b3c',
					 term: 'murder and homicide',
					 score: 0.48089834696298783 },
				   { related_id: '454b4c41341490b92dc9b5cc324a0d5e1ed75270',
					 term: 'new brunswick',
					 score: 0.48089834696298783 },
				   { related_id: 'a1cbbe04215a6c376bbeb824f887888c4cd1d3f8',
					 term: 'victoria henneberry',
					 score: 0.48089834696298783 },
				   { related_id: '3c6bdcddc94f64bf77deb306aae490a90a6fc300',
					 term: 'news',
					 score: 3.487975781371934 },
				   { related_id: 'edf44fea7404e7d7fdb8ffad90e53c2c81343c59',
					 term: 'saunders',
					 score: 46.67719595655379 },
				   { related_id: '0c1fcf5ed36ae3626b677473d52af48991b4b087',
					 term: 'leggette',
					 score: 29.05257697039441 },
				   { related_id: '5c0d6665007e10f7d7b9186d14845a86414becc4',
					 term: 'henneberry',
					 score: 29.05257697039441 },
				   { related_id: '86cbbfa5f4e2ea880344e8bdec2e584c20d686d8',
					 term: 'loretta',
					 score: 24.101900215754533 },
				   { related_id: 'dfb04e6fdc8e2852595799862d7c7d58733584c6',
					 term: 'murder',
					 score: 24.101900215754533 },
				   { related_id: '48a5c526f5bf77da2437e188691cafcbd931ad62',
					 term: 'blake',
					 score: 19.61332158148796 },
				   { related_id: '74cb92755a56b29ac5200aad33ee8d34f381a4df',
					 term: 'brunswick',
					 score: 19.61332158148796 },
				   { related_id: 'd714d8456935fa20e60bd9e661423cb2583c79d9',
					 term: 'victoria',
					 score: 19.61332158148796 },
				   { related_id: 'c2a6b03f190dfb2b4aa91f8af8d477a9bc3401dc',
					 term: 'new',
					 score: 19.61332158148796 },
				   { related_id: '5a013c49508291c6816ac388f93a2c11973086ed',
					 term: 'missing',
					 score: 19.61332158148796 },
				   { related_id: '9f9bdfe45a7826a6aa2109eb7caac1e8c57068fa',
					 term: 'homicide',
					 score: 15.58684106759468 },
				   { related_id: 'b3ae4f722a30578fac0191593f82a69346a877d0',
					 term: 'women',
					 score: 3.696784962986375 },
				   { related_id: '37ebb98c6a9d318933bdf044926f1f3208cc3940',
					 term: 'charged',
					 score: 3.696784962986375 },
				   { related_id: 'e0996a37c13d44c3b06074939d43fa3759bd32c1',
					 term: 'first',
					 score: 2.0794415416798357 },
				   { related_id: 'c758ce5194d711122a9cabd7024790ba05e38832',
					 term: 'charges',
					 score: 2.0794415416798357 },
				   { related_id: 'ad782ecdac770fc6eb9a62e44f90873fb97fb26b',
					 term: 'two',
					 score: 2.0794415416798357 },
				   { related_id: '34eb4c4ef005207e8b8f916b9f1fffacccd6945e',
					 term: 'action',
					 score: 2.0794415416798357 },
				   { related_id: 'fe05bcdcdc4928012781a5f1a2a77cbb5398e106',
					 term: 'one',
					 score: 0.9241962407465938 } ] } } },
		{ index:
			{ _index: 'cortex',
			_type: 'terms',
			data:
				{ id: 'fe05bcdcdc4928012781a5f1a2a77cbb5398e106',
				term: 'one',
				relationships:
				 [ { related_id: '8ca7c7a247049742c2efa88e294f5611ca72edb7',
					 term: 'blake leggette',
					 score: 0.7213475204444817 },
				   { related_id: '67e5e332d36437792b3bf67555ff75ede1a2daf1',
					 term: 'halifax',
					 score: 70.01579393483068 },
				   { related_id: '5c106e2b5976baac9a175ba6b929a1e9393ecd5c',
					 term: 'loretta saunders',
					 score: 0.7213475204444817 },
				   { related_id: 'a210d74529050c4e7096c844477080b982ca38df',
					 term: 'missing persons',
					 score: 0.7213475204444817 },
				   { related_id: '7eb08b348e5ca13b57ff3641e1d34513e7884b3c',
					 term: 'murder and homicide',
					 score: 0.7213475204444817 },
				   { related_id: '454b4c41341490b92dc9b5cc324a0d5e1ed75270',
					 term: 'new brunswick',
					 score: 0.7213475204444817 },
				   { related_id: 'a1cbbe04215a6c376bbeb824f887888c4cd1d3f8',
					 term: 'victoria henneberry',
					 score: 0.7213475204444817 },
				   { related_id: '3c6bdcddc94f64bf77deb306aae490a90a6fc300',
					 term: 'news',
					 score: 5.2319636720579 },
				   { related_id: 'edf44fea7404e7d7fdb8ffad90e53c2c81343c59',
					 term: 'saunders',
					 score: 70.01579393483068 },
				   { related_id: '0c1fcf5ed36ae3626b677473d52af48991b4b087',
					 term: 'leggette',
					 score: 43.57886545559161 },
				   { related_id: '5c0d6665007e10f7d7b9186d14845a86414becc4',
					 term: 'henneberry',
					 score: 43.57886545559161 },
				   { related_id: '86cbbfa5f4e2ea880344e8bdec2e584c20d686d8',
					 term: 'loretta',
					 score: 36.152850323631796 },
				   { related_id: 'dfb04e6fdc8e2852595799862d7c7d58733584c6',
					 term: 'murder',
					 score: 36.152850323631796 },
				   { related_id: '48a5c526f5bf77da2437e188691cafcbd931ad62',
					 term: 'blake',
					 score: 29.419982372231935 },
				   { related_id: '74cb92755a56b29ac5200aad33ee8d34f381a4df',
					 term: 'brunswick',
					 score: 29.419982372231935 },
				   { related_id: 'd714d8456935fa20e60bd9e661423cb2583c79d9',
					 term: 'victoria',
					 score: 29.419982372231935 },
				   { related_id: 'c2a6b03f190dfb2b4aa91f8af8d477a9bc3401dc',
					 term: 'new',
					 score: 29.419982372231935 },
				   { related_id: '5a013c49508291c6816ac388f93a2c11973086ed',
					 term: 'missing',
					 score: 29.419982372231935 },
				   { related_id: '9f9bdfe45a7826a6aa2109eb7caac1e8c57068fa',
					 term: 'homicide',
					 score: 23.380261601392018 },
				   { related_id: 'b3ae4f722a30578fac0191593f82a69346a877d0',
					 term: 'women',
					 score: 5.545177444479562 },
				   { related_id: '37ebb98c6a9d318933bdf044926f1f3208cc3940',
					 term: 'charged',
					 score: 5.545177444479562 },
				   { related_id: 'e0996a37c13d44c3b06074939d43fa3759bd32c1',
					 term: 'first',
					 score: 3.1191623125197534 },
				   { related_id: 'c758ce5194d711122a9cabd7024790ba05e38832',
					 term: 'charges',
					 score: 3.1191623125197534 },
				   { related_id: 'ad782ecdac770fc6eb9a62e44f90873fb97fb26b',
					 term: 'two',
					 score: 3.1191623125197534 },
				   { related_id: '34eb4c4ef005207e8b8f916b9f1fffacccd6945e',
					 term: 'action',
					 score: 3.1191623125197534 },
				   { related_id: 'fe05bcdcdc4928012781a5f1a2a77cbb5398e106',
					 term: 'one',
					 score: 1.3862943611198906 } ] 
				}
			}
		}
	], function(err, data) {
		console.log(util.inspect(data) + ":" + err);
	});
