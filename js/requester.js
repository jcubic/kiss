function requester() {
    var handlers = [];
    var index = 0;
    function removeHandler(handler) {
        handlers = handlers.filter(function(f) {
           return f !== handler;
        });
    }
    return {
        invoke: function(result) {
            handlers.forEach(function(handler) {
                handler(result);
            });
        },
        promise: function(data, trigger) {
            if (!data) {
                return Promise.resolve();
            }
            return new Promise(function(resolve, reject) {
                var id = index++;
                
                handlers.push(function handler(data) {
                    if (data.id === id) {
                        if (data.error) {
                            reject(data.error);
                        } else {
                            resolve(data.result);
                        }
                        removeHandler(handler);
                    }
                });
                trigger({id, data});
            });
          
        }
    };
}
