const path = require('path')

module.exports = {
  verbose: true,
  bail: true,
  rootDir: path.join(__dirname, '..'),
  coverageDirectory: '<rootDir>/test/.coverage'
}
