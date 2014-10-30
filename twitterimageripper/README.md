TwitterImageRipper
==================

A image ripping interface for twitter

# Usage

Instantiate a TwitterImageRipper object and call a method to extract the images.

```javascript
var TwitterImageRipper = require('./app.js')
var tir = new TwitterImageRipper('twitter')
tir.getFriendImages()       // Obtain a list of your frienda and save off any available images
tir.downloadUserImages()    // Save off any available images for a given username
```

Images are saved as [User Name][Message ID].
These two elements can be used to reconstruct the url of the tweet.
`https://twitter.com/[User Name]/status/[Message ID]`