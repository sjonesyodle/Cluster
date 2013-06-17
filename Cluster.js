
Object.create = Object.create ? Object.create :
(function(){
    var F = function () {};
    return function ( o ) {
    	F.prototype = o;
     	return new F();
    };
}());

Object.extend = Object.extend ? Object.extend : 
(function() {
	var prop;
	return function ( destination, source ) {
		for ( prop in source ) { destination[prop] = source[prop]; }
		return destination;
	};
}());


//Cluster JS
;(function( window, document, undefined ) {
	var Module, Cluster;

	Module = (function () {

		var proto = {

			_destroy : function () {
				delete this._context.mods[ this.uid ];
			},

			_pub : function () {},

			_sub : function  () {},

			_unsub : function () {}

		};

		return function ( Cluster, module, uid ) { // constructor
			var Module = Object.create( proto );

			Module._context = Cluster;
			Module.uid      = uid;
			Module.cluster  = Cluster.enhancements;

			return Object.extend( Module, module );
		};

	}());


	Cluster = (function () {
		var
		proto = {

			collect : function ( mods ) {
				var i, len, mod;

				if ( !mods ) return;

				i = -1;
				if ( len = mods && mods.length ? mods.length : false ) {
					while( ++i < len ) {
						this.mods[ ++this.uid ] = Module( this, mods[i], this.uid );
					}

					return;
				}

				this.mods[ ++this.uid ] = Module( this, mods, this.uid );

				return this;
			},

			enhance : function ( o ) {
				if ( typeof o === "object" ) Object.extend( this.enhancements, o );
			},

			start : function () {
				var mod;

				for ( mod in this.mods ) {
					if ( "init" in this.mods[mod] ) this.mods[mod].init();
				}

				return this;
			}

		};

		return function () { // constructor
			var Cluster = Object.create( proto );

			Cluster.mods = {};
			Cluster.enhancements = {};
			Cluster.uid = -1;

			return Cluster;
		};

	}());

	window.Cluster = Cluster;

}( window, document ));



