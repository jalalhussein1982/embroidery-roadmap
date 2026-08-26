# 04 · Partner Prospecting Pipeline

Purpose: build a list of **Prague businesses that meet gift-givers before Anna does**, score them, approach them by hand, and turn 4–6 of them into ongoing referral sources.

The list is a list of partners, not customers. Nothing in this pipeline sends automated messages.

---

## 1. Target types

| Type | Why | What to offer | Priority |
|---|---|---|---|
| Newborn / maternity / family photographers | See every birth weeks early; need props; tag suppliers by habit | Free hoop as a prop, tagged credit, referral discount for their clients | ★★★ |
| Wedding planners & coordinators | Control the vendor list and gift suggestions | Free ring tray sample, listing in their vendor pack | ★★★ |
| Wedding photographers / florists / stationers | Adjacent creatives, same couples | Cross-post, tag exchange, styled shoot | ★★ |
| Baby & kids concept stores (physical, Praha 1–7) | Shelf for the "in stock" line; walk-in gift buyers | Consignment 3–5 pieces, 25–30% margin | ★★★ |
| Doulas, midwives, prenatal yoga/pilates studios | Gatekeep expecting parents, esp. expats | Voucher for their clients, feature in their newsletter | ★★ |
| Bilingual kindergartens, expat parent groups, English-speaking playgroups | Concentrated expat-parent audience | Birthday-gift partnership, featured maker | ★★ |
| Pet groomers, dog boutiques, vets with Instagram | Pet-portrait channel | Sample portrait of the shop's own dog | ★ |
| Expat services (relocation agencies, coworking, Prague expat FB group admins) | Aggregate English speakers | "Featured local maker" post | ★ |
| Czech handmade marketplaces & markets (Fler, Dyzajn market, Mint Market) | Distribution and trust | Listing / stall | ★★ |

## 2. Collection — Apify workflow

Use Apify only to collect **public business profiles**. Do not collect private individuals.

**Step 1 — Seed by Google Places (Apify "Google Maps Scraper")**
Queries, Prague bounding box:
```
novorozenecký fotograf Praha · newborn photographer Prague
svatební koordinátor Praha · wedding planner Prague
dětský obchod Praha · baby boutique Prague · kids concept store Prague
dula Praha · prenatal yoga Prague · těhotenské cvičení Praha
bilingual kindergarten Prague · mateřská školka anglická Praha
psí salon Praha · dog grooming Prague
```
Fields to keep: `name, category, address, district, website, phone, rating, reviewsCount, instagramUrl (if in website/links)`.

**Step 2 — Resolve Instagram handle**
For rows with a website: fetch the site, regex `instagram.com/([A-Za-z0-9._]+)`. For the rest, search Apify "Instagram Search Scraper" by business name + "Praha".

**Step 3 — Enrich (Apify "Instagram Profile Scraper")**
Fields: `followersCount, followsCount, postsCount, isBusinessAccount, businessCategoryName, biography, externalUrl, lastPostDate, avgLikes (last 12), avgComments (last 12)`.

**Step 4 — Overlap check**
For the top ~30 candidates, pull the last 12 posts and count how many tag other local makers/suppliers (`@` mentions in captions). A business that already tags suppliers is 3× more likely to tag Anna.

Output: `partners.csv`. Expected size after filtering: 60–120 rows.

## 3. Scoring schema

Score each row 0–100. Weights sum to 100.

| Criterion | Weight | Scoring rule |
|---|---|---|
| **Audience fit** (their followers are gift-givers/expecting parents/couples) | 25 | Photographer/planner/baby store = 25 · Doula/yoga/kindergarten = 18 · Pet = 12 · Expat services = 10 · Other = 0 |
| **Local density** (Prague, physical presence) | 15 | Prague address + physical premises = 15 · Prague, online only = 10 · Central Bohemia = 5 · Else = 0 |
| **Reach in the right band** | 15 | 800–8,000 followers = 15 · 8k–30k = 10 · 300–800 = 8 · >30k = 4 (won't reply) · <300 = 2 |
| **Activity** | 10 | Last post ≤7 days = 10 · ≤30 days = 6 · ≤90 days = 2 · else 0 |
| **Engagement quality** | 10 | avgComments/followers ≥1% = 10 · ≥0.5% = 6 · else 2 |
| **Tags suppliers already** | 15 | ≥3 supplier mentions in last 12 posts = 15 · 1–2 = 8 · 0 = 0 |
| **Bilingual / expat-facing** | 10 | Bio or posts in EN or CZ+EN = 10 · CZ only = 5 |
| **Exclusion** | — | Score 0 if: sells embroidery/personalised gifts themselves (competitor) · chain / franchise · no Instagram · account private |

**Tiers:**
- ≥70 → Tier A: physical sample + personal message. Target 15.
- 50–69 → Tier B: message only. Target 25.
- <50 → Tier C: follow and engage, no outreach yet.

Suggested `partners.csv` columns:
```
handle, name, type, district, followers, last_post, tags_suppliers, bilingual, score, tier,
status (new/warming/contacted/replied/sample_sent/active/declined), first_contact, follow_up, notes
```

## 4. Outreach protocol — by hand

**Warm-up (days 1–7):** follow, like 3–5 posts, leave 2 real comments. Do this before any message. It is the difference between a reply rate of 5% and 25%.

**Contact (day 8):** one message. DM if they are active on Instagram, email if the site lists one. **Maximum 5 new contacts per day.** Personalise the first line with something specific from their feed.

**Follow-up (day 18):** one short follow-up. Then stop.

**Sample (Tier A, on reply or proactively for the top 5):** hand-deliver in Prague. Photograph the handover. Post about it and tag them — this is content regardless of outcome.

**Tracking:** update `status` in the sheet. Weekly review: replies, samples out, tags received.

## 5. Message templates

### Newborn photographer — CZ
```
Dobrý den [jméno],
sleduju vaše novorozenecké focení — [konkrétní věc, např. série s bílým pozadím z minulého týdne] je krásná.
Vyšívám ručně na míru obrázky se jménem miminka a chtěla bych vám jeden věnovat jako rekvizitu do studia — žádné podmínky, jen bych byla ráda za označení, když se objeví na fotce. Rodiče se na dárek se jménem často ptají a ráda vám k tomu dám i slevový kód pro vaše klienty.
Můžu vám ho příští týden přinést?
Anna, @anna_s_adorable_creations
```

### Newborn photographer — EN
```
Hi [name],
I've been following your newborn work — [specific thing] is beautiful.
I hand-embroider personalised name hoops in Prague and I'd like to give you one as a studio prop — no strings, I'd just appreciate a tag if it ends up in a photo. Parents often ask about a gift with the baby's name, so I'm happy to set up a discount code for your clients too.
Could I drop it off next week?
Anna, @anna_s_adorable_creations
```

### Wedding planner — CZ
```
Dobrý den [jméno],
vaše svatby na Instagramu jsou nádherné, zvlášť [konkrétní svatba].
Vyšívám ručně svatební tácky na prstýnky se jmény a datem — v Praze, na míru, 2–3 týdny. Ráda bych vám jeden poslala jako vzorek pro vaše páry, případně vás uvedla jako doporučeného koordinátora u mě. Dává vám to smysl?
Anna, @anna_s_adorable_creations
```

### Baby / kids store — CZ (email preferred)
```
Předmět: Ručně vyšívané dárky pro miminka — nabídka komisního prodeje

Dobrý den,
jsem Anna, vyšívám ručně v Praze obrázky do dětských pokojů a dárky pro novorozence (@anna_s_adorable_creations). Ráda bych vám nabídla 3–5 hotových kusů do komise s marží 25–30 % a možnost objednávek na míru pro vaše zákazníky.
Mohu se zastavit s ukázkou? Uvedu čas podle vás.
S pozdravem, Anna · tel. · IČO
```

### Expat playgroup / kindergarten — EN
```
Hi [name],
I'm a Prague-based embroiderer making personalised name hoops and birthday gifts for children, in English and Czech. I'd love to offer your families a small discount and, if it's useful, donate a piece for your next raffle or event.
Happy to send photos or bring one by.
Anna, @anna_s_adorable_creations
```

### Follow-up (any, CZ/EN)
```
Jen krátce navazuji na svou zprávu — kdyby to dávalo smysl, ráda přinesu vzorek. Pokud ne, rozumím. Hezký den!
—
Just following up on my note — happy to bring a sample if it's of interest. If not, no problem at all. Have a good week!
```

## 6. Organic pools (participation, no lists)

These are places to be present and answer questions, not to advertise. One helpful reply with a photo of a relevant piece beats ten adverts.

| Pool | Language | How to use |
|---|---|---|
| Facebook: "Maminky v Praze", "Těhotné a maminky 2026", district mum groups | CZ | Answer gift-idea threads; post in "handmade Fridays" if the group has them |
| Facebook: "Prague Expats", "Expat Mums Prague / Prague Moms", "Crowdsourced Prague" | EN | Same; expats ask "where do I get a personalised gift" every week |
| eMimino.cz, Modrykonik.cz forums | CZ | Profile + occasional helpful posts |
| Reddit r/Prague | EN | Reply to gift/handmade threads |
| Fler.cz | CZ | Open a shop; Fler has its own buyer traffic and search |
| Dyzajn market, Mint Market, Christmas markets | CZ/EN | A stall once or twice a year: content, contacts, cash |

## 7. Anti-patterns — do not

- Do not DM individuals found via hashtags or competitors' follower lists.
- Do not use any "auto-follow / auto-like / auto-DM" tool. Blocks start around 20–50 actions/hour on a small account.
- Do not send more than 5 first-contact messages a day, or the same template unchanged.
- Do not collect or store data on private individuals (see file 05, GDPR).
