/*
  For testing modules, this enhancment exposes the interfaces of each module to
  the window. 
*/

var myApp,
    options = {
        mergeEnhancments: true // this must be true
    };

// add the function to `afterInit`
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
    window.clusterInterfaces = Interfaces;
};

// Start the Cluster
myApp = Cluster(options);

// Collect Some modules...
