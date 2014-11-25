var startTime = new Date()
var TIR=require('./app.js')
var tir = new TIR('cuckoo5egg')
//var tir = new TIR('ericcanete')
//var tir = new TIR('bengal_art')
//tir.downloadUserImages()
//tir.getFriendsList()
  tir.getFriendImages()
//tir.getFriendWebsites2()
//tir.getFriendWebsites()
//tir.findRealWebsiteURL()
//tir.outputFriendsList()

//tir.getFriendsIds({},tir.writeFriendsIdsToDisk)
//tir.getFriendsIdsFromDisk({},function(){})
//tir.compareFriendsIds()
//tir.getFriendImagesLocalCheck()
//tir.getFriendsList({},tir.writeFriendsListToDisk)
//tir.getFriendsListFromDisk(function(){})

//Output the time the program completed execution http://nodejs.org/api/process.html#process_event_exit
process.on('exit',function() {
  var exitTime = new Date()
  console.log(exitTime.toString())
console.log("elapsed time:"+(exitTime-startTime))
})


// //Example using a hashtag search
// var tir2 = new TIR('')
// tir2.saveImages('#inktober')
