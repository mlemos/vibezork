const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = (env, argv) => {
  const isDevelopment = argv.mode === 'development';

  return {
    entry: './src/renderer/index.js',
    mode: isDevelopment ? 'development' : 'production',
    target: 'web', // Changed from 'electron-renderer' to 'web'
    devtool: isDevelopment ? 'cheap-module-source-map' : 'source-map',
    
    module: {
      rules: [
        {
          test: /\.(js|jsx)$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-env', '@babel/preset-react']
            }
          }
        },
        {
          test: /\.css$/i,
          use: ['style-loader', 'css-loader']
        },
        {
          test: /\.(png|jpe?g|gif|svg)$/i,
          type: 'asset/resource'
        }
      ]
    },
    
    resolve: {
      extensions: ['.js', '.jsx', '.json'],
      fallback: {
        "events": false,
        "buffer": false,
        "stream": false,
        "util": false,
        "process": false
      }
    },
    
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'renderer.js',
      clean: true
    },
    
    plugins: [
      new HtmlWebpackPlugin({
        template: path.resolve(__dirname, 'src/renderer/index.html'),
        filename: 'index.html'
      }),
      new CopyWebpackPlugin({
        patterns: [
          {
            from: path.resolve(__dirname, 'public'),
            to: path.resolve(__dirname, 'dist'),
            noErrorOnMissing: true
          }
        ]
      })
    ],
    
    devServer: {
      port: 8080,
      hot: false, // Disable hot reloading to avoid Node.js dependencies
      liveReload: true, // Use live reload instead
      static: [
        {
          directory: path.join(__dirname, 'dist')
        },
        {
          directory: path.join(__dirname, 'public'),
          publicPath: '/'
        }
      ],
      historyApiFallback: true,
      client: {
        logging: 'warn', // Reduce console noise
        overlay: false // Disable error overlay
      }
    }
  };
};