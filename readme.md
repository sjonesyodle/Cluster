# Cluster JS

Lightweight Modular Javascript Architecture

---

Cluster is yet another modular "framework" for JavaScript, but its super tiny, and designed to be easy to use; allowing you to focus on your code, not learning the framework...

### So what's a Cluster?

Well, think of a Cluster as a stand-alone section of JS code. One JS app can have multiple (or just one) Clusters, each containing multiple Modules. I'll break it down:

* Cluster 1
	* Module 1
	* Module 2
	* Module 3
* Cluster 2
	* Module 1
	* Module 2
	* Module 3

Under this model, Modules in Cluster 1 cannot interact with Modules in Cluster 2. But the modules within each Cluster can _loosely_ interact with with each other, using the Pub/Sub methods (more about that later).

Each Module inside of a Cluster is an Object-Literal that requires a property named `init` who's value is a function.

### What does it look like?

Using the model above, let's see how to implement 2 different Clusters:

```javascript
var cluster1 = Cluster(),
	cluster2 = Cluster(),
	_mods;

// Passing an array of Modules to the collect method
_mods = [{
	init: function(){
		console.log("I am the first Module in Cluster 1");
	}
},{
	init: function(){
		console.log("I am the second Module in Cluster 1");
	}
},{
	init: function(){
		console.log("I am the third Module in Cluster 1");
	}
}];

cluster1.collect(_mods).start();


//--------------------------

// Passing a single module to the collect method
cluster2.collect({
	init: function(){
		console.log("I am the only Module in Cluster 2");
	}
}).start();
```

### That's nice! What are the methods, and how do I use them?

##### The `.collect()` method:

```javascript
cluster.collect( Array or Module );
```

This method is how we tell a certain cluster to 'register' a module. It accepts a single Module-Object, or an Array of Module-Objects. Note, `.collect()` will not initialize modules.

##### The `.start()` method:

```javascript
cluster.start(Object);
```

After running `.collect()`, and all modules are loaded into the Cluster, the start method must be called in order to initialize them.

The Object argument for start currently only accepts one property - `debug`

```javascript
cluster.start({debug: true});
```

This will log all of the modules and messages registered in the Cluster.

##### The `.inject()` method:

```javascript
cluster.inject( Array or Module );
```

The Inject method is useful when you need to add another module after `.start()` has been called. You can input a single Module-Object, or an Array of Module-Objects.

The major difference is that `.inject()` immediately call's the `init` function of the Module(s) after injection into to the Cluster.

___This should be used only _after_ the `.start()` method has been called.___

##### The `.enhance()` method:

When writing a JS application, there are often functions that will need to be called multiple times in different Modules.

The `.enhance()` method accepts an Object-Literal of functions that get added to the cluster.

```javascript
var cluster = Cluster(), // Create a cluster
	myEnhancments = {
	someFunc1: function (){
		// Do something here
	},
	someFunc2: function (){
		// Do something else here
	}
};

cluster.enhance(myEnhancments);
```

Now, every Module in the Cluster will have access to `somefunc1` and `someFunc2` like so:

```javascript
cluster.collect({
	init: function (){
		// calling somefunc1
		this.cluster.somefunc1();
	}
}).start();
```

### Tie the methods together

Each Cluster method (except `.enhance()`) is chain-able; so you may call one method right after another.

```javascript
cluster.collect(myArrOfMods).start();
```

---

## Pub/Sub

This is the fun part. Each Cluster has it's own set of messages for Subscribing and Publishing. One Cluster, nor it's Modules can interact with another's Pub/Sub messages.

Within each Module, you can Subscribe to a message like so:

```javascript
var token = this._sub("message", function([arg, arg ...]){ /* CALLBACK */ });
```

Obviously, `"message"` should be a unique ID for another Module to Publish on. The _sub method returns a unique token. Here we are setting that token to a variable for use later on.

To publish a message for a subscriber to hear:

```javascript
this._pub("message"[, arg, arg ...]);
```

If at any point you want to unsubscribe a Module from a publisher, use:

```javascript
this._unsub(token);
```

The _unsub method requires a token returned from `_sub`.