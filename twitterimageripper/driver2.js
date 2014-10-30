//
// This driver loops over the command line arguments, which should be a list of user names,  and downloads their images
//
var TIR=require('./app.js')

var tir;

//http://nodejs.org/api/process.html#process_process_argv
process.argv.forEach(function(element,index,fullArray) {
  if (element > 1) {
    tir = new TIR(element)
    tir.downloadUserImages()
  }
})

//Output the time the program completed execution http://nodejs.org/api/process.html#process_event_exit
process.on('exit',function() {
  var exitTime = new Date()
  console.log(exitTime.toString())
})