"use strict";
var stream = require("stream");
var path = require("path");
var assert = require("assert");
describe("Functional tests", function() {
    var inputStream = new stream.Readable();
    var outStream = new stream.Writable({
        objectMode: true
    });
    var output = [];
    outStream._write = function(chunk, encoding, done) {
        output.push(chunk);
        done();
    };
    var OgStream = require(path.join("..", "src", "stream"));
    var ogStream = new OgStream();
    inputStream.pipe(ogStream)
        .pipe(outStream);
    it("Return meta", function(done) {
        ogStream.on("end", function() {
            assert(output.length === 1);
            assert.equal(JSON.stringify(output[0]),
                "{\"title\":\"OG Testing\",\"type\":\"website\",\"url\":\"http://github.com/samholmes/node-open-graph/raw/master/test.html\",\"site_name\":\"irrelavent\",\"description\":\"This is a test bed for Open Graph protocol.\",\"image\":{\"url\":\"http://google.com/images/logo.gif\",\"width\":\"100\",\"height\":\"100\"}}"
            );
            done();
        });
    });
    inputStream.push(
        "http://github.com/samholmes/node-open-graph/raw/master/test.html"
    );
    // emit input end
    inputStream.push(null);
});
