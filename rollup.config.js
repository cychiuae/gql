import babel from "rollup-plugin-babel";
import commonjs from "rollup-plugin-commonjs";
import resolve from "rollup-plugin-node-resolve";
import pkg from "./package.json";

const extensions = [".mjs", ".js", ".jsx", ".ts", ".tsx"];

const deps = Object.keys(pkg.dependencies || {}).concat(
  Object.keys(pkg.devDependencies || {})
);

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
    file: "dist/index.js",
  },
];

function external(id) {
  if (deps.indexOf(id) >= 0) {
    return true;
  }
  return false;
}

export default {
  input: "src/index.ts",
  plugins,
  output,
  external,
};
