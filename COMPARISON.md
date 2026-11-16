# Comparison and Evidence

Reviewed on 2026-11-16. [Wallos](https://github.com/ellite/Wallos) is a mature self-hosted subscription manager with tracking and statistics. This tool does not replace its ongoing-management capabilities.

Our narrow workflow is a one-off local review: keep CNY and USD separate, show annualized calculations per entry, and derive notice deadlines from supplied dates. Import `sample.json` to inspect these outputs. No account, database, or external connection is required.

We reviewed the competitor's official documentation and the specific fixed-commit API source below. We did not run the complete Wallos product or audit its complete source. The difference is limited to the missing-exchange-rate path described here; it does not establish better overall arithmetic, broader features, or uniqueness. Commercial value remains unverified.

## Runtime setup, with an important limitation

The [Wallos v5.5.1 README](https://github.com/ellite/Wallos/blob/v5.5.1/README.md) specifies PHP 8.3 and a web server, or Docker. This static tool does not need those application runtimes or a database. That is a setup difference, not evidence of better calculation or feature completeness.

Manually check the sample's separate currency totals, monthly amount multiplied by 12, and renewal date minus notice days. There are no third-party application dependencies. Actual browser acceptance used a downloaded and extracted ZIP served by a localhost static server. Direct `file://` opening was not verified, so this is **not proof of a completely installation-free experience**.

## Cancellation scenario: not a competitive claim

For an active monthly subscription of 39, marking it as a cancellation candidate must keep the current annualized total at 468 while separately showing a candidate amount of 468. It must not represent that amount as money already saved.

Internal tests passed for this case. To reproduce it, add an active 39 CNY monthly entry and mark it as a cancellation candidate; inspect the two totals. We did not run Wallos v5.5.1's complete cancellation workflow. An absent README description does not prove the feature is absent. No same-input comparison supports claiming superiority for this cancellation feature.

Version 0.2 offers dedicated forms, currency cards, deadline ordering, JSON backups, and CSV exchange. In addition to minimal-DOM tests, real Chromium acceptance covered a downloaded ZIP over localhost: 1180 px desktop and 400 px narrow layouts, five edited entries, multiple currencies, closing and restoring a backup, CSV/report downloads, undo, and drafts. Physical phones, other browsers, and restricted-storage modes remain unverified.

## Verified narrow difference: no mixed-currency total without rates

Source: [Wallos get_monthly_cost.php at commit d3cb93c513c02a78e0f7932d1603b523f4b4baef](https://github.com/ellite/Wallos/blob/d3cb93c513c02a78e0f7932d1603b523f4b4baef/api/subscriptions/get_monthly_cost.php). This concerns only that endpoint and version, not all Wallos pages, current versions, or capabilities.

Conditions:

- Main currency: CNY.
- Two active monthly subscriptions: 39 CNY and 10 USD.
- Each pays once within the selected month.
- `last_exchange_update` has no `date`.

The fixed endpoint sets `canConvertCurrency` to false and adds a missing-rate warning. Its loop still adds unconverted `price` values to `monthlyCost`, then labels the result using the main currency. The source implies **49.00 CNY, accompanied by a warning**. **We did not execute a Wallos instance.** This is inspectable source reasoning, not a measured competitor run.

Our internal execution gives CNY 39 monthly / 468 annualized and USD 10 monthly / 120 annualized, in separate groups. It does not produce a single-currency total of 49 or 588. To reproduce manually, create a blank list, add those two active monthly subscriptions with valid renewal dates, and inspect the two currency cards. Internal test code and dedicated fixtures are not included in the public repository.

The once-per-month condition avoids comparing our monthly equivalents with complex within-month cash-flow schedules.

**Supported narrow benefit:** without exchange rates, this tool avoids displaying a mixed amount as a single currency, reducing the opportunity to overlook a warning and misread a total. It does not perform conversion or provide generally stronger financial calculations. The competitor already warns on this path. Our browser acceptance does not substitute for a complete comparative Wallos run.
