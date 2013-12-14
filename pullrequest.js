function collapseOrExpandDiff(e) {
    var diffDom = $(this).closest('[id^=diff-]');
    diffDom.children('.data, .image, div.view-modes').slideToggle(500);
    if ($(e.target).hasClass('bottom-collapse')) {
        $(this).toggle();
    } else {
        diffDom.find('.bottom-collapse').toggle();
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
    var allDiffSpans =  getDiffSpans(path).closest('[id^=diff-]');
    allDiffSpans.children('.data, .image, div.view-modes').slideUp(500);
    allDiffSpans.find('.bottom-collapse').hide();
}

function expandDiffs(path) {
    var allDiffSpans =  getDiffSpans(path).closest('[id^=diff-]');
    allDiffSpans.children('.data, .image, div.view-modes').slideDown(500);
    allDiffSpans.find('.bottom-collapse').show();
}

$('.js-selectable-text').bind('click', collapseOrExpandDiff);

$('<span class="collapse-lines">' +
    '<label><input type="checkbox" class="js-collapse-additions" checked="yes">+</label>' +
    '<label><input type="checkbox" class="js-collapse-deletions" checked="yes">-</label>' +
    '</span>').insertAfter('.actions .show-inline-notes');
$('<div class="bottom-collapse meta">' + 
    'Collapse diff'+
    '</div>').insertAfter('.data, .image');
$('div.view-modes').closest('[id^=diff-]').addClass('auto-height');
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
