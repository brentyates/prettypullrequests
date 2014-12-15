
var previous_value;

// Saves options to chrome.storage
function save_options () {
  var url = document.getElementById('url').value;

  if (!url || url === 'https://' || previous_value === url) {
    return;
  }

  chrome.storage.sync.set({
      url: url
  }, function () {
      var status = document.getElementById('status');
      status.textContent = 'Options saved.';
      previous_value = url;
      setTimeout(function () {
          status.textContent = '';
      }, 750);
  });
}

document.addEventListener('DOMContentLoaded', function () {
    chrome.storage.sync.get({url: ''}, function(items) {
        document.getElementById('url').value = items.url;
        previous_value = items.url;
    });
    document.getElementById('save').addEventListener('click', save_options);
});

