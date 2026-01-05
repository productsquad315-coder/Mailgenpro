# CONTENT SAFETY GUARDRAILS: THE "PARANOID" WRITER PROTOCOL

> [!CAUTION]
> **SCOPE**: This document applies ONLY to the *written content* of the email.
> **ZERO TRUST**: Even if the user has a perfect domain, ONE bad word from us can ruin it.
> **THE RULE**: We write "Letters", not "Flyers".

---

## 1. TECHNICAL "HYGIENE" (THE INVISIBLE WALL)

### A. The "Text-Only" Absolute
- **Standard**: 100% Plain Text.
- **Exception**: Minimal HTML only for line breaks (`<br>`) and paragraphs (`<p>`).
- **BAN**: `<div>`, `<table>`, `<img>`, `<style>`, `<script>`.
- **Reason**: Complex HTML = "Promotions Tab". Plain Text = "Primary Inbox".

### B. The "One Link" Law
- **Cold Layer (Emails 1-2)**: **ZERO LINKS** (Unless explicitly requested by user setting).
    - If you include a link, spam score jumps by 30%.
    - *Workaround*: Ask for permission. "Reply 'link' and I'll send it."
- **Warm Layer (Email 3+)**: Max **ONE** link.
    - Never hyperlinked text like [Click Here].
    - Always raw or branded: `mailgenpro.com` or `https://mailgenpro.com`.
    - **NEVER** use bit.ly or tracking redirects.

---

## 2. THE "SPAM TRAP" DEFENSE (SEMANTIC BLOCKING)

Filters read your email content. Do not feed them trigger words.

### The "Money" Blacklist (Instant Spam)
- `$$$`, `Request`, `Invoice`, `Deal`, `Offer`, `Discount`, `Free`, `Credit`, `Income`, `Cash`.
- *Alternative*: Use "Cost", "Price", "Value", "Budget".

### The "Urgency" Blacklist
- `Urgent`, `Action`, `NOW`, `Today only`, `Expires`, `Deadline`.
- *Alternative*: "Timeline", "When you have a moment", "This week".

### The "Volume" Blacklist
- `Millions`, `Thousands`, `#1`, `Best`, `Guarantee`.
- *Alternative*: Be specific. "We helped 42 companies..." (Specific numbers are trusted).

---

## 3. ENGAGEMENT TRICKS (THE WHITE LIST)

The only way to prove you aren't spam is if people REPLY.

### The "Reply-Bait" Questions
- "Is this relevant to [Company]?"
- "Did I read that right?"
- "Are you the right person for this?"
- "Unsure if this is for you - mind pointing me to the right lead?"

**Logic**: A "No" reply is better than no reply. A reply tells Google "This is a conversation."

---

## 4. PUNCTUATION & CASE SENSITIVITY

Spam filters punish "loud" formatting.

- **NO ALL CAPS**: NEVER WRITE LIKE THIS.
- **Exclamation limit**: Max 1 exclamation mark per email. Zero if possible.
- **Subject Line Casing**:
  - ❌ "Revolutionize Your Workflow Today" (Title Case = Marketing)
  - ✅ "quick question regarding flow" (Lowercase = Peer-to-Peer)

---

## 5. THE "GET STARTED" CTA PROTOCOL

The user wants a "Get Started" CTA. We must execute this safely.

**The Danger**: A giant "GET STARTED" button links to a signup page, which triggers "Promotional" filters.

**The Solution**: The "Soft Sell" Text Link.

- **Option A (Direct)**:
  "If you want to dive in, you can start here: mailgenpro.com"
  *(Note: No tracking parameters, no buttons. Just raw URL).*

- **Option B (The Permission Ask)**:
  "Reply 'start' and I'll send over the setup guide."

**MANDATORY RULE**: NEVER use a button. ALWAYS use a sentence that leads to a raw link or a reply.
