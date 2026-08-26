# Anna's Adorable Creations — Instagram roadmap

A five-part checklist and roadmap for rebuilding a Prague hand-embroidery
business's Instagram presence: strategy, page setup, ready-to-paste CZ/EN copy,
a partner prospecting pipeline, and Czech tax and consumer-law setup.

## Reading it

Open **`index.html`** (redirects to `01-strategy.html`), or start at
[`01-strategy.html`](01-strategy.html). Every page links to every other from
the sidebar.

| File | Contents |
|---|---|
| `01-strategy.html` | The plan, a 3-phase roadmap, 11 milestones |
| `02-page-setup.html` | Week-1 profile checklist, sections A–J |
| `03-copy.html` | Bio, pinned posts, story slides, handover card |
| `04-partners.html` | Target types, scoring, outreach protocol, message templates |
| `05-legal.html` | Trade licence, tax regimes, VAT, consumer law, GDPR |

The `.md` files are the source documents the pages were built from.

## Progress tracking

110 checkboxes across the five pages. Ticks are saved in the browser's
`localStorage`, scoped to whichever origin the pages are served from.

Because that is per-browser and per-device, each page's footer has:

- **Export backup** — downloads a JSON file of all ticks
- **Import backup** — restores one
- **Copy save link** — packs every tick into a 21-character URL fragment
  (`#s=v1…`) that restores the state anywhere it is opened

`assets/keys.js` fixes the canonical order the save-link bitfield depends on.
If checklist items are added, removed or reordered, regenerate it — otherwise
previously issued save links will decode incorrectly.

## Build

None. Static HTML, one stylesheet, one script, no dependencies, no network
requests. Works from `file://` as well as over HTTP.
