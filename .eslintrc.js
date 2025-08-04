module.exports = {
  root: true,
  env: {
    node: true,
    es2022: true,
  },
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
    'prettier'
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    project: './tsconfig.json'
  },
  plugins: [
    '@typescript-eslint',
    'prettier'
  ],
  rules: {
    'prettier/prettier': 'error',
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/prefer-const': 'error',
    'no-console': 'warn'
  },
  overrides: [
    {
      files: ['packages/mobile/**/*'],
      env: {
        'react-native/react-native': true
      },
      extends: [
        'expo',
        '@react-native'
      ]
    },
    {
      files: ['apps/admin/**/*'],
      env: {
        browser: true
      },
      extends: [
        'next/core-web-vitals'
      ]
    }
  ]
}