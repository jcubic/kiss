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

function event(name, detail) {
    document.dispatchEvent(new CustomEvent(name, { detail }));
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === 'lips') {
        forward.promise(request.message, function({id}) {
            event('lips', {id, message: request.message});
        }).then(function(result) {
            sendResponse(result);
        });
    } else if (request.action === 'reply') {
        console.log({reply: request, vs: 'lips'});
        backward.invoke(request);
    }
});
var forward = requester();
var backward = requester();

document.addEventListener('forward-reply', function(e) {
  forward.invoke(e.detail);
});

document.addEventListener('back-request', function(e) {

    var {id, message} = e.detail;
    console.log({back_req: e.detail});
    backward.promise(message, function({id}) {
        console.log({send: id, message});
        chrome.runtime.sendMessage(null, {id, message}, null, function(reply) {
            console.log('sendMessage ret');
        });
    }).then(function(reply) {
        console.log({reply, id, resolve: true});
        event('back-reply', {id, message: reply});
    });
});

var script = document.createElement('script');
script.src = chrome.extension.getURL('js/script.js');
(document.head||document.documentElement).appendChild(script);
script.onload = function() {
    script.remove();
};

     
