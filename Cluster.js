/**
 * @preserve Cluster.js
 * Copyright 2013 Steve Jones & Matt Jordan
 * Licensed under Creative Commons BY-SA 2.0 (http://creativecommons.org/licenses/by-sa/2.0/)
 */

(function (window) {
    var Log = (!!window.console) ? console.log : function () {},
        extendConflicts = [],
        // Global so we can see it in debug mode
        debugMode = false,
        Internal, Module, Cluster, PubSub;

    Internal = {
        create: (function () {
            var F = function () {};
            return function (o) {
                F.prototype = o;
                return new F();
            };
        }()),

        extend: function (destination, source, noConflict) {
            var prop;
            for (prop in source) {
                if (source.hasOwnProperty(prop)) {
                    if (!!noConflict && prop in destination) {
                        extendConflicts.push(prop + " is already defined");
                        return;
                    }
                    destination[prop] = source[prop];
                }
            }
            return destination;
        },

        size: function (O) {
            var size = 0,
                i;
            for (i in O) {
                if (O.hasOwnProperty(i)) {
                    size++;
                }
            }
            return size;
        }
    };


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
            var PubSub = Internal.create(proto);

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

        return function (Cluster, module, uid, options) { // constructor
            var Module = Internal.create(proto);

            Module._context = Cluster;
            Module.uid = uid;

            Internal.extend(Module, Module._pubsub());
            Module = Internal.extend(Module, module);

            if (options && options.merge) {
                Internal.extend(Module, Cluster.enhancements, true);
            } else {
                Module.cluster = Cluster.enhancements;
            }

            return Module;
        };

    }());

    Cluster = (function () {
        var proto = {

            enhance: function (O) {
                var messages = O.messages,
                    Obj = {},
                    i, m;

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

                Internal.extend(this.enhancements, O);
                return this;
            },

            collect: function (mods) {
                var self = this,
                    Module = self._Module,
                    ops = self.options || {},
                    theMod, i;

                if (!mods) {
                    return self;
                }

                // Make sure mods is always an array
                mods = [].concat(mods);

                for (i = 0; i < mods.length; i++) {
                    theMod = mods[i];

                    if (!!theMod.merge) {
                        ops.merge = true;
                    }


                    self.mods[++Module.uid] = Module.create(self, theMod, Module.uid, ops);
                }

                return self;
            },

            start: function () {
                var self = this,
                    options = self.options,
                    beforeAfter, name, mod;

                beforeAfter = function (mode) {
                    var prop, O, i;
                    if (!!options) {
                        prop = (mode === "after") ? options.afterInit : options.beforeInit;

                        if (!prop) {
                            return;
                        }

                        O = [].concat(prop);
                        for (i in O) {
                            if (O.hasOwnProperty(i) && typeof O[i] === "function") {
                                O[i].call(self);
                            }
                        }
                    }
                };

                beforeAfter("before");

                if (debugMode) {
                    name = (!!options && !!options.name) ? options.name + " " : "";

                    Log(name + "Modules:", self.mods);
                    Log(name + "Messages:", self._PubSub.topics);

                    if (extendConflicts.length > 0) {
                        Log(name + "Conflicts: ", extendConflicts.join(', '));
                    }
                }

                for (mod in self.mods) {
                    if ("init" in self.mods[mod]) {
                        self.mods[mod].init();
                    }
                }

                if (O && !!O.debug) {
                    Log("Modules:", self.mods);
                    Log("Messages:", self._PubSub.topics);
                }
                beforeAfter("after");

                return self;
            },


            inject: function (O) {
                var self = this,
                    Module = self._Module,
                    List = Array.prototype.slice.call(arguments, 1),
                    uid = (Internal.size(self.mods) - 1),
                    ops = self.options || {},
                    theMod, i;

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

                        theMod = O[i];

                        if (!!theMod.merge) {
                            ops.merge = true;
                        }

                        self.mods[uid] = Module.create(self, theMod, ++Module.uid, ops);

                        if ("init" in self.mods[uid]) {
                            self.mods[uid].init();
                        }
                    }
                }
                return self;
            }

        };

        return function (options) { // constructor
            var Cluster = Internal.create(proto);

            if (options) {
                if (!!options.debug){
                    debugMode = true;
                    delete options.debug;
                }
                
                options.merge = (!!options.merge || !!options.mergeEnhancements) ? true : false;
            }

            Cluster.options = options;
            Cluster.mods = {};
            Cluster.enhancements = {};

            Internal.extend(Cluster, {

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

}(window));
