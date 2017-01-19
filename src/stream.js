"use strict";
var stream = require("stream");
var util = require("util");
var Transform = stream.Transform;
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
    Transform.call(this, options);
    var self = this;
    self.queue = self.async.queue(
        function(url, callback) {
            self.fetch(url)
                .then(function(meta) {
                    // Do not push empty object
                    if (Object.getOwnPropertyNames(meta)
                        .length) {
                        self.push(meta);
                    }
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

    this.queue.drain = function() {
        if (self._flushcb && self.queue.idle()) {
            self._flushcb();
        }
    };

    this.started = false;
}

OpengraphStream.prototype._transform = function(chunk, encoding, callback) {
    this.queue.push(typeof chunk === "string" ? chunk : chunk.toString());
    callback();
};

/**
 * Called when there is no more written data to be consumed
 * @param {callable} callback
 * @returns {undefined}
 */
OpengraphStream.prototype._flush = function(callback) {
    if (!this.queue.started) {
        callback();
    } else {
        this._flushcb = callback;
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
            resolve(meta);
        });
    });
};

util.inherits(OpengraphStream, Transform);
module.exports = OpengraphStream;
