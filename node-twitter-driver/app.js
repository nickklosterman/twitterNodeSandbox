env = process.env.NODE_ENV || 'development';

var Twitter = require('node-twitter');
var twitterRestClient = new Twitter.RestClient(
  process.env.TWITTER_CONSUMER_KEY, 
  process.env.TWITTER_CONSUMER_SECRET,
  process.env.TWITTER_ACCESS_TOKEN_KEY,
  process.env.TWITTER_ACCESS_TOKEN_SECRET
);
twitterRestClient.statusesHomeTimeline({/*count:5*/}, function(error, result) {
  if (error)
  {
    console.log('Error: ' + (error.code ? error.code + ' ' + error.message : error.message));
  }

  if (result)
  {
    //sort the results by user name (asc order)
    result.sort(function(a,b) {
      if (a.user.name > b.user.name) { 
	return 1 
      } else { 
	return -1 
      }
    })
    result.forEach(function(element,index,fullArray) {
	          if (typeof element.user !== 'undefined'
		    && typeof element.user.name !=='undefined'
		    && typeof  element.text!== 'undefined') {
                    //id_str can be used in a filename as it is a unqiue identifier to the producing tweet. i think you would need user_name + id_str; useful for naming images stripped from tweets.

                    extractImages(element,function(mediaURLArray){
                      //if we found photoes
		      if (typeof mediaURLArray !== 'undefined'
                        && mediaURLArray.len >1){
		        console.log(element.user.name+":"+element.text+":")
                        mediaURLArray.forEach(function(element,index,fullArray) {
                          console.log("  media:"+element)
                        })
                      } else { 
		        console.log(element.user.name+":"+element.text)
		      }
                    })
                  } else {
		    console.log('bad item')
	          }

    })
  }
});

//not used bc scope of 'element' isn't visible within callback
// function outputTweets(mediaURLArray) {
//   //if we found photoes
//   if (typeof mediaURLArray !== 'undefined'
//     && mediaURLArray.len >1){ // && typeof mediaUrl !== 'undefined') {
//     console.log(element.user.name+":"+element.text+":")
//     mediaURLArray.forEach(function(element,index,fullArray) {
//       console.log("  media:"+element)
//     })
//   } else { 
//     console.log(element.user.name+":"+element.text)
//   }
// }

function extractImages(element,cb) {
  var mediaURLArray=[]
  if ( element.entities['media'] ) {
    var mediaEntities = element.entities['media'] //there is also a hashtags entity.
    //loop over the media entities and if there is a photo push it into our array		      
    mediaEntities.forEach(function(element,index,fullArray) { 
      if ( element.type === "photo") {  //currently (Mon Oct 27 10:49:24 EDT 2014) there is only a `photo` type according to the API
	mediaURLArray.push(element.media_url)
      }
    })
  }
  cb(mediaURLArray)
}


var twitterSearchClient = new Twitter.SearchClient(
  process.env.TWITTER_CONSUMER_KEY, 
  process.env.TWITTER_CONSUMER_SECRET,
  process.env.TWITTER_ACCESS_TOKEN_KEY,
  process.env.TWITTER_ACCESS_TOKEN_SECRET
);
var query='inktober'
twitterSearchClient.search({'q':query,'count':25},function(error,result) {
if (error)
    {
        console.log('Error: ' + (error.code ? error.code + ' ' + error.message : error.message));
    }

    if (result)
    {
console.log("-------------------------")
console.log("results for :"+query)
//        console.log(result);
    result.statuses.forEach(function(element,index,fullArray) {
	          if (typeof element.user !== 'undefined'
		    && typeof element.user.name !=='undefined'
		    && typeof  element.text!== 'undefined') {
                    //id_str can be used in a filename as it is a unqiue identifier to the producing tweet. i think you would need user_name + id_str; useful for naming images stripped from tweets.

                    extractImages(element,function(mediaURLArray){
                      //if we found photoes
		      if (typeof mediaURLArray !== 'undefined'
                        && mediaURLArray.len >1){
		        console.log(element.user.name+":"+element.text+": photo elements found:")
                        mediaURLArray.forEach(function(element,index,fullArray) {
                          console.log("  media:"+element)
                        })
                      } else { 
		        console.log(element.user.name+":"+element.text+":"+mediaURLArray)
		      }
                    })
                  } else {
		    console.log('bad item')
	          }

    })

    }
});

var twitterStreamClient = new Twitter.StreamClient(
  process.env.TWITTER_CONSUMER_KEY, 
  process.env.TWITTER_CONSUMER_SECRET,
  process.env.TWITTER_ACCESS_TOKEN_KEY,
  process.env.TWITTER_ACCESS_TOKEN_SECRET
);

twitterStreamClient.on('close', function() {
    console.log('Connection closed.');
});
twitterStreamClient.on('end', function() {
    console.log('End of Line.');
});
twitterStreamClient.on('error', function(error) {
    console.log('Error: ' + (error.code ? error.code + ' ' + error.message : error.message));
});
twitterStreamClient.on('tweet', function(tweet) {
//    console.log(tweet);
                    extractImages(tweet,function(mediaURLArray){
                      //if we found photoes
		      if (typeof mediaURLArray !== 'undefined'
                        && mediaURLArray.len >1){
		        console.log(tweet.user.name+":"+tweet.text+":")
                        mediaURLArray.forEach(function(element,index,fullArray) {
                          console.log("  media:"+element)
                        })
                      } else { 
		        console.log(tweet.user.name+":"+tweet.text)
		      }
                    })

});

twitterStreamClient.start(['inktober', 'sketch_dailies']);