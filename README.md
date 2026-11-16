# Subscription Ledger Lite

An experimental v0.2 tool for reviewing subscription bills locally. No account, API key, paid endpoint, or backend account is required. It does not connect to banks, cancel services, or guarantee savings. The application interface remains in Simplified Chinese.

## Start locally

Download and extract the complete repository. In the directory containing `index.html`, run an installed Python 3:

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

On Windows with Python Launcher, use `py -3` instead of `python3`. Open `http://127.0.0.1:8000`. Stop the server with Ctrl+C. Serve only the project directory, not a parent directory containing private files. Python only serves the local static files; no API credentials are needed.

This localhost method has been verified. Direct `file://` opening has not been verified.

## Review a list

1. Add a subscription with its service name, total amount per billing period, currency, and next renewal date. IDs are generated automatically. Defaults are monthly, CNY, and active; change them to match your bill. Owner, purpose, and review decision are optional.
2. Save the entry to the list. Review separate monthly-equivalent and annualized totals for each currency. Entries are ordered by notice deadline, not simply renewal date.
3. Download a list backup as `subscription-list.json`. Check that the browser actually saved it, then confirm the backup in the app. Import that JSON later to continue editing.

The fictional demo asks before replacing current content. It is not a record of your bills.

### Editing and safeguards

- Add, edit, and delete entries; undo the **most recent deletion**. Starting or importing another list clears that undo history.
- Up to 500 entries, all editable. Search names, owners, and purposes; filter active or cancelled entries without changing totals.
- Cancelled entries appear last, need no renewal date, and are excluded from totals. You must still verify cancellation with the provider.
- Backing up with an unsaved editor prompts you to save the edit first. Switching lists requires overwrite confirmation.
- The app attempts to warn before leaving with unbacked-up changes or unsubmitted edits. Browsers control whether this prompt appears; do not rely on it instead of a backup.
- Invalid or oversized imports preserve the current list. New edits made during asynchronous file reading take precedence over the arriving file.

## Backups, drafts, and privacy

### File backups: recommended

`subscription-list.json` contains the original inputs and can restore editing. `subscription-report.json` contains calculated results and **cannot restore the list**; selecting it by mistake produces a warning instead of replacing data. Incomplete imported drafts can be saved, but calculations still require valid fields.

A webpage cannot reliably confirm that a download finished. Requesting a download therefore does not clear the backup warning. Confirm that the file exists before acknowledging completion. Back up again after further changes.

### Optional local drafts: off by default

Explicitly enabling drafts stores changes committed to the list in `localStorage`. Unsubmitted form edits are not included. On reopening, you are offered restoration; a draft does not silently replace current content. An unrestored or damaged older draft is protected from automatic overwriting.

Drafts are limited to the same browser and page origin, are not synchronized, and may be cleared by the browser. Some browsers restrict storage for local files; use file backups when storage is unavailable.

Drafts are **not encrypted**. Other users of the same device or origin may access them. Do not enable drafts on a shared computer. Turning off automatic saving does not delete old drafts. The separate delete-draft action requires confirmation, keeps the current list and downloaded files, and cannot recover the deleted draft afterward.

No telemetry, external requests, or third-party scripts. Do not enter passwords, bank-card numbers, or unauthorized personal information. Downloaded backups may contain private billing information; store them appropriately.

## CSV and JSON

CSV is for spreadsheet exchange. **Use JSON for a lossless editable backup.** Additional actions provide a fictional CSV template, CSV export, and sample loading. UTF-8, BOM, commas, quotes, and embedded newlines are supported.

Headers:

```text
asOf,id,name,currency,amount,cadence,status,nextRenewal,noticeDays,owner,purpose,decision
```

- Required headers: `name,currency,amount,cadence,status,nextRenewal`.
- Blank IDs are generated; nonempty IDs must be unique.
- Blank `asOf` uses the page date. If multiple rows specify it, their dates must agree.
- `cadence`: `monthly/quarterly/yearly`; `status`: `active/cancelled`.
- `decision`: `retain/review/cancel_candidate`, default `review`; `noticeDays` defaults to 0.
- Active entries require `nextRenewal`; cancelled entries may leave it blank.
- Blank amounts are not zero. Amounts allow at most two decimal places, without currency symbols or thousands separators.
- CSV export prefixes formula-like values with an apostrophe. Reimport preserves that apostrophe rather than reactivating a formula. Use JSON for exact arbitrary-text round trips.
- JSON/CSV limit: 1 MB; list limit: 500 entries. Excel `.xlsx` is not supported.

JSON uses `{ "schemaVersion":1, "asOf":"YYYY-MM-DD", "subscriptions":[...] }`. Older files without `schemaVersion` are accepted. See `sample.json` for entry fields. Unknown fields are rejected rather than silently discarded. Verify imported dates and billing details yourself.

## Calculation assumptions

- The amount is the entire subscription's cost per billing period, not a per-seat price. Values use at most two decimal places and are accumulated in hundredths to avoid common addition errors. Official minor-unit rules are not validated for each currency.
- Monthly, quarterly, and yearly amounts are multiplied by 12, 4, and 1 respectively. Monthly equivalent is annualized amount divided by 12. The interface displays two decimals; reports retain calculated values.
- Currencies are grouped separately, with code-format checks only. There is no default exchange rate or mixed-currency total.
- Notice deadline equals the entered renewal date minus notice days, using UTC calendar days. The review date is supplied by you. Business days, contractual time zones, and grace periods are not inferred.
- Past dates are not advanced automatically. Verify the next real billing cycle and edit the record.
- Cancellation candidates are separately annualized active entries you marked for review. They do not change current totals, represent immediate savings, or confirm cancellation.
- Duplicate-name warnings do not prove duplicate billing.

Discount changes, usage billing, trial conversions, refunds, termination fees, and taxes are excluded. The tool does not fetch bills or send system renewal notifications. It is not a cash-flow forecast, accounting ledger, or financial, tax, or legal advice. It does not implement the unverified SB122 tax claim from the original opportunity brief.

## Verification and limitations

**59 internal automated tests passed**, covering arithmetic, dates, currency separation, CSV, backup/restore, defaults, cancellation state, deletion undo, draft protection, overwrite refusal, and import races. Internal interaction tests use a minimal DOM simulation, not a browser engine. Test code is not included in this public repository. You can load the sample and manually check the inputs described in [COMPARISON.md](COMPARISON.md).

Independent real Chromium acceptance used a downloaded and extracted ZIP served over localhost. It covered 1180 px desktop and 400 px narrow layouts, five edited subscriptions, multiple currencies, JSON backup followed by closing and restoring, CSV/report downloads, deletion undo, and draft workflows.

Direct `file://` opening, physical phones, other browsers, and restricted-storage modes remain unverified. A narrow browser window is not a physical-phone test. These checks do not guarantee universal compatibility or production maturity.

## Interface, comparison, and license

Primary actions are add, backup, and import. Examples, CSV, and new-list actions are grouped separately. Currency cards summarize costs; compact subscription entries expose owner and calculation details on demand. Narrow layouts use one column, with keyboard focus indicators, a skip link, and reduced-motion support.

[COMPARISON.md](COMPARISON.md) describes only a specific missing-exchange-rate behavior in a fixed version and endpoint of Wallos. It does not claim overall superiority. No third-party runtime dependencies, code, or assets; examples are original and fictional. MIT; see [LICENSE](LICENSE).
