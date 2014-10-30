var TIR=require('./app.js')
//var tir = new TIR('cuckoo5egg')
var tir = new TIR('ericcanete')
//tir.downloadUserImages()
//tir.getFriendsList()
tir.getFriendImages()

//Output the time the program completed execution http://nodejs.org/api/process.html#process_event_exit
process.on('exit',function() {
  var exitTime = new Date()
  console.log(exitTime.toString())
})