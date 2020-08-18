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

var req = requester();

chrome.runtime.onConnect.addListener(function(port) {
    var devToolsListener = function(message, sender, sendResponse) {
        var id = message.id;
        if (message.type === 'backward') {
            req.invoke(message);
        } else if (message.action === 'code') {
            chrome.tabs.executeScript(message.tabId, {code: message.content});
        } else if (message.action === 'script') {
            chrome.tabs.executeScript(message.tabId, {file: message.content});
        } else {
            chrome.tabs.sendMessage(message.tabId, message, function(result) {
                port.postMessage({result, type: 'forward', id});
            });
        }
    }
    // backward request
    var request_back = function(request, sender, sendResponse) {
        console.log({backward: request});
        req.promise(request, function({data, id}) {
            port.postMessage({message: data, type: 'backward', id});
        }).then(function(response) {
            sendResponse(response);
        });
        //sendResponse();
    };
    chrome.runtime.onMessage.addListener(request_back);
    port.onMessage.addListener(devToolsListener);

    port.onDisconnect.addListener(function() {
         port.onMessage.removeListener(devToolsListener);
        chrome.runtime.onMessage.removeListener(request_back);
    });
});


