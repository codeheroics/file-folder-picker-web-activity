# File and Folder Picker Web Activity

This is file & folder picker intended to be used as a [web activity](https://developer.mozilla.org/en-US/docs/Web/API/Web_Activities) from a **FirefoxOS app**

It is a stripped down fork of [File Manager](https://github.com/elfoxero/file-manager), only keeping the ability to select files and folders.

## Features
- Pick a file (sends back file infos)
- Pick a folder (sends back the path)

## Requirements
Your app will need the permissions to access to SD card.

## Why use it
Use this if
- You need to pick an arbitrary file or folder on your FirefoxOS app
- The default apps aren't enough (eg. you do not want a picture/music/video)
- You don't want to rely on the presence of another app to do this (eg. File Manager)

## How to use it
Clone this repository into your app.
Add the following to your `manifest.webapp`:

```js
{
	"activities": {
		"pick-file": {
			"disposition": "inline",
			"returnValue": true,
			"href": "/path/to/this/repo/index.html"
		},
		"pick-folder": {
			"disposition": "inline",
			"returnValue": true,
			"href": "/path/to/this/repo/index.html"
		},
	}
}
```

Then in your app, call the activity like this:

```js
var activity = new MozActivity({
	name: "pick-file" // Or pick-folder
});

activity.onsuccess = function() {
	console.log(this.result);
};

activity.onerror = function() {
	console.log(this.error);
};
```


The Picker will send to your app the following data for a file:

```js
{
	"type": "image/svg+xml",
	"filename": "/sdcard/image.svg",
	"blob": [object Blob],
	"allowSave": false
}
```

For a folder:

```js
{
	"path": "path/to/your/folder"
}
```

## Misc
You should change the activities' names to specific to your app
if you don't want other apps calling the activity
(for example, "pick-file@hugo/conteur").

The names need to contain "file" or "folder" for the picker to know what to work with.

## Resources

This project is open source under GPL license as is the original [File Manager](https://github.com/elfoxero/file-manager)
Uses a variant of [Building Blocks](http://buildingfirefoxos.com/) library and icon theme from [Numix Circle](https://github.com/numixproject/numix-icon-theme-circle).
