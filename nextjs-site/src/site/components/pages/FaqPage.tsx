/**
 * FAQ page — fifth page to leave the legacy injected-HTML pipeline.
 * Content copied verbatim from `faq.html`; `parity:text` byte-compares
 * visible `<main>` text against that legacy file.
 *
 * The legacy prose uses Unicode typographic characters directly (no
 * entities): non-breaking hyphens `‑` (U+2011) in compound terms like
 * "AHRC‑funded" and "Co‑Investigator"; en-dash `–` for date ranges;
 * em-dash `—` in editorial asides; curly quotes `“ ”` and `‘ ’`.
 * Preserve these as literal characters in JSX — they pass through
 * the build, and `parity:text` compares the post-decode strings so
 * both legacy and React renders match.
 *
 * 1 JSON-LD script in the legacy head (FAQ schema) — emitted via
 * the standard `LegacyScripts scripts={content.jsonLdScripts}`
 * pipeline in the route file, unchanged.
 */
export function FaqPage() {
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
            <h1 className="hero-title">Frequently Asked Questions</h1>
            <p className="hero-text">Quick answers about the project, dataset access, licensing, and citation.</p>
          </div>
        </div>
      </section>

      <section className="content-section">
        <div className="container">
          <h2>1. General Project Questions</h2>
          <p><strong>Q: What is the HiMMP project?</strong><br />
            The Heaviness in Metal Music Production (HiMMP) project is an AHRC‑funded academic study at the University of Huddersfield. It investigated metal's defining sonic quality—"heaviness"—through practice‑based and analytical research with world‑leading producers.</p>

          <p><strong>Q: What was the main goal of the research?</strong><br />
            The project set out to examine how “heaviness” is created, shaped, and understood in professional production. Using a controlled comparative design, it explored how top producers approach recording and mixing to achieve heaviness across subgenres.</p>

          <p><strong>Q: Is the HiMMP project still active?</strong><br />
            The research phase (2020–2024) is complete. This website is now a permanent public archive of the project’s data, findings, and resources.</p>

          <p><strong>Q: Who were the principal researchers?</strong><br />
            The project was led by Prof. Dr. Dr. Jan Herbst (Principal Investigator) and Dr. Mark Mynett (Co‑Investigator).</p>

          <h2>2. Research Findings</h2>
          <p><strong>Q: Where can I find a summary of the project’s key research findings?</strong><br />
            We have prepared a detailed, accessible summary of our main findings—including the “Spectrum of Production Ideologies” and the “meta‑instrument” concept—on our <a href="./findings.html">Key Findings page</a>. For the full, in‑depth academic papers and books, please see our <a href="./publications.html">Publications page</a>.</p>

          <h2>3. The 'In Solitude' Dataset & Resources</h2>
          <p><strong>Q: What is the 'In Solitude' song?</strong><br />
            'In Solitude' is a specially composed track designed for controlled comparison: one recording, multiple subgenre elements, and eight commissioned mixes. It allowed us to isolate producers' decisions and study how heaviness is created across styles.</p>

          <p><strong>Q: Which artists performed on the 'In Solitude' track?</strong><br />
            The track features Ralf Scheepers, Aaron Stainthorpe, Rich Shaw, Luke Appleton, Dan Mullins, and Mark Deeks.</p>

          <p><strong>Q: Which producers provided a mix for the project?</strong><br />
            The eight producers are Jens Bogren, Mike Exeter, Adam "Nolly" Getgood, Josh Middleton, Fredrik Nordström, Buster Odeholm, Dave Otero, and Andrew Scheps.</p>

          <p><strong>Q: How can I download the 'In Solitude' multitracks, mixes, and stems?</strong><br />
            The complete dataset, including all raw multitracks, producer mixes, and stems, is publicly archived at the University of Huddersfield's repository. You can access all files here: <a href="https://huddersfield.app.box.com/s/8gren2ma4kesvf5vwip2axzz1v8sawur" target="_blank" rel="noopener noreferrer">https://huddersfield.app.box.com/s/8gren2ma4kesvf5vwip2axzz1v8sawur</a>.</p>

          <p><strong>Q: Are the video interviews and producer sessions also available to download and use?</strong><br />
            Yes. The complete dataset, including the full video interviews, is available from the same repository link. The resources are shared under the same CC BY licence, meaning you are free to use clips in your own analysis, teaching, or reaction videos, provided you give appropriate credit to the HiMMP project.</p>

          <p><strong>Q: What are the copyright rules for using these files?</strong><br />
            The HiMMP dataset is shared under a Creative Commons Attribution (CC BY) licence. You may download, share, remix, adapt, and use the materials for any purpose, including commercially, provided you give appropriate credit to the HiMMP project and researchers.</p>

          <p><strong>Q: How should I cite the HiMMP project or dataset in my academic work?</strong><br />
            We recommend the following citation formats:<br />
            <em>For the dataset:</em> Herbst, Jan and Mark Mynett. (2024). <em>Heaviness in Metal Music Production (HiMMP) Project Dataset</em>. University of Huddersfield. URL: <a href="https://huddersfield.app.box.com/s/8gren2ma4kesvf5vwip2axzz1v8sawur" target="_blank" rel="noopener noreferrer">https://huddersfield.app.box.com/s/8gren2ma4kesvf5vwip2axzz1v8sawur</a><br />
            <em>For the main book:</em> Herbst, Jan and Mark Mynett. (2025). <em>Heaviness in Metal Music Production, Volume 1: How and Why It Works</em>. London: Routledge. DOI: <a href="https://doi.org/10.4324/9781003325727" target="_blank" rel="noopener noreferrer">https://doi.org/10.4324/9781003325727</a></p>

          <h2>4. Publications & Further Information</h2>
          <p><strong>Q: Where can I read the full, detailed research findings?</strong><br />
            All academic outputs are listed on our <a href="./publications.html">Publications page</a>. The primary findings are published in two open‑access books: <em>Heaviness in Metal Music Production, Volume 1: How and Why It Works</em>, and <em>Volume 2: Learn from the Masters</em>.</p>

          <p><strong>Q: Is there a non‑academic summary of the project?</strong><br />
            Yes. A practical, comparative overview of the eight producer mixes appeared in the September 2024 issue of <em>Sound on Sound</em>: “Masters of the Art of Mixing: 8 Producers – One Song – Infinite Insights”.</p>

          <p><strong>Q: How can I contact the researchers?</strong><br />
            For academic enquiries or questions about the research, please use the form on our <a href="./contact.html">Contact page</a>.</p>
        </div>
      </section>
    </main>
  );
}
