TwitterImageRipper
==================

A image ripping interface for twitter

# Usage

Instantiate a TwitterImageRipper object and call a method to extract the images.

```javascript
var TwitterImageRipper = require('./app.js')
var tir = new TwitterImageRipper('twitter')
tir.getFriendImages()
tir.downloadUserImages()
```