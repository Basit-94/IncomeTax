---
name: context7-docs
description: "Fetch live, version-specific documentation and code snippets for libraries and frameworks (Next.js, React, Tailwind, Vitest, Motion) using Upstash Context7."
---

# Upstash Context7 Documentation Retrieval

Context7 provides accurate, version-specific documentation directly into the model context to prevent hallucinated or deprecated APIs.

## When to Use
- When checking breaking changes or latest APIs for Next.js 16 App Router, Turbopack, or React 19.
- When configuring Tailwind CSS v4 directives or PostCSS rules.
- When checking Motion v13 (Framer Motion successor) animation APIs.
- When working with Vitest 4 or testing utilities.

## How to Trigger
- In prompts or tool calls, invoke the `context7` MCP server tools or append `use context7 for <library>` to fetch documentation.
