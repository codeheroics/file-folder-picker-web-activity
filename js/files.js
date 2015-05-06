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

window.FilePicker.utils = window.FilePicker.utils || {};

window.FilePicker.utils.files = (function() {
  var types = {
    'video/*': ['video/mp4']
  };

  function getSize(size) {
    if (size === 0) {
      return '0 bytes';
    } else {
      var labels = ['bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
      var index = Math.floor(Math.log(size) / Math.log(1024));

      if (index in labels) {
        return (size / Math.pow(1024, Math.floor(index))).toFixed(2) + ' ' + labels[index];
      } else {
        return '??? bytes';
      }
    }
  }

  function getMIME(ext, def) {
    def = def || '';
    var returned = {mime: def};

    for (var i = 0; i < FilePicker.MIME.length; i++) {
      if (FilePicker.MIME[i].extensions.indexOf(ext) > -1) {
        returned = FilePicker.MIME[i];
        break;
      }
    }

    return returned;
  }

  function getType(file) {
    var filename = file.split('/').pop();
    var parts = filename.split('.');

    if (parts.length > 1) {
      var MIME = getMIME(parts.pop());

      return MIME.mime;
    }

    return '';
  }

  function getIcon(type, ext) {
    var name = 'unknown';

    if (type.length > 0) {
      for (var i = 0; i < FilePicker.MIME.length; i++) {
        if (new RegExp(FilePicker.MIME[i].pattern) .test(type)) {
          name = FilePicker.MIME[i].class;
          break;
        }
      }
    } else {
      for (var j = 0; j < FilePicker.MIME.length; j++) {
        if (FilePicker.MIME[j].extensions.indexOf(ext) > -1) {
          name = FilePicker.MIME[j].class;
          break;
        }
      }
    }

    return name;
  }

  function getStatus(status) {
    if (status === 'shared') {
      return _('shared-via-usb');
    } else {
      return _('unavailable');
    }
  }

  return {
    'size': getSize,
    'mime': getMIME,
    'icon': getIcon,
    'type': getType,
    'status': getStatus
  };
})();

FilePicker.files = (function () {
  var _ = window.document.webL10n.get;
  var microtime = 0;
  var curDir = '';
  var allFiles = [];
  var allCards = [];
  var cachedCards = [];
  var curFile = null;
  var curItem = null;
  var fileList = document.querySelector('#index .files');
  var tasks = [];
  var touchTimer = -1;
  var touchClientX = 0;
  var touchClientY = 0;

  function pushFile(objFile) {
    allFiles.push(objFile);
  }

  function pushCard(objCard) {
    allCards.push(objCard);
  }

  function cacheCard(stgName) {
    cachedCards.push(stgName);
  }

  function setCard(iCard, objCard) {
    if (typeof iCard === 'string') {
      for (var i = 0; i < allCards.length; i++) {
        if (allCards[i].name === iCard) {
          iCard = i;
          break;
        }
      }
    }

    if ('status' in objCard) {
      allCards[iCard].status = objCard.status;

      fileList.querySelectorAll('li')[iCard].querySelector('a').dataset.status = objCard.status;
      fileList.querySelectorAll('li')[iCard].querySelector('p:last-child').textContent = FilePicker.utils.files.status(objCard.status);
    }
  }

  function setFileList(arrList) {
    allFiles.length = 0;

    allFiles = arrList;
  }

  function clearFileList() {
    allFiles.length = 0;
    cachedCards.length = 0;
  }

  function getFolderName(dir) {
    dir = dir || curDir;

    return dir.split('/').pop();
  }

  function showFileList() {
    var liElem, asideElem, divElem, aElem, p1Elem, p2Elem;

    fileList = fileList || document.querySelector('#index .files');
    fileList.innerHTML = '';

    if (curDir.length > 0 || FilePicker.config.isSimulator) {
      var filesFound = [];
      var foldersFound = [];

      if (FilePicker.config.activityName === 'folder') {
        document.querySelector('#done').style.display = 'block';
      }

      for (var i = 0; i < allFiles.length; i++) {
        var file = allFiles[i];
        var baseCurDir = FilePicker.config.baseDir(curDir);

        if (file.name.indexOf(baseCurDir) === 0) {
          var parts = file.name.replace(baseCurDir, '').split('/');

          if (parts.length > 1) {
            if (foldersFound.indexOf(parts[0]) < 0) {
              foldersFound.push(parts[0]);
            }
          } else {
            var extParts = parts[0].split('/').pop().split('.'), empty = false;

            if (extParts.length > 1) {
              if (extParts[0].length === 0 && extParts[1].toLowerCase() === 'empty') {
                empty = true;
              }
            }

            if (!empty) {
              filesFound.push({'name': parts[0], 'blob': file.blob, 'ext': (extParts.length > 1 ? extParts.pop().toLowerCase() : ''), 'disabled': file.disabled});
            }
          }
        }
      }

      foldersFound.sort(function (a, b) {
        if (a.toLowerCase() < b.toLowerCase())
          return -1;

        if (a.toLowerCase() > b.toLowerCase())
          return 1;

        return 0;
      });
      filesFound.sort(function (a, b) {
        if (a.name.toLowerCase() < b.name.toLowerCase())
          return -1;

        if (a.name.toLowerCase() > b.name.toLowerCase())
          return 1;

        return 0;
      });

      for (var j = 0; j < foldersFound.length; j++) {
        liElem = document.createElement('li');
        liElem.className = 'folder';
        asideElem = document.createElement('aside');
        divElem = document.createElement('div');
        aElem = document.createElement('a');
        p1Elem = document.createElement('p');

        asideElem.className = 'pack-start';
        divElem.className = 'file-icon folder';
        asideElem.appendChild(divElem);

        aElem.href = '#';
        aElem.onclick = function (folderName) {
          return function (event) {
            if (new Date() - microtime > 500) {
              microtime = new Date();

              var selector = '[name="side"]:not(.current):not(.left-to-current)';
              var section = document.querySelector(selector);
              var folder = document.querySelector('#folder');
              fileList = document.querySelector(selector + ' .files');

              if (FilePicker.config.isSimulator && !curDir.length) {
                curDir = folderName;
              } else {
                curDir += '/' + folderName;
              }

              FilePicker.config.title = folderName;

              showFileList();

              document.querySelector('.current, .left-to-current').className = 'left';
              section.className = 'current';
              FilePicker.config.toolbar = [fileList.childNodes.length, 'items'];

              document.querySelector('#back').style.display = 'block';
              document.querySelector('#close').style.display = 'none';
            }
          };
        } (foldersFound[j]);

        p1Elem.appendChild(document.createTextNode(foldersFound[j]));
        aElem.appendChild(p1Elem);

        liElem.appendChild(asideElem);
        liElem.appendChild(aElem);

        fileList.appendChild(liElem);
      }

      for (var k = 0; k < filesFound.length; k++) {
        liElem = document.createElement('li');
        liElem.className = 'file';
        asideElem = document.createElement('aside');
        divElem = document.createElement('div');
        aElem = document.createElement('a');
        p1Elem = document.createElement('p');

        asideElem.className = 'pack-start';
        divElem.className = 'file-icon ' + FilePicker.utils.files.icon(filesFound[k].blob.type, filesFound[k].ext);
        asideElem.appendChild(divElem);

        aElem.href = '#';
        aElem.onclick = (function (fileName, fileBlob, fileExt) {
          return function () {
            FilePicker.activity.postResult({
              'type': fileBlob.type,
              'blob': fileBlob
            });
          };
        })(filesFound[k].name, filesFound[k].blob, filesFound[k].ext);

        p1Elem.appendChild(document.createTextNode(filesFound[k].name));
        aElem.appendChild(p1Elem);

        if (filesFound[k].blob.size >= 0) {
          p2Elem = document.createElement('p');
          p2Elem.appendChild(document.createTextNode(FilePicker.utils.files.size(filesFound[k].blob.size)));
          aElem.appendChild(p2Elem);
        }

        liElem.appendChild(asideElem);
        liElem.appendChild(aElem);

        if (filesFound[k].disabled) {
          liElem.dataset.disabled = 'true';
        }

        fileList.appendChild(liElem);
      }

      var folderHeader = document.querySelector('[data-type="sidebar"] > header > h1');
      var valueHeader = curDir.split('/').pop();

      if (folderHeader) {
        folderHeader.textContent = valueHeader;
      }
    }  else {
      FilePicker.config.toolbar = [allCards.length, 'devices'];
      document.querySelector('#done').style.display = 'none';

      for (var j = 0; j < allCards.length; j++) {
        liElem = document.createElement('li');
        liElem.className = 'folder';
        asideElem = document.createElement('aside');
        divElem = document.createElement('div');
        aElem = document.createElement('a');
        p1Elem = document.createElement('p');
        p2Elem = document.createElement('p');

        asideElem.className = 'pack-start';
        divElem.className = 'file-icon card';
        asideElem.appendChild(divElem);

        aElem.href = '#';
        aElem.dataset.status = allCards[j].status;
        aElem.onclick = function (cardName) {
          return function (event) {
            if (this.dataset.status === 'available') {
              if (new Date() - microtime > 500) {
                microtime = new Date();

                var selector = '[name="side"]:not(.current):not(.left-to-current)';
                var section = document.querySelector(selector);
                var folder = document.querySelector('#folder');
                fileList = document.querySelector(selector + ' .files');

                curDir = cardName;

                FilePicker.config.title = cardName;

                FilePicker.storage.set(cardName);

                document.querySelector('.current, .left-to-current').className = 'left';
                section.className = 'current';

                if (cachedCards.indexOf(cardName) < 0) {
                  FilePicker.storage.load(false);
                } else {
                  showFileList();
                  window.setTimeout(FilePicker.config.refreshToolbar, 0);
                }

                document.querySelector('#back').style.display = 'block';
                document.querySelector('#close').style.display = 'none';
              }
            } else {
              if (this.dataset.status === 'shared') {
                alert(_('disconnect-usb'));
              } else {
                alert(_('insert-card'));
              }
            }
          };
        } (allCards[j].name);

        p1Elem.appendChild(document.createTextNode(allCards[j].name));

        switch (allCards[j].status) {
          case 'available':
            p2Elem.textContent = '';
            break;
          default:
            p2Elem.textContent = FilePicker.utils.files.status(allCards[j].status);
        }

        aElem.appendChild(p1Elem);
        aElem.appendChild(p2Elem);

        liElem.appendChild(asideElem);
        liElem.appendChild(aElem);

        fileList.appendChild(liElem);
      }
    }
  }

  function preloadFileList() {
    fileList.parentElement.dataset.loading = 'true';
  }

  function loadedFileList() {
    fileList.parentElement.dataset.loading = 'false';
  }

  function callBack(funCallback) {
    funCallback(curFile, curDir, curItem);
  }

  function goTo(path, callback) {
    var parts, folderName, section;

    if (typeof path === 'number') {
      if (path === -1) {
        parts = curDir.split('/');
        parts.splice(parts.length - 1, 1);

        folderName = parts.length > 0 ? parts[parts.length - 1] : '';
        curDir = parts.join('/');
      } else if (path === 0) {
        parts = [];
        folderName = '';
        curDir = '';

        if (document.body.dataset.devices === undefined) {
          window.close();
        }
      }
    } else {
      curDir = path;

      parts = curDir.split('/');
      folderName = parts.length > 0 ? parts[parts.length - 1] : '';
    }

    if ((FilePicker.config.isSimulator && parts.length) || (allCards.length === 0 && parts.length > 1) || (allCards.length > 0 && parts.length > 0)) {
      var selector = '[name="side"]:not(.current):not(.left-to-current)';

      section = document.querySelector(selector);
      fileList = document.querySelector(selector + ' .files');

      FilePicker.config.title = folderName;

      FilePicker.files.show();

      document.querySelector('.current, .left-to-current').className = 'right';
      section.className = 'left-to-current current';

      if (callback !== undefined) {
        callback();
      }

    } else if((FilePicker.config.isSimulator && !parts.length) || (allCards.length === 0 && parts.length === 1) || (allCards.length > 0 && parts.length === 0)) {
      section = document.querySelector('section[data-position="current"]');

      document.querySelector('.current, .left-to-current').className = 'right';
      section.className = 'current';

      if (callback !== undefined) {
        callback();
      }

      if (!document.querySelector('#index').classList.contains('current')) {
        document.querySelector('#back').style.display = 'block';
        document.querySelector('#close').style.display = 'none';
      } else {
        document.querySelector('#back').style.display = 'none';
        document.querySelector('#close').style.display = 'block';
      }

      fileList = document.querySelector('section[data-position="current"] .files');

      FilePicker.config.title = FilePicker.config.app;

      FilePicker.files.show();
    }

    if (curDir.length > 0 || FilePicker.config.isSimulator) {
      FilePicker.config.toolbar = [section.querySelector('ul.files').childNodes.length, 'items'];
    } else {
      FilePicker.config.toolbar = [section.querySelector('ul.files').childNodes.length, 'devices'];
    }
  }

  function isFile(strName) {
    for (var i = 0; i < allFiles.length; i++) {
      if (allFiles[i].name === strName) {
        return true;
      }
    }

    return false;
  }

  function hasFiles(strPath) {
    for (var i = 0; i < allFiles.length; i++) {
      if (allFiles[i].name.indexOf(FilePicker.config.baseDir(strPath)) === 0) {
        return true;
      }
    }

    return false;
  }

  if (document.querySelector('#back')) {
    document.querySelector('#back').addEventListener('click', function () {
      goTo(-1);
    });
  }

  document.body.addEventListener('touchend', function (e) {
    if (touchTimer > -1) {
      window.clearTimeout(touchTimer);
      touchTimer = -1;

      e.preventDefault();
    }
  });

  return {
    get all() {
      return allFiles;
    },
    get devices() {
      return allCards;
    },
    get path() {
      return curDir;
    },
    set path(strPath) {
      curDir = strPath;
    },
    'call': callBack,
    'card': pushCard,
    'cacheCard': cacheCard,
    'updateCard': setCard,
    'isFile': isFile,
    'hasFiles': hasFiles,
    'go': goTo,
    'folder': getFolderName,
    'preload': preloadFileList,
    'loaded': loadedFileList,
    'push': pushFile,
    'reset': clearFileList,
    'set': setFileList,
    'show': showFileList
  };
})();

var errorHandler = function (error) {
  switch (error.name) {
    case 'SecurityError':
      alert(_('app-needs-permissions'));
      window.close();
      break;
  }
};
