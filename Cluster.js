/**
 * @preserve Cluster.js
 * Copyright 2013 Steve Jones & Matt Jordan
 * Licensed under Creative Commons BY-SA 2.0 (http://creativecommons.org/licenses/by-sa/2.0/)
 */

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
    var Log = ( !! window.console) ? console.log : function () {},
        Module,
        Cluster,
        PubSub;

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

                            Log(this.topics[m]);

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
        var proto = {

            enhance: function (O) {
                var messages = O.messages,
                    Obj = {},
                    i,
                    m;

                if (!O || typeof O !== "object") {
                    return this;
                }

                if (!!messages && Object.prototype.toString.call(messages) === "[object Array]") {
                    for (i in messages) {
                        if (messages.hasOwnProperty(i)) {
                            m = messages[i].toString();
                            Obj[m] = m;
                        }
                    }
                    O.messages = Obj;
                }

                Object.extend(this.enhancements, O);
                return this;
            },

            collect: function (mods) {
                var self = this,
                    Module = self._Module,
                    i;

                if (!mods) {
                    return self;
                }

                // Make sure mods is always an array
                mods = [].concat(mods);

                for (i = 0; i < mods.length; i++) {
                    self.mods[++Module.uid] = Module.create(self, mods[i], Module.uid);
                }

                return self;
            },

            start: function (O) {
                var self = this,
                    mod;

                for (mod in self.mods) {
                    if ("init" in self.mods[mod]) {
                        self.mods[mod].init();
                    }
                }

                if (O && !! O.debug) {
                    Log("Modules:", self.mods);
                    Log("Messages:", self._PubSub.topics);
                }

                return self;
            },

            
            inject: function (O) {
                var self = this,
                    Module = self._Module,
                    List = Array.prototype.slice.call(arguments, 1),
                    uid = (Object.size(self.mods) - 1),
                    i;

                // If `List` is not empty, assume there are more module objects sent as List Arguments
                if (List.length > 0) {
                    List.unshift(O);
                    O = List;
                } else {
                    O = [].concat(O);
                }

                for (i in O) {
                    if (O.hasOwnProperty(i)) {
                        uid++;
                        
                        self.mods[uid] = Module.create(self, O[i], ++Module.uid);

                        if ("init" in self.mods[uid]) {
                            self.mods[uid].init();
                        }
                    }
                }
                return self;
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
