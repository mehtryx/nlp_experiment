var _ = require('underscore'),
	util = require('util');
	
var sample = { index: 
   { _index: 'cortex',
     _type: 'terms',
     _id: 'dc9186a06078733915a6fcbab34e59120be2b484',
     data: 
      { id: 'dc9186a06078733915a6fcbab34e59120be2b484',
        term: 'vladimir',
        relationships: 
         [ { related_id: '7044ef6c89aeee2fc7d7095fc1e78d83e5920335',
             related_term: 'and media',
             related_score: 0.15658532843209588 },
           { related_id: '79a9d178235eb1dcd4bbeaa340691c29807ca706',
             related_term: 'arts',
             related_score: 0.15658532843209588 },
           { related_id: 'd196ff3a53ae954f7e4387add752586cc57d05e4',
             related_term: 'black sea',
             related_score: 0.15658532843209588 },
           { related_id: 'ab65d8b9611fb58f4c612f6a5ec239e0e73fd38c',
             related_term: 'canada',
             related_score: 6.386294361119891 },
           { related_id: 'c3c67e7b40214ee43f0ad8d0e40b30c3d2ac3547',
             related_term: 'crimea',
             related_score: 24.956726942625227 },
           { related_id: '014acbfe6cf12f0fb50f1c523f30e2903e5088b5',
             related_term: 'crimean legislature',
             related_score: 0.15658532843209588 },
           { related_id: 'f92876cd85baaf6996175bc0949c5d465c8e6dd5',
             related_term: 'eastern europe',
             related_score: 0.15658532843209588 },
           { related_id: '7fd41f69d56aec773d7c5bfb109dd4633b197db7',
             related_term: 'elections and voting',
             related_score: 0.15658532843209588 },
           { related_id: 'c32b941d4ed063de2f7fb1669124175ed90cde46',
             related_term: 'entertainment',
             related_score: 0.15658532843209588 },
           { related_id: '19f68053cb703302512381ddc2f23e16789db44f',
             related_term: 'european politics',
             related_score: 0.15658532843209588 },
           { related_id: 'a64fd3a5e47cd74c6b1b2c52c95884c0ea85079f',
             related_term: 'getty images inc.',
             related_score: 0.15658532843209588 },
           { related_id: '75a46f784acdd6cef00097c9edaebb099d7a9c67',
             related_term: 'government and politics',
             related_score: 0.15658532843209588 },
           { related_id: 'e8992a407aa60587558ebdbefe9b90a4f1602489',
             related_term: 'interpol',
             related_score: 0.15658532843209588 },
           { related_id: 'fad7894bd411a1b93adc134cf531ef30ffab1c94',
             related_term: 'journalism',
             related_score: 0.15658532843209588 },
           { related_id: '216e43fd27ce258d4e3bb32fe5ed37e0283604f6',
             related_term: 'kiev',
             related_score: 0.15658532843209588 },
           { related_id: 'fd64f3a1b76191da90ca2271c7f1ddb5c9eee54d',
             related_term: 'kyiv',
             related_score: 9.45981065528196 },
           { related_id: 'bb362a46a483f3f8c993ec45978ae24e60b1ea4e',
             related_term: 'media',
             related_score: 0.15658532843209588 },
           { related_id: '83e8cef8d84f02139290f90f29c0338ee7b4c246',
             related_term: 'moscow',
             related_score: 7.847820615220354 },
           { related_id: '6c7e6eb988f7ca8a4a1a50496ecb3c3c87852add',
             related_term: 'oleg sluzarenko',
             related_score: 0.15658532843209588 },
           { related_id: '51d55774e645e23ce66930847bc1811c89594314',
             related_term: 'pn',
             related_score: 0.15658532843209588 },
           { related_id: '4c5fd84e89eda6074c7fed6fce2c6c199d4e2eb8',
             related_term: 'politics',
             related_score: 0.15658532843209588 },
           { related_id: 'f975d055c63358f6ebb8a4761b71a399dca7c3e1',
             related_term: 'postmedia network inc.',
             related_score: 0.15658532843209588 },
           { related_id: '1da47b117d8454a764c3927da1dc2e8848379985',
             related_term: 'pravda newspaper',
             related_score: 0.15658532843209588 },
           { related_id: 'b5806cf57b529e6c0a798e9d9214e6707b2ebcfa',
             related_term: 'protests and demonstrations',
             related_score: 0.15658532843209588 },
           { related_id: '961feca5be1c952253c6e0358630b2c4efdb7322',
             related_term: 'referenda',
             related_score: 0.15658532843209588 },
           { related_id: '46710697532bed53e4993980277a463637bd35d4',
             related_term: 'rostov-on-don',
             related_score: 0.15658532843209588 },
           { related_id: 'c705264ec3421bf319168aad7e8d2e1617bf9487',
             related_term: 'russia',
             related_score: 15.198563491233637 },
           { related_id: '45c373148fcacd78ca9a356ab5cdf9cf51afb407',
             related_term: 'russian politics',
             related_score: 0.15658532843209588 },
           { related_id: '992b782b4bf22f866fb8d9f320ec489ad04e23f8',
             related_term: 'sergei aksenov',
             related_score: 0.15658532843209588 },
           { related_id: '82764fb4f6f027006c2be26eb9b12320f4992c24',
             related_term: 'sevastopol',
             related_score: 7.847820615220354 },
           { related_id: 'cce585aead96fe7e09442d22a3871403c4219e4c',
             related_term: 'simferopol',
             related_score: 13.135182093288606 },
           { related_id: 'd0e2ea781783710aa6b81123667252f042f5e317',
             related_term: 'simon castro',
             related_score: 0.15658532843209588 },
           { related_id: 'e5f3e37091c467e256637adc520accaf9a151533',
             related_term: 'stalin-era ukraina hotel',
             related_score: 0.15658532843209588 },
           { related_id: '0c4fb5956d00091319b39929e084b02e0056bf93',
             related_term: 'ukraine',
             related_score: 37.122310969395116 },
           { related_id: '8edda96ea9728c72455ba0a43c644a7af94bc7c4',
             related_term: 'ukrainian politics',
             related_score: 0.15658532843209588 },
           { related_id: 'bf515b84d0f69a0b519a1155b72689a580f16298',
             related_term: 'viktor yanukovych',
             related_score: 0.15658532843209588 },
           { related_id: '98cbcfb01b3d18ddf073055feb0d1917aa695275',
             related_term: 'vladimir konstantinov',
             related_score: 0.15658532843209588 },
           { related_id: '41bd4280793ab9c0b1cd68b039d0a442c02b18b4',
             related_term: 'vladimir putin',
             related_score: 0.15658532843209588 },
           { related_id: '97b304c6c2a5954f5c65f3f1e9446f01144e4f82',
             related_term: 'world politics',
             related_score: 0.15658532843209588 },
           { related_id: '3c6bdcddc94f64bf77deb306aae490a90a6fc300',
             related_term: 'news',
             related_score: 0.017052142266255243 },
           { related_id: '7c211433f02071597741e6ff5a8ea34789abbf43',
             related_term: 'world',
             related_score: 0.017052142266255243 },
           { related_id: 'f8fd5fa7675349b5c4bdd55d271ca94e845580cf',
             related_term: 'russian',
             related_score: 40.53986644099046 },
           { related_id: '036870da21d1598971067a464f8f2e426a8b0e32',
             related_term: 'yanukovych',
             related_score: 19.776717645007146 },
           { related_id: 'a823464f131b53d5b0b18c4895b1a8f9b040b0bf',
             related_term: 'ukrainian',
             related_score: 17.412408675139822 },
           { related_id: 'bc792c1b20b65d1b9061e9c63cd756059eccce45',
             related_term: 'crimean',
             related_score: 13.135182093288606 },
           { related_id: '2069affb2b97fb3b0d4676f420b57e833cbe92bb',
             related_term: 'sluzarenko',
             related_score: 11.22226448130471 },
           { related_id: '7d9ac9826241e97b755a642a74d8134c43a15686',
             related_term: 'parliament',
             related_score: 10.83339258920235 },
           { related_id: '1785a93e5a968f37278f64cef35098943f62b438',
             related_term: 'government',
             related_score: 9.45981065528196 },
           { related_id: '29cf0a63a0aa34033b7fa5c536759e0d70d484bc',
             related_term: 'newspaper',
             related_score: 7.847820615220354 },
           { related_id: 'c445760bcf1b7c714a914e06783818ac74089c36',
             related_term: 'getty',
             related_score: 6.386294361119891 },
           { related_id: '19f49d852660fe0a079cbf95c3efb34ba88de911',
             related_term: 'images',
             related_score: 6.386294361119891 },
           { related_id: '20b70f0af00562e63758b9ee42012ecc96c58590',
             related_term: 'oleg',
             related_score: 6.386294361119891 },
           { related_id: 'dc9186a06078733915a6fcbab34e59120be2b484',
             related_term: 'vladimir',
             related_score: 6.386294361119891 } ] } } };


var result = _.findWhere(sample.index.data.relationships, { related_id: '20b70f0af00562e63758b9ee42012ecc96c58590' });
console.log(result);
console.log("score: " + result.related_score);
