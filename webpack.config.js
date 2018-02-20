module.exports = {
  entry: "./src/boot.tsx",
  output: {
    path: __dirname + "/dist",
    filename: "chip.js"
  },
  devtool: "source-map",
  resolve: {
    extensions: [".ts", ".tsx", ".js"]
  },
  module: {
    loaders: [
      {
        test: /\.css$/,
        loader: ["style-loader"]
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
        loader: ["ts-loader"]
      }
    ]
  }
};
