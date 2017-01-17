"use strict";
var stream = require("stream");
var util = require("util");
var Duplex = stream.Duplex;
var Promise = require("bluebird");

function OpengraphStream(options) {
    if (!(this instanceof OpengraphStream)) {
        return new OpengraphStream(options);
    }
    options = options || {};
    this.concurrency = options.concurrency ? options.concurrency : 2;
    options.readableObjectMode = true;
    this.opengraph = require("open-graph");
    this.async = require("async");
    delete options.concurrency;
    Duplex.call(this, options);
    var self = this;
    self.queue = self.async.queue(
        function(url, callback) {
            self.fetch(url)
                .then(function() {
                    callback();
                    return;
                })
                .catch(function(err) {
                    self.emit("error", new Error(
                        "Error fetching url: %s",
                        url, err));
                    callback(err);
                });
        },
        self.concurrency
    );
    this.metas = [];
}

/**
 * Call when url are push in input 
 * @param {mixed} chunk
 * @param {type} enc
 * @param {type} cb
 * @returns {undefined}
 */
OpengraphStream.prototype._write = function(chunk, enc, cb) {
    this.queue.push(typeof chunk === "string" ? chunk : chunk.toString());
    cb();
};

/**
 * Read urls extracted from sitemap
 * @returns {undefined}
 */
OpengraphStream.prototype._read = function() {
    // We have nothing to read
    if (!this.metas.length) {
        // Nothing is processing, we end
        if (this.queue.idle()) {
            this.push(null);
        } else {
            // Something is processing, we push a new read at the end of the
            // event loop 
            var self = this;
            setImmediate(function() {
                self._read();
            });
        }
    } else {
        var stop = false;
        while (this.metas.length > 0 && !stop) {
            var chunk = this.metas.shift();
            stop = !this.push(chunk);
        }
    }
};

/**
 * Fetch meta of an url
 * @param {string} url
 * @returns {Promise}
 */
OpengraphStream.prototype.fetch = function(url) {
    var self = this;
    return new Promise(function(resolve, reject) {
        self.opengraph(url, function(err, meta) {
            if (err) {
                reject(err);
                return;
            }
            self.metas.push(meta);
            resolve(meta);
        });
    });
};

util.inherits(OpengraphStream, Duplex);
module.exports = OpengraphStream;
