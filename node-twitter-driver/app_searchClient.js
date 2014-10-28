env = process.env.NODE_ENV || 'development';

var Twitter = require('node-twitter');
var fs = require('fs'),
    request = require('request')

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
//var query='inktober filter:images'
//var query='from:ericcanete filter:images'
//var query='from:fabien_mense filter:images'
var query='from:mrjakeparker+OR+from:rafchu+OR+from:fabien_mense+OR+from:ericcanete+OR+from:skottieyoung filter:images' //another method could be to use twitter lists and grab tweets from that list
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
                        && mediaURLArray.length >0){
//		        console.log(element.user.name+":"+element.text+": photo elements found:")
		        console.log(element.user.name+"_"+element.id_str)
                        var filename = element.user.name+"_"+element.id_str
                        mediaURLArray.forEach(function(element,index,fullArray) {
                          console.log("  media:"+element)
                          saveFile(element,filename)
                        })
                      } else { 
//		        console.log(element.user.name+":"+element.text+":"+mediaURLArray)
		        console.log(element.user.name)
                        console.log(mediaURLArray.length)
		      }
                    })
                  } else {
		    console.log('bad item')
	          }

    })

    }
});

function saveFile(url,filename){
  var imageStream=fs.createWriteStream(filename)
  imageStream.on('close',function(){
    console.log("Writing of "+filename+" done.")
  })

  //tack on so we get the large image
  var options = {url:url+":large",headers:{ 'User-Agent':'request'}}
  var imagerequest=request(options,function(err,resp,body){
                     if (err){
		       if (err.code === 'ECONNREFUSED'){
			 console.error(url+'Refused connection');
		       } else if (err.code==='ECONNRESET'){
			 console.error(url+'reset connection')
		       } else if (err.code==='ENOTFOUND'){
			 console.error(url+'enotfound')
		       } else {
			 console.log(url+err);
			 console.log(err.stack);
		       }
                       //getImage(comicImage,that.doneFlag);//call ourself again if there was an error (mostlikely due to hitting the server too hard)
		     }
                   })
  imagerequest.pipe(imageStream)
}