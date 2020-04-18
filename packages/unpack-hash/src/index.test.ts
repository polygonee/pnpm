import fs = require('fs')
import unpackHash from '.'
import path = require('path')
import tempy = require('tempy')

test('unpack', async () => {
  const dest = tempy.directory()
  console.log(dest)
  await unpackHash(fs.createReadStream(path.join(__dirname, '../__fixtures__/babel-helper-hoist-variables-6.24.1.tgz')), dest)
})
