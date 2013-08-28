/*
  The Bank
  Cluster Addon
  The Bank provides 3 useful methods to get, set, and load global data in your app.
*/

var cluster = Cluster(),
	enhancements;


enhancements = {
	Bank: (function () {
        var bank = {};
        return {

            add: function (modID, k, v) {
                modID = trim(modID.slice(modID.indexOf("/") + 1));
                if (!bank[modID]) {
                    bank[modID] = {};
                }
                bank[modID][k] = v;
            },

            get: function (modID, k) {
                return bank[modID] ? bank[modID][k] : undefined;
            },

            load: function (obj, context) {
                var modID, bankProp, pass = true;
                $.each(obj, function (v, k) {
                    modID = trim(v);
                    bankProp = trim(k);
                    if (!(modID in bank) || !bank[modID][bankProp]) {
                        pass = false;
                        return;
                    }
                    context[bankProp] = bank[modID][bankProp];
                });
                return pass;
            }
        };
    }())
};

cluster.enhance(enhancements);

// collect modules and start `cluster` below...
