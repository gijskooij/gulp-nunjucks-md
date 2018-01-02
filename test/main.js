'use strict'
import test from 'ava'
import Vinyl from 'vinyl'
import nunjucksRender from '../'
import fs from 'fs'
import path from 'path'

function getFile (filepath) {
  return new Vinyl({
    base: 'test/fixtures',
    cwd: 'test',
    path: filepath,
    contents: fs.readFileSync('test/' + filepath)
  })
}

function getExpected (filepath) {
  return fs.readFileSync('test/expected/' + filepath, 'utf8')
}

test.cb('should render a html file', t => {
  const stream = nunjucksRender()
  const expected = getExpected('hello-world.html')
  const file = getFile('fixtures/hello-world.njk')

  stream.once('data', output => {
    t.truthy(output)
    t.truthy(output.contents)
    t.is(path.extname(output.path), '.html')
    t.is(output.contents.toString(), expected)
    t.end()
  })
  stream.write(file)
  stream.end()
})

test.cb('should remove extension', t => {
  const stream = nunjucksRender({
    ext: null
  })
  const file = getFile('fixtures/hello-world.njk')

  stream.once('data', output => {
    t.truthy(output)
    t.truthy(output.contents)
    t.is(path.extname(output.path), '')
    t.end()
  })
  stream.write(file)
  stream.end()
})

test.cb('accept global env as second argument', t => {
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

  stream.once('data', output => {
    t.truthy(output)
    t.truthy(output.contents)
    t.is(path.extname(output.path), '.html')
    t.is(output.contents.toString(), expected)
    t.end()
  })
  stream.write(file)
  stream.end()
})

test.cb('should use nunjucks environment to resolve paths', t => {
  const stream = nunjucksRender({
    path: ['test/fixtures']
  })
  const expected = getExpected('child.html')
  const file = getFile('fixtures/child.njk')

  stream.once('data', output => {
    t.truthy(output)
    t.truthy(output.contents)
    t.is(output.contents.toString(), expected)
    t.end()
  })
  stream.write(file)
  stream.end()
})

test.cb('should pass context data', t => {
  const stream = nunjucksRender({data: {
    title: 'Overridden title'
  }})
  const expected = getExpected('overridden-title.html')
  const file = getFile('fixtures/hello-world.njk')

  stream.once('data', output => {
    t.truthy(output)
    t.truthy(output.contents)
    t.is(output.contents.toString(), expected)
    t.end()
  })
  stream.write(file)
  stream.end()
})

test.cb('should use gulp-data', t => {
  const stream = nunjucksRender()
  const expected = getExpected('overridden-title.html')
  const file = getFile('fixtures/hello-world.njk')
  file.data = { title: 'Overridden title' }

  stream.once('data', output => {
    t.truthy(output)
    t.truthy(output.contents)
    t.is(output.data.title, 'Overridden title')
    t.is(output.contents.toString(), expected)
    t.end()
  })
  stream.write(file)
  stream.end()
})

test.cb('should merge gulp-data with context', t => {
  const stream = nunjucksRender({data: {
    title: 'Title from context'
  }})
  const expected = getExpected('merge-data.html')
  const file = getFile('fixtures/merge-data.njk')
  file.data = { title: 'Title from data', text: 'Some text' }

  stream.once('data', output => {
    t.truthy(output)
    t.truthy(output.contents)
    t.is(output.contents.toString(), expected)
    t.end()
  })
  stream.write(file)
  stream.end()
})

test.cb('should create a new data context for each template', t => {
  const stream = nunjucksRender({
    path: 'test/fixtures'
  })
  const expected1 = getExpected('set.html')
  const expected2 = getExpected('hello-world.html')
  const file = getFile('fixtures/set.njk')
  const file2 = getFile('fixtures/hello-world.njk')

  stream.once('data', output => {
    // First file
    t.truthy(output)
    t.truthy(output.contents)
    t.is(output.path, path.normalize('fixtures/set.html'))
    t.is(output.contents.toString(), expected1)

    stream.once('data', output => {
      // Second file
      t.truthy(output)
      t.truthy(output.contents)
      t.is(output.path, path.normalize('fixtures/hello-world.html'))
      t.is(output.contents.toString(), expected2)
    })

    stream.write(file2)
    stream.end()
  })
  stream.on('finish', function () {
    t.end()
  })
  stream.write(file)
})

test.cb('should throw an error', t => {
  const stream = nunjucksRender()
  const file = getFile('fixtures/import-error.njk')

  const onerror = function (err) {
    t.truthy(err)
    this.removeListener('finish', onfinish)
    t.end()
  }

  const onfinish = function () {
    t.end(new Error("Template has a syntax error which wasn't thrown."))
  }

  stream.on('error', onerror)
  stream.on('finish', onfinish)

  stream.write(file)
  stream.end()
})

test.cb('error should contain file path', t => {
  const stream = nunjucksRender()
  const file = getFile('fixtures/import-error.njk')

  const onerror = function (err) {
    t.truthy(err)
    t.true(err.hasOwnProperty('fileName'))
    this.removeListener('finish', onfinish)
    t.end()
  }

  const onfinish = function () {
    t.end(new Error("Template has a syntax error which wasn't thrown."))
  }

  stream.on('error', onerror)
  stream.on('finish', onfinish)

  stream.write(file)
  stream.end()
})

test.cb('should inherit extension if inheritExtension option is provided', t => {
  const stream = nunjucksRender({inheritExtension: true})
  const expected = getExpected('base.tpl')
  const file = getFile('fixtures/base.tpl')

  stream.once('data', output => {
    t.truthy(output)
    t.truthy(output.contents)
    t.is(output.contents.toString(), expected)
    t.is(path.extname(output.path), '.tpl')
    t.end()
  })
  stream.write(file)
  stream.end()
})

test.cb('Can manipulate environment with hook', t => {
  const hook = function (environment) {
    environment.addFilter('defaultName', (str, defName) => {
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

  stream.once('data', output => {
    t.truthy(output)
    t.truthy(output.contents)
    t.is(output.contents.toString(), expected)
    t.end()
  })
  stream.write(file)
  stream.end()
})

test.cb('should use custom default config', t => {
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

  streamAutoescape.once('data', output => {
    t.is(output.contents.toString(), expectedAutoescape)

    customNunjucksRender.setDefaults({
      envOptions: { autoescape: false }
    })

    const streamNotAutoescape = customNunjucksRender({
      data: {html: '<strong>Hello World!</strong>'}
    })

    streamNotAutoescape.once('data', output => {
      t.is(output.contents.toString(), expectedNotAutoescape)
      t.end()
    })
    streamNotAutoescape.write(fileNotAutoescape)
    streamNotAutoescape.end()
  })
  streamAutoescape.write(fileAutoescape)
  streamAutoescape.end()
})

test.cb('should render simple template with front-matter and data', t => {
  const stream = nunjucksRender({
    path: ['test/fixtures/'],
    data: 'test/fixtures/data.json'
  })

  const expected = getExpected('fm-simple.html')
  const file = getFile('fixtures/frontmatter.njk')

  stream.once('data', output => {
    t.truthy(output)
    t.truthy(output.contents)
    t.is(output.contents.toString(), expected)
    t.end()
  })
  stream.write(file)
  stream.end()
})

test.cb('should render markdown template with front-matter', t => {
  const stream = nunjucksRender({
    path: ['test/fixtures/'],
    data: {'site': { 'title': 'Example Site' }}
  })

  const expected = getExpected('fm-markdown.html')
  const file = getFile('fixtures/markdown.md')

  stream.once('data', output => {
    t.truthy(output)
    t.truthy(output.contents)
    t.is(output.contents.toString(), expected)
    t.end()
  })
  stream.write(file)
  stream.end()
})

test.cb('should use super when useBlock set to false globally', t => {
  const stream = nunjucksRender({
    path: ['test/fixtures/'],
    data: {'site': {'title': 'Example Site'}},
    useBlock: false
  })

  const expected = getExpected('fm-noblock.html')
  const file = getFile('fixtures/noblock.njk')

  stream.once('data', output => {
    t.truthy(output)
    t.truthy(output.contents)
    t.is(output.contents.toString(), expected)
    t.end()
  })
  stream.write(file)
  stream.end()
})

test.cb('should use super when useBlock set to false locally', t => {
  const stream = nunjucksRender({
    path: ['test/fixtures/'],
    data: {'site': {'title': 'Example Site'}}
  })

  const expected = getExpected('fm-noblock.html')
  const file = getFile('fixtures/noblock-local.njk')

  stream.once('data', output => {
    t.truthy(output)
    t.truthy(output.contents)
    t.is(output.contents.toString(), expected)
    t.end()
  })
  stream.write(file)
  stream.end()
})

test.cb('should render template page.layout set in passed data', t => {
  const stream = nunjucksRender({
    path: ['test/fixtures/'],
    data: 'test/fixtures/data-nolayout.json'
  })

  const expected = getExpected('fm-simple.html')
  const file = getFile('fixtures/nolayout.njk')

  stream.once('data', output => {
    t.truthy(output)
    t.truthy(output.contents)
    t.is(output.contents.toString(), expected)
    t.end()
  })
  stream.write(file)
  stream.end()
})

test.cb('should render markdown when page.layout set in passed data', t => {
  const stream = nunjucksRender({
    path: ['test/fixtures/'],
    data: {'site': { 'title': 'Example Site' }, 'page': { 'layout': 'layout', 'title': 'Page Title', 'description': 'Some Awesome Description' }}
  })

  const expected = getExpected('fm-markdown.html')
  const file = getFile('fixtures/markdown-nolayout.md')

  stream.once('data', output => {
    t.truthy(output)
    t.truthy(output.contents)
    t.is(output.contents.toString(), expected)
    t.end()
  })
  stream.write(file)
  stream.end()
})
