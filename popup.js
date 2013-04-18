var port;

chrome.tabs.getSelected(null, function(tab) {
    port = chrome.tabs.connect(tab.id, {name: "pullrequest"});
});

function collapse() {
    var path = document.getElementById('path').value;
    port.postMessage({collapse: path});
}

function expand() {
    var path = document.getElementById('path').value;
    port.postMessage({expand: path});
}

document.addEventListener('DOMContentLoaded', function () {
    document.querySelector('#collapse').addEventListener('click', collapse);
    document.querySelector('#expand').addEventListener('click', expand);
});
