# Form 4 XML Parser - Detailed Explanation

## Table of Contents
1. [What is Form 4?](#what-is-form-4)
2. [XML Structure Overview](#xml-structure-overview)
3. [Parser Architecture](#parser-architecture)
4. [Step-by-Step Parsing Process](#step-by-step-parsing-process)
5. [Code Walkthrough](#code-walkthrough)
6. [Examples](#examples)
7. [Edge Cases](#edge-cases)

---

## What is Form 4?

### Background

**Form 4** is a document that insiders (executives, directors, major shareholders) must file with the SEC within 2 business days of buying or selling their company's stock.

**Why it matters**: Insiders have more information than regular investors, so their trading patterns can be valuable signals.

### Example Scenario

```
Tim Cook (CEO of Apple) buys 10,000 shares of AAPL at $150/share
    ↓
Within 2 days, Apple must file Form 4 with the SEC
    ↓
The Form 4 XML is published on SEC EDGAR
    ↓
Our parser reads it and extracts the key information
    ↓
We calculate a signal score and alert users
```

---

## XML Structure Overview

### High-Level Structure

A Form 4 XML document has three main sections:

```xml
<ownershipDocument>
    <!-- Section 1: WHO is the company? -->
    <issuer>
        <issuerCik>0000320193</issuerCik>
        <issuerName>Apple Inc.</issuerName>
        <issuerTradingSymbol>AAPL</issuerTradingSymbol>
    </issuer>

    <!-- Section 2: WHO is the insider? -->
    <reportingOwner>
        <reportingOwnerId>
            <rptOwnerName>Tim Cook</rptOwnerName>
        </reportingOwnerId>
        <reportingOwnerRelationship>
            <isOfficer>1</isOfficer>
            <officerTitle>Chief Executive Officer</officerTitle>
        </reportingOwnerRelationship>
    </reportingOwner>

    <!-- Section 3: WHAT did they do? -->
    <nonDerivativeTable>
        <nonDerivativeTransaction>
            <!-- Transaction details here -->
        </nonDerivativeTransaction>
    </nonDerivativeTable>
</ownershipDocument>
```

### Visual Breakdown

```
┌────────────────────────────────────────────────────────────────┐
│                     FORM 4 XML DOCUMENT                        │
└────────────────────────────────────────────────────────────────┘
                              │
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
   ┌─────────┐         ┌───────────┐      ┌──────────────┐
   │ ISSUER  │         │  INSIDER  │      │ TRANSACTIONS │
   │ (Company)│        │ (Reporter)│      │  (Trades)    │
   └─────────┘         └───────────┘      └──────────────┘
        │                     │                     │
        │                     │                     │
    ┌───┴───┐           ┌─────┴─────┐       ┌──────┴──────┐
    │ CIK   │           │   Name    │       │ Buy or Sell │
    │ Name  │           │   Title   │       │ How many    │
    │ Ticker│           │   Role    │       │ At what $   │
    └───────┘           └───────────┘       └─────────────┘
```

---

## Parser Architecture

### The Parser Class

```typescript
export class Form4Parser {
    /**
     * Main entry point - parses entire Form 4 document
     */
    parse(xmlText: string, accessionNumber: string, filingDate: string): Form4Data

    /**
     * Private helper methods (internal use only)
     */
    private parseIssuer(xml: string): IssuerInfo
    private parseInsider(xml: string): InsiderInfo
    private parseTransactions(xml: string): TransactionInfo[]
    private extractText(xml: string, tagName: string): string | null
    private extractAttribute(xml: string, attrName: string): string | null
}
```

### Why No XML Library?

Most XML parsers are heavy dependencies. Our parser uses **regex** (regular expressions) to extract data directly from the XML string. This makes it:
- ✅ Lightweight (no external dependencies)
- ✅ Fast (direct string matching)
- ✅ Sufficient (Form 4 XML is predictable)

### Regex Basics (Crash Course)

```javascript
// Find text between <name> and </name>
const regex = /<name>(.*?)<\/name>/

// Example:
"<name>Tim Cook</name>".match(regex)
// Result: ["<name>Tim Cook</name>", "Tim Cook"]
//         [full match,              captured group]

// The captured group (index 1) is what we want!
```

---

## Step-by-Step Parsing Process

### Step 1: Parse Issuer (Company Information)

**Goal**: Extract CIK, company name, and ticker symbol

**XML Input**:
```xml
<issuer>
    <issuerCik>0000320193</issuerCik>
    <issuerName>Apple Inc.</issuerName>
    <issuerTradingSymbol>AAPL</issuerTradingSymbol>
</issuer>
```

**Code**:
```typescript
private parseIssuer(xml: string): IssuerInfo {
    const cik = this.extractText(xml, "issuerCik") || "";
    const companyName = this.extractText(xml, "issuerName") || "";
    const ticker = this.extractText(xml, "issuerTradingSymbol");

    return {
        cik: cik.replace(/^0+/, ""), // Remove leading zeros: "0000320193" → "320193"
        companyName,
        ticker: ticker || undefined,
    };
}
```

**How `extractText()` Works**:
```typescript
private extractText(xml: string, tagName: string): string | null {
    // Try format: <issuerCik><value>0000320193</value></issuerCik>
    const valueRegex = new RegExp(
        `<${tagName}[^>]*>\\s*<value>([\\s\\S]*?)<\\/value>\\s*<\/${tagName}>`,
        "i"
    );
    let match = xml.match(valueRegex);
    if (match) return match[1].trim();

    // Try format: <issuerCik>0000320193</issuerCik>
    const directRegex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\/${tagName}>`, "i");
    match = xml.match(directRegex);
    return match ? match[1].trim() : null;
}
```

**Result**:
```typescript
{
    cik: "320193",
    companyName: "Apple Inc.",
    ticker: "AAPL"
}
```

---

### Step 2: Parse Insider (Reporting Owner Information)

**Goal**: Extract insider's name, title, and relationship to company

**XML Input**:
```xml
<reportingOwner>
    <reportingOwnerId>
        <rptOwnerName>Tim Cook</rptOwnerName>
    </reportingOwnerId>
    <reportingOwnerRelationship>
        <isDirector>0</isDirector>
        <isOfficer>1</isOfficer>
        <isTenPercentOwner>0</isTenPercentOwner>
        <isOther>0</isOther>
        <officerTitle>Chief Executive Officer</officerTitle>
    </reportingOwnerRelationship>
</reportingOwner>
```

**Code**:
```typescript
private parseInsider(xml: string): InsiderInfo {
    const name = this.extractText(xml, "rptOwnerName") || "";
    const title = this.extractText(xml, "officerTitle");

    // Parse relationship flags (1 = true, 0 = false)
    const isDirector = this.extractText(xml, "isDirector") === "1";
    const isOfficer = this.extractText(xml, "isOfficer") === "1";
    const isTenPercentOwner = this.extractText(xml, "isTenPercentOwner") === "1";
    const isOther = this.extractText(xml, "isOther") === "1";

    return {
        name,
        title: title || undefined,
        isDirector,
        isOfficer,
        isTenPercentOwner,
        isOther,
    };
}
```

**Result**:
```typescript
{
    name: "Tim Cook",
    title: "Chief Executive Officer",
    isDirector: false,
    isOfficer: true,
    isTenPercentOwner: false,
    isOther: false
}
```

---

### Step 3: Parse Transactions (The Trades)

**Goal**: Extract all buy/sell transactions from the document

**XML Input**:
```xml
<nonDerivativeTable>
    <nonDerivativeTransaction>
        <transactionDate>
            <value>2024-01-15</value>
        </transactionDate>
        <transactionCoding>
            <transactionCode>P</transactionCode>  <!-- P = Purchase, S = Sale -->
        </transactionCoding>
        <transactionAmounts>
            <transactionShares>
                <value>10000</value>
            </transactionShares>
            <transactionPricePerShare>
                <value>150.50</value>
            </transactionPricePerShare>
        </transactionAmounts>
        <postTransactionAmounts>
            <sharesOwnedFollowingTransaction>
                <value>500000</value>
            </sharesOwnedFollowingTransaction>
        </postTransactionAmounts>
        <ownershipNature>
            <directOrIndirectOwnership>
                <value>D</value>  <!-- D = Direct, I = Indirect -->
            </directOrIndirectOwnership>
        </ownershipNature>
    </nonDerivativeTransaction>
</nonDerivativeTable>
```

**Code Flow**:

```typescript
// Step 3.1: Find all transaction blocks
private extractNonDerivativeTransactions(xml: string): TransactionInfo[] {
    const transactions: TransactionInfo[] = [];

    // Find the table containing all transactions
    const tableMatch = xml.match(/<nonDerivativeTable>([\s\S]*?)<\/nonDerivativeTable>/i);
    if (!tableMatch) return transactions;

    const tableXml = tableMatch[1];

    // Find each individual transaction
    const txRegex = /<nonDerivativeTransaction>([\s\S]*?)<\/nonDerivativeTransaction>/gi;
    const txMatches = tableXml.matchAll(txRegex);

    // Parse each transaction
    for (const match of txMatches) {
        const txXml = match[1];
        const transaction = this.parseTransactionElement(txXml);
        if (transaction) {
            transactions.push(transaction);
        }
    }

    return transactions;
}

// Step 3.2: Parse individual transaction
private parseTransactionElement(txXml: string): TransactionInfo | null {
    // Extract transaction code
    const transactionCode = this.extractText(txXml, "transactionCode");

    // FILTER: Only care about P (purchase) and S (sale)
    if (transactionCode !== "P" && transactionCode !== "S") {
        return null; // Skip this transaction
    }

    // Extract transaction date
    const transactionDate = this.extractText(txXml, "transactionDate");
    if (!transactionDate) return null;

    // Extract shares and price
    const sharesStr = this.extractText(txXml, "transactionShares");
    const priceStr = this.extractText(txXml, "transactionPricePerShare");

    if (!sharesStr || !priceStr) return null;

    const shares = parseFloat(sharesStr);
    const price = parseFloat(priceStr);

    if (isNaN(shares) || isNaN(price)) return null;

    // Extract post-transaction shares (holdings after this trade)
    const postSharesStr = this.extractText(txXml, "sharesOwnedFollowingTransaction");
    const postShares = postSharesStr ? parseFloat(postSharesStr) : 0;

    // Determine if direct or indirect ownership
    const ownershipCode = this.extractText(txXml, "directOrIndirectOwnership");
    const isDirectOwnership = ownershipCode === "D";

    // Check for 10b5-1 plan in footnotes
    const footnoteId = this.extractAttribute(txXml, "footnoteId");
    const is10b51 = this.check10b51InFootnotes(txXml, footnoteId);

    return {
        transactionDate,
        transactionCode,
        shares,
        pricePerShare: price,
        transactionValue: shares * price, // Calculate total value
        postTransactionShares: postShares,
        isDirectOwnership,
        is10b51,
    };
}
```

**Result**:
```typescript
[
    {
        transactionDate: "2024-01-15",
        transactionCode: "P",
        shares: 10000,
        pricePerShare: 150.50,
        transactionValue: 1505000, // 10000 × 150.50
        postTransactionShares: 500000,
        isDirectOwnership: true,
        is10b51: false
    }
]
```

---

### Step 4: Detect 10b5-1 Trading Plans

**What is 10b5-1?**
A pre-arranged trading plan that allows insiders to trade during blackout periods. These are less meaningful as "signals" because they're scheduled in advance, not based on current information.

**XML Input**:
```xml
<nonDerivativeTransaction>
    <!-- ... transaction details ... -->
    <footnoteId id="F1"/>
</nonDerivativeTransaction>

<footnotes>
    <footnote id="F1">
        This transaction was made pursuant to a Rule 10b5-1 trading plan.
    </footnote>
</footnotes>
```

**Code**:
```typescript
private check10b51InFootnotes(xml: string, footnoteId: string | null): boolean {
    if (!footnoteId) return false;

    // Find the footnote by ID
    const footnoteRegex = new RegExp(
        `<footnote[^>]*id=["']${footnoteId}["'][^>]*>([\\s\\S]*?)<\\/footnote>`,
        "i"
    );
    const match = xml.match(footnoteRegex);

    if (!match) return false;

    const footnoteText = match[1].toLowerCase();

    // Check if footnote mentions 10b5-1
    return footnoteText.includes("10b5-1") || footnoteText.includes("10b5");
}
```

**Why this matters**:
- ✅ **10b5-1 = false**: Insider made decision to trade → More meaningful signal
- ⚠️ **10b5-1 = true**: Trade was pre-scheduled → Less meaningful signal

---

## Code Walkthrough

### Complete Parsing Flow

```typescript
// Main entry point
parse(xmlText: string, accessionNumber: string, filingDate: string): Form4Data {
    // Step 1: Parse issuer (company)
    const issuer = this.parseIssuer(xmlText);

    // Step 2: Parse insider (reporting owner)
    const insider = this.parseInsider(xmlText);

    // Step 3: Parse all transactions
    const transactions = this.parseTransactions(xmlText);

    // Step 4: Return structured data
    return {
        accessionNumber,
        filingDate,
        issuer,
        insider,
        transactions,
    };
}
```

### Visual Flow Diagram

```
XML String
    │
    ▼
┌───────────────────────┐
│ parse()               │
│ Main entry point      │
└───────┬───────────────┘
        │
        ├─────────────────────────┐
        │                         │
        ▼                         ▼
┌──────────────┐         ┌──────────────┐
│ parseIssuer()│         │parseInsider()│
│ Extract CIK  │         │ Extract name │
│ Extract name │         │ Extract title│
│ Extract ticker│        │ Parse roles  │
└──────┬───────┘         └──────┬───────┘
       │                        │
       │   ┌────────────────────┘
       │   │
       ▼   ▼
┌──────────────────────┐
│ parseTransactions()  │
│                      │
│ 1. Find table        │
│ 2. Find all <tx>     │
│ 3. For each:         │
│    - Parse details   │
│    - Filter P/S only │
│    - Check footnotes │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ Form4Data            │
│                      │
│ - accessionNumber    │
│ - filingDate         │
│ - issuer             │
│ - insider            │
│ - transactions[]     │
└──────────────────────┘
```

---

## Examples

### Example 1: Simple Buy Transaction

**Input XML** (simplified):
```xml
<ownershipDocument>
    <issuer>
        <issuerCik>0000789019</issuerCik>
        <issuerName>Microsoft Corporation</issuerName>
        <issuerTradingSymbol>MSFT</issuerTradingSymbol>
    </issuer>
    <reportingOwner>
        <reportingOwnerId>
            <rptOwnerName>Satya Nadella</rptOwnerName>
        </reportingOwnerId>
        <reportingOwnerRelationship>
            <isOfficer>1</isOfficer>
            <officerTitle>CEO</officerTitle>
        </reportingOwnerRelationship>
    </reportingOwner>
    <nonDerivativeTable>
        <nonDerivativeTransaction>
            <transactionDate><value>2024-02-01</value></transactionDate>
            <transactionCoding>
                <transactionCode>P</transactionCode>
            </transactionCoding>
            <transactionAmounts>
                <transactionShares><value>5000</value></transactionShares>
                <transactionPricePerShare><value>375.00</value></transactionPricePerShare>
            </transactionAmounts>
            <postTransactionAmounts>
                <sharesOwnedFollowingTransaction><value>1005000</value></sharesOwnedFollowingTransaction>
            </postTransactionAmounts>
            <ownershipNature>
                <directOrIndirectOwnership><value>D</value></directOrIndirectOwnership>
            </ownershipNature>
        </nonDerivativeTransaction>
    </nonDerivativeTable>
</ownershipDocument>
```

**Parser Output**:
```typescript
{
    accessionNumber: "0001234567-24-000123",
    filingDate: "2024-02-02",
    issuer: {
        cik: "789019",
        ticker: "MSFT",
        companyName: "Microsoft Corporation"
    },
    insider: {
        name: "Satya Nadella",
        title: "CEO",
        isOfficer: true,
        isDirector: false,
        isTenPercentOwner: false,
        isOther: false
    },
    transactions: [
        {
            transactionDate: "2024-02-01",
            transactionCode: "P",
            shares: 5000,
            pricePerShare: 375.00,
            transactionValue: 1875000,  // 5000 × 375
            postTransactionShares: 1005000,
            isDirectOwnership: true,
            is10b51: false
        }
    ]
}
```

**Human Readable**:
> Satya Nadella (CEO of Microsoft) bought 5,000 shares of MSFT at $375/share for a total value of $1,875,000. He now owns 1,005,000 shares.

---

### Example 2: Multiple Transactions (One Filing)

Sometimes a Form 4 contains multiple transactions. The parser handles this:

**Input**: Form 4 with 3 transactions
```xml
<nonDerivativeTable>
    <nonDerivativeTransaction>
        <!-- Transaction 1: Buy 1000 shares -->
    </nonDerivativeTransaction>
    <nonDerivativeTransaction>
        <!-- Transaction 2: Buy 2000 shares -->
    </nonDerivativeTransaction>
    <nonDerivativeTransaction>
        <!-- Transaction 3: Sell 500 shares -->
    </nonDerivativeTransaction>
</nonDerivativeTable>
```

**Parser Output**:
```typescript
transactions: [
    { transactionCode: "P", shares: 1000, ... },
    { transactionCode: "P", shares: 2000, ... },
    { transactionCode: "S", shares: 500, ... }
]
```

---

### Example 3: Filtering Non-P/S Transactions

**Why Filter?**
Form 4 includes many transaction types (awards, options, grants, etc.). We only care about **P** (purchases) and **S** (sales) because those involve actual cash and indicate conviction.

**Input**: Form 4 with mixed transaction types
```xml
<nonDerivativeTable>
    <nonDerivativeTransaction>
        <transactionCoding>
            <transactionCode>A</transactionCode>  <!-- Award/Grant -->
        </transactionCoding>
        <!-- ... -->
    </nonDerivativeTransaction>
    <nonDerivativeTransaction>
        <transactionCoding>
            <transactionCode>P</transactionCode>  <!-- Purchase -->
        </transactionCoding>
        <!-- ... -->
    </nonDerivativeTransaction>
    <nonDerivativeTransaction>
        <transactionCoding>
            <transactionCode>S</transactionCode>  <!-- Sale -->
        </transactionCoding>
        <!-- ... -->
    </nonDerivativeTransaction>
</nonDerivativeTable>
```

**Parser Logic**:
```typescript
// In parseTransactionElement()
const transactionCode = this.extractText(txXml, "transactionCode");

// FILTER: Only P and S
if (transactionCode !== "P" && transactionCode !== "S") {
    return null; // Ignore this transaction
}
```

**Parser Output**:
```typescript
transactions: [
    // Transaction with code "A" is SKIPPED
    { transactionCode: "P", ... }, // Purchase - INCLUDED
    { transactionCode: "S", ... }  // Sale - INCLUDED
]
```

---

## Edge Cases

### 1. Missing Ticker Symbol

**Problem**: Some companies don't have a ticker (private companies, special situations)

**XML**:
```xml
<issuer>
    <issuerCik>0001234567</issuerCik>
    <issuerName>Private Company Inc.</issuerName>
    <!-- No <issuerTradingSymbol> tag -->
</issuer>
```

**Parser Handles It**:
```typescript
const ticker = this.extractText(xml, "issuerTradingSymbol");
return {
    cik: "1234567",
    companyName: "Private Company Inc.",
    ticker: ticker || undefined  // ticker will be undefined
};
```

---

### 2. Missing Insider Title

**Problem**: Not all insiders have titles (e.g., large shareholders)

**XML**:
```xml
<reportingOwner>
    <reportingOwnerId>
        <rptOwnerName>John Doe</rptOwnerName>
    </reportingOwnerId>
    <reportingOwnerRelationship>
        <isTenPercentOwner>1</isTenPercentOwner>
        <!-- No <officerTitle> tag -->
    </reportingOwnerRelationship>
</reportingOwner>
```

**Parser Handles It**:
```typescript
const title = this.extractText(xml, "officerTitle");
return {
    name: "John Doe",
    title: title || undefined,  // title will be undefined
    isTenPercentOwner: true,
    ...
};
```

---

### 3. Zero or Missing Price

**Problem**: Some transactions don't have a price (gifts, awards)

**XML**:
```xml
<transactionAmounts>
    <transactionShares><value>1000</value></transactionShares>
    <transactionPricePerShare><value>0.00</value></transactionPricePerShare>
</transactionAmounts>
```

**Parser Handles It**:
```typescript
const price = parseFloat(priceStr);

if (isNaN(price)) return null; // Skip if price is invalid

// Price of 0 is valid (for awards/grants)
// But we filter these out anyway because transactionCode will be "A" not "P"
```

---

### 4. Indirect Ownership

**Problem**: Insiders sometimes hold shares indirectly (trusts, family members)

**XML**:
```xml
<ownershipNature>
    <directOrIndirectOwnership>
        <value>I</value>  <!-- I = Indirect -->
    </directOrIndirectOwnership>
</ownershipNature>
```

**Parser Handles It**:
```typescript
const ownershipCode = this.extractText(txXml, "directOrIndirectOwnership");
const isDirectOwnership = ownershipCode === "D"; // false if "I"

return {
    ...
    isDirectOwnership: false,  // Marked as indirect
    ...
};
```

**Why It Matters**: Direct ownership is generally a stronger signal than indirect.

---

### 5. Derivative vs Non-Derivative Transactions

**Problem**: Form 4 has two types of transactions:
- **Non-Derivative**: Actual stock (what we want)
- **Derivative**: Options, warrants, etc. (less clear signal)

**XML Structure**:
```xml
<ownershipDocument>
    <nonDerivativeTable>
        <!-- Regular stock transactions -->
    </nonDerivativeTable>

    <derivativeTable>
        <!-- Options, warrants, etc. -->
    </derivativeTable>
</ownershipDocument>
```

**Parser Handles Both**:
```typescript
private parseTransactions(xml: string): TransactionInfo[] {
    const transactions: TransactionInfo[] = [];

    // Parse non-derivative (regular stock)
    const nonDerivTransactions = this.extractNonDerivativeTransactions(xml);
    transactions.push(...nonDerivTransactions);

    // Parse derivative (options, etc.)
    const derivTransactions = this.extractDerivativeTransactions(xml);
    transactions.push(...derivTransactions);

    return transactions;
}
```

**Note**: Both use the same parsing logic, just different XML sections.

---

## Summary

### What the Parser Does

```
1. Takes SEC Form 4 XML as input
2. Extracts three key pieces of information:
   - WHO is the company? (issuer)
   - WHO is the insider? (reporting owner)
   - WHAT did they do? (transactions)
3. Filters to only buy (P) and sell (S) transactions
4. Detects 10b5-1 trading plans
5. Returns structured, typed data ready for scoring
```

### Why It's Built This Way

✅ **No External Dependencies**: Regex-based parsing is lightweight
✅ **Predictable Input**: Form 4 XML structure is standardized by SEC
✅ **Flexible**: Handles missing fields gracefully
✅ **Testable**: Clear input/output makes testing easy
✅ **Fast**: Direct string matching is efficient

### Key Takeaways

1. **Form 4 XML has 3 main sections**: issuer, insider, transactions
2. **We use regex to extract data**: No XML parsing libraries needed
3. **We filter transactions**: Only P (buy) and S (sell) matter
4. **We handle edge cases**: Missing fields, indirect ownership, etc.
5. **We detect 10b5-1 plans**: These trades are less meaningful signals

### Next Steps After Parsing

```
Parser Output (Form4Data)
    ↓
Upsert to Database (issuer, insider, transactions)
    ↓
Calculate Signal Score (scoring engine)
    ↓
Check Alert Rules (should we alert?)
    ↓
Post to Slack (if urgent)
```

---

## Debugging Tips

### How to See What the Parser is Doing

1. **Add console.logs**:
```typescript
parse(xmlText: string, ...): Form4Data {
    console.log("Parsing Form 4...");

    const issuer = this.parseIssuer(xmlText);
    console.log("Issuer:", issuer);

    const insider = this.parseInsider(xmlText);
    console.log("Insider:", insider);

    const transactions = this.parseTransactions(xmlText);
    console.log("Transactions:", transactions);

    return { ... };
}
```

2. **Test with real Form 4 XML**:
```bash
# Download a real Form 4
curl "https://www.sec.gov/cgi-bin/viewer?action=view&cik=320193&accession_number=0001209191-24-000001&xbrl_type=v" > form4.xml

# Test your parser
node -e "
const parser = new Form4Parser();
const fs = require('fs');
const xml = fs.readFileSync('form4.xml', 'utf-8');
console.log(parser.parse(xml, 'ACC123', '2024-01-15'));
"
```

3. **Run the tests**:
```bash
pnpm --filter @starter/core test parser.test.ts
```

---

*This parser is the foundation of the entire InsiderWire system. Understanding it is key to understanding how we turn SEC filings into actionable signals!*
