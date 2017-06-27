/* eslint-env mocha */
'use strict'
const should = require('should')
const gutil = require('gulp-util')
const nunjucksRender = require('../')
const fs = require('fs')
const path = require('path')

require('mocha')

function getFile (filepath) {
  return new gutil.File({
    base: 'test/fixtures',
    cwd: 'test',
    path: filepath,
    contents: fs.readFileSync('test/' + filepath)
  })
}

function getExpected (filepath) {
  return fs.readFileSync('test/expected/' + filepath, 'utf8')
}

describe('gulp-nunjucks-md', function () {
  it('should render a html file', function (done) {
    const stream = nunjucksRender()
    const expected = getExpected('hello-world.html')
    const file = getFile('fixtures/hello-world.njk')

    stream.once('data', function (output) {
      should.exist(output)
      should.exist(output.contents)
      path.extname(output.path).should.equal('.html')
      output.contents.toString().should.equal(expected)
      done()
    })
    stream.write(file)
    stream.end()
  })

  it('should remove extension', function (done) {
    const stream = nunjucksRender({
      ext: null
    })
    const file = getFile('fixtures/hello-world.njk')

    stream.once('data', function (output) {
      should.exist(output)
      should.exist(output.contents)
      path.extname(output.path).should.equal('')
      done()
    })
    stream.write(file)
    stream.end()
  })

  it('accept global env as second argument', function (done) {
    const stream = nunjucksRender({
      data: {
        html: '<strong>Hello World!</strong>'
      },
      envOptions: {
        autoescape: true
      }
    })
    const expected = getExpected('global.html')
    const file = getFile('fixtures/global.njk')

    stream.once('data', function (output) {
      should.exist(output)
      should.exist(output.contents)
      path.extname(output.path).should.equal('.html')
      output.contents.toString().should.equal(expected)
      done()
    })
    stream.write(file)
    stream.end()
  })

  it('should use nunjucks environment to resolve paths', function (done) {
    const stream = nunjucksRender({
      path: ['test/fixtures']
    })
    const expected = getExpected('child.html')
    const file = getFile('fixtures/child.njk')

    stream.once('data', function (output) {
      should.exist(output)
      should.exist(output.contents)
      output.contents.toString().should.equal(expected)
      done()
    })
    stream.write(file)
    stream.end()
  })

  it('should pass context data', function (done) {
    const stream = nunjucksRender({data: {
      title: 'Overridden title'
    }})
    const expected = getExpected('overridden-title.html')
    const file = getFile('fixtures/hello-world.njk')

    stream.once('data', function (output) {
      should.exist(output)
      should.exist(output.contents)
      output.contents.toString().should.equal(expected)
      done()
    })
    stream.write(file)
    stream.end()
  })

  it('should use gulp-data', function (done) {
    const stream = nunjucksRender()
    const expected = getExpected('overridden-title.html')
    const file = getFile('fixtures/hello-world.njk')
    file.data = { title: 'Overridden title' }

    stream.once('data', function (output) {
      should.exist(output)
      should.exist(output.contents)
      output.data.title.should.equal('Overridden title')
      output.contents.toString().should.equal(expected)
      done()
    })
    stream.write(file)
    stream.end()
  })

  it('should merge gulp-data with context', function (done) {
    const stream = nunjucksRender({data: {
      title: 'Title from context'
    }})
    const expected = getExpected('merge-data.html')
    const file = getFile('fixtures/merge-data.njk')
    file.data = { title: 'Title from data', text: 'Some text' }

    stream.once('data', function (output) {
      should.exist(output)
      should.exist(output.contents)
      output.contents.toString().should.equal(expected)
      done()
    })
    stream.write(file)
    stream.end()
  })

  it('should create a new data context for each template', function (done) {
    const stream = nunjucksRender({
      path: 'test/fixtures'
    })
    const expected1 = getExpected('set.html')
    const expected2 = getExpected('hello-world.html')
    const file = getFile('fixtures/set.njk')
    const file2 = getFile('fixtures/hello-world.njk')

    stream.once('data', function (output) {
      // First file
      should.exist(output)
      should.exist(output.contents)
      output.path.should.equal(path.normalize('fixtures/set.html'))
      output.contents.toString().should.equal(expected1)

      stream.once('data', function (output) {
        // Second file
        should.exist(output)
        should.exist(output.contents)
        output.path.should.equal(path.normalize('fixtures/hello-world.html'))
        output.contents.toString().should.equal(expected2)
      })

      stream.write(file2)
      stream.end()
    })
    stream.on('finish', function () {
      done()
    })
    stream.write(file)
  })

  it('should throw an error', function (done) {
    const stream = nunjucksRender()
    const file = getFile('fixtures/import-error.njk')

    const onerror = function (err) {
      should.exist(err)
      this.removeListener('finish', onfinish)
      done()
    }

    const onfinish = function () {
      done(new Error("Template has a syntax error which wasn't thrown."))
    }

    stream.on('error', onerror)
    stream.on('finish', onfinish)

    stream.write(file)
    stream.end()
  })

  it('error should contain file path', function (done) {
    const stream = nunjucksRender()
    const file = getFile('fixtures/import-error.njk')

    const onerror = function (err) {
      should.exist(err)
      err.should.have.property('fileName')
      this.removeListener('finish', onfinish)
      done()
    }

    const onfinish = function () {
      done(new Error("Template has a syntax error which wasn't thrown."))
    }

    stream.on('error', onerror)
    stream.on('finish', onfinish)

    stream.write(file)
    stream.end()
  })

  it('should inherit extension if inheritExtension option is provided', function (done) {
    const stream = nunjucksRender({inheritExtension: true})
    const expected = getExpected('base.tpl')
    const file = getFile('fixtures/base.tpl')

    stream.once('data', function (output) {
      should.exist(output)
      should.exist(output.contents)
      output.contents.toString().should.equal(expected)
      path.extname(output.path).should.equal('.tpl')
      done()
    })
    stream.write(file)
    stream.end()
  })

  it('Can manipulate environment with hook', function (done) {
    const hook = function (environment) {
      environment.addFilter('defaultName', function (str, defName) {
        if (!str) {
          return (defName || 'John Doe').toUpperCase()
        }

        return str.toUpperCase()
      })

      environment.addGlobal('globalTitle', 'Test nunjucks project')
    }

    const stream = nunjucksRender({
      manageEnv: hook
    })

    const expected = getExpected('custom-filter.html')
    const file = getFile('fixtures/custom-filter.njk')

    stream.once('data', function (output) {
      should.exist(output)
      should.exist(output.contents)
      output.contents.toString().should.equal(expected)
      done()
    })
    stream.write(file)
    stream.end()
  })

  it('should use custom default config', function (done) {
    const customNunjucksRender = require('../')

    customNunjucksRender.setDefaults({
      envOptions: { autoescape: true }
    })

    const streamAutoescape = customNunjucksRender({
      data: { html: '<strong>Hello World!</strong>' }
    })

    const fileAutoescape = getFile('fixtures/global.njk')
    const fileNotAutoescape = getFile('fixtures/global.njk')
    const expectedAutoescape = getExpected('global.html')
    const expectedNotAutoescape = getExpected('global-not-excaped.html')

    streamAutoescape.once('data', function (output) {
      output.contents.toString().should.equal(expectedAutoescape)

      customNunjucksRender.setDefaults({
        envOptions: { autoescape: false }
      })

      const streamNotAutoescape = customNunjucksRender({
        data: {html: '<strong>Hello World!</strong>'}
      })

      streamNotAutoescape.once('data', function (output) {
        output.contents.toString().should.equal(expectedNotAutoescape)
        done()
      })
      streamNotAutoescape.write(fileNotAutoescape)
      streamNotAutoescape.end()
    })
    streamAutoescape.write(fileAutoescape)
    streamAutoescape.end()
  })

  it('should render simple template with front-matter and data', function (done) {
    const stream = nunjucksRender({
      path: ['test/fixtures/'],
      data: 'test/fixtures/data.json'
    })

    const expected = getExpected('fm-simple.html')
    const file = getFile('fixtures/frontmatter.njk')

    stream.once('data', function (output) {
      should.exist(output)
      should.exist(output.contents)
      output.contents.toString().should.equal(expected)
      done()
    })
    stream.write(file)
    stream.end()
  })

  it('should render markdown template with front-matter', function (done) {
    const stream = nunjucksRender({
      path: ['test/fixtures/'],
      data: {'site': { 'title': 'Example Site' }}
    })

    const expected = getExpected('fm-markdown.html')
    const file = getFile('fixtures/markdown.md')

    stream.once('data', function (output) {
      should.exist(output)
      should.exist(output.contents)
      output.contents.toString().should.equal(expected)
      done()
    })
    stream.write(file)
    stream.end()
  })

  it('should use super when useBlock set to false globally', function (done) {
    const stream = nunjucksRender({
      path: ['test/fixtures/'],
      data: {'site': {'title': 'Example Site'}},
      useBlock: false
    })

    const expected = getExpected('fm-noblock.html')
    const file = getFile('fixtures/noblock.njk')

    stream.once('data', function (output) {
      should.exist(output)
      should.exist(output.contents)
      output.contents.toString().should.equal(expected)
      done()
    })
    stream.write(file)
    stream.end()
  })

  it('should use super when useBlock set to false locally', function (done) {
    const stream = nunjucksRender({
      path: ['test/fixtures/'],
      data: {'site': {'title': 'Example Site'}}
    })

    const expected = getExpected('fm-noblock.html')
    const file = getFile('fixtures/noblock-local.njk')

    stream.once('data', function (output) {
      should.exist(output)
      should.exist(output.contents)
      output.contents.toString().should.equal(expected)
      done()
    })
    stream.write(file)
    stream.end()
  })

  it('should render template page.layout set in passed data', function (done) {
    const stream = nunjucksRender({
      path: ['test/fixtures/'],
      data: 'test/fixtures/data-nolayout.json'
    })

    const expected = getExpected('fm-simple.html')
    const file = getFile('fixtures/nolayout.njk')

    stream.once('data', function (output) {
      should.exist(output)
      should.exist(output.contents)
      output.contents.toString().should.equal(expected)
      done()
    })
    stream.write(file)
    stream.end()
  })

  it('should render markdown when page.layout set in passed data', function (done) {
    const stream = nunjucksRender({
      path: ['test/fixtures/'],
      data: {'site': { 'title': 'Example Site' }, 'page': { 'layout': 'layout', 'title': 'Page Title', 'description': 'Some Awesome Description' }}
    })

    const expected = getExpected('fm-markdown.html')
    const file = getFile('fixtures/markdown-nolayout.md')

    stream.once('data', function (output) {
      should.exist(output)
      should.exist(output.contents)
      output.contents.toString().should.equal(expected)
      done()
    })
    stream.write(file)
    stream.end()
  })
})
