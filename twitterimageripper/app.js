
//This module can be used to either download images from a user or from that users followers or the friends of that user

env = process.env.NODE_ENV || 'development';

//var Twitter = require('node-twitter');
var Twitter = require('../../node-twitter/lib/Twitter');  //YOU MUST download and use my version of node-twitter from Github. I added some functionality that isn't in the mainline one. 
var fs = require('fs'),
    request = require('request'),
    http = require('http'),
    https = require('https')


function TwitterImageRipper(screen_name){
  this.screen_name=screen_name
  this.friendsScreenNameList = []
  this.friendsList = []
  this.friendsListFromDisk = []
  this.friendsIds = []
  this.friendsIdsFromDisk = []
  this.requestCounter = 0
  this.numberOfRequests = 0
  this.flag429 = false
  this.imageSize = 'large'
  this.friendsIdsFilename = 'friendsIds.txt'
  this.friendsScreenListFilename = 'friendsScreenList.txt'
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
	console.trace('Error: ' + (error.code ? error.code + ' ' + error.message : error.message));
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
	console.trace('Error: ' + (error.code ? error.code + ' ' + error.message : error.message));
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

//Meant to be run to get all friends and call the cb when there are no more friends to grab
TwitterImageRipper.prototype.getFriendsList = function(result,cb) {
  // if (typeof cb === 'undefined'
  //   || typeof cb !== 'function' ) {
  //   console.log("No Callback provided")
  //   cb = function() {}
  // } 
  if (typeof result !== 'undefined') {
    var next_cursor_str = result.next_cursor_str?result.next_cursor_str:'-1'
  }
  var that = this // we need to capture off our 'this' and use that inside the twitterRestClient, otherwise we'll be using the twitterRestClient's this
  this.twitterRestClient.friendsList({'screen_name':this.screen_name,'count':200,'cursor':next_cursor_str},function(error,result){
    if (error) {
      if (error.code === 429 /* too many requests */)
      {
        that.flag429 = true // instead of calling saveImages, call a function that clears the flag and then calls saveImages?
        console.log("Error 429. Retry in 15 minutes when new queries allowed")
        //if there were too many requests we call the same function again but after a 15 minute timeout
        setTimeout( that.getFriendsList.bind(that),15*60*1000,result,cb )
      } else {
        console.trace('Error: ' + (error.code ? error.code + ' ' + error.message : error.message));
      }
    }
    // if results were returned populate our friendsList array with them
    if (result) {
      result.users.forEach(function(element,index,fullArray) {
        //console.log(element)
	if (typeof element.screen_name !== 'undefined') {
	  //console.log(element.screen_name)
          //console.log(that)
          that.friendsScreenNameList.push(element.screen_name)
          that.friendsList.push(element)
	}
      })
      if (result.next_cursor_str !== '0' ){
        that.getFriendsList(result,cb)
	console.log("calling getFriendsList again")
      } else {
	console.log("calling callback")
        cb(that) //we need to pass in our context to the callback
      }
    }

  })
}

TwitterImageRipper.prototype.outputFriendsList = function () {
  var that = this
  this.getFriendsList({'next_cursor_str':'-1'},function () {
    //	console.log(this)
    //	console.log(that)
    if (typeof that.friendsList !== 'undefined'
      && that.friendsList.length > 0 ) {
      console.log("this.friendsList"+that.friendsList.length)
      that.friendsList.forEach(function(element,index,fullArray) {
	if (typeof element.screen_name !== 'undefined'
	  && typeof element.name !== 'undefined') {
	  console.log(element.screen_name+":"+element.name)
	}
      })

    } else {
      console.log("fail")
      console.log(typeof that.friendsList)
      if (that.friendsList) {
	console(that.friendsList.length)
      }
    }
  })
}

TwitterImageRipper.prototype.writeFriendsListToDisk = function (context,cb) {
  console.log('writeFriendsIdsToDisk')
  //  console.log(this)
  //  console.log(context)
  // var that = this
  if (context.friendsList.length>0) {
    if (fs.exists(context.friendsScreenListFilename)){
      console.log("overwriting "+context.friendsScreenListFilename)
    }
    fs.writeFile(context.friendsScreenListFilename,JSON.stringify(context.friendsList),function(err) {
      if (err) throw err;
      console.log(context.friendsScreenListFilename+' saved!');
    })
  } else {
    console.log("friendsList length is 0")
  }
}

TwitterImageRipper.prototype.getFriendsListFromDisk = function (cb) {
  console.log('getFriendsListFromDisk')
  var that = this;
  console.log(this.friendsScreenListFilename);
  fs.exists(this.friendsScreenListFilename,function(exists) {
    if (!exists){
      console.log(this.friendsScreenListFilename+" doesn't exit") ;
    } else  {
      fs.readFile(that.friendsScreenListFilename, function (err, data) {
        if (err) throw err;
        //console.log(data);
//        return JSON.parse(data);
       that.friendsListFromDisk = JSON.parse(data); //I couldn't think of another way to get the ids from disk and use a return and also use a callback on that data to perform the compare after the data was obtained.
        //that.friendsListFromDisk.forEach(function(element,index,fullArray){
        //console.log(element.screen_name)
        //});
        console.log('getFriendsListFromDisk 2');
        cb()
      });
    }
  });
}

TwitterImageRipper.prototype.writeFriendsIdsToDisk = function (context,cb) {
  console.log('writeFriendsIdsToDisk')
  //  console.log(this)
  //console.log(context)
  // var that = this
  if (context.friendsIds.length>0) {
    if (fs.exists(context.friendsIdsFilename)){
      console.log("overwriting "+context.friendsIdsFilename)
    }
    fs.writeFile(context.friendsIdsFilename,JSON.stringify(context.friendsIds),function(err) {
      if (err) throw err;
      console.log(context.friendsIdsFilename+' saved!');
    })
  } else {
    console.log("friendsIds length is 0")
  }
}

TwitterImageRipper.prototype.getFriendsIdsFromDisk = function (cb) {
  console.log('getFriendsIdsFromDisk')
  var that = this;
  console.log(this.friendsIdsFilename);
  fs.exists(this.friendsIdsFilename,function(exists) {
    if (!exists){
      console.log(this.friendsIdsFilename+" doesn't exit") ;
    } else  {
      fs.readFile(that.friendsIdsFilename, function (err, data) {
        if (err) throw err;
        //console.log(data);
//        return JSON.parse(data);
       that.friendsIdsFromDisk = JSON.parse(data); //I couldn't think of another way to get the ids from disk and use a return and also use a callback on that data to perform the compare after the data was obtained.
        console.log('getFriendsIdsFromDisk 2');
        cb()
      });
    }
  });
}

TwitterImageRipper.prototype.compareFriendsIds = function (cb) {
  var that = this;
  var compareResult =function() {
    if (that.friendsIds.length>0 && that.friendsIdsFromDisk.length>0) {
      //console.log(that.friendsIdsFromDisk.length)
      if (that.friendsIds.length !== that.friendsIdsFromDisk.length){
        console.log("friends ids length mismatch")
        console.log("that.friendsIds.length:"+that.friendsIds.length+"  friendsIdsFromDisk.length"+ that.friendsIdsFromDisk.length)
        cb({'lengthMatch':false}); //call the callback with a false value passed in
      } else {
        console.log("match");
        cb({'lengthMatch':true}); //call the callback with a true value passed in
      }
    } else {
      console.log("that.friendsIds.length that.friendsIdsFromDisk.length") 
      console.log(that.friendsIds.length+" "+that.friendsIdsFromDisk.length)
      console.log("fail")
    }
  }

  this.getFriendsIdsFromDisk(compareResult)
  this.getFriendsIds({},compareResult)
}

TwitterImageRipper.prototype.getFriendsIds = function (result,cb) {
  console.log('getFriendsIds')
  var that = this
  // my test case twitter user doesn't have that more than ~20 friends
  // you can request up to 5000 followers ids. Use this function in conjunction with the getFriendsList to update local store
  if (typeof result !== 'undefined') {
    var next_cursor_str = result.next_cursor_str?result.next_cursor_str:'-1'
  }
  this.twitterRestClient.friendsIds({'user_name':this.screen_name,'count':5000,'cursor':next_cursor_str}, function(error, result) {
    if (error) {
      if (error.code === 429 /* too many requests */)
      {
        //if there were too many requests we call the same function again but after a 15 minute timeout
        setTimeout( that.getFriendsIds.bind(that),15*60*1000,result,cb )
      } else {
        console.trace('Error: ' + (error.code ? error.code + ' ' + error.message : error.message));
      }
    }
    if (result) {
      result.ids.forEach(function(element,index,fullArray) {
        that.friendsIds.push(element)
      })
      if (result.next_cursor_str !== '0' ){
        that.getFriendsIds(result,cb)
	console.log("calling getFriendsIds again")
      } else {
	console.log("calling callback")
//callback to write the array to disk
        cb(that) //we need to pass in our context to the callback

      }
    }
  })		      
}

// Make a local check to see if we have the latest follower list;
//  if the length of the returned list from twitter matches the length of the local list, proceed to download the images 
//otherwise get the latest full list before downloading images.
TwitterImageRipper.prototype.getFriendImagesLocalCheck = function () {
  var that = this;
  var callback = function(result) {
    if (result['lengthMatch'] && result['lengthMatch'] === false ) {
      that.getFriendsList({'next_cursor_str':'-1'},that.downloadFriendImages)
    } else {
      console.log("      that.downloadFriendImages(that)")
      that.downloadFriendImages(that)
    }
  }
  this.compareFriendsIds(callback);
}

TwitterImageRipper.prototype.getFriendImages = function () {
//
  this.getFriendsList({'next_cursor_str':'-1'},this.downloadFriendImages)
  // this.freindsScreenNameList.forEach(function(element,index,fullArray) {
  //   console.log(element)
  // })
}

TwitterImageRipper.prototype.downloadFriendImages = function (context) {
//console.log(context.friendsScreenNameList.length)
//console.log(context)
  context.friendsScreenNameList.forEach(function(element,index,fullArray){
    if( context.flag429 === false) {
      context.saveImages(element)
    } else {
      process.stdout.write("q")
      setTimeout(context.saveImages.bind(context),15*60*1000,element)
      setTimeout(context.reset429Flag.bind(context),14*60*1000)
    }
    //console.log(element)
  })
}

//
// Download the images of the provided screen_name to the constructor
//
TwitterImageRipper.prototype.downloadUserImages = function () {
  this.saveImages(this.screen_name)
}

TwitterImageRipper.prototype.reset429Flag=function () {
  var time = new Date()
  process.stdout.write("flag429=false "+time.toString())
  this.flag429 = false
}
TwitterImageRipper.prototype.saveImages=function(screen_name){
  var query
  //console.log("this:"+typeof this)
//  console.log(this)
  var that = this //save off our context for use inside of twittterSearchClient
  if (this.flag429 === true) {
    setTimeout( that.saveImages.bind(that),15*60*1000,screen_name ) //wait 15mins before trying again
    setTimeout( that.reset429Flag.bind(that),14*60*1000)
    process.stdout.write("Q")
  } else {
    console.log("this.flag429:"+this.flag429+"for "+screen_name)
    if (screen_name[0] === "#") { //if search is a hashtag search
      query = screen_name+' filter:images'
    } else {
      query='from:'+screen_name+' filter:images'
    }
    this.twitterSearchClient.search({'q':query,'count':25},function(error,result) {
      if (error) {
        if (error.code === 429 /* too many requests */)
        {
          //  console.log("that:"+typeof that)
          console.log("that.flag429:"+that.flag429+"for "+screen_name) //are the searches all being kicked off before any of them return such that they are all setting the 429 flag?
          that.flag429 = true // instead of calling saveImages, call a function that clears the flag and then calls saveImages?
          console.log("Error 429. Retry in 15 minutes when new queries allowed")
          //if there were too many requests we call the same function again but after a 15 minute timeout
          setTimeout( that.saveImages.bind(that),15*60*1000,screen_name )
          setTimeout( that.reset429Flag.bind(that),14*60*1000)
        } else {
          console.trace('Error: ' + (error.code ? error.code + ' ' + error.message : error.message));
        }
      }
      if (result) {
        result.statuses.forEach(function(element,index,fullArray) {
	  if (typeof element.user !== 'undefined'
	    && typeof element.user.name !=='undefined'
	    && typeof  element.id_str !== 'undefined') {

            that.extractImages(element,function(mediaURLArray){
              //if we found photos
	      if (typeof mediaURLArray !== 'undefined'
                && mediaURLArray.length > 0){
	        //console.log(element.user.name+"_"+element.id_str)
                var filename = element.user.name+"_"+element.id_str
                var data = {username: element.user.name, idstr:element.id_str}
                var mediaURLArrayLength = mediaURLArray.length
                mediaURLArray.forEach(function(element,index,fullArray) {  //save off message text as well? Then can merge the image and text using IM. 
                  //console.log(" media:"+element)
                  that.saveFile(element,data) //filename+"_"+index+".image")
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
}
// // //var query='inktober filter:images'
// // //var query='from:ericcanete filter:images'
// // //var query='from:fabien_mense filter:images'
// var query='from:mrjakeparker+OR+from:rafchu+OR+from:fabien_mense+OR+from:ericcanete+OR+from:skottieyoung+OR+from:coryloftis+OR+from:kevinwada+OR+from:kindachinese+OR+from:bill_otomo+OR+from:cii+OR+from:gobite+OR+from:catsuka+OR+from:karlkerschl+OR+from:higallerygerard+OR+from:kristaferanka+OR+from:terrydodsonart+OR+from:inkybat+OR+from:zacgormania+OR+from:2dbean+OR+from:humberto_ramos+OR+from:leinilyu+OR+from:audreykawasaki+OR+from:jamesharren1+OR+from:taramcpherson+OR+from:jimlee+OR+from:royalboiler+OR+from:ah_adam_hughes+OR+from:paulsmithdraws+OR+from:gingerhazingphilnotojock4twenty+OR+from:chrissamnee+OR+from:jimmahfood+OR+from:sara_pichelli+OR+from:nthonyholden2dcale+OR+from:jcaffoe+OR+from:nimasprout+OR+from:allisonsmithart+OR+from:tnsk+OR+from:bengal_art filter:images' //another method could be to use twitter lists and grab tweets from that list
// query='from:coryloftis+OR+from:kevinwada+OR+from:kindachinese+OR+from:bill_otomo+OR+from:cii+OR+from:gobite+OR+from:catsuka+OR+from:karlkerschl+OR+from:higallerygerard+OR+from:kristaferanka+OR+from:terrydodsonart+OR+from:inkybat+OR+from:zacgormania+OR+from:2dbean+OR+from:humberto_ramos+OR+from:leinilyu+OR+from:audreykawasaki filter:images' //another method could be to use twitter lists and grab tweets from that list
// //query ='from:jamesharren1+OR+from:taramcpherson+OR+from:jimlee+OR+from:royalboiler+OR+from:ah_adam_hughes+OR+from:paulsmithdraws+OR+from:gingerhazingphilnotojock4twenty+OR+from:chrissamnee+OR+from:jimmahfood+OR+from:sara_pichelli+OR+from:nthonyholden2dcale+OR+from:jcaffoe+OR+from:nimasprout+OR+from:allisonsmithart+OR+from:tnsk+OR+from:bengal_art filter:images'
// //query ='from:bengal_art filter:images' 



TwitterImageRipper.prototype.getFriendWebsites = function() {
  this.getFriendsList({'next_cursor_str':'-1'},this.getFriendWebsites2.bind(this))
  //this.getFriendsList({},this.getFriendWebsites2)
}

TwitterImageRipper.prototype.getFriendWebsites2 = function(context) {
  var that = context
  //console.log(this)
  //console.log(that)
  if (typeof context.friendsList !== 'undefined'
    && context.friendsList.length > 0 ){
    context.friendsList.forEach(function(element,index,fullArray) {
      //if (index < 5 ) {
      if (typeof element.name !== 'undefined'
        && typeof element.screen_name !== 'undefined'
        && typeof element.url !== 'undefined' ) {
        //	  && typeof element.expanded_url !== 'undefined' ) {
        if ( element.url !== null ) {
          console.log(element.name+":"+element.screen_name+":"+element.url+":"+context.findRealWebsiteURL(element.url));//+":"+element.expanded_url) 
        } else {
          console.log(element.name+":"+element.screen_name+":No Website Provided")
        }
        if ( typeof element.entities !== 'undefined'
          && typeof element.entities.url !== 'undefined'
          && typeof element.entities.url.urls === 'Array'
           ) {
          element.entities.url.urls.forEach(function(element,index,fullArray) {
            console.log(" "+element.url)
          })
        }
      }
      //}
    })
  }
}

TwitterImageRipper.prototype.findRealWebsiteURL = function(shortUrl) {
  var realURL = ""
  if (false) {
    //this method would freeze up and never finish. I even stopped it from following https but still it would seem to hang
    //shortUrl = "http://t.co/UlbQAqtyhX"
    //http://www.mattlunn.me.uk/blog/2012/05/handling-a-http-redirect-in-node-js/
    var protocol 
    if (shortUrl
      && shortUrl.length > 5) {
      if (shortUrl[4] === ":") {
        protocol = http
      } else if (shortUrl[4] === "s") {
        protocol = https
      }
    }
    //if (protocol === http) {
    protocol.get(shortUrl, function (res) {
      // Detect a redirect
      if (res.statusCode > 300 && res.statusCode < 400 && res.headers.location) {
        //console.log(res)
        console.log(res.headers.location)
        realURL = res.headers.location
        if (realURL === "https://www.facebook.com/unsupportedbrowser") {

        }
      } else {
        console.log('no redirect')
      }
    })
    //}
    return realURL
  }
  
  var Http = function (shortUrl) {
    var protocol 
    if (shortUrl
      && shortUrl.length > 5) {
      if (shortUrl[4] === ":") {
        protocol = http
      } else if (shortUrl[4] === "s") {
        protocol = https
      }
    }
    protocol.get(shortUrl, function (res) {
      // Detect a redirect
      if (res.statusCode > 300 && res.statusCode < 400 && res.headers.location) {
        //console.log(res)
        console.log(res.headers.location)
        realURL = res.headers.location
      } else {
        console.log('no redirect')
      }
    })
  }
  
  //http://www.2ality.com/2012/04/expand-urls.html
  //user agent string from visiting: http://www.useragentstring.com/
  if (true) {
    //TODO: figure out why I get the www.facebook.com/unsupportedbrowser url. I didn't get this when using the above method.
    request( { method: "HEAD", url: shortUrl, followAllRedirects: true, 'User-Agent':"Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.42 Safari/537.36"},
             function (error, response) {
               if (error) {
                 console.log(error)
               }
               if (typeof response !== 'undefined') {

                 if (response.request.href === "https://www.facebook.com/unsupportedbrowser" ) {
                   Http(shortUrl)
                 } else {
                   console.log(response.request.href);
                 }
               }
             });
  }
}

TwitterImageRipper.prototype.setImageSizeToDownload = function(imageSize) {
  if (imageSize === 'large'
    || imageSize === 'medium'
    || imageSize === 'small'
    || imageSize === 'thumb' ) {
    this.imageSize = imageSize
  } else {
    console.log("Invalid size provided.")
    console.log("Image size not changed.")
  }
}

TwitterImageRipper.prototype.saveFile = function(url,data/*filename*/) {
  //url.lastIndexOf('/')
  var splitURL = url.split('/')
  var imageFilename = splitURL[splitURL.length-1]
  var filename=data.username+"_"+data.idstr+"_"+imageFilename
  var that = this;
  if ( fs.existsSync(filename) ) {
    process.stdout.write("X")
    //    console.log(filename+" already exists. Skipping.")
    //that.requestCounter++
    //console.log(that.requestCounter+"/"+that.friendsList.length)
  } else {
    var imageStream=fs.createWriteStream(filename)
    imageStream.on('close',function(){
      console.log("Writing of "+filename+" done.")
      that.requestCounter++  ; //the requestCounter won't match the friendsList bc for each frined there might be 0+ images to obtain.
      console.log(that.requestCounter+"/"+that.friendsList.length)
    })

    //tack on `:large` so we get the large image
    var options = {url:url+":"+this.imageSize,headers:{ 'User-Agent':'request'}}
    //do http requests for the image count against our limit? They aren't using the api,
    //console.log(options) 
    var that = this
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
                         that.saveFile(url,filename);//call ourself again if there was an error (mostlikely due to hitting the server too hard)
		       }
                     })
    imageStream.on('error',function(error) {
      if (error) {
        console.log(error)
      }
    })
    imagerequest.pipe(imageStream)
  }
}

module.exports = TwitterImageRipper

//TODO: work on spidering of 
//TODO: work on ranking media based on likes/retweets/comments
//TODO: make getFriendList more generic so that the json object is saved off so we can access other details like the personal website of your followers etc, stick in db? local mongo instance?
// TODO: create updateFriendsList which will update the local store of FriendsList, set as a cronjob?
// TODO: use local friendsList data with fallback to manually getting getFriendList
//TODO: auto prevent hitting the rate limit of 150 requests
//--TODO: create function to allow image scraping for a input search term, i.e. the constructor parameter could be used as the search term as well.
//TODO: use setInterval or use a cron job to continually get images.
//TODO: save off friend list in local storage to prevent having to get it every time.  If changes are found, add them to the local store.
//TODO: make the app more cli ncurses like such that they can retreive things piecemeal. Get friends list then show their friends or show friend urls etc. or output as html! 
//TODO: output csv list of data, json?
//TODO: save off the following list. Check it periodically and update. Allow them to force update if they know the local list is out of date.
//TODO: allow syncing of the local list, i.e. if there is a user in the local list, then use the api to follow them. 

/* How big of an array before I should use a data structure?
 * 
 * I'm interacting with the Twitter API to get my list of friends (people I follow). 
 * You can get up to 5000 friends ids at a time, but only 200 full friend profiles per request. 
 * A)My plan is to initially populate some json with the full friend profiles and save it off to a file. 
 * B)My plan is to initially populate some json with the friend ids.
 * Upon subsequent runs I would load the json and perform a getFriendsIds call and see if the number of json records matched the number of getFriendsIds. 
 * 
 * A)If the numbers are mismatched, I'd loop through getting all friend profiles, 200 at a time. No point in doing a search since just grabbed all the profiles so just dump old dataset and replace.
 * B)If the numbers are mismatched, create a list of the missing ids and the hit users/lookup with the ids and add to our json these missing profiles
 * 
 * Web shit is slow; so finding out which records are missing and then creating a request may be just as slow as going directly to performing the X http requests and getting all your friends. B-tree ish in that sense that watiting for the next results is costly.
 */
