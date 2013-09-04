/*
  For testing modules, this enhancment exposes the interfaces of each module to
  the window.

  This is NOT an enhacement!
*/

var myApp,
    options = {
        mergeEnhancments: true
    };

// Add the function to `afterInit`
options.afterInit = function () {
    var self = this,
        mods = self.mods,
        Interfaces = {},
        name, mod, i, x;

    for (i in mods) {
        if (mods.hasOwnProperty(i)) {
            mod = mods[i];
            delete mod._context;
            name = Interfaces[mod.name] = {};
            for (x in mod) {
                if (mod.hasOwnProperty(x)) {
                    name[x] = mod[x];
                }
            }
        }
    }
    window.clusterInterfaces = window.$C = Interfaces;
};

// Start the Cluster instance
myApp = Cluster(options);

// Collect Some modules...
