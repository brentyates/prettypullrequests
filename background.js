var urls = ['github.com'];

function host(url) {
    return url.trim().replace(/^(?:https?:\/\/)([^\/?#]+).*$/, '$1').toLowerCase();
}

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  if (-1 !== urls.indexOf(host(tab.url))) {
    chrome.pageAction.show(tabId);
    if (tab.url.indexOf('github.com') < 0) {
      chrome.tabs.insertCSS(null, {file: "pullrequest.css"});
      chrome.tabs.executeScript(null, {file: "jquery-1.9.1.min.js"});
      chrome.tabs.executeScript(null, {file: "enterprise.js"});
    }
  }
});

chrome.storage.sync.get({url: ''}, function(items) {
    urls.push(items.url.replace(/https?:\/\//, ''));
});
