module.exports = {
  root: true,
  env: {
    node: true
  },
  'extends': [
    'plugin:vue/recommended',
    '@vue/standard',
    '@vue/typescript'
  ],
  rules: {
    'no-console': 'off',
    'no-debugger': 'off',
    'vue/max-attributes-per-line': {
      multiline: {
        allowFirstLine: true
      }
    },
    'vue/multiline-html-element-content-newline': {
      ignores: ['VueComponent', 'pre', 'textarea']
    }
  },
  parserOptions: {
    parser: 'typescript-eslint-parser'
  }
}
