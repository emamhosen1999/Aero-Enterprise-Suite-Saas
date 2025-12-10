const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

/**
 * Webpack Bundle Analyzer Configuration
 * 
 * @file webpack.analyzer.config.js
 * @description Enhanced webpack configuration for bundle analysis and optimization
 * @version 1.0.0
 * @author Glass ERP Development Team
 * @created 2025-06-18
 */

module.exports = {
  mode: 'production',
  
  // Entry points for feature-based analysis
  entry: {
    main: './src/frontend/App.jsx',
    features: './src/frontend/features/index.js'
  },

  // Output configuration for analysis
  output: {
    path: __dirname + '/dist',
    filename: '[name].[contenthash].js',
    chunkFilename: '[name].[contenthash].chunk.js',
    clean: true
  },

  // Optimization for bundle splitting
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        // Vendor libraries
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
          priority: 10
        },
        // Feature modules
        features: {
          test: /[\\/]src[\\/]frontend[\\/]features[\\/]/,
          name: 'features',
          chunks: 'all',
          priority: 5
        },
        // Common shared code
        common: {
          name: 'common',
          minChunks: 2,
          chunks: 'all',
          priority: 1
        },
        // Individual feature chunks
        employeeManagement: {
          test: /[\\/]src[\\/]frontend[\\/]features[\\/]employee-management[\\/]/,
          name: 'feature-employee-management',
          chunks: 'all',
          priority: 8
        },
        projectManagement: {
          test: /[\\/]src[\\/]frontend[\\/]features[\\/]project-management[\\/]/,
          name: 'feature-project-management',
          chunks: 'all',
          priority: 8
        },
        leaveManagement: {
          test: /[\\/]src[\\/]frontend[\\/]features[\\/]leave-management[\\/]/,
          name: 'feature-leave-management',
          chunks: 'all',
          priority: 8
        },
        attendance: {
          test: /[\\/]src[\\/]frontend[\\/]features[\\/]attendance[\\/]/,
          name: 'feature-attendance',
          chunks: 'all',
          priority: 8
        },
        communication: {
          test: /[\\/]src[\\/]frontend[\\/]features[\\/]communication[\\/]/,
          name: 'feature-communication',
          chunks: 'all',
          priority: 8
        },
        events: {
          test: /[\\/]src[\\/]frontend[\\/]features[\\/]events[\\/]/,
          name: 'feature-events',
          chunks: 'all',
          priority: 8
        },
        administration: {
          test: /[\\/]src[\\/]frontend[\\/]features[\\/]administration[\\/]/,
          name: 'feature-administration',
          chunks: 'all',
          priority: 8
        }
      }
    },
    // Runtime chunk for webpack runtime
    runtimeChunk: {
      name: 'runtime'
    },
    // Minimize for production analysis
    minimize: true
  },

  // Plugins for analysis
  plugins: [
    // Bundle analyzer plugin
    new BundleAnalyzerPlugin({
      analyzerMode: 'static',
      openAnalyzer: false,
      reportFilename: 'bundle-analysis-report.html',
      defaultSizes: 'gzip',
      generateStatsFile: true,
      statsFilename: 'bundle-stats.json',
      logLevel: 'info'
    })
  ],

  // Module resolution
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
    alias: {
      '@': './src/frontend',
      '@components': './src/frontend/components',
      '@features': './src/frontend/features',
      '@atoms': './src/frontend/components/atoms',
      '@molecules': './src/frontend/components/molecules',
      '@organisms': './src/frontend/components/organisms',
      '@templates': './src/frontend/components/templates',
      '@utils': './src/frontend/utils',
      '@hooks': './src/frontend/hooks',
      '@contexts': './src/frontend/contexts'
    }
  },

  // Module rules for different file types
  module: {
    rules: [
      {
        test: /\.(js|jsx|ts|tsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/preset-react'],
            plugins: ['@babel/plugin-syntax-dynamic-import']
          }
        }
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader', 'postcss-loader']
      },
      {
        test: /\.(png|jpg|jpeg|gif|svg)$/,
        type: 'asset/resource'
      }
    ]
  },

  // Performance hints
  performance: {
    hints: 'warning',
    maxEntrypointSize: 300000, // 300KB
    maxAssetSize: 250000 // 250KB
  },

  // Stats configuration for detailed analysis
  stats: {
    assets: true,
    chunks: true,
    modules: true,
    reasons: true,
    usedExports: true,
    providedExports: true,
    optimizationBailout: true,
    errorDetails: true,
    timings: true,
    builtAt: true
  }
};
