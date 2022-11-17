import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
import dts from "rollup-plugin-dts";

const packageJson = require("./package.json");

export default[
    {
        inlineDynamicImports: true,
        input: "src/index.ts",
        output: [
            {
                file: packageJson.main,
                format: "cjs",
                sourcemap: true,
                output: undefined
            },
            {
                file: packageJson.module,
                format: "esm",
                sourcemap: true,
                output: undefined
            },
        ],
        plugins: [
            resolve(),
            commonjs(),
            typescript({ tsconfig: "./tsconfig.json" }),
        ],
    },
    {
        input: "dist/esm/index.d.ts",
        inlineDynamicImports: true,
        experimentalCodeSplitting: true,
        output: [{ file: "dist/index.d.ts", format: "esm" }],
        plugins: [dts.default()],
    },
];
