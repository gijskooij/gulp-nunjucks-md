'use strict'
const fs = require('fs')
const path = require('path')
const unescape = require('lodash.unescape')
const PluginError = require('plugin-error')
const through = require('through2')
const nunjucks = require('nunjucks')
const frontMatter = require('front-matter')
const marked = require('marked')
const preferLocal = require('prefer-local')

let defaults = {
  path: '.',
  ext: '.html',
  extLayout: '.njk',
  data: {},
  useBlock: true,
  block: 'content',
  marked: null,
  escape: true,
  inheritExtension: false,
  envOptions: {
    watch: false
  },
  manageEnv: null
}

module.exports = options => {
  options = Object.assign({}, defaults, options)
  nunjucks.configure(options.envOptions)

  const compile = new nunjucks.Environment(new nunjucks.FileSystemLoader(options.path), options.envOptions)

  if (typeof (options.manageEnv) === 'function') {
    options.manageEnv.call(null, compile)
  }

  /*
   * file = file
   * cb   = callback function
   */
  return through.obj(function (file, enc, cb) {
    let data = {}
    if (typeof options.data === 'object') {
      data = Object.assign({}, options.data)
    } else {
      data = JSON.parse(fs.readFileSync(path.resolve(options.data), 'utf8'))
    }

    if (file.isNull()) {
      this.push(file)
      return cb()
    }

    if (file.data) {
      data = Object.assign({}, file.data, data)
    }

    if (file.isStream()) {
      this.emit('error', new PluginError('gulp-nunjucks-md', 'Streaming not supported'))
      return cb()
    }

    const isMarkdown = /\.md|\.markdown/.test(path.extname(file.path))
    const frontmatter = frontMatter(file.contents.toString())
    const haveAttributes = Object.keys(frontmatter.attributes).length
    let _fileContent = frontmatter.body
    // merge front-matter data
    if (haveAttributes) data = Object.assign({}, data, { page: frontmatter.attributes })
    // process markdown
    if (isMarkdown) _fileContent = md(_fileContent, options)

    if (preferLocal(data, 'page.layout')) {
      const _canUseBlock = preferLocal(data, 'page.useBlock', options.useBlock)
      const _extendLayout = `{% extends "${data.page.layout}${options.extLayout}" %}`
      const _extendBlock = `{% block ${options.block} %}${_fileContent}{% endblock %}`
      _fileContent = `${_extendLayout} ${_canUseBlock ? _extendBlock : _fileContent}`
    } else if (haveAttributes) {
      this.emit('error', new PluginError('gulp-nunjucks-md', 'Layout not declared in front-matter or data'))
    }

    try {
      file.contents = Buffer.from(compile.renderString(_fileContent, data))
      // Replace extension with mentioned/default extension
      // only if inherit extension flag is not provided(truthy)
      if (!options.inheritExtension) {
        file.extname = options.ext
      }
      this.push(file)
    } catch (err) {
      this.emit('error', new PluginError('gulp-nunjucks-md', err, {fileName: file.path}))
    }
    cb()
  })
}

function md (text, options) {
  const render = new marked.Renderer()
  marked.setOptions(options.marked)
  render.text = text => unescape(text)
  return options.escape ? marked(text) : marked(text, {renderer: render})
}

module.exports.setDefaults = function (options) {
  defaults = Object.assign({}, defaults, options)
}

module.exports.nunjucks = nunjucks
