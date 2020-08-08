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
            console.log('forward ' + id);
            event('lips', {id, message: request.message});
        }).then(function(result) {
            console.log('cm');
            console.log(result);
            sendResponse(result);
        });
    }
});
var forward = requester();

document.addEventListener('forward-reply', function(e) {
  console.log('invoke');
  console.log(e.detail);
  forward.invoke(e.detail);
});
document.addEventListener('back-request', function(e) {
    var {id, message} = e.detail;
    console.log({b: message});
    chrome.runtime.sendMessage(null, message, null, function(reply) {
        console.log({reply});
        event('back-reply', {id, message: reply});
    });
});

var script = document.createElement('script');
script.src = chrome.extension.getURL('js/script.js');
(document.head||document.documentElement).appendChild(script);
script.onload = function() {
    script.remove();
};

     
