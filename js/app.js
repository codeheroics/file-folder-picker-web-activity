/*
* Copyright (c) 2013-2015 Jhon Klever, http://github.com/elfoxero
*
* Permission is hereby granted, free of charge, to any person obtaining a copy
* of this software and associated documentation files (the "Software"), to
* deal in the Software without restriction, including without limitation the
* rights to use, copy, modify, merge, publish and distribute, subject to the
* following conditions:
*
* The above copyright notice and this permission notice shall be included in
* all copies or substantial portions of the Software.
*
* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
* IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
* FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
* AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
* LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
* FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
* IN THE SOFTWARE.
*
*/

window.FilePicker = {};

(function() {
  var _ = window.document.webL10n.get;
  var selectedFolder = '';
  var localizationLoaded = false;
  var activityLoaded = false;

  FilePicker.utils = FilePicker.utils || {};

  if (document.querySelector('#refresh')) {
    document.querySelector('#refresh').addEventListener('click', function (e) {
      FilePicker.config.toolbar = 'loading';
      FilePicker.files.reset();

      if (document.body.dataset.devices === 'true') {
        if (!document.getElementById('index').classList.contains('left')) {
          var stateLabels = document.querySelectorAll("#index ul.files > li > a > p:nth-child(2)");

          [].forEach.call(stateLabels, function (label) {
            label.textContent = '';
          });

          FilePicker.storage.refresh(function (index, value) {
            if (typeof value === 'number') {
              FilePicker.files.updateCard(index, {space: value});
            } else {
              FilePicker.files.updateCard(index, {status: value});
            }

            if (index === stateLabels.length - 1) {
              FilePicker.config.toolbar = [stateLabels.length, 'devices'];
            }
          });
        } else {
          FilePicker.storage.refresh();
        }
      } else {
        FilePicker.storage.refresh();
      }
    });
  }

  FilePicker.init = function() {
    if (!activityLoaded || !localizationLoaded) return;
    if (FilePicker.files.path.length > 0) {
      FilePicker.storage.load(true);
    } else {
      FilePicker.utils.preload.complete();
      FilePicker.storage.load(false);
    }
  };


  window.addEventListener('localized', function() {
    FilePicker.config.app = _('file-picker');

    document.documentElement.lang = document.webL10n.getLanguage();
    document.documentElement.dir = document.webL10n.getDirection();

    localizationLoaded = true;
    FilePicker.init();
  }, false);

  navigator.setMessageHandler = navigator.setMessageHandler || navigator.mozSetMessageHandler;
  navigator.setMessageHandler('activity', function(activity) {
    FilePicker.activity = activity;
    FilePicker.config.activityName = activity.source.name.indexOf('folder') !== -1 ? 'folder' : 'file';
    FilePicker.config.app = _(FilePicker.config.activityName + '-picker');

    activityLoaded = true;
    FilePicker.init();

    document.querySelector('#close').onclick = function (e) {
      FilePicker.activity.postError('Activity cancelled');
      FilePicker.activity = null;
    };

    if (FilePicker.config.activityName !== 'folder') return;

    var doneBtn = document.getElementById('done');
    doneBtn.style.display = 'block';

    doneBtn.addEventListener('click', function () {
      FilePicker.files.call(function (curFile, curDir) {
        FilePicker.activity.postResult({path: curDir});
        FilePicker.activity = null;
      });
    });
  });
})();
