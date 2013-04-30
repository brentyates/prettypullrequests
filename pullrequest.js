function collapseOrExpandDiff() {
    $(this).closest('[id^=diff-]').children('.data').slideToggle(500);
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
}

function expandDiffs(path) {
    getDiffSpans(path).closest('[id^=diff-]').children('.data').slideDown(500);
}

$('.js-selectable-text').bind('click', collapseOrExpandDiff);

$('<span class="collapse-lines">' +
    '<label><input type="checkbox" class="js-collapse-additions" checked="yes">+</label>' +
    '<label><input type="checkbox" class="js-collapse-deletions" checked="yes">-</label>' +
    '</span>').insertAfter('.actions .show-inline-notes');
$('.js-collapse-additions').bind('click', collapseOrExpandAdditions);
$('.js-collapse-deletions').bind('click', collapseOrExpandDeletions);

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
