nsider Trading Signal Bot — Functional Specification
1. Scope & Intake
Filings monitored

SEC Form 4 only

Poll all US issuers (no watchlist)

Ingest daily (with intraday polling if available)

Transactions included

Only:

P — Open-market buy

S — Open-market sell

Exclude:

Gifts (G), awards (A), tax-withhold (F), option exercise (M), conversions, indirect transfers

2. Normalized Data Model (Core)
Issuer

issuer_cik

ticker

company_name

Insider (identity rule = name + issuer)

insider_name

insider_title

issuer_cik

No cross-issuer identity resolution.

Transaction

filing_accession

transaction_date

transaction_code (P/S)

shares

price

transaction_value = shares × price

post_transaction_shares

is_direct_ownership

is_10b5_1 (parsed from footnotes if present)

3. Dedupe & Aggregation Logic
Atomic unit

Transaction row is the atomic event.

Aggregation

Daily aggregation per ticker.
Used for:

Daily digest

Cluster detection

Context enrichment

Dedupe key

filing_accession + insider_name + transaction_date + shares + price

4. Alert Types
A. Urgent Alerts (real-time Slack post)

Triggered if any condition below is true:

Threshold-based:

transaction_value ≥ $250,000

OR abs(% change in insider holdings) ≥ 10%

Role-based:

Insider role in {CEO, CFO, Chair, President}

OR first buy by that insider in ≥ 6 months

Buys score positive, sells score negative — but both can trigger alerts.

B. Daily Digest (Slack thread reply)

Posted once daily per ticker

Summarizes all included transactions

Sorted by absolute signal score

5. Scoring Model (Transparent & Tunable)
Base score

Buy (P): +1

Sell (S): -1

Size multiplier

log10(transaction_value / 10,000)

Role multiplier

CEO/CFO/Chair: ×1.5

First activity bonus

First trade in ≥180 days: +1

Cluster bonus

≥2 insiders same ticker within 7 days: +1 per additional insider

Final score

signal_score = base × size_multiplier × role_multiplier + bonuses

Used for:

Urgency ranking

Digest ordering

Slack labeling (Low / Medium / High signal)

6. Slack Delivery Model
Channel Structure

One channel total

One thread per ticker per day

Urgent Alert (starts thread)

Message content:

Ticker + company name

Insider name + title

BUY or SELL

Shares, price, value

% holdings change

Signal score (with label)

“First trade in X days” or “Cluster detected” (if applicable)

Link to SEC filing

Daily Digest (thread reply)

Summary line example:
3 insider trades today | Net value: +$1.2M | Avg score: 2.4

Then bullet list per insider:

Name / role

Buy or sell

Value

Signal score

Rolling 90-day context:

Number of buys vs sells

Repeat buyers highlighted

7. Parsing & Enrichment Rules
Holdings calculation

Use postTransactionAmounts.sharesOwnedFollowingTransaction

Compute delta from previous known filing for same insider + issuer

Role extraction

From reportingOwnerRelationship

Normalize titles (CEO, CFO, etc.)

Footnotes

Parsed only for 10b5-1 mentions (flag only, no exclusion)

8. Failure & Edge Handling

Missing price → skip transaction

Multiple prices → use weighted average

Amended filings → overwrite prior record (same accession + /A)

9. System Behavior Summary (End-to-End)

Poll SEC Form 4 feed

Parse XML to normalized transactions

Filter to P and S only

Deduplicate

Compute holdings delta and score

Check urgent rules and post Slack alert

Aggregate by ticker per day

Post daily digest as thread reply
