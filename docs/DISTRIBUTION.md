# SignalLayer — distribution and commercial validation

This document distinguishes **technical discovery**, **wallet-capable buyers**, and **settled payments from independent customers**. A marketplace listing is not proof of revenue. It is maintained as a checklist, not an assertion of real-time availability.

Last editorial review: 2026-10-07. Do not treat unverified marketplace claims below as completed registrations.

## Free acquisition channels

| Channel | Evidence / actions | Next step |
| --- | --- | --- |
| [ClawHub](https://clawhub.ai/xavierleterrible-hub/skills/signallayer-preflight) | Skill v0.1.0 was publicly published and passed its platform scan. | Publish a new version when important GitHub SKILL.md changes have been reviewed; do not assume GitHub sync is automatic. |
| [GitHub](https://github.com/xavierleterrible-hub/signallayer-preflight) | Public Agent Skill source, read-only offer helper, CI. | Maintain accurate docs and installation examples. |
| [skills.sh](https://skills.sh/) | GitHub root SKILL.md is eligible for direct installation via the Skills CLI. Listing/ranking depends on real user installations. | Use `npx skills add xavierleterrible-hub/signallayer-preflight`; do not self-install repeatedly to inflate analytics. |
| [Official MCP Registry](https://registry.modelcontextprotocol.io/) | Published previously under `io.github.xavierleterrible-hub/signallayer`. | Verify version listed against live server version, update using official publisher if stale. |
| [Glama](https://glama.ai/) | Remote MCP server previously connected and indexed. | Verify public listing and individual tool availability. |
| [Smithery](https://smithery.ai/) | MCP server previously published and discoverable. | Verify public visibility and that tool schemas/annotations are up to date. |
| [x402scan](https://www.x402scan.com/) | HTTP x402 endpoints previously registered. | Verify exact resources/prices and latest crawl; do not conflate listing with settlements. |
| [x402dev](https://www.x402dev.com/) | Three HTTP tools previously recorded. | Recheck prices and status in directory. |
| [Agent402](https://agent402.tools/) | Seller previously listed in unproven tier. | Check if `agent_preflight` at $0.01 qualifies for unproven routing. Distinct external payers must develop naturally. |
| [Saylor Agent Bazaar](https://bazaar.saylorinnovations.com/) | Submission was blocked by provider's Cloudflare/D1 issue. | Follow upstream issue; retry only when provider confirms repair. |
| [MCP Market](https://mcpmarket.com/submit) | Supports a free review queue for GitHub-hosted Agent Skills. | A submitter email is required; use free queue, do not select paid placement. |
| [PulseMCP](https://www.pulsemcp.com/) | Check whether listing is ingested from official MCP Registry. | If absent, use their official manual submission process if available. |
| [x402 List](https://x402-list.com/api) | Supports reviewed endpoint submissions. | **Do not submit blindly**: some free-host / resubmission cases require a non-refundable $0.50–$1.50 USDC payment. Explicit approval first. |

## Ready-to-paste submission copy

**Agent Skill title:** SignalLayer Preflight

**Agent Skill repository:** https://github.com/xavierleterrible-hub/signallayer-preflight

**Remote MCP endpoint:** https://signallayer.floot.app/_api/mcp

**Description:** Check x402 payment terms and structural Base recipient signals before user-authorized API purchases. Free tool selection and evidence-aware $0.01 USDC Preflight on Base, with explicit uncertainty and no private-key collection.

**Tags (separate):** x402, payment-preflight, base, usdc, agent-security, mcp

**Categories:** Security, Development, Finance (use the actual marketplace taxonomy).

**Public homepage:** https://signallayer.floot.app

**Tool URLs:**
- `https://signallayer.floot.app/_api/v1/agent/preflight` ($0.01)
- `https://signallayer.floot.app/_api/v1/market/execution-intel` ($0.03)
- `https://signallayer.floot.app/_api/v1/web/structured-extract` ($0.02)

Pricing above is informational; the actual 402 requirement controls transaction terms, and buyer approval is mandatory.

## Conversion metrics to measure

1. **Installations** (ClawHub / skills.sh separately; counts are not necessarily unique users).
2. **Real discovery calls** (count by endpoint and source, distinguish bots/crawlers).
3. **Selected paid tool / HTTP 402** (not revenue).
4. **Verified and settled payments on Base** (transaction hashes, net receipts).
5. **Distinct external payers and repeat payers** (self-tests excluded).
6. **Variable cost per call and net contribution margin** (especially structured_extract).

Use this funnel to decide whether to iterate the product after 14 and 30 days. Do not create paid tests to manufacture marketplace trust or inflate demand.

## Major unverified integration gaps

- Does the facilitator index SignalLayer's actual resources in **Bazaar**? A public `.well-known/x402.json` alone does not prove this. Validate via facilitator discovery catalog and extension processing status.
- Does x402-over-**MCP** settle successfully, or only x402-over-HTTP?
- Do MCP `structuredContent` values conform to declared `outputSchema`?
- Are externally sourced fields safely escaped and protected against SSRF / prompt injection?
- What are the variable costs and latency percentiles per paid tool?
