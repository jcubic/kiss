var __i = 0;
var messages = (function() {
  var handlers = [];
  var port;
  var listeners = [];
  setTimeout(function() {
      port = chrome.extension.connect({
          name: "kiss-connection-" + __i++
      });
      port.onMessage.addListener(function(data) {
          console.log({data});
          if (data.type === 'forward') {
              req.invoke(data);
          }
          listeners.forEach(function(handler) {
              handler(data);
          });
      });
  }, 400);
  function reply(id, message) {
      const tabId = chrome.devtools.inspectedWindow.tabId;
      var message = {action: 'reply', tabId, id, message};
      console.log(message);
      port.postMessage(message);
  }
  function listen(fn) {
      listeners.push(function(data) {
          if (data.type === 'backward') {
              var ret = fn(data);
              if (ret.then) {
                  ret.then((ret) => reply(data.id, ret.valueOf()));
              } else {
                  reply(data.id, ret);
              }
          }
      });
  }
  var req = requester();
  function send(type, args) {
      args = args.map(x => x.valueOf());
      return req.promise({type, args}, function({id, data}) {
          const tabId = chrome.devtools.inspectedWindow.tabId;
          var message = {action: 'lips', tabId, id, message: data};
          port.postMessage(message);
      }).then(r => {
          console.log({r});
          return r;
      });
  }
  return {
      send,
      listen
  };
})();
