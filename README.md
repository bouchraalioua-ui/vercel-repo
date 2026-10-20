# CloudMargin 7 — Segmented Revenue Forecast

Independent student finance project. Three connected modules: FP&A, Product Finance, and Build vs. Buy. All inputs are hypothetical and not Vercel financial information.

## Revenue model

Free, Pro, and Enterprise cohorts are forecast independently for 36 months. Each month records the opening cohort sizes, task volume, agent-driven execution attempts, direct modeled delivery costs, subscription/contract revenue, and usage overages. At month end, each cohort moves based on annual gross acquisition rates approximated monthly, Free→Pro conversion, Pro churn, Pro→Enterprise upgrades, and Enterprise churn. Customer counts are expected values (can be fractional), not discrete customer records.

- Free: no subscription revenue; workload still incurs delivery costs.
- Pro: account count × illustrative monthly Pro fee, plus execution attempts above the Pro included allowance × illustrative overage rate.
- Enterprise: account count × illustrative monthly contract amount, plus execution attempts above Enterprise included allowance × illustrative overage rate.
- No model provider pass-through spending is counted as Vercel revenue.
- Included execution allowances are hypothetical; actual Vercel product packaging is more complex.
- A fixed budget snapshot is retained until deliberately updated. The operating model feeds the Product Finance and Build vs. Buy modules.

## Important limitations

This is **not a representation of Vercel's actual pricing or financials**. Enterprise contracts are represented by a simplified monthly amount rather than negotiated commitments and usage drawdowns. Annual churn/conversion rates are divided by 12 as a pedagogical approximation; the model is not an accounting revenue-recognition engine. Billing of retry attempts is illustrative. Unit cost excludes many real cloud cost categories. No live data or secrets are required.

## Running

`npm install` then `npm run dev`. To run deterministic finance checks: `node model.test.mjs`. Deploy on Vercel as a Next.js project with the folder containing `package.json` as root.
