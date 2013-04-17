function collapseOrExpand() {
    $(this).closest('[id^=diff-]').children('.data').slideToggle(500);
}

$('.js-selectable-text').bind('click', collapseOrExpand);
