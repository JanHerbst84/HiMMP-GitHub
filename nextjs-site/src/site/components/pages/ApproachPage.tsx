/**
 * Approach page — second page to leave the legacy injected-HTML
 * pipeline and own its own JSX. Content copied verbatim from
 * `approach.html`; `parity:text` byte-compares visible `<main>` text
 * against that legacy file. Do not paraphrase, tighten, or "improve"
 * the prose, the typos, or the malformed legacy tag noted below.
 *
 * Class hooks (`.hero`, `.content-section`, `.video-feature`,
 * `.video-container`, `.timeline-section`, `.timeline-grid`,
 * `.timeline-item`, `.text-content`, `.video-fallback-note`,
 * `.highlight-text`) are preserved — both legacy
 * `/assets/css/main.css` and any future `[data-page="approach"]` rules
 * in `app/globals.css` may target them.
 *
 * Legacy oddities preserved on purpose:
 *
 * - The hero's first paragraph in `approach.html` contains a malformed
 *   tag `</Research>`: `<strong><span class="highlight-text">Research
 *   & impact statement</span></Research> //</strong>`. Browsers ignore
 *   unknown closing tags, so the visible rendering is
 *   "Research & impact statement //" with the first span highlighted.
 *   JSX cannot emit `</Research>` (it's not a valid element close), so
 *   we write the structurally equivalent valid JSX below — this
 *   preserves visible text, the strong wrapper, and the highlight on
 *   "Research & impact statement". `parity:text` passes (visible text
 *   after tag-stripping matches).
 *
 * - Performer name spelled "Aaron Stainsthorpe" in the body prose
 *   (line 394 of approach.html) vs "Aaron Stainthorpe" everywhere else
 *   (JSON-LD, About page references). The legacy typo is preserved —
 *   the content-preservation contract bans silent corrections.
 *
 * - The Box.com multitrack URL on this page is
 *   `https://huddersfield.box.com/...` (no `app.` subdomain), unlike
 *   the About page which uses `https://huddersfield.app.box.com/...`.
 *   Both are kept verbatim.
 */
export function ApproachPage() {
  return (
    <main id="main-content">
      <section
        className="hero"
        style={{
          backgroundImage: "url('assets/images/background/HiMMP-bg-approach.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          position: "relative"
        }}
      >
        <div className="hero-overlay"></div>
        <div className="container">
          <div className="hero-content">
            <h1 className="hero-title">Research Approach &amp; Methodology</h1>
            <p className="hero-text">
              <strong>
                <span className="highlight-text">Research &amp; impact statement</span> //
              </strong>{" "}
              HiMMP was centred on the{" "}
              <span className="highlight-text">song 'In Solitude'</span>
              , composed, recorded, mixed, and mastered by our{" "}
              <a href="team.html">research team</a>
              . Not only have we documented every step along the way of creating the song and made the media files publicly available, but we also took the recording (multitrack) to world-leading{" "}
              <a href="team.html">metal music producers</a> to mix and produce their own versions of the song.
            </p>
            <p className="hero-text">
              <span className="highlight-text">
                Video interviews with producers about heaviness and their mixing of 'In
                Solitude'
              </span>{" "}
              not only provide a wealth of data for researching heaviness but now serve as an invaluable educational resource for interested metal music producers
              and artists. Our comprehensive documentation and systematic analysis offer
              deep insights into the core quality of metal, with the potential to improve
              how practitioners understand and achieve heaviness.
            </p>
          </div>
        </div>
      </section>

      <section className="content-section video-feature">
        <div className="container">
          <p><b>Watch our interview with producer Andrew Scheps to get a better sense of our research approach.</b></p>
          <div className="video-container">
            <iframe
              loading="lazy"
              src="https://www.youtube.com/embed/s51zs_ZVVoA"
              title="Andrew Scheps Interview"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
          <p className="video-fallback-note" style={{ marginTop: "15px", textAlign: "center" }}>
          </p>
        </div>
      </section>

      <section className="content-section">
        <div className="container">
          <h3>Further outline of your approach and desired output (impact)</h3>
          <div className="text-content">
            <p>
              Our research centred around the song{" "}
              <a
                href="https://open.spotify.com/track/3qk8nfMpCTLHtGSew8oD7O?si=4c3dc468476a4426"
                target="_blank"
              >
                <u><b>'In Solitude'</b></u>
              </a>
              , which was arranged and recorded by
              the HiMMP team with the help of well-known artists in the metal scene: <b>Ralf Scheepers</b>
              {" "}(vocals; Primal Fear, Avantasia, Gamma Ray); <b>Aaron Stainsthorpe</b> (vocals; My Dying Bride);
              {" "}<b>Rich Shaw</b> (guitar; ex Cradle of Filth); <b>Luke Appleton</b> (bass; ex-Iced Earth, Blaze Bayley);
              {" "}<b>Dan Mullins</b> (drums; My Dying Bride); <b>Mark Deeks</b> (orchestration; Winterfylleth). The
              HiMMP researchers created their own production of the song as a version that can be
              compared with those of world-leading metal producers participating in the project.
            </p>
            <p>
              The{" "}
              <a
                href="https://huddersfield.box.com/s/8gren2ma4kesvf5vwip2axzz1v8sawur"
                target="_blank"
              >
                <u><b>multitrack</b></u>
              </a>
              {" "}provided various options (e.g., drum samples, clean and unedited tom
              tracks, various bass guitar layers, different guitar tones) to allow <a href="team.html">producers</a> to customise
              their mix. The professional <a href="team.html">producers</a> mix the song in their regular working environment,
              followed by a video interview about heaviness and their approach to producing 'In Solitude'.
              Each <a href="team.html">producer's</a> original mix, along with video documentation and interviews, forms a rich
              dataset for exploring the phenomenon of musical heaviness. This comprehensive material
              allows us to study how heaviness can be controlled and achieved in metal music
              production, examining the interplay between creative freedom, engineering and acoustic
              constraints, genre expectations, and trade-offs between attributes such as sonic weight vs
              clarity and separation vs cohesion.
            </p>
            <p>
              Our outcome was an empirically grounded framework of heaviness derived from industry
              practice. This framework is not only theoretically but also audio-visually comprehensible
              through our extensive audio and video documentation. Aspiring producers can apply this
              framework to their own tracks, or mix and learn from the publicly available multitrack of 'In
              Solitude'.
            </p>
          </div>
        </div>
      </section>

      <section className="content-section timeline-section">
        <div className="container">
          <h3>Research timeline</h3>
          <div className="timeline-grid">
            <div className="timeline-item">
              <h4>Phase 1 // Song creation (completed)</h4>
              <p>
                We wrote, arranged, recorded, and prepared 'In Solitude' for production, all
                with the help of known artists in the metal scene.
              </p>
            </div>
            <div className="timeline-item">
              <h4>Phase 2 // Producer sessions (completed)</h4>
              <p>
                We took 'In Solitude' to eight leading metal music
                producers and asked them to produce their own
                version of the multitrack and to give insights into
                their mixing approach and decision-making process,
                all documented on video.
              </p>
            </div>
            <div className="timeline-item">
              <h4>Phase 3 // Data analysis and dissemination (completed)</h4>
              <p>
                We analysed the video interviews and producer
                mixes, wrote our findings up for the academic
                readership, and summarised them for various interested
                parties (metal music producers/artists;
                educators).
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
