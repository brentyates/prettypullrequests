
var isGitHub = $("meta[property='og:site_name']").attr('content') === 'GitHub';

function htmlIsInjected() {
  return $('.pretty-pull-requests').length !== 0;
}

function injectHtml() {
  $('<span class="pretty-pull-requests collapse-lines">' +
        '<label><input type="checkbox" class="js-collapse-additions" checked="yes">+</label>' +
        '<label><input type="checkbox" class="js-collapse-deletions" checked="yes">-</label>' +
    '</span>').insertAfter('.actions, .file-actions');

  $('<div class="pretty-pull-requests bottom-collapse">Click to Collapse</div>').insertAfter('.data.highlight.blob-wrapper');
}

function collapseAdditions() {
    if (isGitHub) {
        $(this).closest('[id^=diff-]').find('.blob-code-addition').parent('tr').slideToggle();
    } else {
        $(this).closest('[id^=diff-]').find('.gi').slideToggle();
    }
}

function collapseDeletions() {
    if (isGitHub) {
        $(this).closest('[id^=diff-]').find('.blob-code-deletion').parent('tr').slideToggle();
    } else {
        $(this).closest('[id^=diff-]').find('.gd').slideToggle();
    }
}

function getDiffSpans(path) {
    return $('.js-selectable-text').filter(function () {
        return this.innerHTML.trim().match(path);
    });
}

function collapseDiffs(path) {
    var spans = getDiffSpans(path).closest('[id^=diff-]');
    spans.children('.data, .image').slideUp(200);
    spans.children('div.bottom-collapse').hide();
}

function expandDiffs(path) {
    var spans = getDiffSpans(path).closest('[id^=diff-]');
    spans.children('.data, .image').slideDown(200);
    spans.children('div.bottom-collapse').show();
}

function moveToNextTab($pullRequestTabs, $selectedTab) {
  if ($selectedTab.get(0) === $pullRequestTabs.get(-1)) {
    // We're on the last tab. Click on the first one.
    $pullRequestTabs.first().simulate('click');
  } else {
    // Get the tab index we're on.
    var tabIndex = $pullRequestTabs.index($selectedTab);
    // Click on the next tab.
    tabIndex += 1;
    // Wrap the tab in a jQuery object so we can click on it.
    $($pullRequestTabs.get(tabIndex)).simulate('click');
  }
}

function moveToPreviousTab($pullRequestTabs, $selectedTab) {
  if ($selectedTab.get(0) === $pullRequestTabs.get(0)) {
    // We're on the first tab. Click on the last one.
    $pullRequestTabs.last().simulate('click');
  } else {
    // Get the tab index we're on.
    var tabIndex = $pullRequestTabs.index($selectedTab);
    // Click on the previous tab.
    tabIndex -= 1;
    // Wrap the tab in a jQuery object so we can click on it.
    $($pullRequestTabs.get(tabIndex)).simulate('click');
  }
}

chrome.storage.sync.get({url: ''}, function(items) {
    if (items.url == window.location.origin ||
        "https://github.com" === window.location.origin) {

        var injectHtmlIfNecessary = function () {
            if (!htmlIsInjected()) {
                injectHtml();
            }
            setTimeout(injectHtmlIfNecessary, 1000);
        };
        injectHtmlIfNecessary();

        var $body = $('body');

        $body.on('click', '.js-selectable-text, .bottom-collapse', function (e) {
            var span = $(this).closest('[id^=diff-]');
            span.children('.data, .image').slideToggle(200);
            if ($(e.target).hasClass('bottom-collapse')) {
                $(this).closest('div.bottom-collapse').toggle();
            } else {
                span.children('div.bottom-collapse').toggle();
            }
            span.children('.meta')[0].scrollIntoViewIfNeeded();
        });

        $body.on('click', '.js-collapse-additions', collapseAdditions);

        $body.on('click', '.js-collapse-deletions', collapseDeletions);

        var $pullRequestTabs = $('.js-pull-request-tab');

        $body.on('keydown', function (e) {
          if (e.keyCode !== 192) {
            return;
          }

          var $selectedTab = $('.js-pull-request-tab.selected');

          if (e.shiftKey) {
            // Making this work like it would in other apps, where the shift
            // key makes the cmd+tilde go backwards through the list.
            moveToPreviousTab($pullRequestTabs, $selectedTab);
          } else {
            moveToNextTab($pullRequestTabs, $selectedTab);
          }
        });

        // Actions per changed file
        chrome.runtime.onConnect.addListener(function (port) {
            console.assert(port.name == "pullrequest");

            port.onMessage.addListener(function (msg) {
                if (msg.collapse !== undefined) {
                    collapseDiffs(msg.collapse);
                }
                if (msg.expand !== undefined) {
                    expandDiffs(msg.expand);
                }
                if (msg.goto !== undefined) {
                    getDiffSpans(msg.goto)[0].scrollIntoViewIfNeeded();
                }
            });
        });

        // Create the tree with the changed files after pressing the octocat button
        chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
            if (request.getPaths) {
                var paths = $.map($('.file .js-selectable-text'), function (item) {
                    return $.trim(item.innerHTML);
                });
                if (paths.length > 0) {
                    sendResponse({paths: paths});
                }
            }
        });
    }
});
