/**
 * Videos page — ninth page to leave the legacy injected-HTML
 * pipeline. Content copied verbatim from `videos.html`.
 *
 * Structural notes specific to this page:
 *
 * - All 28 iframes carry `data-lazy-youtube-src` instead of `src`,
 *   matching what the catch-all's `prepareEnhancedVideoHtml`
 *   produced for this route. The existing `<EnhancedVideoController>`
 *   (rendered by the route file) reads that attribute after
 *   hydration to install a click-to-load thumbnail trigger; the
 *   real `src` is only assigned when the user clicks. The existing
 *   Playwright test "video embeds load YouTube only after activation"
 *   asserts this contract.
 *
 * - The publication-section-nav block lives OUTSIDE any
 *   content-section but inside <main>. Its buttons are wired by an
 *   inline body script (`document.querySelectorAll('.section-nav-button')`
 *   + scroll-to-target). That script is preserved verbatim through
 *   the standard `<LegacyScripts scripts={content.bodyScripts}>`
 *   path in the route file.
 *
 * - Legacy oddity preserved: the h4 for Buster Odeholm's conceptual
 *   interview (videos.html:668) has mismatched quote characters —
 *   `Odeholm on "Heaviness'` (opens with a double quote, closes
 *   with a single quote). Verified against the source file and
 *   reproduced verbatim. All other h4 elements use matched 'Heaviness'.
 */
type ConceptVideo = { embedId: string; iframeTitle: string; heading: string };
type MixingVideo = { embedId: string; iframeTitle: string; heading: string };
type BonusVideo = { embedId: string; iframeTitle: string; heading: string };
type UserVideo = { embedId: string; iframeTitle: string; heading: string; meta: string; start?: number };
// Bilibili items are linked, not embedded: the site's Content-Security-Policy
// allows frames and images from YouTube only, and a Bilibili player or thumbnail
// would need a CSP change plus the live all-route audit. A link card carries no
// external resource, so it is CSP-neutral.
type BilibiliVideo = { bvid: string; heading: string; meta: string; note: string };

const conceptVideos: ReadonlyArray<ConceptVideo> = [
  { embedId: "TkLQaOkAtlw", iframeTitle: "Jens Bogren on Heaviness", heading: "Jens Bogren on 'Heaviness'" },
  { embedId: "aLCDfx8vLZQ", iframeTitle: "Adam 'Nolly' Getgood on Heaviness", heading: "Adam \"Nolly\" Getgood on 'Heaviness'" },
  { embedId: "bfTYTU6w9DY", iframeTitle: "Fredrik Nordström on Heaviness", heading: "Fredrik Nordström on 'Heaviness'" },
  { embedId: "OOnlKxInoI4", iframeTitle: "Dave Otero on Heaviness", heading: "Dave Otero on 'Heaviness'" },
  { embedId: "oteN4__CT9g", iframeTitle: "Mike Exeter on Heaviness", heading: "Mike Exeter on 'Heaviness'" },
  { embedId: "F5U-jelDy2Q", iframeTitle: "Josh Middleton on Heaviness", heading: "Josh Middleton on 'Heaviness'" },
  // Legacy typo preserved: mismatched quote characters on Odeholm
  // (open double, close single). See file header comment.
  { embedId: "mGkjPOp8w-s", iframeTitle: "Buster Odeholm on Heaviness", heading: "Buster Odeholm on \"Heaviness'" },
  { embedId: "s51zs_ZVVoA", iframeTitle: "Andrew Scheps on Heaviness", heading: "Andrew Scheps on 'Heaviness'" }
];

const mixingVideos: ReadonlyArray<MixingVideo> = [
  { embedId: "ip2_rPxVf9s", iframeTitle: "Jens Bogren mixing In Solitude", heading: "Jens Bogren mixing 'In Solitude'" },
  { embedId: "Mv-4G_MvrwE", iframeTitle: "Adam 'Nolly' Getgood mixing In Solitude", heading: "Adam \"Nolly\" Getgood mixing 'In Solitude'" },
  { embedId: "8yh3Kdqkom0", iframeTitle: "Fredrik Nordström mixing In Solitude", heading: "Fredrik Nordström mixing 'In Solitude'" },
  { embedId: "4fdoxa9B3rk", iframeTitle: "Mike Exeter mixing In Solitude", heading: "Mike Exeter mixing 'In Solitude'" },
  { embedId: "e2mMG8m4oMw", iframeTitle: "Dave Otero mixing In Solitude", heading: "Dave Otero mixing 'In Solitude'" },
  { embedId: "SssI2McBMvk", iframeTitle: "Josh Middleton mixing In Solitude", heading: "Josh Middleton mixing 'In Solitude'" },
  { embedId: "wxZPn6FdNBU", iframeTitle: "Buster Odeholm mixing In Solitude", heading: "Buster Odeholm mixing 'In Solitude'" },
  { embedId: "1rjKIqBC7og", iframeTitle: "Andrew Scheps mixing In Solitude", heading: "Andrew Scheps mixing 'In Solitude'" }
];

const bonusVideos: ReadonlyArray<BonusVideo> = [
  { embedId: "AuNs1Ga5xgM", iframeTitle: "HiMMP team comparing the In Solitude mixes", heading: "HiMMP team comparing the 'In Solitude' mixes" },
  { embedId: "MzkIatgG7oQ", iframeTitle: "HiMMP team mixing In Solitude", heading: "HiMMP team mixing 'In Solitude'" }
];

export const userVideos: ReadonlyArray<UserVideo> = [
  { embedId: "U_TtJo2_bh8", iframeTitle: "8 Top Mix Engineers Mix The Same Track", heading: "8 Top Mix Engineers Mix The Same Track", meta: "Sound on Sound • 24 July 2024" },
  { embedId: "3u-NNeLa8lc", iframeTitle: "Mastering Engineer Reacts to 8 Pro Mixes of the Same Song", heading: "Mastering Engineer Reacts to 8 Pro Mixes of the Same Song", meta: "Production Advice • 19 September 2024" },
  { embedId: "OZloYQA56UQ", iframeTitle: "8 Famous Mix Engineers Mixed the Same Song - The Difference Is Shocking", heading: "8 Famous Mix Engineers Mixed the Same Song - The Difference Is Shocking", meta: "Beats and Meats • 9 July 2025" },
  { embedId: "DOgtV0Gn87A", iframeTitle: "믹싱의 기준 (Basis for Mixing)", heading: "믹싱의 기준 (Basis for Mixing)", meta: "미디생활 (Live of MIDI) • 2 March 2025" },
  // German-language video essay (~49 min) that features and endorses the
  // HiMMP website on screen ~27:00-31:40 and takes up HiMMP's multi-dimensional
  // conception of heaviness. `start: 1622` deep-links the embed to the HiMMP
  // segment (27:02). Transcript-verified; date corroborated (recorded Thu
  // 2 Apr 2026, Good Friday next day).
  { embedId: "Gl2qWQhHFEg", iframeTitle: "Bloodred — Perfektion ist der Feind guter Musik (features HiMMP)", heading: "Perfektion ist der Feind guter Musik", meta: "Bloodred • 2 April 2026 • German-language feature (HiMMP from 27:00)", start: 1622 },
  { embedId: "nxkTL94OXto", iframeTitle: "JackieW — Chinese-language reaction to the eight producer mixes (YouTube cross-post)", heading: "神仙打架！8位金属圈混音大咖各混同一首歌", meta: "JackieW • 1 March 2025 • Chinese-language reaction; YouTube cross-post of the Bilibili original listed below" }
];

// Independent practitioners who downloaded the open 'In Solitude'
// multitracks/DIs and published their own mixes/reamps. Distinct from the
// reaction videos above: this is reuse of the research data, not commentary
// on it. IDs + dates verified against YouTube API metadata (2026-06-01) in
// the impact case-study tracker; titles confirmed via YouTube oEmbed.
export const reuseVideos: ReadonlyArray<UserVideo> = [
  { embedId: "UaEQNxLrvko", iframeTitle: "Warlock Studios mix and master of In Solitude", heading: "In Solitude - Warlock Studios mix and master", meta: "Warlock Studios • 18 September 2025" },
  { embedId: "EotCnk5bAE8", iframeTitle: "Al R mix of In Solitude", heading: "In Solitude - Al R mix", meta: "Al R • 17 September 2025" },
  { embedId: "IFO698VENMk", iframeTitle: "Pradhe mix of In Solitude", heading: "In Solitude - Pradhe mix", meta: "Pradhe • 21 August 2025" },
  { embedId: "5QDnVNiI5nM", iframeTitle: "Pradhe short mix of In Solitude", heading: "In Solitude - Pradhe mix (short)", meta: "Pradhe • 17 August 2025" },
  { embedId: "IZDfsAneeHc", iframeTitle: "djabthrash reamping the In Solitude guitar DIs", heading: "Reamping the In Solitude guitar DIs", meta: "djabthrash • 26 August 2025" },
  { embedId: "fpvd9woR-oM", iframeTitle: "Marnetmar mix of In Solitude", heading: "In Solitude - Marnetmar mix", meta: "Marnetmar • 29 August 2026" }
];

// Chinese-language republication, translation, reaction and reuse on Bilibili.
// Found by native Bilibili search on 16 September 2026 and verified against
// yt-dlp metadata (ids, uploaders, upload dates) in the impact case-study
// tracker (metrics/track_bilibili.py). Dates are Bilibili upload dates.
const bilibiliVideos: ReadonlyArray<BilibiliVideo> = [
  { bvid: "BV14sdoYEEFi", heading: "（中字）什么才是“重”？Djent制作人“大光头”Adam Nolly GetGood如是说！", meta: "許柏林666 • 15 April 2025", note: "Chinese-subtitled translation of the Adam 'Nolly' Getgood interview on heaviness, crediting the project, the AHRC and the University of Huddersfield." },
  { bvid: "BV1UvXWYQE7F", heading: "（中字）最重型的制作人听过最重的专辑是？Buster Odeholm 接受英国 HiMMP 专访", meta: "許柏林666 • 22 March 2025", note: "Chinese-subtitled translation of the Buster Odeholm interview on heaviness, crediting the project and the AHRC grant." },
  { bvid: "BV1ujA1e6EAz", heading: "神仙打架！八位混音师各混同一首歌", meta: "JackieW钩钩 • 22 February 2025", note: "Chinese-language reaction to the eight producer mixes; the original of the YouTube cross-post listed above." },
  { bvid: "BV1ogaazmE5n", heading: 'Adam "Nolly" Getgood：混音《In Solitude》包含分轨地址', meta: "zzy071 • 5 September 2025", note: "Republication of the Adam 'Nolly' Getgood mixing session, pointing viewers to the open multitracks." },
  { bvid: "BV1XeW3zwEcD", heading: "Jens Bogren 混音《In Solitude》", meta: "zzy071 • 19 September 2025", note: "Republication of the Jens Bogren mixing session with a translated, chaptered description." },
  { bvid: "BV1GMY3zpEsR", heading: "【搬运/混音教程/Buster Odeholm】Buster Odeholm: Mixing 'In Solitude'", meta: "M1kageThordendal • 7 September 2025", note: "Republication of the Buster Odeholm mixing session with the original description, credits and source link." },
  { bvid: "BV1HrycBJEnx", heading: "瞎混 | HiMMP - In Solitude | Mixing Training", meta: "明年还是胖的像橘猫 • 20 November 2025", note: "A Chinese producer's own mix of the open 'In Solitude' multitracks, published as mixing practice." }
];

function LazyYouTubeIframe({ embedId, title, start }: { embedId: string; title: string; start?: number }) {
  // Optional `start` deep-links the embed to a timestamp (seconds). The
  // lazy controller assigns data-lazy-youtube-src as the real src on click,
  // so the ?start= query rides along and YouTube honours it.
  // Privacy-enhanced mode (youtube-nocookie.com); CSP frame-src allows only this origin.
  const lazySrc = start
    ? `https://www.youtube-nocookie.com/embed/${embedId}?start=${start}`
    : `https://www.youtube-nocookie.com/embed/${embedId}`;
  return (
    <iframe
      loading="lazy"
      data-lazy-youtube-src={lazySrc}
      title={title}
      frameBorder="0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
    ></iframe>
  );
}

export function VideosPage() {
  return (
    <main id="main-content">
      <section
        className="hero"
        style={{
          backgroundImage: "url('assets/images/background/HiMMP-bg-welcome.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          position: "relative"
        }}
      >
        <div className="hero-overlay"></div>
        <div className="container">
          <div className="hero-content">
            <h1 className="hero-title">Videos</h1>
            <p className="hero-text">
              Below are the videos (conceptual &amp; 'In Solitude' mix) that resulted from
              the HiMMP <a href="team.html">producer</a> interviews.
            </p>
            <div className="hero-buttons">
              <a href="https://www.youtube.com/@HiMMP-Research" target="_blank" className="resource-button">Visit YouTube Channel</a>
              <a href="audio.html" className="resource-button">Access Audio Section</a>
            </div>
          </div>
        </div>
      </section>

      <section className="content-section">
        <div className="container">
          <aside className="sidebar-box" aria-label="Key Findings Guide">
            <p><strong>Want a structured walkthrough?</strong> The <a href="findings.html">Key Findings Guide</a> organizes these insights chapter-by-chapter with timestamps and audio comparisons.</p>
          </aside>
        </div>
      </section>

      <div className="publication-section-nav">
        <div className="container">
          <h3>Navigate to Section</h3>
          <div className="section-nav-buttons">
            <button className="section-nav-button" data-target="concept-videos-section">Conceptual Interviews</button>
            <button className="section-nav-button" data-target="mixing-videos-section">Mixing Sessions</button>
            <button className="section-nav-button" data-target="bonus-videos-section">Bonus Content</button>
            <button className="section-nav-button" data-target="user-generated-videos-section">User-Generated</button>
            <button className="section-nav-button" data-target="practitioner-reuse-videos-section">Practitioner Reuse</button>
            <button className="section-nav-button" data-target="bilibili-videos-section">Bilibili (中文)</button>
          </div>
        </div>
      </div>

      <section className="content-section concept-videos-section" id="concept-videos-section">
        <div className="container">
          <h3>Conceptual Interviews about 'Heaviness'</h3>
          <div className="video-grid">
            {conceptVideos.map(({ embedId, iframeTitle, heading }) => (
              <div key={embedId} className="video-item">
                <div className="video-container">
                  <LazyYouTubeIframe embedId={embedId} title={iframeTitle} />
                </div>
                <h4>{heading}</h4>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="content-section mixing-videos-section" id="mixing-videos-section">
        <div className="container">
          <h3>Mixing 'In Solitude'</h3>
          <div className="video-grid">
            {mixingVideos.map(({ embedId, iframeTitle, heading }) => (
              <div key={embedId} className="video-item">
                <div className="video-container">
                  <LazyYouTubeIframe embedId={embedId} title={iframeTitle} />
                </div>
                <h4>{heading}</h4>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="content-section bonus-videos-section" id="bonus-videos-section">
        <div className="container">
          <h3>Bonus Content</h3>
          <div className="video-grid">
            {bonusVideos.map(({ embedId, iframeTitle, heading }) => (
              <div key={embedId} className="video-item">
                <div className="video-container">
                  <LazyYouTubeIframe embedId={embedId} title={iframeTitle} />
                </div>
                <h4>{heading}</h4>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="content-section user-generated-videos-section" id="user-generated-videos-section">
        <div className="container">
          <h3>User-Generated Content</h3>
          <p>Third-party videos, reactions, and features of the HiMMP research content:</p>
          <div className="video-grid">
            {userVideos.map(({ embedId, iframeTitle, heading, meta, start }) => (
              <div key={embedId} className="video-item">
                <div className="video-container">
                  <LazyYouTubeIframe embedId={embedId} title={iframeTitle} start={start} />
                </div>
                <h4>{heading}</h4>
                <p className="video-meta">{meta}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="content-section practitioner-reuse-videos-section" id="practitioner-reuse-videos-section">
        <div className="container">
          <h3>Practitioner Reuse</h3>
          <p>Independent producers and engineers who downloaded the open 'In Solitude' multitracks and shared their own mixes, masters, and reamps:</p>
          <div className="video-grid">
            {reuseVideos.map(({ embedId, iframeTitle, heading, meta }) => (
              <div key={embedId} className="video-item">
                <div className="video-container">
                  <LazyYouTubeIframe embedId={embedId} title={iframeTitle} />
                </div>
                <h4>{heading}</h4>
                <p className="video-meta">{meta}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="content-section bilibili-videos-section" id="bilibili-videos-section">
        <div className="container">
          <h3>Chinese-language Republication and Reuse (Bilibili)</h3>
          <p>Translations, reposts, reactions and practitioner reuse of the HiMMP material on Bilibili. These open on Bilibili; the project holds archived copies.</p>
          <div className="video-grid">
            {bilibiliVideos.map(({ bvid, heading, meta, note }) => (
              <div key={bvid} className="video-item">
                <h4>{heading}</h4>
                <p className="video-meta">{meta}</p>
                <p>{note}</p>
                <p>
                  <a className="resource-button" href={`https://www.bilibili.com/video/${bvid}/`} target="_blank" rel="noopener noreferrer">
                    Watch on Bilibili
                  </a>
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
