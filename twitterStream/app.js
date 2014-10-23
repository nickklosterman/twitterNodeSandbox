
//http://www.informit.com/articles/article.aspx?p=1947699&seqNum=4
var app = require('express').createServer(),
    twitter = require('ntwitter');

app.listen(3000);

env = process.env.NODE_ENV || 'development';
process.config = require('./config')[env];

var twit = new twitter({
  consumer_key: process.env.TWITTER_CONSUMER_KEY, 
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET, 
  access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY, 
  access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET 
});


//twit.stream('statuses/filter', { track: ['love', 'hate'] }, function(stream) {
twit.stream('user' , function(stream) {
//twit.stream('user_timeline',{screen_name:'eric_canete', count:25} , function(stream){ 
  stream.on('data', function (data) {
      console.log('----')
      //console.log(data);
      if (typeof data.user !== 'undefined' 
	  && typeof data.user.name !== 'undefined') {
	  console.log('New Tweet from '+data.user.name)
      }
      if (typeof data.text !== 'undefined') {
	  console.log(' Tweet: '+data.text)
      }
      
      if ( typeof data.entities !=='undefined' 
	   && typeof data.entities['media'] !== 'undefined') {
	  var dataEntities = data.entities['media']
	  dataEntities.forEach(function(element,index,fullArrray){
      	      if ( element.type == "photo" ) {
		  var mediaUrl = element.media_url;
      		  console.log(' Media: '+mediaUrl)
      	      } 
	  })
      }
	  
  });
});
 
// //ericcanete
// twit.get('statuses/user_timeline', {screen_name:'fabien_mense'} , function ( err, data, response ) { 
// console.log(err)
// console.log(data)
// console.log(response)
// });

// twit.get('statuses/home_timeline' , function ( err, data, response ) { 
// console.log(err)
// console.log(data)
// console.log(response)
// });


// //twit.get('followers/ids', { screen_name: 'ericcanete' },  function (err, data, response) {
// twit.get('followers/ids',  function (err, data, response) {
// console.log(err)
// console.log(data)
// console.log(response)
// })
