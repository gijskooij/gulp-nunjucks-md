# gulp-nunjucks-md
[![Build Status](https://travis-ci.org/mohitsinghs/gulp-nunjucks-md.svg)](https://travis-ci.org/mohitsinghs/gulp-nunjucks-md)
[![npm](https://badge.fury.io/js/gulp-nunjucks-md.svg)](http://badge.fury.io/js/gulp-nunjucks-md) [![dependencies](https://david-dm.org/mohitsinghs/gulp-nunjucks-md/status.svg)](https://david-dm.org/mohitsinghs/gulp-nunjucks-md)
[![devDependencies](https://david-dm.org/mohitsinghs/gulp-nunjucks-md/dev-status.svg)](https://david-dm.org/mohitsinghs/gulp-nunjucks-md?type=dev) [![license MIT](https://img.shields.io/badge/license-MIT-brightgreen.svg)](https://github.com/mohitsinghs/mohitsinghs.github.io/blob/source/LICENSE)
> Render nunjucks templates, with markdown and front-matter. Based on [gulp-nunjucks-render](https://github.com/carlosl/gulp-nunjucks-render)

## Install

Install with [npm](https://npmjs.com/package/gulp-nunjucks-md)

```
npm install --save-dev gulp-nunjucks-md
```

## Features
This plugin performs following tasks &ndash;
* Extracts front-matter data and assigns to a `page` variable.
* Optionally, If file is markdown, renders markdown.
* Finally, renders nunjucks to html as usual.

If you want rendering only then prefer [original plugin](https://github.com/carlosl/gulp-nunjucks-render).

## Configuration

Your page should have a front-matter with a `layout` pointing to name of a layout (without extension) in your template directory. Also your parent layout should have a `content` block where processed content will be inserted. See [wiki](https://github.com/mohitsinghs/gulp-nunjucks-md/wiki) for an example.

Markdown will be rendered only if a page with markdown extension is found, but be aware that combining markdown with nunjucks can lead to undesired output.

## Usage

```js
const gulp = require('gulp');
const nunjucksMd = require('gulp-nunjucks-md');

gulp.task('default', function () {
  return gulp.src('src/*.{html,njk,md}') // your pages
    .pipe(nunjucksMd({
      path: ['src/templates/'], // nunjucks templates
      data: 'src/data.json' // json data
    }))
    .pipe(gulp.dest('dist'));
});
```

## API
Plugin accepts options object, which contain these by default:

```js
var defaults = {
    path: '.',
    ext: '.html',
    data: {},
    block: 'content',
    marked: null,
    inheritExtension: false,
    envOptions: {
      watch: false
    },
    manageEnv: null,
    loaders: null
};
```

* `path` - Relative path to templates
* `ext` - Extension for compiled templates, pass null or empty string if yo don't want any extension
* `data` - Data passed to template, either object or path to the json
* `block` - Name of content block in your parent template
* `marked` - Custom options for [marked](http://github.com/chjj/marked)
* `inheritExtension` - If true, uses same extension that is used for template
* `envOptions` - These are options provided for nunjucks Environment. More info [here](https://mozilla.github.io/nunjucks/api.html#configure).
* `manageEnv` - Hook for managing environment before compilation. Useful for adding custom filters, globals, etc.
* `loaders` - If provided, uses that as first parameter to Environment constructor. Otherwise, uses provided `path`. More info [here](https://mozilla.github.io/nunjucks/api.html#environment)

For more info about nunjucks functionality, check [https://mozilla.github.io/nunjucks/api.html](https://mozilla.github.io/nunjucks/api.html).

## Shout-outs

[Carlos G. Limardo](http://limardo.org) and [Kristijan Husak](http://kristijanhusak.com) for [gulp-nunjucks-render](https://github.com/carlosl/gulp-nunjucks-render) from which this plugin is derived.  
[Sindre Sorhus](http://sindresorhus.com/) for [gulp-nunjucks](https://www.npmjs.org/package/gulp-nunjucks)
