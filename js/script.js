(function() {
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

// -----------------------------------------------------------------------------
function event(name, detail) {
    document.dispatchEvent(new CustomEvent(name, { detail }));
}

// -----------------------------------------------------------------------------
document.addEventListener('lips', function(e) {
    const id = e.detail.id;
    const { type, args } = e.detail.message;
    if (type === 'exec') {
        lips.exec(args[0]).then(function(result) {
            result = result.map(x => {
                if (x && typeof x === 'object') {
                    return x.valueOf();
                }
                return x;
            }).filter(x => typeof x !== 'undefined');
            event('forward-reply', { result, id });
        }).catch(function(error) {
            event('forward-reply', { error, id });
        });
    }
});

// -----------------------------------------------------------------------------
document.addEventListener('back-reply', function(e) {
    console.log({'back': e});
    req.invoke(e.detail);
});

// -----------------------------------------------------------------------------
var req = requester();

// -----------------------------------------------------------------------------
lips.env.set('stdout', lips.OutputPort(function() {
    var args = Array.from(arguments).map(x => x.valueOf());
    if (args.length) {
        return req.promise({ name: 'stdout', args }, function({ id, data }) {
            event('back-request', { id, message: data });
        });
    }
}));

// -----------------------------------------------------------------------------
lips.env.set('debug', function() {
    return req.promise({name: 'debug'}, function({ id, data }) {
        event('back-request', { id, message: data });
    });
});

// -----------------------------------------------------------------------------
lips.env.set('stdin', lips.InputPort(function() {
    return req.promise({name: 'stdin'}, function({ id, data }) {
        console.log({data, id});
        event('back-request', { id, message: data });
    });
}));

// -----------------------------------------------------------------------------
var style = (bg, radius = '') => `${radius ? 'border-radius: ' + radius + ';' : ''}padding: 2px 10px; background: ${bg}; color: white`;
if (window.lips) {
    console.log(
        `%cDevTools%cDetected LIPS%c${lips.version}`,
        style('#3E5975', '4px 0 0 4px'),
        style('#DD0031'),
        style('#C3002F', '0 4px 4px 0')
    );
}

})();
