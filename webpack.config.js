module.exports = {
  entry: "./src/index.tsx",
  output: {
    path: __dirname + "/dist",
    filename: "chip.js"
  },
  devtool: "source-map",
  resolve: {
    extensions: [".ts", ".tsx", ".js"]
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: "style-loader"
      },
      {
        test: /\.css$/,
        loader: "css-loader",
        options: {
          modules: true,
          localIdentName: "[name]__[local]__[hash:base64:5]"
        }
      },
      {
        test: /\.tsx?$/,
        use: "ts-loader"
      }
    ]
  }
};
