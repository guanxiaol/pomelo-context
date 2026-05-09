# Pack Context Workbook

Pack the provided input into a Context Workbook bundle.

Use:

```bash
node ./src/cli.ts pack $ARGUMENTS --out tmp/context.cwb
node ./src/cli.ts inspect tmp/context.cwb --index --budget small
node ./src/cli.ts validate tmp/context.cwb
```

If the user did not specify a recipe, choose the closest recipe from `node ./src/cli.ts recipes`.
