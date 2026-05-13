/**
 * Acknowledgements page — fourth page to leave the legacy injected-HTML
 * pipeline. Content copied verbatim from `acknowledgements.html`;
 * `parity:text` byte-compares visible `<main>` text against that
 * legacy file.
 *
 * The legacy file is the smallest page in the site (89 lines, 2
 * paragraphs in main + a back-to-findings link). No JSON-LD, no
 * inline styles, no DOM-binding controllers.
 *
 * The hero uses the welcome-page background image; the existing
 * `[data-page="acknowledgements"]` rules in `globals.css` apply.
 */
export function AcknowledgementsPage() {
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
            <h1 className="hero-title">Acknowledgements</h1>
            <p className="hero-text">Funding and editorial transparency for the HiMMP project.</p>
          </div>
        </div>
      </section>
      <section className="content-section">
        <div className="container">
          <h2>This guide was supported by the following:</h2>

          <p>The research for this text was made possible by the generous support of the Arts and Humanities Research Council (AHRC) in the United Kingdom, funded under grant number AH/T010991/1. We would also like to express our gratitude to the University of Huddersfield, particularly the School of Arts and Humanities (SAH) and the School of Computing and Engineering (SCE), for their continued support.</p>

          <p>We acknowledge the use of AI-assisted tools, specifically Grammarly Pro, EditGPT Pro, and Google Gemini Advanced (2.5 Pro), for copyediting tasks to refine prose for grammar, clarity, and conciseness, as well as for feedback on suggestions regarding argumentative structure. Following ethical guidelines for AI use in academic writing and in line with journal policies, all substantive intellectual work, including critical engagement with academic sources and data, data analysis and interpretation, and theoretical development, was independently undertaken by the authors. Analytical interpretations, editorial decisions, and ultimate responsibility for the text remain entirely our own.</p>

          <p><a className="read-more" href="findings.html">Back to Findings →</a></p>
        </div>
      </section>
    </main>
  );
}
