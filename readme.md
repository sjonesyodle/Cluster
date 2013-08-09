# Cluster JS

Lightweight Modular Javascript Architecture

---

Cluster _is_ yet another modular "framework" for JavaScript, but its super tiny, and designed to be easy to use; allowing you to focus on your code, not learning the framework...

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

### So, what does it look like?

Using the model above, let's see how to implement 2 different Clusters:

```javascript
var cluster1 = Cluster(),
	cluster2 = Cluster()
	_mods = []; // Define an empty Array to add Modules to

// Using the `collect` method;

_mods.push({
	init: function(){
		console.log("I am the first Module in Cluster 1");
	}
});


_mods.push({
	init: function(){
		console.log("I am the second Module in Cluster 1");
	}
});

_mods.push({
	init: function(){
		console.log("I am the third Module in Cluster 1");
	}
});

cluster1.collect(_mods).start();

//--------------------------

// Using the `register` method;

cluster2.register({
	init: function(){
		console.log("I am the first Module in Cluster 2");
	}
}).register({
	init: function(){
		console.log("I am the second Module in Cluster 2");
	}
}).register({
	init: function(){
		console.log("I am the third Module in Cluster 2");
	}
}).start();
```

### That's nice! What are the methods, and how do I use them?

##### The `.collect()` method:

```javascript
cluster.collect( Array );
```

This method accepts an Array of Module objects. Each object in the array will be registered all at once, but will not be initialized.

##### The `.register()` method:

```javascript
cluster.register( Single-Object );
```

The register method allows you to define a single module for a given Cluster. Again, any Module passed will not be initialized.

##### The `.start()` method:

```javascript
cluster.start(null);
```

After running `.collect()` and/or `.register()`, and all modules are loaded into the Cluster, the start method must be called in order to initialize them.


##### The `.inject()` method:

```javascript
cluster.inject( Array or Module );
```

The Inject method is useful when you need to add another module after `.start()` has been called. Think of this method as a cross between `.collect()` and `.register()`. You can input a single Module-Object, or an Array of Module-Objects.

The major difference is that `.inject()` immedeately call's the `init` function of the Module(s) after injection into to the Cluster.

___This should only be used _after_ the `.start()` method has been called.___

### Tie the methods together

Each Cluster method is chain-able; you may call one method right after another.

```javascript
cluster.collect(myArrOfMods).start();
```

---

## Pub/Sub

This is the fun part. Each Cluster has it's own set of messages for Subscribing and Publishing. One Cluster, nor it's Modules can interact with another's Pub/Sub messages.

Within each Module, you can Subscribe to a message like so:

```javascript
this._sub("message", function([arg, arg ...]){ /* CALLBACK */ });
```

Obviously, `"message"` should be a unique ID for another Module to Publish on.

To publish a message for a subscriber to hear:

```javascript
this._pub("message"[, arg, arg ...]);
```

If at any point you want to unsubscribe a Module from a publisher, use:

```javascript
this._unsub("message");
```