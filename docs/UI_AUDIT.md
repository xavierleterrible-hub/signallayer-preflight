# SignalLayer — Public UI click and link audit

**Audited:** 2026-10-08 05:20 UTC, production at https://signallayer.floot.app, read-only Chromium on desktop and mobile.

**Evidence:** [GitHub Actions run](https://github.com/xavierleterrible-hub/signallayer-preflight/actions/runs/37731822702) — downloadable `signallayer-ui-audit` JSON artifact. The job completed successfully.

## Coverage and limitations

- Homepage: **18 visible anchors on desktop**, **15 on mobile**.
- No page JavaScript exceptions, empty href placeholders or broken fragment anchors surfaced on the homepage.
- The site has a single public HTML landing page; most anchors refer to machine API endpoints. A safe link checker deliberately did not try to sign, pay, submit forms or execute POST-only MCP methods.
- This does **not** prove that every interaction works. These are all the visible homepage links discovered by the browser, not an audit of authenticated pages or every hover state.

## Tested homepage API link targets

| GET destination | HTTP | Browser-facing classification |
| --- | ---: | --- |
| `/_api/tools` | 200 | Valid raw machine catalog |
| `/_api/openapi` | 200 | Valid API specification |
| `/_api/skill` | 200 | Valid Skill docs |
| `/_api/v1/router` | 200 | Valid free router when supplied a task |
| `/_api/llms` | 200 | Valid machine-readable text |
| `/_api/v1/agent/preflight-test` | **402** | Expected x402 challenge; unfriendly as a human-facing "Test" destination |
| `/_api/v1/agent/preflight` | **402** | Expected x402 paywall; not an actual paid result |
| `/_api/v1/market/execution-intel` | **402** | Expected x402 paywall; not an actual paid result |
| `/_api/v1/web/structured-extract` | **402** | Expected x402 paywall; not an actual paid result |
| `/_api/mcp` | **405** | Wrong method for browser navigation; Streamable HTTP MCP expects POST |

**Do not "fix" HTTP 402 or HTTP 405 by weakening API protection.** The problem is that the landing page directs a browser to machine-only endpoints.

## Specific clickable home UI that needs attention

1. **`/_api/mcp`** appears as a clickable bare URL but navigates to HTTP 405. Change this clickable affordance to copy the MCP endpoint or open an MCP setup explanation. Keep the raw endpoint available to agents for POST.
2. **Paid tool external-arrow links** `Open agent_preflight`, `Open market_execution_intel`, `Open structured_extract` lead to HTTP 402 JSON. Redirect their **UI links only** to a visible tool explanation, live price/requirements and copy endpoint feature. The machine API must still return the real x402 challenge.
3. **`Test x402 on Base Sepolia`** leads to HTTP 402. Give it an explanation/test instructions page or dialog clarifying that a funded testnet wallet and user authorization are needed, rather than looking like an unexpectedly broken test.
4. **`MCP DOCS`** currently points to `/_api/skill` (Agent Skill text), not a specific MCP setup guide. Point it to a real MCP guide if available; otherwise rename it "Agent Skill" accurately.
5. Keep legitimate raw machine links `TOOLS.JSON`, `OPENAPI`, `SKILL.MD`, and `/_api/llms`; consider indicating that they open raw machine-readable output rather than a consumer page.

The intended human flow is: homepage → capabilities/tool detail → free route/catalog → instructions for a compatible, user-authorized x402 wallet → paid API request by the agent. No fake free paid checks, misleading "safe" guarantee, automatic signing or private key collection.

## Fix and regression checklist for Floot (scheduled 2026-10-08 02:30 America/Toronto)

- First inspect the existing project UI component(s); preserve their style, responsive design and data contracts.
- Implement the UI destination changes above with **working** routes, modals or copy controls. A "copy" action must actually copy and show feedback. Avoid placeholder `href="#"` or decorative buttons.
- Check desktop and mobile, keyboard-focus interactions and labels; avoid clickables hidden behind overlays.
- Keep URLs shown to agents accurate and copyable even if not clickable as human GET links.
- Retest with Playwright from this repo. Aim for **no GET-405 link** and **no human-facing paid tool links unexpectedly opening raw 402**. Direct API responses must continue returning legitimate 402 and MCP GET 405.
- Update descriptions in `helpers/signalLayerMcp.tsx` as specified in [DISTRIBUTION.md](DISTRIBUTION.md).
- Run Floot typecheck/specs and preview first; publish only on passing checks and re-run the production browser audit.
- No payment, wallet change, quota upgrade or ClawHub re-import.

