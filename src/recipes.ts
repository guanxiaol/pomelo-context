import type { ReadingGuideEntry, RecipeDefinition, RecipeId } from "./types.ts";

const defaultGuide = (focus: string): ReadingGuideEntry[] => [
  {
    task: "Understand the artifact quickly",
    firstRead: ["manifest.json", "sheets/Overview.csv", "sheets/Reading Guide.csv"],
    thenRead: ["Only the sheet ranges listed in suggestedRanges"],
    tokenBudget: "small",
    rationale: `Use the index before reading details. Focus on ${focus}.`
  },
  {
    task: "Continue work in another agent session",
    firstRead: ["manifest.json", "notes/summary.md"],
    thenRead: ["Recipe-specific sheet ranges", "assets/artifact.html when interaction matters"],
    tokenBudget: "medium",
    rationale: "Preserve intent and decisions without loading the entire artifact."
  }
];

export const recipes: RecipeDefinition[] = [
  {
    id: "compare-options",
    title: "Compare Options",
    category: "Exploration",
    borrowedFrom: "Side-by-side code and visual design explorations",
    purpose: "Fan out multiple options, compare tradeoffs, and choose a recommendation.",
    promptPattern: "Generate distinct approaches, lay them side by side, label the tradeoff each one makes, and recommend one.",
    defaultSheets: [
      { name: "Option Matrix", kind: "comparison", description: "Options, benefits, drawbacks, cost, risk, and recommendation.", columns: ["Option", "Description", "Pros", "Cons", "Cost", "Risk", "Recommended"], priority: 2 },
      { name: "Tradeoffs", kind: "decision", description: "Decision criteria and how each option scores.", columns: ["Criterion", "Option", "Score", "Evidence"], priority: 3 }
    ],
    readingGuide: defaultGuide("the option matrix and final recommendation")
  },
  {
    id: "implementation-plan",
    title: "Implementation Plan",
    category: "Planning",
    borrowedFrom: "Timeline, data flow, mockups, key code, risks, open questions",
    purpose: "Create a handoff-ready plan that an implementer can execute.",
    promptPattern: "Create a thorough implementation plan with milestones, data flow, key code, risks, and open questions.",
    defaultSheets: [
      { name: "Milestones", kind: "plan", description: "Independently reviewable slices.", columns: ["Milestone", "When", "Scope", "Owner", "Done When"], priority: 2 },
      { name: "Data Flow", kind: "architecture", description: "Request, storage, fan-out, and failure paths.", columns: ["Step", "Actor", "Action", "Input", "Output", "Notes"], priority: 3 },
      { name: "Key Code", kind: "code", description: "Code snippets most likely to matter.", columns: ["File", "Lines", "Snippet", "Why It Matters"], priority: 4 },
      { name: "Risks", kind: "risk", description: "Risks and mitigations.", columns: ["Risk", "Severity", "Mitigation", "Owner"], priority: 2 },
      { name: "Open Questions", kind: "decision", description: "Questions that block or shape the implementation.", columns: ["Question", "Default", "Decision Needed By", "Owner"], priority: 3 }
    ],
    readingGuide: defaultGuide("milestones, risks, and open questions")
  },
  {
    id: "annotated-pr-review",
    title: "Annotated PR Review",
    category: "Code Review",
    borrowedFrom: "Annotated diff with severity tags and jump links",
    purpose: "Make a code review scannable by file, severity, and suggested next step.",
    promptPattern: "Render the diff with inline annotations, color-coded severity, file risk, and exact next steps.",
    defaultSheets: [
      { name: "Findings", kind: "review", description: "Review findings ordered by severity.", columns: ["Severity", "File", "Line", "Finding", "Suggested Fix"], priority: 2 },
      { name: "Files", kind: "review", description: "Files changed and risk level.", columns: ["File", "Status", "Added", "Removed", "Risk", "Why"], priority: 3 },
      { name: "Suggested Next Steps", kind: "action", description: "Concrete actions after review.", columns: ["Action", "File", "Owner", "Priority"], priority: 2 }
    ],
    readingGuide: defaultGuide("findings ordered by severity")
  },
  {
    id: "module-map",
    title: "Module Map",
    category: "Code Understanding",
    borrowedFrom: "Boxes, arrows, request path, callstack walkthrough, gotchas",
    purpose: "Explain unfamiliar code by entry points, trust boundaries, hot paths, and gotchas.",
    promptPattern: "Map the module as entry points, call paths, key files, trust boundaries, and gotchas.",
    defaultSheets: [
      { name: "Module Map", kind: "architecture", description: "Components and relationships.", columns: ["Component", "Role", "Depends On", "Trust Boundary", "Notes"], priority: 2 },
      { name: "Call Path", kind: "walkthrough", description: "Step-by-step execution path.", columns: ["Step", "File", "Line", "What Happens", "Why It Matters"], priority: 3 },
      { name: "Gotchas", kind: "risk", description: "Surprising behaviors to remember.", columns: ["Gotcha", "Impact", "Where", "Mitigation"], priority: 2 }
    ],
    readingGuide: defaultGuide("call path and gotchas")
  },
  {
    id: "design-system-reference",
    title: "Design System Reference",
    category: "Design",
    borrowedFrom: "Tokens as swatches and components as contact sheets",
    purpose: "Package tokens, component variants, states, and copyable references.",
    promptPattern: "Extract design tokens and component variants into swatches, matrices, and copyable snippets.",
    defaultSheets: [
      { name: "Tokens", kind: "design", description: "Color, typography, spacing, radius, shadows.", columns: ["Group", "Name", "Value", "Usage"], priority: 2 },
      { name: "Component Matrix", kind: "design", description: "Variants, states, sizes, and intents.", columns: ["Component", "Variant", "State", "Size", "Intent", "Props"], priority: 3 }
    ],
    readingGuide: defaultGuide("tokens and component matrix")
  },
  {
    id: "prototype-snapshot",
    title: "Prototype Snapshot",
    category: "Prototyping",
    borrowedFrom: "Animation controls and drag-to-reorder prototypes",
    purpose: "Capture an interactive prototype's state, parameters, decisions, and exportable values.",
    promptPattern: "Build or capture a throwaway prototype, preserve state, parameters, and copyable output.",
    defaultSheets: [
      { name: "Prototype State", kind: "prototype", description: "Current state, controls, and chosen parameters.", columns: ["Control", "Value", "Default", "Why"], priority: 2 },
      { name: "Interaction Notes", kind: "prototype", description: "What the interaction feels like and open questions.", columns: ["Observation", "Decision", "Open Question"], priority: 3 },
      { name: "Exports", kind: "export", description: "Copyable CSS, JSON, prompt, or params.", columns: ["Format", "Content", "Use"], priority: 2 }
    ],
    readingGuide: defaultGuide("chosen parameters and exports")
  },
  {
    id: "research-explainer",
    title: "Research Explainer",
    category: "Research",
    borrowedFrom: "TL;DR, collapsible request paths, tabbed snippets, glossary, FAQ",
    purpose: "Turn a topic or feature into a navigable explainer.",
    promptPattern: "Explain the topic once: TL;DR, request path, key snippets, gotchas, glossary, FAQ.",
    defaultSheets: [
      { name: "TLDR", kind: "summary", description: "One-pass explanation.", columns: ["Point", "Detail", "Evidence"], priority: 1 },
      { name: "Steps", kind: "walkthrough", description: "Step-by-step flow.", columns: ["Step", "Name", "Where", "What Happens"], priority: 2 },
      { name: "Glossary", kind: "reference", description: "Terms and definitions.", columns: ["Term", "Definition", "Related"], priority: 3 },
      { name: "FAQ", kind: "reference", description: "Questions and answers.", columns: ["Question", "Answer"], priority: 3 }
    ],
    readingGuide: defaultGuide("TLDR, steps, and gotchas")
  },
  {
    id: "status-report",
    title: "Status Report",
    category: "Reports",
    borrowedFrom: "Weekly status with highlights, metrics, carryover, and sources",
    purpose: "Create recurring status updates that are easy to skim and audit.",
    promptPattern: "Summarize what shipped, what slipped, metrics, carryover, and sources.",
    defaultSheets: [
      { name: "Highlights", kind: "report", description: "Top updates.", columns: ["Highlight", "Impact", "Evidence"], priority: 2 },
      { name: "Metrics", kind: "metrics", description: "Current values and deltas.", columns: ["Metric", "Value", "Delta", "Notes"], priority: 2 },
      { name: "Carryover", kind: "action", description: "In review, blocked, slipped.", columns: ["Status", "Item", "Owner", "Next Step"], priority: 3 }
    ],
    readingGuide: defaultGuide("highlights and carryover")
  },
  {
    id: "incident-report",
    title: "Incident Report",
    category: "Reports",
    borrowedFrom: "Incident timeline, root cause, impact, action items",
    purpose: "Preserve incident facts, root cause, impact, and follow-up actions.",
    promptPattern: "Create TL;DR, timeline, root cause, impact table, and action items from incident notes.",
    defaultSheets: [
      { name: "Timeline", kind: "incident", description: "Minute-by-minute event log.", columns: ["Time", "Event", "Actor", "Evidence"], priority: 2 },
      { name: "Impact", kind: "incident", description: "User and system impact.", columns: ["Metric", "Value", "Notes"], priority: 2 },
      { name: "Action Items", kind: "action", description: "Follow-up tasks.", columns: ["Owner", "Action", "Due", "Status"], priority: 2 }
    ],
    readingGuide: defaultGuide("timeline, root cause, and action items")
  },
  {
    id: "custom-editor-export",
    title: "Custom Editor Export",
    category: "Custom Editors",
    borrowedFrom: "Triage board, feature flag editor, prompt tuner with copy/export buttons",
    purpose: "Capture edits to structured data and export only the useful delta.",
    promptPattern: "Create or capture a purpose-built editor; always end with export as JSON, diff, markdown, or prompt.",
    defaultSheets: [
      { name: "Editor State", kind: "editor", description: "Current UI state.", columns: ["Field", "Value", "Changed", "Validation"], priority: 2 },
      { name: "Exports", kind: "export", description: "Copyable outputs.", columns: ["Format", "Content", "Use"], priority: 1 },
      { name: "Validation", kind: "validation", description: "Warnings and dependencies.", columns: ["Severity", "Rule", "Message", "Fix"], priority: 2 }
    ],
    readingGuide: defaultGuide("exports and validation warnings")
  },
  {
    id: "web-or-chat-archive",
    title: "Web or Chat Archive",
    category: "Archive",
    borrowedFrom: "Readable HTML reports plus source preservation",
    purpose: "Freeze web, X, chat, or article context into a durable low-token archive.",
    promptPattern: "Archive the source, extract structure, preserve links, summarize claims, and provide ranges for agent reuse.",
    defaultSheets: [
      { name: "Claims", kind: "archive", description: "Important claims, views, or decisions.", columns: ["Claim", "Source", "Evidence", "Confidence"], priority: 2 },
      { name: "Messages", kind: "chat", description: "Chat messages when the source is conversational.", columns: ["Index", "Role", "Author", "Content", "Token Estimate"], priority: 3 },
      { name: "Links", kind: "reference", description: "Outbound links and references.", columns: ["Text", "URL", "Source"], priority: 4 }
    ],
    readingGuide: defaultGuide("claims, messages, and source links")
  }
];

export function getRecipe(id: RecipeId): RecipeDefinition {
  const recipe = recipes.find((entry) => entry.id === id);
  if (!recipe) {
    throw new Error(`Unknown recipe: ${id}`);
  }
  return recipe;
}

export function isRecipeId(value: string): value is RecipeId {
  return recipes.some((entry) => entry.id === value);
}

export function recipeCatalogMarkdown(): string {
  return recipes
    .map((recipe) => `## ${recipe.id}\n\n${recipe.purpose}\n\nPrompt pattern: ${recipe.promptPattern}\n`)
    .join("\n");
}
