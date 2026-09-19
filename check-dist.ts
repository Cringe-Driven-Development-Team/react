import { existsSync } from "node:fs";
import { join } from "node:path";
import { Glob } from "bun";

const distDir = join(import.meta.dir, "dist");

function fail(message: string): never {
    console.error(message);
    process.exit(1);
}

function findProfilerTraces(source: string): string[] {
    return [...new Set(source.match(/\w*profil\w*/gi) ?? [])];
}

if (!existsSync(distDir)) {
    fail("dist не найден: сначала запусти bun run build");
}

const files = [...new Glob("*.{mjs,d.mts}").scanSync({ cwd: distDir })].sort();
const hasRuntime = files.some((file) => file.endsWith(".mjs"));
const hasDeclarations = files.some((file) => file.endsWith(".d.mts"));

if (!hasRuntime || !hasDeclarations) {
    fail(`В dist нет пары .mjs и .d.mts: ${files.join(", ") || "файлов нет"}`);
}

const dirty: string[] = [];

for (const file of files) {
    const traces = findProfilerTraces(await Bun.file(join(distDir, file)).text());

    if (traces.length > 0) {
        dirty.push(`${file}: ${traces.join(", ")}`);
    }
}

if (dirty.length > 0) {
    fail(`Профайлер попал в пакет:\n${dirty.join("\n")}`);
}

console.log(`В пакете нет профайлера: ${files.join(", ")}`);
