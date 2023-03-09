import { defineBuildConfig } from "unbuild";

export default defineBuildConfig({
  declaration: true,
  rollup: {
    emitCJS: true,
  },
  clean: true,
  outDir: "lib",
  entries: ["src/index"],
  externals: [
    "@greymass/eosio",
    "anchor-link",
    "newsafe-link-browser-transport",
    "eosjs",
    "universal-authenticator-library",
  ],
});
