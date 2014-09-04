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

$(
    '<span class="collapse-lines">' +
        '<label><input type="checkbox" class="js-collapse-additions" checked="yes">+</label>' +
        '<label><input type="checkbox" class="js-collapse-deletions" checked="yes">-</label>' +
    '</span>'
).insertAfter('.actions');

$('<div class="bottom-collapse meta">Click to Collapse</div>').insertAfter('.data.highlight.blob-wrapper');

$('.js-selectable-text, .bottom-collapse').on('click', function (e) {
    var span = $(this).closest('[id^=diff-]');
    span.children('.data, .image').slideToggle(200);
    if ($(e.target).hasClass('bottom-collapse')) {
        $(this).closest('div.bottom-collapse').toggle();
    } else {
        span.children('div.bottom-collapse').toggle();
    }
    span.children('.meta')[0].scrollIntoViewIfNeeded();
});

$('.js-collapse-additions').on('click', function() {
    $(this).closest('[id^=diff-]').find('.blob-code-addition').parent('tr').slideToggle();
});

$('.js-collapse-deletions').on('click', function() {
    $(this).closest('[id^=diff-]').find('.blob-code-deletion').parent('tr').slideToggle();
});

chrome.runtime.onConnect.addListener(function(port) {
    console.assert(port.name == "pullrequest");

    port.onMessage.addListener(function(msg) {
        if (msg.collapse != undefined) {
            collapseDiffs(msg.collapse);
        }
        if (msg.expand != undefined) {
            expandDiffs(msg.expand);
        }
        if (msg.goto != undefined) {
            getDiffSpans(msg.goto)[0].scrollIntoViewIfNeeded();
        }
    });
});

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if (request.getPaths) {
            var paths = $.map($('.file .js-selectable-text'), function(item) { return $.trim(item.innerHTML) });
            if (paths.length > 0) {
                sendResponse({paths: paths});
            }
        }

    }
);
