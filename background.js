
var gh_enterprise;

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    var regExp = gh_enterprise ?
                "^https:\/\/(github.com|" + gh_enterprise + ")"
               : "^https:\/\/github.com";

    if (tab.url.match(regExp)) {
        chrome.pageAction.show(tabId);
    }
});

chrome.storage.sync.get({url: ''}, function(items) {
    gh_enterprise = items.url.replace("https://", "");
});
