function collapseOrExpand() {
    $(this).closest('[id^=diff-]').children('.data').slideToggle(500);
}

function getSpans(path) {
    var spans;
    if (path == "") {
        spans = $('.js-selectable-text');
    }
    else {
        spans = $("span:contains('" + path + "')");
    }
    return spans;
}

function collapse(path) {
    getSpans(path).closest('[id^=diff-]').children('.data').slideUp(500);
}

function expand(path) {
    getSpans(path).closest('[id^=diff-]').children('.data').slideDown(500);
}

$('.js-selectable-text').bind('click', collapseOrExpand);

chrome.runtime.onConnect.addListener(function(port) {
    console.assert(port.name == "pullrequest");

    port.onMessage.addListener(function(msg) {
        if (msg.collapse != undefined) {
            collapse(msg.collapse);
        }
        if (msg.expand != undefined) {
            expand(msg.expand);
        }
    });
});
