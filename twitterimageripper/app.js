
//This module can be used to either download images from a user or from that users followers or the friends of that user

env = process.env.NODE_ENV || 'development';

//var Twitter = require('node-twitter');
var Twitter = require('../../node-twitter/lib/Twitter');
var fs = require('fs'),
    request = require('request')


function TwitterImageRipper(screen_name){
  this.screen_name=screen_name
  this.friendsScreenNameList = []

  //is it bad practice to automatically create a client even if it isin't going to be used?
  this.twitterRestClient = new Twitter.RestClient(
    process.env.TWITTER_CONSUMER_KEY,
    process.env.TWITTER_CONSUMER_SECRET,
    process.env.TWITTER_ACCESS_TOKEN_KEY,
    process.env.TWITTER_ACCESS_TOKEN_SECRET
  );

  this.twitterSearchClient = new Twitter.SearchClient(
    process.env.TWITTER_CONSUMER_KEY,
    process.env.TWITTER_CONSUMER_SECRET,
    process.env.TWITTER_ACCESS_TOKEN_KEY,
    process.env.TWITTER_ACCESS_TOKEN_SECRET
  );
}

TwitterImageRipper.prototype.extractImages = function(element,cb) {
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

//meant to be used with friendsIds
TwitterImageRipper.prototype.usersLookup = function (method) {
  switch(method) {
    case 'screen_name':
    console.log("I don't really know in what case you would use this function.")
    this.twitterRestClient.usersLookup({'screen_name':inputString},function(error,result){
      if (error) {
	console.log('Error: ' + (error.code ? error.code + ' ' + error.message : error.message));
      }
      if (result) {
	result.forEach(function(element,index,fullArray) {
	  if (typeof element.user !== 'undefined'
	    && typeof element.user.name !=='undefined'
	    && typeof  element.text!== 'undefined') {
	    console.log(element.user.name)
	    console.log(element.user.screen_name)
	  }
	})
      }
    })
    break;

    case 'user_id':
    var inputString ='"'
    this.friendsIds.forEach(function(element,index,fullArray){
      inputString+=element
      if (index !== this.friendsIds.length - 1) {
        inputString+=','
      }
    })
    inputString += '"'

    this.twitterRestClient.usersLookup({'user_id':inputString},function(error,result){
      if (error) {
	console.log('Error: ' + (error.code ? error.code + ' ' + error.message : error.message));
      }
      if (result) {
	result.forEach(function(element,index,fullArray) {
	  if (typeof element.user !== 'undefined'
	    && typeof element.user.name !=='undefined'
	    && typeof  element.text!== 'undefined') {
	    console.log(element.user.name)
	    console.log(element.user.screen_name)
	  }
	})
      }
    })
  break;
  }
}

//Meant to be run to get all friends
TwitterImageRipper.prototype.getFriendsList = function(result,cb) {
  if (typeof result !== 'undefined') {
    var next_cursor_str = result.next_cursor_str?result.next_cursor_str:'-1'
  }
  var that = this // we need to capture off our 'this' and use that inside the twitterRestClient, otherwise we'll be using the twitterRestClient's this
  this.twitterRestClient.friendsList({'screen_name':this.screen_name,'count':200,'cursor':next_cursor_str},function(error,result){
    if (error) {
      console.log('Error: ' + (error.code ? error.code + ' ' + error.message : error.message));
    }
    if (result) {
      result.users.forEach(function(element,index,fullArray) {
        //console.log(element)
	if (typeof element.screen_name !== 'undefined') {
	  //console.log(element.screen_name)
          //console.log(that)
          that.friendsScreenNameList.push(element.screen_name)
	}
      })
      if (result.next_cursor_str !== '0' ){
        that.getFriendsList(result,cb)
      } else {
        cb(that) //we need to pass in our context to the callback
      }
    }

  })
}

TwitterImageRipper.prototype.getFriendsIds = function () {
// my test case twitter user doesn't have that more than ~20 friends
this.twitterRestClient.friendsIds({'user_name':this.screen_name,'count':200}, function(error, result) {
    if (error) {
	console.log('Error: ' + (error.code ? error.code + ' ' + error.message : error.message));
    }
    if (result) {
      result.ids.forEach(function(element,index,fullArray) {
	//console.log(element)
	})
      this.getMoreFriendsIds(result)
    }
})		      
}

// TwitterImageRipper.prototype.getMoreFriendsIds = function (result) {
// this.twitterRestClient.friendsIds({'cursor':result.next_cursor_str}, function(error, result) {
//     if (error) {
// 	console.log('Error: ' + (error.code ? error.code + ' ' + error.message : error.message));
//     }
//     if (result) {
//       result.ids.forEach(function(element,index,fullArray) {
// 	console.log(element)
// 	})
//       this.getMoreFriendsIds(result.next_cursor_str)
//     }
// })		      
// }

// TwitterImageRipper.prototype.getMoreFriendsList = function(result) {
// this.twitterRestClient.friendsList({'cursor':result.next_cursor_str}, function(error, result) {
//     if (error) {
// 	console.log('Error: ' + (error.code ? error.code + ' ' + error.message : error.message));
//     }
//     if (result) {
//       result.users.forEach(function(element,index,fullArray) {
// 	console.log(element.screen_name)
//         console.log(this)
//         this.friendsScreenNameList.push(element.screen_name)
// 	})
//       console.log(result.next_cursor_str)
//       if (result.next_cursor_str !== "0") {
//         this.getMoreFriendsList(result)
//       } else {
//         this.downloadUserImages()
//       }
//     }
// })		      
// }



TwitterImageRipper.prototype.getFriendImages = function () {
this.getFriendsList({'next_cursor_str':'-1'},this.downloadFriendImages)
// this.freindsScreenNameList.forEach(function(element,index,fullArray) {
//   console.log(element)
// })
}

TwitterImageRipper.prototype.downloadFriendImages = function (context) {
context.friendsScreenNameList.forEach(function(element,index,fullArray){
  context.saveImages(element)
  //console.log(element)
})
}

TwitterImageRipper.prototype.downloadUserImages = function () {
  this.saveImages(this.screen_name)
}

TwitterImageRipper.prototype.saveImages=function(screen_name){
  var query='from:'+screen_name+' filter:images'
  var that = this //save off our context for use inside of twittterSearchClient
  this.twitterSearchClient.search({'q':query,'count':25},function(error,result) {
    if (error) {
      console.log('Error: ' + (error.code ? error.code + ' ' + error.message : error.message));
    }
    if (result) {
      result.statuses.forEach(function(element,index,fullArray) {
	if (typeof element.user !== 'undefined'
	  && typeof element.user.name !=='undefined'
	  && typeof  element.id_str !== 'undefined') {

          that.extractImages(element,function(mediaURLArray){
            //if we found photoes
	    if (typeof mediaURLArray !== 'undefined'
              && mediaURLArray.length >0){
	      //console.log(element.user.name+"_"+element.id_str)
              var filename = element.user.name+"_"+element.id_str
              mediaURLArray.forEach(function(element,index,fullArray) {
                console.log("  media:"+element)
                that.saveFile(element,filename)
              })
            } else { 
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
}

// var twitterSearchClient = new Twitter.SearchClient(
//   process.env.TWITTER_CONSUMER_KEY, 
//   process.env.TWITTER_CONSUMER_SECRET,
//   process.env.TWITTER_ACCESS_TOKEN_KEY,
//   process.env.TWITTER_ACCESS_TOKEN_SECRET
// );
// // //var query='inktober filter:images'
// // //var query='from:ericcanete filter:images'
// // //var query='from:fabien_mense filter:images'
// var query='from:mrjakeparker+OR+from:rafchu+OR+from:fabien_mense+OR+from:ericcanete+OR+from:skottieyoung+OR+from:coryloftis+OR+from:kevinwada+OR+from:kindachinese+OR+from:bill_otomo+OR+from:cii+OR+from:gobite+OR+from:catsuka+OR+from:karlkerschl+OR+from:higallerygerard+OR+from:kristaferanka+OR+from:terrydodsonart+OR+from:inkybat+OR+from:zacgormania+OR+from:2dbean+OR+from:humberto_ramos+OR+from:leinilyu+OR+from:audreykawasaki+OR+from:jamesharren1+OR+from:taramcpherson+OR+from:jimlee+OR+from:royalboiler+OR+from:ah_adam_hughes+OR+from:paulsmithdraws+OR+from:gingerhazingphilnotojock4twenty+OR+from:chrissamnee+OR+from:jimmahfood+OR+from:sara_pichelli+OR+from:nthonyholden2dcale+OR+from:jcaffoe+OR+from:nimasprout+OR+from:allisonsmithart+OR+from:tnsk+OR+from:bengal_art filter:images' //another method could be to use twitter lists and grab tweets from that list
// query='from:coryloftis+OR+from:kevinwada+OR+from:kindachinese+OR+from:bill_otomo+OR+from:cii+OR+from:gobite+OR+from:catsuka+OR+from:karlkerschl+OR+from:higallerygerard+OR+from:kristaferanka+OR+from:terrydodsonart+OR+from:inkybat+OR+from:zacgormania+OR+from:2dbean+OR+from:humberto_ramos+OR+from:leinilyu+OR+from:audreykawasaki filter:images' //another method could be to use twitter lists and grab tweets from that list
// //query ='from:jamesharren1+OR+from:taramcpherson+OR+from:jimlee+OR+from:royalboiler+OR+from:ah_adam_hughes+OR+from:paulsmithdraws+OR+from:gingerhazingphilnotojock4twenty+OR+from:chrissamnee+OR+from:jimmahfood+OR+from:sara_pichelli+OR+from:nthonyholden2dcale+OR+from:jcaffoe+OR+from:nimasprout+OR+from:allisonsmithart+OR+from:tnsk+OR+from:bengal_art filter:images'
// //query ='from:bengal_art filter:images' 
// twitterSearchClient.search({'q':query,'count':25},function(error,result) {
// if (error)
//     {
//         console.log('Error: ' + (error.code ? error.code + ' ' + error.message : error.message));
//     }
//     if (result)
//     {
// console.log("-------------------------")
// console.log("results for :"+query)
// //        console.log(result);
//     result.statuses.forEach(function(element,index,fullArray) {
// 	          if (typeof element.user !== 'undefined'
// 		    && typeof element.user.name !=='undefined'
// 		    && typeof  element.text!== 'undefined') {
//                     //id_str can be used in a filename as it is a unqiue identifier to the producing tweet. i think you would need user_name + id_str; useful for naming images stripped from tweets.

//                     extractImages(element,function(mediaURLArray){
//                       //if we found photoes
// 		      if (typeof mediaURLArray !== 'undefined'
//                         && mediaURLArray.length >0){
// //		        console.log(element.user.name+":"+element.text+": photo elements found:")
// 		        console.log(element.user.name+"_"+element.id_str)
//                         var filename = element.user.name+"_"+element.id_str
//                         mediaURLArray.forEach(function(element,index,fullArray) {
//                           console.log("  media:"+element)
//                           saveFile(element,filename)
//                         })
//                       } else { 
// //		        console.log(element.user.name+":"+element.text+":"+mediaURLArray)
// 		        console.log(element.user.name)
//                         console.log(mediaURLArray.length)
// 		      }
//                     })
//                   } else {
// 		    console.log('bad item')
// 	          }

//     })

//     }
// });

TwitterImageRipper.prototype.saveFile = function(url,filename) {
  var imageStream=fs.createWriteStream(filename)
  imageStream.on('close',function(){
    console.log("Writing of "+filename+" done.")
  })

  //tack on `:large` so we get the large image
  var options = {url:url+":large",headers:{ 'User-Agent':'request'}}
  var imagerequest=request(options,function(err,resp,body) {
                     if (err){
		       if (err.code === 'ECONNREFUSED') {
			 console.error(url+'Refused connection');
		       } else if (err.code==='ECONNRESET') {
			 console.error(url+'reset connection')
		       } else if (err.code==='ENOTFOUND') {
			 console.error(url+'enotfound')
		       } else {
			 console.log(url+err);
			 console.log(err.stack);
		       }
                       this.saveFile(url,filename);//call ourself again if there was an error (mostlikely due to hitting the server too hard)
		     }
                   })
  imagerequest.pipe(imageStream)
}

module.exports = TwitterImageRipper