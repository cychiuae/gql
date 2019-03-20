module.exports = {
  presets: [
    ["@babel/preset-env", { targets: { node: "10" } }],
    "@babel/preset-typescript",
  ],
  // TODO: Remove class-properties once it becomes Stage 4
  plugins: ["@babel/plugin-proposal-class-properties"],
};
