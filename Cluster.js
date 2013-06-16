
Object.create = Object.create ? Object.create :
(function(){
    var F = function () {};
    return function ( o ) {
    	F.prototype = o;
     	return new F();
    };
}());


//Cluster JS
;(function( window, document, undefined ) {
	var 
	cluster, Cluster,
	module, Module;

	Module = { // instance constructor methods

		validate : function ( mod ) {
			return (typeof mod === "object") && ("init" in mod) && (typeof mod.init === "function");
		},

		make : function ( mod ) {
			
		}

	},

	module = { // instance blueprint with facade methods

	},

	Cluster = { // instance constructor methods

		accumulate : function ( mods, cluster ) {
			var i = mods.length || false;

			if ( i ) {
				while( i-- ) {
					if ( Module.validate( mods[i] ) ) {
						cluster.mods.push( this.make( mods[i] ) );
					}
				}

				return;
			}

			if ( this.validate( mods ) ) cluster.mods.push( this.make( mods ) );
		},

		make : function ( mod ) {
			var _mod = mod.mod;
			if (("cfg" in mod) && ( typeof mod.cfg === "object" )) _mod.cfg = mod.cfg;
			return _mod;
		},

		enhance : function () {

		},

		start : function () {

		}
	};

	cluster = { // instance blueprint with facade methods
		mods : [],

		include : function ( mods ) {
			Cluster.accumulate( mods, this );
		},

		enhance : function ( obj ) {
			Cluster.enhance.call( this );
			// easily extend the cluster with methods that all modules can see
		},

		start : function () {
			Cluster.start.call( this );
		},

		notes : function () {

		}
	};

	cluster.modProto = {

		_destroy : function () {

		},

		_pub : function () {},

		_sub : function () {},

		_unsub : function () {}

	}

	window.Cluster = function () {
		return Object.create( cluster );
	};


}( window, document ));


// var Unified = Cluster();


// Unified.notes([

// ]);	

// Unified([

// 	{
// 		cfg : {

// 		},

// 		mod : {

// 			init : function () {}

// 		}

// 	},

// 	{
// 		cfg : {

// 		},

// 		mod : {

// 			init : function () {}

// 		}

// 	},

// 	{
// 		cfg : {

// 		},

// 		mod : {

// 			init : function () {}

// 		}

// 	}

// ]).start();



