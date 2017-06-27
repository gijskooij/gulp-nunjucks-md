'use strict'
const fs = require('fs')
const path = require('path')
const _ = require('lodash')
const gutil = require('gulp-util')
const through = require('through2')
const nunjucks = require('nunjucks')
const fm = require('front-matter')
const md = require('marked')

let defaults = {
  path: '.',
  ext: '.html',
  data: {},
  useBlock: true,
  block: 'content',
  marked: null,
  inheritExtension: false,
  envOptions: {
    watch: false
  },
  manageEnv: null
}

module.exports = function (options) {
  options = _.defaultsDeep(options || {}, defaults)
  nunjucks.configure(options.envOptions)

  if (!options.loaders) {
    options.loaders = new nunjucks.FileSystemLoader(options.path)
  }

  const compile = new nunjucks.Environment(options.loaders, options.envOptions)

  if (_.isFunction(options.manageEnv)) {
    options.manageEnv.call(null, compile)
  }

  /*
   * file = file
   * cb   = callback function
   */
  return through.obj(function (file, enc, cb) {
    let data = {}
    if (_.isObject(options.data)) {
      data = _.cloneDeep(options.data)
    } else if (_.isString(options.data)) {
      data = JSON.parse(fs.readFileSync(path.resolve(options.data)))
    }

    if (file.isNull()) {
      this.push(file)
      return cb()
    }

    if (file.data) {
      data = _.merge(file.data, data)
    }

    if (file.isStream()) {
      this.emit('error', new gutil.PluginError('gulp-nunjucks-md', 'Streaming not supported'))
      return cb()
    }

    const frontmatter = fm(file.contents.toString())
    const _haveAttributes = !_.isEmpty(frontmatter.attributes)

    if (_haveAttributes) _.merge(data, { page: frontmatter.attributes })

    if (isMarkdown(file)) {
      md.setOptions(options.marked)
      if (_haveAttributes) frontmatter.body = md(frontmatter.body)
      else file.contents = Buffer.from(md(file.contents.toString()))
    }
    if (_.has(data, 'page.layout')) {
      const _canUseBlock = _.has(data, 'page.useBlock') ? data.page.useBlock : options.useBlock
      const _extendLayout = '{% extends "' + data.page.layout + '.njk" %}'
      const _content = _haveAttributes ? frontmatter.body : file.contents.toString()
      const _extendBlock = '{% block ' + options.block + ' %}' + _content + '{% endblock %}'
      file.contents = Buffer.from(_extendLayout.concat(_canUseBlock ? _extendBlock : _content))
    } else if (_haveAttributes) {
      this.emit('error', new gutil.PluginError('gulp-nunjucks-md', 'Layout not declared in front-matter or data'))
    }

    const _this = this
    const filePath = file.path

    try {
      compile.renderString(file.contents.toString(), data, function (err, result) {
        if (err) {
          _this.emit('error', new gutil.PluginError('gulp-nunjucks-md', err, {fileName: filePath}))
          return cb()
        }
        file.contents = Buffer.from(result)
        // Replace extension with mentioned/default extension
        // only if inherit extension flag is not provided(truthy)
        if (!options.inheritExtension) {
          file.path = gutil.replaceExtension(filePath, options.ext)
        }
        _this.push(file)
        cb()
      })
    } catch (err) {
      _this.emit('error', new gutil.PluginError('gulp-nunjucks-md', err, {fileName: filePath}))
      cb()
    }
  })
}

function isMarkdown (file) {
  return /\.md|\.markdown/.test(path.extname(file.path))
}

module.exports.setDefaults = function (options) {
  defaults = _.defaultsDeep(options || {}, defaults)
}

module.exports.nunjucks = nunjucks
