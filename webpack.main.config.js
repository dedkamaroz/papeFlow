const path = require('path');

module.exports = {
  entry: {
    index: './src/main/index.ts',
    preload: './src/main/preload.ts',
  },
  target: 'electron-main',
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: {
          loader: 'ts-loader',
          options: {
            transpileOnly: true,
          },
        },
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@main': path.resolve(__dirname, 'src/main'),
      '@shared': path.resolve(__dirname, 'src/shared'),
    },
  },
  output: {
    path: path.resolve(__dirname, 'dist/main'),
    filename: '[name].js',
  },
  externals: {
    'better-sqlite3': 'commonjs better-sqlite3',
  },
  node: {
    __dirname: false,
    __filename: false,
  },
};