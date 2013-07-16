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
            destination[prop] = source[prop];
        }
        return destination;
    };
}());


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
                    var
                    subscribers = that.topics[topic],
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
        var
        proto = {

            collect: function (mods) {
                var Module = this._Module,
                    i;

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

                for (mod in this.mods) {
                    if ("init" in this.mods[mod]) {
                        this.mods[mod].init();
                    }
                }

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


