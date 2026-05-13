/**
 * Videos page — ninth page to leave the legacy injected-HTML
 * pipeline. Content copied verbatim from `videos.html`.
 *
 * Structural notes specific to this page:
 *
 * - All 22 iframes carry `data-lazy-youtube-src` instead of `src`,
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
type UserVideo = { embedId: string; iframeTitle: string; heading: string; meta: string };

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

const userVideos: ReadonlyArray<UserVideo> = [
  { embedId: "U_TtJo2_bh8", iframeTitle: "8 Top Mix Engineers Mix The Same Track", heading: "8 Top Mix Engineers Mix The Same Track", meta: "Sound on Sound • 24 July 2024" },
  { embedId: "3u-NNeLa8lc", iframeTitle: "Mastering Engineer Reacts to 8 Pro Mixes of the Same Song", heading: "Mastering Engineer Reacts to 8 Pro Mixes of the Same Song", meta: "Production Advice • 19 September 2024" },
  { embedId: "OZloYQA56UQ", iframeTitle: "8 Famous Mix Engineers Mixed the Same Song - The Difference Is Shocking", heading: "8 Famous Mix Engineers Mixed the Same Song - The Difference Is Shocking", meta: "Beats and Meats • 9 July 2025" },
  { embedId: "DOgtV0Gn87A", iframeTitle: "믹싱의 기준 (Basis for Mixing)", heading: "믹싱의 기준 (Basis for Mixing)", meta: "미디생활 (Live of MIDI) • 2 March 2025" }
];

function LazyYouTubeIframe({ embedId, title }: { embedId: string; title: string }) {
  return (
    <iframe
      loading="lazy"
      data-lazy-youtube-src={`https://www.youtube.com/embed/${embedId}`}
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
          <p>Third-party videos and reactions featuring the HiMMP research content:</p>
          <div className="video-grid">
            {userVideos.map(({ embedId, iframeTitle, heading, meta }) => (
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
    </main>
  );
}
