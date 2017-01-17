var stream = require("stream");
var process = require("process");
var path = require("path");
var OgStream = require(path.join(__dirname, "src", "stream"));
var ogStream = new OgStream();
var inputStream = new stream.Readable();
// out stream must be in objectMode
var outStream = new stream.Writable({objectMode:true});
outStream._write = function(chunk, enc, cb) {
    console.log(chunk);
    cb();
};
// error event is emitted if an error occured on parsing
ogStream.on("error", function (err) {
    console.log(err);
});
// end event is emitted when all urls are fetched and parsed
ogStream.on("end", function () {
    console.log("end");
});
inputStream.pipe(ogStream).pipe(outStream);
inputStream.push("https://raw.githubusercontent.com/petitchevalroux/node-opengraph-fetcher/master/tests/test.html");
inputStream.push(null);
