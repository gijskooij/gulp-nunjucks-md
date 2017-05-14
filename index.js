'use strict';
const fs = require('fs');
const path = require('path');
const _ = require('lodash');
const gutil = require('gulp-util');
const through = require('through2');
const nunjucks = require('nunjucks');
const fm = require('front-matter');
const md = require('marked');

let defaults = {
    path: '.',
    ext: '.html',
    data: {},
    block: 'content',
    marked: null,
    inheritExtension: false,
    envOptions: {
      watch: false
    },
    manageEnv: null
};

module.exports = function (options) {
  options = _.defaultsDeep(options || {}, defaults);
  nunjucks.configure(options.envOptions);

  if (!options.loaders) {
    options.loaders = new nunjucks.FileSystemLoader(options.path);
  }

  var compile = new nunjucks.Environment(options.loaders, options.envOptions);

  if (_.isFunction(options.manageEnv)) {
    options.manageEnv.call(null, compile);
  }

  /*
   * file = file
   * cb   = callback function
   */
  return through.obj(function(file, enc, cb) {
    var data = {};
    if (_.isObject(options.data)) {
        data = _.cloneDeep(options.data);
    } else if (_.isString(options.data)) {
        data = JSON.parse(fs.readFileSync(path.resolve(options.data)));
    }

    if (file.isNull()) {
      this.push(file);
      return cb();
    }

    if (file.data) {
      data = _.merge(file.data, data);
    }

    if (file.isStream()) {
      this.emit('error', new gutil.PluginError('gulp-nunjucks-md', 'Streaming not supported'));
      return cb();
    }

    var frontmatter = fm(file.contents.toString());
    if(!_.isEmpty(frontmatter.attributes)) {

        if(isMarkdown(file)) {
            md.setOptions(options.marked);
            frontmatter.body = md(frontmatter.body);
        }

        _.merge(data, { page: frontmatter.attributes } );

        if(data.page.layout){
          file.contents = Buffer.from('\{% extends \"' + data.page.layout + '.njk\" %\}\n\{% block ' +  options.block + ' %\}' + frontmatter.body + '\n\{% endblock %\}');
        } else {
          this.emit('error', new gutil.PluginError('gulp-nunjucks-md', 'Layout not declared in front-matter'));
        }
    }

    var _this = this;

    var filePath = file.path;

    try {
      compile.renderString(file.contents.toString(), data, function (err, result) {
        if (err) {
          _this.emit('error', new gutil.PluginError('gulp-nunjucks-md', err, {fileName: filePath}));
          return cb();
        }
        file.contents = Buffer.from(result);
        // Replace extension with mentioned/default extension
        // only if inherit extension flag is not provided(truthy)
        if (!options.inheritExtension) {
          file.path = gutil.replaceExtension(filePath, options.ext);
        }
        _this.push(file);
        cb();
      });
    } catch (err) {
      _this.emit('error', new gutil.PluginError('gulp-nunjucks-md', err, {fileName: filePath}));
      cb();
    }
  });
};

function isMarkdown(file) {
  return /\.md|\.markdown/.test(path.extname(file.path));
}

module.exports.setDefaults = function (options) {
  defaults = _.defaultsDeep(options || {}, defaults);
};

module.exports.nunjucks = nunjucks;
