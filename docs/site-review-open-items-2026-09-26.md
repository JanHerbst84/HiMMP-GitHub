# himmp.net review: open items (2026-09-26)

Status: **Claude positions recorded; Sol positions pending.** Procedure: consensus rule
(`agent-instructions/references/model-delegation.md` § Consensus rule). Claude's positions are committed before Sol
answers; Sol receives the facts and options only. Agreement is adopted; consequential disagreement goes to a
Socratic pass, and only then to JPH. Items outside consensus authority (research stimuli, facts only JPH knows,
legal texts of the data controller) go to JPH regardless.

Context: `docs/site-review-2026-09-25-plan.md` §6.4 "Held for JPH".

## Facts

- Home page (`nextjs-site/src/site/components/pages/HomeMain.tsx`, under `parity:text`, so visible-text changes are
  mirrored into the legacy `index.html`):
  - Output cards: "The Complete Dataset" → "+ ACCESS DATA"; "Project Publications" → "+ VIEW PUBLICATIONS";
    "Producer Videos & Mixes" → "+ WATCH & LISTEN"; "Key Findings: Producer's Guide" → "+ READ GUIDE".
  - Ghost buttons "+ MORE" (about, approach, dataset, researchers); books "+ OPEN ACCESS"; "+ VIEW ALL
    PUBLICATIONS"; banner "Explore the Guide →". Elsewhere on the site: "Read Chapter N →", "Open Glossary →",
    "Read Full Acknowledgements →", "Access the Full Dataset →".
  - "Project Completed" card: "The HiMMP research project has now concluded. Several outputs are still forthcoming
    and will be made available on this website as they are finalized. This website will be regularly updated and
    remain online as a resource for …". Stats: 4 years, 8 producers, 14 chapters, 2 volumes.
  - Banner "New: Interactive Findings Guide" (the guide was published 16 Nov 2025 per its JSON-LD dates).
  - The guide's title is "Heaviness in Metal Music Production: A Practical Guide"; the findings index captions its
    cover "Key Findings: A Practical Guide"; the publications page heads it "Practical Findings Guide".
- Navigation labels are lowercase; the home item reads "welcome".
- Page heroes: home `clamp(480px, 70vh, 720px)`; inner pages `clamp(360px, 50vh, 520px)`; set in design slices
  D-2a/D-9-e-11/D-9-g-2 (the audio hero was raised deliberately after review item FRESH-9 found it "markedly weaker
  than the home hero").
- Audio: 45 MP3 at 320 kbps (≈ 12 MB per 5-minute mix, 500 MB total) are the research stimuli for the mix
  comparisons. Players use `preload="metadata"`: 0.1 MB is fetched on page load; a full mix is only downloaded when
  played. Nginx serves byte ranges.
- YouTube: all embeds are click-to-load facades since the 2026-09-25 release (no request to YouTube before the
  click; thumbnails from `img.youtube.com`). After a click the player loads from `www.youtube.com`, which sets
  cookies. CSP `frame-src` allows `www.youtube.com` and `youtube.com` only.
- Privacy page (`PrivacyPage.tsx:240-250`): "No information is shared with third parties", "This website does not
  use cookies other than those essential for technical operation." It does not mention YouTube embeds.

## Claude's positions (recorded before reading Sol)

| # | Item | Position | Why |
|---|---|---|---|
| 1a | CTA labels | Unify form, keep the words: sentence case with a trailing arrow, no "+" prefix ("Access data →", "View publications →", "Watch & listen →", "Read the guide →", "More →"/"Open access →"), matching the rest of the site. | Three label systems today; the words stay the author's. Reversible. |
| 1b | Nav "welcome" | Change to "home"; keep lowercase styling. | "welcome" is not a recognised label for the home link; lowercase is a deliberate brand choice. |
| 2a | "Project Completed" text | Replace the forthcoming claim with a statement that is true either way: "The HiMMP research project (2020–2024) has concluded. New outputs are added here as they are published, and the site remains online as a resource for …" (rest unchanged). | Whether outputs are still pending is JPH's knowledge; neutral wording cannot go stale. |
| 2b | "New:" banner | Drop "New:" ("Interactive Findings Guide"); keep the banner. | Ten months old; the banner is the only mid-page call to the guide. |
| 2c | Duplicate promotions | Keep the card, banner, books and publications links otherwise. | They serve different entry points; removing sections is a content decision with little gain. |
| 3 | "Key Findings: Producer's Guide" | "Key Findings: A Practical Guide" (the site's own caption for the cover). | Last remaining third name for the guide. |
| 4 | Hero heights | Keep. | Deliberate, reviewed design decision; the finding was low severity. |
| 5 | Audio re-encoding | No change; close. | Stimuli (JPH-only), and the cost only arises on play; page load is 0.1 MB. |
| 6 | youtube-nocookie | Switch embeds to `www.youtube-nocookie.com` (CSP `frame-src` adds it; keep thumbnails; rerun `audit:csp:live`). | Fewer cookies after the click, closer to what the privacy page says; reversible. |
| 7 | Privacy page silent on YouTube | Raise to JPH with a drafted disclosure; do not edit the legal text. | Data-controller statement; not an agent decision. |
