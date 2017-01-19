"use strict";
var stream = require("stream");
var path = require("path");
var assert = require("assert");
var sinon = require("sinon");
var Promise = require("bluebird");
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
            function(url, cb) {
                cb(new Error("test error"));
            }));
        s.on("error", function(error) {
            assert(error instanceof Error);
            done();
        });
        inputStream.pipe(s)
            .pipe(new stream.Writable());
        inputStream.push(
            "https://raw.githubusercontent.com/petitchevalroux/node-opengraph-fetcher/master/tests/test.html"
        );
        inputStream.push(null);
    });

    it("Return an instance of stream without new", function(done) {
        var s = S();
        assert(s instanceof S);
        done();
    });

    it("Send end/finish signals with empty input stream", function(done) {
        var inputStream = new stream.Readable();
        var s = new S();
        var writeStream = new stream.Writable();
        inputStream
            .pipe(s)
            .pipe(writeStream);
        inputStream.push(null);
        var promises = [
            new Promise(function(resolve) {
                s.on("end", function() {
                    resolve();
                });
            }),
            new Promise(function(resolve) {
                writeStream.on("finish", function() {
                    resolve();
                });
            })
        ];
        Promise.all(promises)
            .then(function() {
                done();
                return;
            })
            .catch(function() {});
    });
});
