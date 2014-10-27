"use strict";

var rewire = require("rewire");
var Session = require("express-session");
var RiakPbcMock = require("./mocks/RiakPbc");

var setLocalVariable = "__set__";

describe("RiakStore", function () {
    var RiakStoreFactory;
    var RiakStore;
    var riakPbcMock;
    var store;
    var options;

    beforeEach(function () {
        riakPbcMock = RiakPbcMock();
        RiakStoreFactory = rewire("../index.js");
        RiakStoreFactory[setLocalVariable]("RiakPbc", riakPbcMock);
        RiakStore = RiakStoreFactory(Session);
    });

    describe("when created", function () {
        beforeEach(function () {
            options = {
                bucket: "foo",
                connection: {
                },
            };

            store = new RiakStore(options);
        });

        it("should create a new client with the correct options", function () {
            store.client.should.be.an.instanceOf(riakPbcMock.RiakPBC);
            riakPbcMock.createClient.should.have.been.calledWith(options.connection);
        });

        it("should assign the bucket according to the options", function () {
            store.bucket.should.equal("foo");
        });
    });

    describe("when an existing client is provided", function () {
        var client;

        beforeEach(function () {
            client = riakPbcMock.createClient();
            options = {
                bucket: "foo",
                client: client,
            };

            store = new RiakStore(options);
        });

        it("should use the existing client instead of creating a new one", function () {
            store.client.should.equal(client);
            riakPbcMock.createClient.should.have.been.calledOnce;
        });
    });

    describe("when a bucket is not provided", function () {
        it("should throw an error", function () {
            void function () {
                new RiakStore({ bucket: "" });
            }.should.throw(TypeError, "`bucket` should be a non-empty string");
        });
    });

    describe("when bucket is not a string", function () {
        it("should throw an error", function () {
            void function () {
                new RiakStore({ bucket: {} });
            }.should.throw(TypeError, "`bucket` should be a non-empty string");
        });
    });

    describe("when a new session is created", function () {
        beforeEach(function () {
            options = { bucket: "foo" };
            store = new RiakStore(options);
        });

        it("should put the value in the correct key of the bucket", function (callback) {
            store.get("bar", function (error, session) {
                expect(error).not.to.exist;
                expect(session).not.to.exist;
                store.set("bar", { cat: true }, function (error) {
                    expect(error).not.to.exist;
                    store.get("bar", function (error, result) {
                        expect(error).not.to.exist;
                        expect(result.cat).to.equal(true);
                        callback();
                    });
                });
            });
        });
    });

    describe("when a session is destroyed", function () {
        beforeEach(function () {
            options = { bucket: "foo" };
            store = new RiakStore(options);
        });

        it("should be removed", function (callback) {
            store.set("bar", { cat: true }, function (error) {
                expect(error).not.to.exist;
                store.destroy("bar", function (error, result) {
                    expect(error).not.to.exist;
                    expect("bar" in store.client.buckets.foo).to.equal(false);
                    callback();
                });
            });
        });
    });

    describe("when riak is unavailable", function () {
        var error;

        beforeEach(function () {
            options = { bucket: "foo" };
            store = new RiakStore(options);
            store.client.nextError = new Error("unavailable");
        });

        describe("get()", function () {
            beforeEach(function (callback) {
                store.get("bar", function (err) {
                    error = err;
                    callback();
                });
            });

            it("should return an error", function () {
                error.should.be.an.instanceOf(Error);
                error.message.should.equal("unavailable");
            });
        });

        describe("set()", function () {
            beforeEach(function (callback) {
                store.set("bar", {}, function (err) {
                    error = err;
                    callback();
                });
            });

            it("should return an error", function () {
                error.should.be.an.instanceOf(Error);
                error.message.should.equal("unavailable");
            });
        });

        describe("destroy()", function () {
            beforeEach(function (callback) {
                store.destroy("bar", function (err) {
                    error = err;
                    callback();
                });
            });

            it("should return an error", function () {
                error.should.be.an.instanceOf(Error);
                error.message.should.equal("unavailable");
            });
        });
    });
});
