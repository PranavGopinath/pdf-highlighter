// next.config.js or next.config.ts
const nextConfig = {
    webpack: (config) => {
      config.module.rules.push({
        test: /pdf\.worker(\.min)?\.js$/,
        use: {
          loader: 'file-loader',
          options: {
            name: '[name].[ext]',
            outputPath: 'static/js/',
          },
        },
      });
      return config;
    },
  };
  
  export default nextConfig;
  