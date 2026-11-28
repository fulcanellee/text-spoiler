import { copyFileSync, mkdirSync, rmSync, writeFileSync } from "node:fs";

if (process.argv[2] === "clean") {
    rmSync("dist", { recursive: true, force: true });
    process.exit(0);
}

for (const dir of ["dist/esm", "dist/cjs"]) {
    mkdirSync(dir, { recursive: true });
    copyFileSync("src/text-spoiler/TextSpoiler.css", `${dir}/TextSpoiler.css`);
}

writeFileSync(
    "dist/esm/package.json",
    JSON.stringify({ type: "module" }, null, 2),
);
writeFileSync(
    "dist/cjs/package.json",
    JSON.stringify({ type: "commonjs" }, null, 2),
);
