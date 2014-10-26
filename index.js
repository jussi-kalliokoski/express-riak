"use strict";
var RiakPbc = require("riakpbc");
var parentPrototype = "__proto__";

module.exports = function (Session) {
    var Store = Session.Store;

    function RiakStore (options) {
        this.bucket = options.bucket;
        Store.call(this, options);
        this.client = RiakPbc.createClient(options.host);
    }

    RiakStore.prototype[parentPrototype] = Store.prototype;

    RiakStore.prototype.get = function (sessionId, callback) {
        this.client.get({
            bucket: this.bucket,
            key: sessionId,
        }, function (error, data) {
            if ( error ) { return callback(error); }
            if ( !data.content ) { return callback(); }
            callback(null, data.content[0].value);
        });
    };

    RiakStore.prototype.set = function (sessionId, session, callback) {
        this.client.put({
            bucket: this.bucket,
            key: sessionId,
            content: {
                "content_type": "application/json",
                "value": JSON.stringify(session),
            },
        }, function (error) {
            if ( error ) { return callback(error); }
            callback();
        });
    };

    RiakStore.prototype.destroy = function (sessionId, callback) {
        this.client.del({
            bucket: this.bucket,
            key: sessionId,
        }, function (error) {
            if ( error ) { return callback(error); }
            callback();
        });
    };

    return RiakStore;
};