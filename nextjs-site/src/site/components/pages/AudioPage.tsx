import { AudioComparison } from "@/src/site/components/AudioComparison";

/**
 * Audio page — eighth page to leave the legacy injected-HTML
 * pipeline. Content copied verbatim from `audio.html`; `parity:text`
 * byte-compares visible main text against that legacy file.
 *
 * Two structural notes specific to this page:
 *
 * - The interactive mix-comparison section is replaced by the
 *   existing `<AudioComparison>` React component (shipped in commit
 *   6b04b30 / "D-3"). The legacy `<section id="mix-comparison-tool">`
 *   block is therefore not emitted from this component; the route
 *   file (`app/audio/page.tsx`) wraps it and also filters the legacy
 *   `audio-player.js` body script + the inline `comparison-player`
 *   wiring script out of the rendered body scripts so they cannot
 *   double-bind on top of the React component.
 *
 * - The legacy `audio.html` has the closing `</main>` tag at line 613
 *   followed by two more `<section class="content-section
 *   producer-mixes-section">` blocks (Dave Otero, Andrew Scheps)
 *   outside the `<main>` element. The catch-all extraction logic
 *   already extends the legacy "main" through to the footer to
 *   capture these strays. This component places all 8 producer mix
 *   sections inside the React `<main>` so the structure is now
 *   semantically correct — `parity:text` extracts both legacy and
 *   generated main with the same heuristics so the visible text
 *   matches either way.
 */
const producerMixes: ReadonlyArray<{ name: string; file: string }> = [
  { name: "Jens Bogren", file: "Bogren.mp3" },
  { name: "Mike Exeter", file: "Exeter.mp3" },
  { name: "Adam 'Nolly' Getgood", file: "Getgood.mp3" },
  { name: "Josh Middleton", file: "Middleton.mp3" },
  { name: "Fredrik Nordström", file: "Nordstrom.mp3" },
  { name: "Buster Odeholm", file: "Odeholm.mp3" },
  { name: "Dave Otero", file: "Otero.mp3" },
  { name: "Andrew Scheps", file: "Scheps.mp3" }
];

const DOWNLOAD_HREF = "https://huddersfield.app.box.com/s/8gren2ma4kesvf5vwip2axzz1v8sawur/folder/171312398857";

export function AudioPage() {
  return (
    <main id="main-content">
      <section
        className="hero"
        style={{
          backgroundImage: "url('assets/images/background/HiMMP-bg-about.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          position: "relative"
        }}
      >
        <div className="hero-overlay"></div>
        <div className="container">
          <div className="hero-content">
            <h1 className="hero-title">HiMMP Downloads &amp; Resources</h1>
            <p className="hero-text">
              <a href="https://huddersfield.app.box.com/s/8gren2ma4kesvf5vwip2axzz1v8sawur" target="_blank" className="resource-button">Access all resources HERE</a>
            </p>
            <p className="hero-text" style={{ marginTop: "10px", fontSize: "0.95em" }}>
              Licensing and citation guidance: see our <a href="faq.html">FAQ</a>.
            </p>
            <p className="hero-text">
              Below are the audio resources and audio stems for each <a href="team.html">producer</a>, including their final mix for review.
            </p>
            <p className="hero-text">
              In contrast to the original mix masters, which have differing program loudness, the
              Loudness-Matched versions have the same program loudness (LUFS), meaning that
              comparisons will not be impacted by the 'louder-perceived-better' principle.
            </p>
          </div>
        </div>
      </section>

      <section className="content-section">
        <div className="container">
          <aside className="sidebar-box" aria-label="Listening with Context">
            <strong>Listening with Context</strong>
            <p>These mixes demonstrate the principles explored in our research. For detailed explanations of <em>what</em> you're hearing and <em>why</em> producers made specific choices, check out our <a href="findings.html"><strong>Key Findings Guide</strong></a> — it walks through each concept with linked audio examples.</p>
          </aside>
        </div>
      </section>

      <section className="content-section video-comparison-section">
        <div className="container">
          <h3>Video Comparison of Producer Mixes</h3>
          <div className="video-container">
            <iframe
              src="https://www.youtube.com/embed/AuNs1Ga5xgM"
              title="8 Top Mix Engineers Mix The Same Track"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
        </div>
      </section>

      <AudioComparison />

      <section className="content-section mix-comparison-section">
        <div className="container">
          <h3>HiMMP / Team Mix</h3>
          <div className="mix-comparison-player">
            <audio id="mix-player" controls>
              <source src="assets/audio/HiMMP.mp3" type="audio/mpeg" />
              Your browser does not support the audio element.
            </audio>
            <div className="download-link-container">
              <a href={DOWNLOAD_HREF} className="download-link">Download the hi-res audio and stem files here</a>
            </div>
          </div>
        </div>
      </section>

      {producerMixes.map(({ name, file }) => (
        <section key={file} className="content-section producer-mixes-section">
          <div className="container">
            <h3>{name}</h3>
            <div className="mix-player">
              <audio controls>
                <source src={`assets/audio/${file}`} type="audio/mpeg" />
                Your browser does not support the audio element.
              </audio>
            </div>
            <div className="download-link-container">
              <a href={DOWNLOAD_HREF} className="download-link">Download the hi-res audio and stem files here</a>
            </div>
          </div>
        </section>
      ))}
    </main>
  );
}
