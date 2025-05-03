const { build } = require("esbuild");
const { dependencies } = require("./package.json");

build({
    entryPoints: ["src/extension.ts"],
    bundle: true,
    minify: true,
    external: ["vscode"],
    platform: "node",
    format: "cjs",
    outfile: "out/extension.js"
});