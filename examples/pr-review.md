# PR #247 Review

## What Changed

The PR adds optimistic task updates and an idempotency key.

```ts
return useMutation({
  onMutate: async (patch) => {
    const prev = qc.getQueryData(key);
    qc.setQueryData(key, optimisticPatch(patch));
    return { prev };
  }
});
```

## Risks

- Background refetch can clobber optimistic state if queries are not cancelled first.
- Retry requests may mint a new idempotency key each time.

## Suggested Next Steps

1. Cancel queries in `onMutate`.
2. Mint idempotency keys once and thread them through retries.
3. Surface rollback errors to users.
