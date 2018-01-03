# gulp-nunjucks-md
[![Build Status](https://travis-ci.org/mohitsinghs/gulp-nunjucks-md.svg)](https://travis-ci.org/mohitsinghs/gulp-nunjucks-md)
[![npm](https://badge.fury.io/js/gulp-nunjucks-md.svg)](http://badge.fury.io/js/gulp-nunjucks-md)
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)
[![license MIT](https://img.shields.io/badge/license-MIT-brightgreen.svg)](https://github.com/mohitsinghs/gulp-nunjucks-md/blob/master/LICENSE)
[![Coverage Status](https://coveralls.io/repos/github/mohitsinghs/gulp-nunjucks-md/badge.svg?branch=master)](https://coveralls.io/github/mohitsinghs/gulp-nunjucks-md?branch=master)
> Render nunjucks templates, with markdown and front-matter. Based on [gulp-nunjucks-render](https://github.com/carlosl/gulp-nunjucks-render)

## Install

Install with [npm](https://npmjs.com/package/gulp-nunjucks-md)

```
npm install --save-dev gulp-nunjucks-md
```

## Features
This plugin performs following tasks &ndash;
* Extracts front-matter data and assigns to a `page` variable.
* Optionally, If file is markdown and have frontmatter, renders markdown.
* Finally, renders nunjucks to html as usual.

If you don't use markdown then prefer [original plugin](https://github.com/carlosl/gulp-nunjucks-render).

## Configuration

- To extend a parent layout with frontmatter, your page should have a front-matter with a `layout` pointing to name of a layout (without extension) in your template directory.
- To set a parent layout for all pages your data should contain a `page.layout` in the data passed to plugin containing name of the layout without extension.
- By default this plugin warps a `content` block around your page. Your parent layout should have a `content` block where processed content will be inserted. You can turn off this behavior by setting `useBlock: false` either in options or in frontmatter and declaring blocks normally ( for example multiple block inheritance).
- In order to render markdown, the page should have frontmatter and `.markdown` or `.md` extension, You can also pass custom options to marked through `marked` option. 
- Be aware that combining markdown with nunjucks can lead to undesired output. this plugin uses a custom marked renderer to avoid text escaping to make nunjucks work with markdown. set `escape: true` to avoid this if you don't want to combine markdown with nunjucks or want to pass your own renderer to `marked` option.
- See [wiki](https://github.com/mohitsinghs/gulp-nunjucks-md/wiki) for an example.

## Usage

```js
const gulp = require('gulp')
const nunjucksMd = require('gulp-nunjucks-md')

gulp.task('default', function () {
  return gulp.src('src/*.{html,njk,md}') // your pages
    .pipe(nunjucksMd({
      path: ['src/templates/'], // nunjucks templates
      data: 'src/data.json' // json data
    }))
    .pipe(gulp.dest('dist'))
})
```

## API
Plugin accepts options object, which contain these by default:

```js
var defaults = {
  path: '.',
  ext: '.html',
  data: {},
  useBlock: true,
  block: 'content',
  marked: null,
  escape: false,
  inheritExtension: false,
  envOptions: {
    watch: false
  },
  manageEnv: null
}
```

* `path` - Relative path to templates
* `ext` - Extension for compiled templates, pass null or empty string if yo don't want any extension
* `data` - Data passed to template, either object or path to the json file
* `useBlock` - If true appends a content block. If false only parent template will be extended and no default content block will be wrapped. We can also set it at page level by adding `useBlock : false/true` to frontmatter. Please note that page level configuration will be preferred.
* `block` - Name of content block in your parent template
* `marked` - Custom options for [marked](http://github.com/chjj/marked)
* `escape` - `true` by default. Set it to `false` if you want to use nunjucks in markdown.
* `inheritExtension` - If true, uses same extension that is used for template
* `envOptions` - These are options provided for nunjucks Environment. More info [here](https://mozilla.github.io/nunjucks/api.html#configure).
* `manageEnv` - Hook for managing environment before compilation. Useful for adding custom filters, globals, etc.

For more info about nunjucks functionality, check [https://mozilla.github.io/nunjucks/api.html](https://mozilla.github.io/nunjucks/api.html).

## Shout-outs

[Carlos G. Limardo](http://limardo.org) and [Kristijan Husak](http://kristijanhusak.com) for [gulp-nunjucks-render](https://github.com/carlosl/gulp-nunjucks-render) from which this plugin is derived.  
[Sindre Sorhus](http://sindresorhus.com/) for [gulp-nunjucks](https://www.npmjs.org/package/gulp-nunjucks)
