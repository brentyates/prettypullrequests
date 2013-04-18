function checkForValidUrl(tabId, changeInfo, tab) {
    if (tab.url.match("^https://github.com")) {
        chrome.pageAction.show(tabId);
    }
}

chrome.tabs.onUpdated.addListener(checkForValidUrl);
