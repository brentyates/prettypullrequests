
var gh_enterprise;

function host(url) {
    return url.trim().replace(/^(?:https?:\/\/)([^\/?#]+).*$/, '$1').toLowerCase();
}

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    var urls = gh_enterprise ?
                gh_enterprise.concat(",").concat("github.com")
               : "github.com";

    urls = urls.split(',').map(host);
    if (-1 !== urls.indexOf(host(tab.url))) {
        chrome.pageAction.show(tabId);
    }
});

chrome.storage.sync.get({url: ''}, function(items) {
    gh_enterprise = items.url;
});
