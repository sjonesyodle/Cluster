
// Define a Cluster...
var x = Cluster();


// Add an enhancment for use in all modules in this cluster...
x.enhance({
    util : {
        somemethod : function () {
            console.log("yo");
        }
    }
});



// Collect Modules in an Array...
x.collect([

    {
        init : function () {
            // Add a subscription, and get it's token
            var token = this._sub("say", function ( word ) {
                console.log(token);
            });
        },
        
        say : function (word) {
            console.log(word);
        } 
    },
    
    
    {
        init : function () {
            this._pub("say", "what's up");
        }
    }

]);


// Start the cluster...
x.start();
