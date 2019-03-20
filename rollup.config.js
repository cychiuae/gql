import babel from "rollup-plugin-babel";
import commonjs from "rollup-plugin-commonjs";
import resolve from "rollup-plugin-node-resolve";

const extensions = [".mjs", ".js", ".jsx", ".ts", ".tsx"];

const plugins = [
  babel({
    extensions,
    exclude: "node_modules/**",
  }),
  resolve({
    extensions,
  }),
  commonjs({
    include: "node_modules/**",
  }),
];

const output = [
  {
    format: "cjs",
    file: "index.js",
  },
];

function external(id) {
  return true;
}

export default {
  input: "index.ts",
  plugins,
  output,
  external,
};
