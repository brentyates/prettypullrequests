;(function ($) {
  'use strict';

  function saveOptionsToChromeStorage(options, callback) {
    chrome.storage.sync.set(options, callback);
  }

  function loadItemsFromChromeStorage(options, callback) {
    chrome.storage.sync.get(options, function (items) {
      callback(items);
    });
  }

  function addNewAutoCollapseField(value) {
    var controlForm = $('#auto-collapse-form'),
        currentEntry = $(controlForm).children('.entry:last'),
        newEntry = $(currentEntry.clone()).appendTo(controlForm);

    newEntry.find('input').val(value);
    controlForm.find('.entry:not(:last) .btn-add')
        .removeClass('btn-add').addClass('btn-remove')
        .removeClass('btn-success').addClass('btn-danger')
        .html('<span class="glyphicon glyphicon-minus"></span>');
  }

  function resetAutoCollapseFields() {
    var controlForm = $('#auto-collapse-form'),
        currentEntry = $(controlForm).children('.entry:last'),
        newEntry = $(currentEntry.clone());
    controlForm.find('.entry').each((index, item) => {
      item.remove();
    });
    newEntry.appendTo(controlForm);
  }

  function setFormValues(options) {
    resetAutoCollapseFields();
    for (var key in options) {
      var $formInput = $('input[name="' + key + '"]');

      if ($formInput.prop('type') === 'checkbox') {
        $formInput.prop('checked', options[key]);
      } else {
        if (options[key].constructor === Array) {
          var values = options[key];
          $formInput.val(values.pop())
          values.forEach(value => {
            addNewAutoCollapseField(value);
          });
        } else {
          $formInput.prop('value', options[key]);
        }
      }
    }
  }

  function getChangedValuesObject(changedAttributes) {
    var updates = {};

    for (var key in changedAttributes) {
      updates[key] = changedAttributes[key].newValue;
    }

    return updates;
  }

  $(document).ready(function () {
    loadItemsFromChromeStorage({
      url: '',
      saveCollapsedDiffs: true,
      tabSwitchingEnabled: false,
      autoCollapseExpressions: []
      // Add new items here to get them loaded and their values put in the form.
    }, setFormValues);

    $('#options-form').submit(function (e) {
      e.preventDefault();

      var $form = $(e.currentTarget);
      var url = $form.find('input[name="url"]').val();
      var origin = url.match(/https?:\/\/[^/?#]+/);
      var saveCollapsedDiffs = $form.find('input[name="saveCollapsedDiffs"]').prop('checked');
      var tabSwitchingEnabled = $form.find('input[name="tabSwitchingEnabled"]').prop('checked');
      var autoCollapseExpressions = [];

      $('input[name="autoCollapseExpressions"]').each((index, item) => {
        autoCollapseExpressions.push($(item).val());
      });
      autoCollapseExpressions = autoCollapseExpressions.filter(item => {return item !== ''});
      if (autoCollapseExpressions.length == 0) {
        autoCollapseExpressions = [''];
      }

      if (origin) {
        origin[0] += '/*';
        chrome.permissions.request({
          origins: origin
        });
      }

      saveOptionsToChromeStorage({
        'url': url,
        'saveCollapsedDiffs': saveCollapsedDiffs,
        'tabSwitchingEnabled': tabSwitchingEnabled,
        'autoCollapseExpressions': autoCollapseExpressions
      }, function () {
          var status = $('#status');
          status.text('Options saved.');
          setTimeout(function () {
              status.text('');
          }, 3000);
      });
    });

    $(document).on('click', '.btn-add', function(e) {
        e.preventDefault;
        addNewAutoCollapseField('');
    }).on('click', '.btn-remove', function(e){
      $(this).parents('.entry:first').remove();

      e.preventDefault();
      return false;
    });

    chrome.storage.onChanged.addListener(function (changes) {
      // The options were updated, update them here too.
      setFormValues(getChangedValuesObject(changes));
    });
  });
} (this.$));
