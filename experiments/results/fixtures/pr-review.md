# Streaming Backpressure PR Review

## Summary
The PR changes stream flushing in src/stream/writer.ts and introduces MAX_IN_FLIGHT_CHUNKS=32.

Background notes: this section includes implementation context, alternatives considered, historical notes, and discussion that a human may want later but an agent should not read by default. The purpose of the experiment is to see whether the retrieval path can preserve the facts while skipping this lower-priority prose.

Background notes: this section includes implementation context, alternatives considered, historical notes, and discussion that a human may want later but an agent should not read by default. The purpose of the experiment is to see whether the retrieval path can preserve the facts while skipping this lower-priority prose.

Background notes: this section includes implementation context, alternatives considered, historical notes, and discussion that a human may want later but an agent should not read by default. The purpose of the experiment is to see whether the retrieval path can preserve the facts while skipping this lower-priority prose.

Background notes: this section includes implementation context, alternatives considered, historical notes, and discussion that a human may want later but an agent should not read by default. The purpose of the experiment is to see whether the retrieval path can preserve the facts while skipping this lower-priority prose.

Background notes: this section includes implementation context, alternatives considered, historical notes, and discussion that a human may want later but an agent should not read by default. The purpose of the experiment is to see whether the retrieval path can preserve the facts while skipping this lower-priority prose.

Background notes: this section includes implementation context, alternatives considered, historical notes, and discussion that a human may want later but an agent should not read by default. The purpose of the experiment is to see whether the retrieval path can preserve the facts while skipping this lower-priority prose.

Background notes: this section includes implementation context, alternatives considered, historical notes, and discussion that a human may want later but an agent should not read by default. The purpose of the experiment is to see whether the retrieval path can preserve the facts while skipping this lower-priority prose.

Background notes: this section includes implementation context, alternatives considered, historical notes, and discussion that a human may want later but an agent should not read by default. The purpose of the experiment is to see whether the retrieval path can preserve the facts while skipping this lower-priority prose.

## Finding
Severity P1: abort signals are not forwarded to the retry loop. The fix is to pass AbortSignal into retryWithBackoff.

Background notes: this section includes implementation context, alternatives considered, historical notes, and discussion that a human may want later but an agent should not read by default. The purpose of the experiment is to see whether the retrieval path can preserve the facts while skipping this lower-priority prose.

Background notes: this section includes implementation context, alternatives considered, historical notes, and discussion that a human may want later but an agent should not read by default. The purpose of the experiment is to see whether the retrieval path can preserve the facts while skipping this lower-priority prose.

Background notes: this section includes implementation context, alternatives considered, historical notes, and discussion that a human may want later but an agent should not read by default. The purpose of the experiment is to see whether the retrieval path can preserve the facts while skipping this lower-priority prose.

Background notes: this section includes implementation context, alternatives considered, historical notes, and discussion that a human may want later but an agent should not read by default. The purpose of the experiment is to see whether the retrieval path can preserve the facts while skipping this lower-priority prose.

Background notes: this section includes implementation context, alternatives considered, historical notes, and discussion that a human may want later but an agent should not read by default. The purpose of the experiment is to see whether the retrieval path can preserve the facts while skipping this lower-priority prose.

Background notes: this section includes implementation context, alternatives considered, historical notes, and discussion that a human may want later but an agent should not read by default. The purpose of the experiment is to see whether the retrieval path can preserve the facts while skipping this lower-priority prose.

Background notes: this section includes implementation context, alternatives considered, historical notes, and discussion that a human may want later but an agent should not read by default. The purpose of the experiment is to see whether the retrieval path can preserve the facts while skipping this lower-priority prose.

Background notes: this section includes implementation context, alternatives considered, historical notes, and discussion that a human may want later but an agent should not read by default. The purpose of the experiment is to see whether the retrieval path can preserve the facts while skipping this lower-priority prose.

## Finding
Severity P2: queue depth metrics are emitted after await writer.flush(), which hides stalls. Emit queue_depth before flush.

Background notes: this section includes implementation context, alternatives considered, historical notes, and discussion that a human may want later but an agent should not read by default. The purpose of the experiment is to see whether the retrieval path can preserve the facts while skipping this lower-priority prose.

Background notes: this section includes implementation context, alternatives considered, historical notes, and discussion that a human may want later but an agent should not read by default. The purpose of the experiment is to see whether the retrieval path can preserve the facts while skipping this lower-priority prose.

Background notes: this section includes implementation context, alternatives considered, historical notes, and discussion that a human may want later but an agent should not read by default. The purpose of the experiment is to see whether the retrieval path can preserve the facts while skipping this lower-priority prose.

Background notes: this section includes implementation context, alternatives considered, historical notes, and discussion that a human may want later but an agent should not read by default. The purpose of the experiment is to see whether the retrieval path can preserve the facts while skipping this lower-priority prose.

Background notes: this section includes implementation context, alternatives considered, historical notes, and discussion that a human may want later but an agent should not read by default. The purpose of the experiment is to see whether the retrieval path can preserve the facts while skipping this lower-priority prose.

Background notes: this section includes implementation context, alternatives considered, historical notes, and discussion that a human may want later but an agent should not read by default. The purpose of the experiment is to see whether the retrieval path can preserve the facts while skipping this lower-priority prose.

Background notes: this section includes implementation context, alternatives considered, historical notes, and discussion that a human may want later but an agent should not read by default. The purpose of the experiment is to see whether the retrieval path can preserve the facts while skipping this lower-priority prose.

Background notes: this section includes implementation context, alternatives considered, historical notes, and discussion that a human may want later but an agent should not read by default. The purpose of the experiment is to see whether the retrieval path can preserve the facts while skipping this lower-priority prose.

## Test Gap
Add a slow-consumer test that asserts backpressure pauses reads after 32 chunks.
