const urls = ['github.com'];

function host(url) {
    return new URL(url).hostname;
}

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  if (urls.includes(host(tab.url))) {
    chrome.pageAction.show(tabId);
    if (!tab.url.includes('github.com')) {
      chrome.tabs.insertCSS(null, {file: "pullrequest.css"});
      chrome.tabs.executeScript(null, {file: "jquery-1.9.1.min.js"});
      chrome.tabs.executeScript(null, {file: "enterprise.js"});
    }
  }
});

chrome.storage.sync.get({url: ''}, function(items) {
    urls.push(host(items.url));
});
