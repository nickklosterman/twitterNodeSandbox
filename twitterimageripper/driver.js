var TIR=require('./app.js')
var tir = new TIR('cuckoo5egg')
//var tir = new TIR('ericcanete')
//var tir = new TIR('bengal_art')
//tir.downloadUserImages()
//tir.getFriendsList()
//tir.getFriendImages()
//tir.getFriendWebsites2()
tir.getFriendWebsites()
//tir.findRealWebsiteURL()
//tir.outputFriendsList()


//Output the time the program completed execution http://nodejs.org/api/process.html#process_event_exit
process.on('exit',function() {
  var exitTime = new Date()
  console.log(exitTime.toString())
})


// //Example using a hashtag search
// var tir2 = new TIR('')
// tir2.saveImages('#inktober')
