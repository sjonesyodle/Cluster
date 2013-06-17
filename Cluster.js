
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
	var Module, Cluster, PubSub;

	PubSub = (function(){

		var proto = {

			pub : function ( topic, args ) {

		        if ( !this.topics[topic] ) return false;

		        setTimeout(function () {
		            var 
		            subscribers = this.topics[topic],
		            len         = subscribers ? subscribers.length : 0;

		            while ( len-- ) { subscribers[len].func( args ); }

		        }, 0);

		        return true;

		    },

		    sub : function ( topic, func ) {
		        var 
		        that = this,
		        token;

		        if ( !this.topics[topic] ) this.topics[topic] = [];

		        token = ( ++this.subUid ).toString();

		        this.topics[topic].push({
		            token: token,
		            func: func,
		            forget : (function( token ){
		                return function () { that.unsub( token ); };
		            }( token ))
		        });

		        return token;
		    },

		    unsub : function ( token ) {
		        var m, i, j;

		        for ( m in this.topics ) {
		            if ( !this.topics[m] ) continue;

		            i = 0;
		            j = this.topics[m].length;
		            for ( ; i < j; i++ ) {
		                if ( this.topics[m][i].token === token ) {
		                    this.topics[m].splice(i, 1);
		                    return token;
		                }
		            }
		        }

		        return false;
		    }

		};


		return function () {
			var PubSub = Object.create( proto );

			PubSub.subUid = -1;
			PubSub.topics = {};

			return PubSub;
		};

	}());

	Module = (function () {

		var proto = {

			_destroy : function () {
				delete this._context.mods[ this.uid ];
			},

			_pub : function () {
				this.cluster.pubsub.pub( arguments );
			},

			_sub : function () {
				this.cluster.pubsub.sub( arguments );
			},

			_unsub : function () {
				this.cluster.pubsub.unsub( arguments );
			}

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

			Object.extend( Cluster.enhancements, { pubsub : PubSub() } ); // add pub/sub

			return Cluster;
		};

	}());

	window.Cluster = Cluster;

}( window, document ));



