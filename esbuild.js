const { build } = require("esbuild");

build({
    entryPoints: ["src/extension.ts"],
    bundle: true,
    minify: true,
    external: ["vscode"],
    platform: "node",
    format: "cjs",
    outfile: "out/extension.js"
});