# gulp-nunjucks-md
[![Build Status](https://travis-ci.org/mohitsinghs/gulp-nunjucks-md.svg)](https://travis-ci.org/mohitsinghs/gulp-nunjucks-md)
[![npm](https://badge.fury.io/js/gulp-nunjucks-md.svg)](http://badge.fury.io/js/gulp-nunjucks-md) [![dependencies](https://david-dm.org/mohitsinghs/gulp-nunjucks-md.svg?theme=shields.io)](https://david-dm.org/mohitsinghs/gulp-nunjucks-md) [![license MIT](https://img.shields.io/badge/license-MIT-brightgreen.svg)](https://github.com/mohitsinghs/mohitsinghs.github.io/blob/source/LICENSE)
> Based on [gulp-nunjucks-render](https://github.com/carlosl/gulp-nunjucks-render). Refer to original plugin to know more about rendering nunjucks templates with gulp.

## Differences
So, What are the differences ? Well, It contains all the features of original plugin. The additions are regrading the handling of markdown and front-matter. Useful for doing things like static sites.

## Install

Install with [npm](https://npmjs.com/package/gulp-nunjucks-md)

```
npm install --save-dev gulp-nunjucks-md
```

## Example

Suppose we have a file named **src/templates/default.njk** for parent template.
```nunjucks
<!DOCTYPE html>
<html lang="en-US">
  <head>
    <meta charset="utf-8">
    <title>{{ site.title }} | {{ page.title }}</title>
    <meta name="description" content="{{ page.description }}" />
    <link rel="stylesheet" href="{{ site.url }}/main.css">
  </head>
  <body>
    <main>
      {% block content %}{% endblock %} <!-- Very Important -->
    <main>
  <script async src="{{ site.url }}/main.js"></script>
  </body>
</html>
```

And we have a json file at **src/data.json**
```json
{
  "site": {
    "title": "Example Site",
    "url": "http://example.com",
  },
    "boxes" : [
    {
      "title": "red"
    },
    {
      "title": "green",
    },
    {
      "title": "blue",
    }
  ]
}
```

Also we have a markdown page with some nunjucks and front-matter in it **src/index.md**.
```nunjucks
---
layout: default
title: "Page Title"
description: "Some Awesome Description"
---

{% for box in boxes %}
<div class="{{ box.title }}">
</div>
{% endfor %}
```

Now in our **gulpfile.js**.

```javascript
var gulp = require('gulp');
var nunjucksMd = require('gulp-nunjucks-md');

gulp.task('default', function () {
  return gulp.src('src/*.md')
    .pipe(nunjucksMd({
      path: ['src/templates/'] // String or Array,
      data: 'src/data.json' // String or Data
    }))
    .pipe(gulp.dest('dist'));
});
```

This will render to

```html
<!DOCTYPE html>
<html lang="en-US">
  <head>
    <meta charset="utf-8">
    <title>Example Site | Page Title</title>
    <meta name="description" content="Some Awesome Description" />
    <link rel="stylesheet" href="http://example.com/main.css">
  </head>
  <body>
    <main>
      <div class="red">
      </div>
      <div class="green">
      </div>
      <div class="blue">
      </div>
    <main>
  <script async src="http://example.com/main.js"></script>
  </body>
</html>
```

> This plugin just appends `block` tags around your markdown or html, removes front-matter and appends it to data, converts markdown and finally renders your nunjucks to html.

## API Modifications

There are two additions and one modification from original.

* `data` - Data passed to template. If you pass a path to `json` file then it's okay. It will parse data from that file.
* `block` - The block to use for template inheritance. Default is `content`.
* `marked` - Options for marked if you want to modify it.

## License

MIT © [Carlos G. Limardo](http://limardo.org), [Kristijan Husak](http://kristijanhusak.com) and [Mohit Singh](http://git.io/mohit)
