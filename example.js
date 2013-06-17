var x = Cluster();

x.enhance({
    
    util : {
        
        somemethod : function () {
            console.log("yo");
        }
        
    }

});


x.collect([

    {
        
        init : function () {
        
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
            
            this._destroy();
            
        }
        
    }

]);


x.start();
