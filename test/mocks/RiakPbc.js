"use strict";

var sinon = require("sinon");
var contentTypeKey = "content_type";

module.exports = function RiakPbcMockFactory () {
    function RiakPbcMock () {
        this.buckets = {};
        sinon.spy(this, "get");
        sinon.spy(this, "put");
        sinon.spy(this, "del");
    }

    RiakPbcMock.prototype.get = function (params, callback) {
        if ( this.nextError ) {
            var error = this.nextError;
            this.nextError = null;
            process.nextTick(function () {
                callback(error);
            });
            return;
        }

        process.nextTick(function () {
            this.buckets[params.bucket] = this.buckets[params.bucket] || {};

            if ( !this.buckets[params.bucket][params.key] ) {
                return callback(void 0, {});
            }

            callback(void 0, {
                content: [this.buckets[params.bucket][params.key]],
            });
        }.bind(this));
    };

    RiakPbcMock.prototype.put = function (params, callback) {
        if ( this.nextError ) {
            var error = this.nextError;
            this.nextError = null;
            process.nextTick(function () {
                callback(error);
            });
            return;
        }

        process.nextTick(function () {
            this.buckets[params.bucket] = this.buckets[params.bucket] || {};
            var value = params.content.value;

            if ( params.content[contentTypeKey] === "application/json" ) {
                value = JSON.parse(value);
            }

            this.buckets[params.bucket][params.key] = {
                "content_type": params.content[contentTypeKey],
                "value": value,
            };

            callback();
        }.bind(this));
    };

    RiakPbcMock.prototype.del = function (params, callback) {
        if ( this.nextError ) {
            var error = this.nextError;
            this.nextError = null;
            process.nextTick(function () {
                callback(error);
            });
            return;
        }

        process.nextTick(function () {
            this.buckets[params.bucket] = this.buckets[params.bucket] || {};
            delete this.buckets[params.bucket][params.key];
            callback();
        }.bind(this));
    };

    function createClient (options) {
        return new RiakPbcMock(options);
    }

    var exports = {
        createClient: createClient,
        RiakPBC: RiakPbcMock,
    };

    sinon.spy(exports, "createClient");

    return exports;
};
