// lib/cluster.js;
Object.create = Object.create ? Object.create : (function () {
    var F = function () {};
    return function (o) {
        F.prototype = o;
        return new F();
    };
}());

Object.extend = Object.extend ? Object.extend : (function () {
    return function (destination, source) {
        for (var prop in source) {
            if (source.hasOwnProperty(prop)) {
                destination[prop] = source[prop];
            }
        }
        return destination;
    };
}());

Object.size = function (O) {
    var size = 0,
        i;
    for (i in O) {
        if (O.hasOwnProperty(i)) {
            size++;
        }
    }
    return size;
};


(function (window, document, undefined) {
    var Module, Cluster, PubSub;

    PubSub = (function () {

        var proto = {

            Pub: function (topic, args) {
                var that = this;

                if (!this.topics[topic]) {
                    return false;
                }

                setTimeout(function () {
                    var subscribers = that.topics[topic],
                        len = subscribers ? subscribers.length : 0;

                    while (len--) {
                        subscribers[len].func.apply(subscribers[len].funcContext, [args]);
                    }

                }, 0);

                return true;

            },

            Sub: function (topic, func, funcContext) {
                var
                that = this,
                    token;

                if (!that.topics[topic]) {
                    that.topics[topic] = [];
                }

                token = (++that.subUid).toString();

                that.topics[topic].push({
                    token: token,
                    func: func,
                    funcContext: funcContext
                });

                return token;
            },

            unSub: function (token) {
                var m, i, j;

                for (m in this.topics) {
                    if (!this.topics[m]) {
                        continue;
                    }

                    i = 0;
                    j = this.topics[m].length;
                    for (; i < j; i++) {
                        if (this.topics[m][i].token === token) {
                            this.topics[m].splice(i, 1);

                            console.log(this.topics[m]);

                            return token;
                        }
                    }
                }

                return false;
            }

        };


        return function () { // constructor
            var PubSub = Object.create(proto);

            PubSub.subUid = -1;
            PubSub.topics = {};

            return PubSub;
        };

    }());

    Module = (function () {

        var proto = {

            _destroy: function () {
                delete this._context.mods[this.uid];
            },

            _pubsub: function () {
                var
                that = this,
                    ps = that._context._PubSub,
                    argsArr = Array.prototype.slice;

                return {
                    _pub: function () {
                        var args = argsArr.call(arguments);
                        args.push(that);
                        return ps.Pub.apply(ps, args);
                    },
                    _sub: function () {
                        var args = argsArr.call(arguments);
                        args.push(that);
                        return ps.Sub.apply(ps, args);
                    },
                    _unsub: function () {
                        var args = argsArr.call(arguments);
                        return ps.unSub.apply(ps, args);
                    }
                };
            }

        };

        return function (Cluster, module, uid) { // constructor
            var Module = Object.create(proto);

            Module._context = Cluster;
            Module.uid = uid;
            Module.cluster = Cluster.enhancements;

            Object.extend(Module, Module._pubsub());

            return Object.extend(Module, module);
        };

    }());


    Cluster = (function () {
        var vars = {
            collected: false,
            registries: []
        },
            proto = {

            collect: function (mods) {
                var Module = this._Module,
                    i;

                vars.collected = true;

                if (!mods) {
                    return;
                }

                if (mods.length > 0) {
                    for (i = -1; i < mods.length; i++) {
                        this.mods[++Module.uid] = Module.create(this, mods[i], Module.uid);
                    }
                }

                this.mods[++Module.uid] = Module.create(this, mods, Module.uid);                
                return this;
            },

            enhance: function (o) {
                if (typeof o === "object") {
                    Object.extend(this.enhancements, o);
                }
            },

            start: function () {
                var mod;

                if (vars.collected === false){
                    if(vars.registries.length === 0){
                        return;
                    }

                    return this.collect( vars.registries ).start();
                }

                for (mod in this.mods) {
                    if ("init" in this.mods[mod]) {
                        this.mods[mod].init();
                    }
                }

                delete vars.registries;

                return this;
            },

            
            register: function(O){
                if (O && typeof O === "object"){
                    vars.registries.push(O);
                }
                // Always `return this;` to maintain chainability
                return this;
            },

            // Inject another module, after `start` has been called.
            // `Cluster.inject({/*module here*/});`
            // `Cluster.inject([{/*module here*/}, {/*module here*/}]);`
            // `Cluster.inject({/*module here*/}, {/*module here*/});`
            inject: function (O) {
                var Module = this._Module,
                    List = Array.prototype.slice.call(arguments, 1), // get any arguments, after the first one `O`.
                    uid = (Object.size(this.mods) - 1),
                    i;

                // If `List` is not empty, assume there are more module objects sent as List Arguments
                if (List.length > 0) {
                    List.unshift(O);
                    O = List;
                } else {
                    // No List args in sight, treat the first arg `O` as an array and loop through it.
                    // Even if there's just one.
                    O = [].concat(O);
                }

                for (i in O) {
                    if (O.hasOwnProperty(i)) {
                        uid++;

                        // Add the module to the list
                        this.mods[uid] = Module.create(this, O[i], ++Module.uid);

                        // Run the mod's init function
                        if ("init" in this.mods[uid]) {
                            this.mods[uid].init();
                        }
                    }
                }

                // One could call the `inject` menthod more than once:
                // `Cluster(var name).inject({/*object 1*/}).inject({/*object 2*/}) ... `
                return this;
            }

        };

        return function () { // constructor
            var Cluster = Object.create(proto);

            Cluster.mods = {};
            Cluster.enhancements = {};

            Object.extend(Cluster, {

                _Module: {
                    create: Module,
                    uid: -1
                },

                _PubSub: PubSub()

            });

            return Cluster;
        };

    }());

    window.Cluster = Cluster;

}(window, document));

// End lib/cluster.js;
