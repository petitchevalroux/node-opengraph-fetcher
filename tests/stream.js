"use strict";
var stream = require("stream");
var path = require("path");
var assert = require("assert");
var sinon = require("sinon");
describe("Stream tests", function() {
    var toRestore = [];
    afterEach(function() {
        toRestore.forEach(function(r) {
            r.restore();
        });
    });
    var S = require(path.join("..", "src", "stream"));
    it("Queue has the good concurrency", function(done) {
        var s = new S({
            "concurrency": 4
        });
        assert.equal(s.queue.concurrency, 4);
        done();
    });
    it("Emit error when an error occured while parsing", function(done) {
        var inputStream = new stream.Readable();
        var s = new S();
        toRestore.push(sinon.stub(s, "opengraph",
            function() {
                throw new Error("test error");
            }));
        s.on("error", function(error) {
            assert(error instanceof Error);
            done();
        });
        inputStream.pipe(s)
            .pipe(new stream.Writable());
        inputStream.push(
            "http://github.com/samholmes/node-open-graph/raw/master/test.html"
        );
        inputStream.push(null);
    });

    it("Return an instance of stream without new", function(done) {
        var s = S();
        assert(s instanceof S);
        done();
    });

});
