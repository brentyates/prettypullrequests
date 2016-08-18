var isGitHub = $("meta[property='og:site_name']").attr('content') === 'GitHub';
var useLocalStorage = true;
var lsNamespace = 'ppr'; // Prepend to entries in localStorage for some namespacing to make deletion easier.
var pullRequestNumber;
var commitHash;
var repositoryName;
var repositoryAuthor;

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
    var $ids = $as.map(function(index, a) {
        return $(a).attr('name');
    });

    return $ids;
}

function getId(path) {
    var $span = $('span[title="' + path + '"]').closest('[id^=diff-]');
    var $a = $span.prev('a[name^=diff-]');
    var id = $a.attr('name');

    return id;
}

function uniquify(diffId) {
  var diffViewId = pullRequestNumber || commitHash;

  return lsNamespace + '|' + repositoryAuthor + '|' + repositoryName + '|' + diffViewId + '|' + diffId;
}

function collectUniquePageInfo() {
  repositoryAuthor = $('[itemprop="author"]').find('a').text();
  repositoryName = $('strong[itemprop="name"]').find('a').text();
  pullRequestNumber = $('.gh-header-number').text();
  commitHash = $('.sha.user-select-contain').text();
}

function toggleDiff(id, duration, display) {
    var $a = $('a[name^=' + id + ']');

    duration = !isNaN(duration) ? duration : 200;

    if ($.inArray(display, ['expand', 'collapse', 'toggle']) < 0) {
        if (!useLocalStorage) {
            display = 'toggle';
        } else {
            display = (localStorage.getItem(uniquify(id)) === 'collapse') ? 'expand' : 'collapse';
        }
    }

    if ($a) {
        var $span = $a.next('div[id^=diff-]');
        var $data = $span.children('.data, .image');
        var $bottom = $span.children('.bottom-collapse');

        switch (display) {
            case 'toggle':
                $data.toggle(duration);
                $bottom.toggle();
                return true;
            case 'expand':
                $data.slideDown(duration);
                $bottom.show();
                return useLocalStorage ? localStorage.removeItem(uniquify(id)) : true;
            default:
                $data.slideUp(duration);
                $bottom.hide();
                return useLocalStorage ? localStorage.setItem(uniquify(id), display) : true;
        }
    }
    return false;
}

function toggleDiffs(path, display) {
    var $ids = getIds(path);

    $ids.each(function(index, id) {
        toggleDiff(id, 200, display);
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

function initDiffs() {
    if (useLocalStorage) {
        $('a[name^=diff-]').each(function(index, item) {
            var id = $(item).attr('name');

            if (localStorage.getItem(uniquify(id)) === 'collapse') {
                toggleDiff(id, 0, 'collapse');
            }
        });
    }
}

function clickTitle() {
    var path = $(this).attr('title');
    var id = getId(path);

    return toggleDiff(id);
}

function clickCollapse() {
    var $span = $(this).prevAll('.file-header');
    var path = $span.attr('data-path');
    var id = getId(path);

    return toggleDiff(id, '200', 'collapse');
}

chrome.storage.sync.get({url: '', saveCollapsedDiffs: true, tabSwitchingEnabled: false}, function(items) {
    if (items.url == window.location.origin ||
        "https://github.com" === window.location.origin) {

        var injectHtmlIfNecessary = function () {
            if (!htmlIsInjected()) {
                collectUniquePageInfo();
                injectHtml();
                initDiffs();
            }
            setTimeout(injectHtmlIfNecessary, 1000);
        };
        var $body = $('body');
        useLocalStorage = items.saveCollapsedDiffs;

        injectHtmlIfNecessary();

        $body.on('click', '.user-select-contain, .js-selectable-text', clickTitle);

        $body.on('click', '.bottom-collapse', clickCollapse);

        $body.on('click', '.js-collapse-additions', collapseAdditions);

        $body.on('click', '.js-collapse-deletions', collapseDeletions);

        if (items.tabSwitchingEnabled) {
          $body.on('keydown', function (e) {
              if (e.keyCode !== 192 || e.target.nodeName === 'TEXTAREA') {
                  return;
              }

              var $pullRequestTabs = $('nav.tabnav-tabs a.tabnav-tab');
              var $selectedTab     = $('nav.tabnav-tabs a.tabnav-tab.selected');
              var selectedTabIndex = $pullRequestTabs.index( $selectedTab );

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
                    toggleDiffs(msg.collapse, 'collapse');
                }
                if (msg.expand !== undefined) {
                    toggleDiffs(msg.expand, 'expand');
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
