
var gh_enterprise;

function host(url) {
    return url.trim().replace(/^(?:https?:\/\/)([^\/?#]+).*$/, '$1').toLowerCase();
}

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  var urls = ['github.com'];
  if (gh_enterprise) {
    gh_enterprise = gh_enterprise.replace('https://', '');
    gh_enterprise = gh_enterprise.replace('http://', '');
    urls.push(gh_enterprise);
  }

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
    gh_enterprise = items.url;
});
