
//This module can be used to either download images from a user or from that users followers or the friends of that user

env = process.env.NODE_ENV || 'development';

//var Twitter = require('node-twitter');
var Twitter = require('../../node-twitter/lib/Twitter');
var fs = require('fs'),
    request = require('request'),
    http = require('http'),
    https = require('https')


function TwitterImageRipper(screen_name){
  this.screen_name=screen_name
  this.friendsScreenNameList = []
  this.friendsList = []
  this.requestCounter = 0
  this.numberOfRequests = 0
  this.flag429 = false
  this.imageSize = 'large'

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

//Meant to be run to get all friends
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

TwitterImageRipper.prototype.getFriendsIds = function () {
  // my test case twitter user doesn't have that more than ~20 friends
  this.twitterRestClient.friendsIds({'user_name':this.screen_name,'count':200}, function(error, result) {
    if (error) {
      console.trace('Error: ' + (error.code ? error.code + ' ' + error.message : error.message));
    }
    if (result) {
      result.ids.forEach(function(element,index,fullArray) {
	//console.log(element)
      })
      this.getMoreFriendsIds(result)
    }
  })		      
}


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
  var query
  if (screen_name[0] === "#") { //if search is a hashtag search
    query = screen_name+' filter:images'
  } else {
    query='from:'+screen_name+' filter:images'
  }
  var that = this //save off our context for use inside of twittterSearchClient
  this.twitterSearchClient.search({'q':query,'count':25},function(error,result) {
    if (error) {
      if (error.code === 429 /* too many requests */)
      {
        this.flag429 = true // instead of calling saveImages, call a function that clears the flag and then calls saveImages?
        console.log("Error 429. Retry in 15 minutes when new queries allowed")
        //if there were too many requests we call the same function again but after a 15 minute timeout
        setTimeout( that.saveImages.bind(that),15*60*1000,screen_name )
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
            //if we found photoes
	    if (typeof mediaURLArray !== 'undefined'
              && mediaURLArray.length > 0){
	      //console.log(element.user.name+"_"+element.id_str)
              var filename = element.user.name+"_"+element.id_str
              mediaURLArray.forEach(function(element,index,fullArray) {  //save off message text as well? Then can merge the image and text using IM. 
                console.log(" media:"+element)
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

TwitterImageRipper.prototype.saveFile = function(url,filename) {

  var that = this;
  if ( fs.existsSync(filename) ) {
    console.log(filename+" already exists. Skipping.")
    that.requestCounter++
    console.log(that.requestCounter+"/"+that.friendsList.length)

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
}

module.exports = TwitterImageRipper

//TODO: work on spidering of 
//TODO: work on ranking media based on likes/retweets/comments
//TODO: make getFriendList more generic so that the json object is saved off so we can access other details like the personal website of your followers etc
//TODO: auto prevent hitting the rate limit of 150 requests
//TODO: create function to allow image scraping for a input search term, i.e. the constructor parameter could be used as the search term as well.
//TODO: use setInterval or use a cron job to continually get images.
//TODO: save off friend list in local storage to prevent having to get it every time.  If changes are found, add them to the local store.
//TODO: make the app more cli ncurses like such that they can retreive things piecemeal. Get friends list then show their friends or show friend urls etc. or output as html! 