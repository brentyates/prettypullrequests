
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
    return $('.user-select-contain, .js-selectable-text').filter(function () {
        return this.innerHTML.trim().match(path);
    });
}

function getIds(path) {
    var $spans = getDiffSpans(path).closest('[id^=diff-]');
    var $as = $spans.prev('a[name^=diff-]');
    var ids = $as.map(function(index, a) {
        return $(a).attr('name');
    });

    return ids;
}

function collapseDiffs(path) {
    var ids = getIds(path);

    ids.each(function(index, id) {
        toggleDiff(id, 200, 'hide');
    });
}

function expandDiffs(path) {
    var ids = getIds(path);

    ids.each(function(index, id) {
        toggleDiff(id, 200, 'show');
    });
}

function moveToNextTab($pullRequestTabs, selectedTabIndex) {
    selectedTabIndex += 1;
    if (selectedTabIndex >= $pullRequestTabs.length) {
        selectedTabIndex = 0;
    }
    $pullRequestTabs[selectedTabIndex].click();
}

function moveToPreviousTab($pullRequestTabs, selectedTabIndex) {
    selectedTabIndex -= 1;
    if (selectedTabIndex < 0) {
        selectedTabIndex = $pullRequestTabs.length - 1;
    }
    $pullRequestTabs[selectedTabIndex].click();
}

function getIdFromPath(path) {
    var $span = $('span[title="' + path + '"]').closest('[id^=diff-]');
    var $a = $span.prev('a[name^=diff-]');
    var id = $a.attr('name');

    return id;
}

function initDiffs() {
    $('a[name^=diff-]').each(function(index, item) {
        var id = $(item).attr('name');

        if (localStorage.getItem(id) === 'hide') {
            toggleDiff(id, 0, 'hide');
        }
    });
}

function toggleDiff(id, duration, display) {
    var $a = $('a[name^=' + id + ']');

    duration = duration ? duration : 200;

    if (display != 'show' && display != 'hide') {
        display = localStorage.getItem(id) === 'hide' ? 'show' : 'hide';
    }

    if ($a) {
        var $span = $a.next('div[id^=diff-]');
        var $data = $span.children('.data, .image');
        var $bottom = $span.children('.bottom-collapse');

        if (display === 'show') {
            $data.slideDown(duration);
            $bottom.show();
        } else {
            $data.slideUp(duration);
            $bottom.hide();
        }

        return localStorage.setItem(id, display);
    }
    return false;
}

function clickTitle(event) {
    var path = $(this).attr('title');
    var id = getIdFromPath(path);

    return toggleDiff(id);
}

function clickCollapse(event) {
    var $span = $(this).prevAll('.file-header');
    var path = $span.attr('data-path');
    var id = getIdFromPath(path);

    return toggleDiff(id, '200', 'hide');
}

chrome.storage.sync.get({url: '', tabSwitchingEnabled: false}, function(items) {
    if (items.url == window.location.origin ||
        "https://github.com" === window.location.origin) {

        var injectHtmlIfNecessary = function () {
            if (!htmlIsInjected()) {
                injectHtml();
                initDiffs();
            }
            setTimeout(injectHtmlIfNecessary, 1000);
        };
        injectHtmlIfNecessary();

        var $body = $('body');

        $body.on('click', '.user-select-contain, .js-selectable-text', clickTitle);

        $body.on('click', '.bottom-collapse', clickCollapse);

        $body.on('click', '.js-collapse-additions', collapseAdditions);

        $body.on('click', '.js-collapse-deletions', collapseDeletions);

        if (items.tabSwitchingEnabled) {
          $body.on('keydown', function (e) {
              if (e.keyCode !== 192 || e.target.nodeName === 'TEXTAREA') {
                  return;
              }

              var $pullRequestTabs = $('.js-pull-request-tab');
              var selectedTabIndex = $('.js-pull-request-tab.selected').index();

              if (e.shiftKey) {
                  // Making this work like it would in other apps, where the shift
                  // key makes the cmd+tilde go backwards through the list.
                  moveToPreviousTab($pullRequestTabs, selectedTabIndex);
              } else {
                  moveToNextTab($pullRequestTabs, selectedTabIndex);
              }
          });
        }

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
                var paths = $.map($('.file .user-select-contain, .file .js-selectable-text'), function (item) {
                    return $.trim(item.innerHTML);
                });
                if (paths.length > 0) {
                    sendResponse({paths: paths});
                }
            }
        });
    }
});
