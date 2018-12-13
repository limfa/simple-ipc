module.exports = {
  env: {
    es6: true,
    node: true
  },
  extends: 'eslint:recommended',
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module'
  },
  rules: {
    indent: ['error', 2],
    semi: ['error', 'never'],
    'no-console': 0
  }
}
