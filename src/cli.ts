#!/usr/bin/env node
import { benchmarkTarget, formatBenchmarkReport } from "./benchmark.ts";
import { convertBundle, inspectBundle, packBundle } from "./bundle.ts";
import { runExperiment } from "./experiment.ts";
import { readSheetRange } from "./range.ts";
import { recipes } from "./recipes.ts";
import { formatValidationReport, validateBundle } from "./validate.ts";

async function main(): Promise<void> {
  const [command, ...args] = process.argv.slice(2);
  try {
    if (!command || command === "help" || command === "--help") {
      printHelp();
      return;
    }
    if (command === "recipes") {
      console.log(recipes.map((recipe) => `${recipe.id}\t${recipe.category}\t${recipe.purpose}`).join("\n"));
      return;
    }
    if (command === "pack") {
      const input = args[0];
      if (!input) throw new Error("pack requires an input path.");
      const recipe = valueOf(args, "--recipe") ?? "web-or-chat-archive";
      const out = valueOf(args, "--out") ?? `${input.replace(/[/.]+$/g, "")}.cwb`;
      const formats = (valueOf(args, "--formats") ?? "xlsx,json,md,csv,html").split(",").map((value) => value.trim()).filter(Boolean);
      const workbook = await packBundle(input, out, recipe, formats);
      console.log(`Packed ${workbook.title} -> ${out}`);
      console.log(`Sheets: ${workbook.sheets.length}; full tokens ~${workbook.tokenBudget.estimatedFullTokens}; index ~${workbook.tokenBudget.estimatedIndexTokens}`);
      return;
    }
    if (command === "inspect") {
      const bundle = args[0];
      if (!bundle) throw new Error("inspect requires a .cwb bundle path.");
      const budget = (valueOf(args, "--budget") ?? "small") as "small" | "medium" | "full";
      const includeIndex = args.includes("--index");
      process.stdout.write(await inspectBundle(bundle, budget, includeIndex));
      return;
    }
    if (command === "read") {
      const bundle = args[0];
      if (!bundle) throw new Error("read requires a .cwb bundle path.");
      const sheet = valueOf(args, "--sheet");
      const range = valueOf(args, "--range") ?? "A1:D20";
      if (!sheet) throw new Error("read requires --sheet <name>.");
      process.stdout.write(await readSheetRange(bundle, sheet, range));
      return;
    }
    if (command === "validate") {
      const bundle = args[0];
      if (!bundle) throw new Error("validate requires a .cwb bundle path.");
      const report = await validateBundle(bundle);
      process.stdout.write(formatValidationReport(report));
      if (!report.ok) process.exitCode = 1;
      return;
    }
    if (command === "benchmark") {
      const input = args[0];
      if (!input) throw new Error("benchmark requires an input path or .cwb bundle path.");
      const recipe = valueOf(args, "--recipe") ?? "web-or-chat-archive";
      process.stdout.write(formatBenchmarkReport(await benchmarkTarget(input, recipe)));
      return;
    }
    if (command === "experiment") {
      const out = valueOf(args, "--out") ?? "experiments/results";
      const result = await runExperiment(out);
      console.log(`Wrote experiment results to ${out}`);
      for (const [method, avg] of Object.entries(result.averages)) {
        console.log(`${method}: avg tokens ${avg.tokens.toFixed(0)}, accuracy ${(avg.accuracy * 100).toFixed(1)}%, structure ${avg.structureScore.toFixed(1)}, efficiency ${avg.efficiency.toFixed(3)}`);
      }
      return;
    }
    if (command === "convert") {
      const input = args[0];
      if (!input) throw new Error("convert requires an input path.");
      const to = valueOf(args, "--to");
      if (!to) throw new Error("convert requires --to xlsx|csv-dir|md|html|json.");
      const out = valueOf(args, "--out");
      const result = await convertBundle({ input, to: to as never, out });
      if (!out && (to === "md" || to === "html" || to === "json")) {
        process.stdout.write(result);
      } else {
        console.log(`Wrote ${result}`);
      }
      return;
    }
    throw new Error(`Unknown command: ${command}`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

function valueOf(args: string[], flag: string): string | undefined {
  const index = args.indexOf(flag);
  if (index === -1) return undefined;
  return args[index + 1];
}

function printHelp(): void {
  console.log(`Context Workbook (cwb)

Usage:
  cwb pack <input> --recipe web-or-chat-archive --out out.cwb
  cwb inspect <bundle.cwb> --index --budget small
  cwb read <bundle.cwb> --sheet Risks --range A1:D20
  cwb validate <bundle.cwb>
  cwb benchmark <input-or-bundle> --recipe web-or-chat-archive
  cwb experiment --out experiments/results
  cwb convert <input-or-bundle> --to xlsx|csv-dir|md|html|json --out <path>
  cwb recipes
`);
}

await main();
