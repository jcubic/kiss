let created = false;
let checkCount = 0;
chrome.devtools.network.onNavigated.addListener(createPanelIfHasLips);
const checkVueInterval = setInterval(createPanelIfHasLips, 1000);
createPanelIfHasLips();

function createPanelIfHasLips() {
  if (created || checkCount++ > 10) {
    clearInterval(checkVueInterval);
    return;
  }
  chrome.devtools.inspectedWindow.eval(
    '!!window.lips',
    function (hasVue) {
      if (!hasVue || created) {
        return;
      }
      clearInterval(checkVueInterval);
      created = true;
      chrome.tabs.executeScript({
          file: 'js/content-script.js'
      });
      chrome.devtools.panels.create(
        "KISS", '/img/icon128.png', "/html/panel.html",
        panel => {
          // panel loaded
        }
      );
    }
  )
}

//chrome.tabs.query
