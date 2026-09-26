# himmp.net review: open items (2026-09-26)

Status: **resolved 2026-09-26, deployed in release `20260926-071441-784a39e`** — consensus items implemented; 2a and 4 resolved by a Socratic pass (no change now, one question/option each for JPH); 5 closed; 7 raised to JPH. Procedure: consensus rule
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

## Sol's positions (`gpt-5.6-sol`, medium, read-only; blind to the section above)

| # | Choice | Detail |
|---|---|---|
| 1a | Rewrite and standardise | Sentence case, no "+", trailing →. Replace the four ambiguous "+ MORE" links with descriptive text: "Learn about HiMMP →", "Explore the approach →", "Access the dataset →", "Meet the researchers →"; "Access data →", "View publications →", "Watch & listen →", "Read guide →", "Open access →", "View all publications →", "Explore the guide →". |
| 1b | "home" | Lowercase kept. |
| 2a | Ask the PI; change nothing meanwhile | Only the PI can confirm whether outputs are pending. |
| 2b | Drop "New:" | "Interactive Findings Guide". |
| 2c | Keep all | Different entry points, not verbatim duplication. |
| 3 | Rename | "Heaviness in Metal Music Production: A Practical Guide". |
| 4 | Reduce selected inner pages | `clamp(300px, 36vh, 400px)`; home and audio unchanged; wanted PI approval. |
| 5 | No change | Stimuli; metadata preload and ranges already avoid full downloads. Noted that the audio page's players lacked an explicit `preload="metadata"`. |
| 6 | youtube-nocookie | `frame-src https://www.youtube-nocookie.com` only; keep `img.youtube.com`; live CSP audit. |
| 7 | Raise to the PI with a draft | Draft below; also flagged the privacy page's "all data stored in Germany / no transfers outside the EEA/UK" statements for legal reconciliation (`PrivacyPage.tsx:590`). |

## Comparison and outcome

| # | Claude | Sol | Status | Outcome |
|---|---|---|---|---|
| 1a | unify form, keep words | same form, descriptive text for "+ MORE" | consensus (detail) | **Adopted Sol's labels**: descriptive link text also satisfies WCAG 2.4.4 (link purpose); the form convention is shared. |
| 1b | "home" | "home" | consensus | **Adopted.** |
| 2a | neutral rewrite | ask PI, no change | disagreement → Socratic pass | **No change now; one yes/no question to JPH** (below). The pass found Claude's wording was not claim-free ("added here as they are published" is also a maintenance promise) and that the publications page (`PublicationsPage.tsx:73`) makes the same claim, so both pages must change together if at all. |
| 2b | drop "New:" | drop "New:" | consensus | **Adopted.** |
| 2c | keep | keep | consensus | **No change.** |
| 3 | "Key Findings: A Practical Guide" | full title | consensus (detail) | **"Key Findings: A Practical Guide"**: it is the site's own caption for the guide cover (`FindingsIndexPage.tsx`), and the full 54-character title wraps to three lines in a quarter-width card. |
| 4 | keep | reduce selected | disagreement → Socratic pass | **Keep now; option to JPH** (below). No design doc recorded a height floor, but content is not hidden (≈ 325 px of content visible at 1440×900) and the finding is Low; Sol itself wanted PI approval. |
| 5 | no change | no change | consensus | **Closed.** Delivery fix adopted: `preload="metadata"` on the audio page's players (`AudioComparison.tsx`, `AudioPage.tsx`); the stimuli are unchanged. |
| 6 | nocookie | nocookie, youtube.com dropped | consensus | **Adopted**: embeds and `frame-src` on `www.youtube-nocookie.com` only; structured-data `embedUrl`s stay on youtube.com. |
| 7 | raise to JPH | raise to JPH with draft | consensus | **Raised to JPH** (legal text of the data controller; outside consensus authority). |

### Socratic pass (fresh Claude subagent, 2026-09-26)

Steelmanned both sides and put two questions to each. 2a: recommended Sol's position plus a ready replacement,
acceptable to both. 4: recommended Claude's position plus one option for JPH, acceptable to both (Sol's condition of
PI approval is met). Moderate value offered: `clamp(320px, 44vh, 440px)`, already used at two narrower breakpoints
(`globals.css` ≈ 928, 2291).

## For JPH

1. **2a — one question:** Are HiMMP outputs still forthcoming? If yes, nothing changes. If no, the home "Project
   Completed" paragraph and the publications intro (`PublicationsPage.tsx:73`) change together, e.g. "The HiMMP
   research project (2020–2024) has concluded. Its outputs are collected on this website, which remains online as a
   resource for …" (keeping "regularly updated" only if you still commit to it).
2. **4 — optional design change:** inner-page heroes (not home, not audio) from `clamp(360px, 50vh, 520px)` to
   `clamp(320px, 44vh, 440px)`. Today ≈ 325 px of content is visible on a 1440×900 screen; the earlier "thin strip"
   (233 px) problem would not return.
3. **7 — privacy page (legal text):** it says no information is shared with third parties and no non-essential
   cookies are used, but does not mention YouTube. Since 2026-09-25 no request reaches YouTube's player before a
   visitor clicks; thumbnails still load from `img.youtube.com` when a video section scrolls into view. Draft
   (Sol's, lightly edited):

   > **Embedded YouTube videos.** Pages with videos show preview images loaded from YouTube (Google). A video
   > player is loaded only when you choose to play a video; your browser then connects to YouTube's
   > privacy-enhanced service (youtube-nocookie.com), which may process connection data and use cookies or
   > similar technologies. See Google's Privacy Policy for details.

   Sol also flagged the page's statements that all data is stored in Germany and not transferred outside the
   EEA/UK (`PrivacyPage.tsx` ≈ 590) for legal reconciliation. Technical alternative if you prefer no contact with
   Google before a click: self-host the thumbnails (removes `img.youtube.com` from the CSP).
4. **5 — audio (for the record):** kept at 320 kbps; no action needed.

## Implementation review (Sol + internal, 2026-09-26)

- Sol (Low): the home page still preconnected to `www.youtube.com` through the legacy head. ACCEPT: removed, together
  with the `img.youtube.com` preconnect, so no connection to Google is opened on page load (thumbnails still load
  when a video section scrolls into view).
- Internal reviewer: no findings.

## JPH answers and final advice (2026-09-26)

- **2a:** JPH confirmed outputs are still forthcoming. The "Project Completed" paragraph and the publications intro
  stay as they are. Impact activities are also in preparation; JPH marked this as an internal note, not for the
  website, so nothing is added.
- **4 (Claude's advice, JPH delegated the call):** keep the current hero heights; closed. The proposed
  `clamp(320px, 44vh, 440px)` gains about 54 px at 1440×900 (44vh = 396 px vs 450 px), too little to reverse a
  reviewed design decision.
- **7 (advice; privacy text awaits JPH's go-ahead as the named controller, `PrivacyPage.tsx` §2):** the page is
  inaccurate beyond the YouTube gap. Evidence: the VPS address `5.182.18.217` (AS47583 Hostinger International)
  geolocates to Manchester, UK (ipinfo.io, 2026-09-26; VERIFY the location in the Hostinger panel), while §11 says
  "All data are stored on servers located in Germany" and the Matomo paragraph says "hosted on our own web server
  in Germany" (Matomo runs on the same VPS). Recommended edits:
  1. §11 and the Matomo paragraph: "Germany" → "the United Kingdom" (after the panel check). "No data are
     transferred to countries outside the European Economic Area or the United Kingdom" becomes "… except as
     described for embedded YouTube videos".
  2. Add the YouTube paragraph (drafted above) after the Cookies paragraph.
  3. Keep thumbnails from `img.youtube.com` (disclosed) rather than self-hosting: about a third of the embedded
     videos belong to other channels, and re-hosting their thumbnails would copy third-party images.
