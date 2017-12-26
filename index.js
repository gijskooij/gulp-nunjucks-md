'use strict'
const fs = require('fs')
const path = require('path')
const _ = require('lodash')
const gutil = require('gulp-util')
const through = require('through2')
const nunjucks = require('nunjucks')
const frontMatter = require('front-matter')
const marked = require('marked')
const preferLocal = require('prefer-local')

let defaults = {
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

module.exports = options => {
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
      data = _.merge({}, file.data, data)
    }

    if (file.isStream()) {
      this.emit('error', new gutil.PluginError('gulp-nunjucks-md', 'Streaming not supported'))
      return cb()
    }

    const isMarkdown = /\.md|\.markdown/.test(path.extname(file.path))
    const frontmatter = frontMatter(file.contents.toString())
    const haveAttributes = !_.isEmpty(frontmatter.attributes)
    let _fileContent = haveAttributes ? frontmatter.body : file.contents.toString()
    // merge front-matter data
    if (haveAttributes) data = _.merge({}, data, { page: frontmatter.attributes })
    // process markdown
    if (isMarkdown) _fileContent = md(_fileContent, options)

    if (_.has(data, 'page.layout')) {
      const _canUseBlock = preferLocal(data, 'page.useBlock', options.useBlock)
      const _extendLayout = `{% extends "${data.page.layout}.njk" %}`
      const _extendBlock = `{% block ${options.block} %}${_fileContent}{% endblock %}`
      _fileContent = `${_extendLayout} ${_canUseBlock ? _extendBlock : _fileContent}`
    } else if (haveAttributes) {
      this.emit('error', new gutil.PluginError('gulp-nunjucks-md', 'Layout not declared in front-matter or data'))
    }

    try {
      compile.renderString(_fileContent, data, (err, result) => {
        if (err) {
          this.emit('error', new gutil.PluginError('gulp-nunjucks-md', err, {fileName: file.path}))
          return cb()
        }
        file.contents = Buffer.from(result)
        // Replace extension with mentioned/default extension
        // only if inherit extension flag is not provided(truthy)
        if (!options.inheritExtension) {
          file.path = gutil.replaceExtension(file.path, options.ext)
        }
        this.push(file)
        cb()
      })
    } catch (err) {
      this.emit('error', new gutil.PluginError('gulp-nunjucks-md', err, {fileName: file.path}))
      cb()
    }
  })
}

function md (text, options) {
  const render = new marked.Renderer()
  marked.setOptions(options.marked)
  render.text = text => unescape(text)
  return options.escape ? marked(text) : marked(text, {renderer: render})
}

module.exports.setDefaults = function (options) {
  defaults = _.defaultsDeep(options || {}, defaults)
}

module.exports.nunjucks = nunjucks
