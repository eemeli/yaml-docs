//= require ../lib/_jquery

;(function () {
  'use strict';

  $.ajax({
    url: 'https://api.github.com/repos/eemeli/yaml/releases/latest',
    dataType: 'json',
    success: function(data) {
      if (/^v[0-9]/.test(data && data.tag_name)) {
        $('#version').text(data.tag_name.slice(1))
      }
    }
  });
})();
