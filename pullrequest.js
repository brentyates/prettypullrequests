function collapseOrExpandDiff(e) {
    $(this).closest('[id^=diff-]').children('.data').slideToggle(500);
    if ($(e.target).hasClass('bottom-collapse')) {
        $(this).closest('div.bottom-collapse').toggle();
    } else {
        $(this).closest('[id^=diff-]').children('div.bottom-collapse').toggle();
    }
}

function collapseOrExpandAdditions() {
    $(this).closest('[id^=diff-]').find('.gi').slideToggle();
}

function collapseOrExpandDeletions() {
    $(this).closest('[id^=diff-]').find('.gd').slideToggle();
}

function getDiffSpans(path) {
    var spans;
    if (path == "") {
        spans = $('.js-selectable-text');
    }
    else {
        spans = $("span:contains('" + path + "')");
    }
    return spans;
}

function collapseDiffs(path) {
    getDiffSpans(path).closest('[id^=diff-]').children('.data').slideUp(500);
    getDiffSpans(path).closest('[id^=diff-]').children('div.bottom-collapse').hide();
}

function expandDiffs(path) {
    getDiffSpans(path).closest('[id^=diff-]').children('.data').slideDown(500);
    getDiffSpans(path).closest('[id^=diff-]').children('div.bottom-collapse').show();
}

$('.js-selectable-text').bind('click', collapseOrExpandDiff);

$('<span class="collapse-lines">' +
    '<label><input type="checkbox" class="js-collapse-additions" checked="yes">+</label>' +
    '<label><input type="checkbox" class="js-collapse-deletions" checked="yes">-</label>' +
    '</span>').insertAfter('.actions .show-inline-notes');
$('<div class="bottom-collapse meta">' + 
    'Collapse diff'+
    '</div>').insertAfter('.file-comments-place-holder');
$('.bottom-collapse').bind('click', collapseOrExpandDiff);
$('.js-collapse-additions').bind('click', collapseOrExpandAdditions);
$('.js-collapse-deletions').bind('click', collapseOrExpandDeletions);
$('.js-comment-and-button').text('Close Pull Request');

chrome.runtime.onConnect.addListener(function(port) {
    console.assert(port.name == "pullrequest");

    port.onMessage.addListener(function(msg) {
        if (msg.collapse != undefined) {
            collapseDiffs(msg.collapse);
        }
        if (msg.expand != undefined) {
            expandDiffs(msg.expand);
        }
    });
});
