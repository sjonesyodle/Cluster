// Set the window as object
global.window = {};

var chai = require('chai')
	assert = chai.assert,
	expect = chai.expect,
	Cluster = require(__dirname + '/../Cluster.js');




describe("Cluster", function(){
	it("should be a function", function(){
		assert(typeof global.window.Cluster === "function", "Cluster is not a function");
	});
});




// Define a cluster
var testCluster = global.window.Cluster({
	name: "testCluster"
});

global.answer = false;

// Collect some modules and start them
testCluster.collect({
    init: function () {
        this._sub("test0", function(){
        	global.answer = "_sub has been called";
        });
    }
}).collect({
	init: function () {
        this._pub("test0");
    }
}).start();




describe("testCluster", function(){
	it("should return a string", function(){
		expect(global.answer).to.be.a("string");
	});
});

