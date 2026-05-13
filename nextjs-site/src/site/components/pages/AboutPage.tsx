/**
 * About page — first page to leave the legacy injected-HTML pipeline and
 * own its own JSX. Content is copied verbatim from the legacy
 * `about.html` source; the `parity:text` and `parity:content` gates
 * compare the generated `<main>` against that legacy file and will fail
 * on any added/removed/changed character. Do not paraphrase, tighten,
 * or "improve" the prose — this is a load-bearing constraint.
 *
 * Class names (`.hero`, `.content-section`, `.aims-grid`, `.aim-item`,
 * `.collaboration-note`, `.text-content`, `.hero-overlay`, etc.) are
 * preserved because both legacy `/assets/css/main.css` and the new
 * token-driven `[data-page="about"]` rules in `app/globals.css` target
 * them. The inline `style` on `<section class="hero">` retains the
 * `HiMMP-bg-about.jpg` substring so the visual-parity hero mask still
 * matches (other pages still use the mask).
 */
export function AboutPage() {
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
            <h1 className="hero-title">About HiMMP</h1>
            <p className="hero-text">
              Despite the rich history and cultural impact of metal music, there is
              surprisingly little understanding of what exactly makes it sound so 'heavy'.
              Our research addressed this gap by{" "}
              <span className="highlight-text">
                examining how 'heaviness' is created and
                captured in the recording and mixing process.
              </span>{" "}
              The project was designed to make a
              significant global impact on our understanding of this defining characteristic
              of metal music.
            </p>
          </div>
        </div>
      </section>

      <section className="content-section">
        <div className="container">
          <h3>Project / Research Overview</h3>
          <div className="text-content">
            <p>
              Previously, there was a lack of music production knowledge and
              educational material that would enable those interested in understanding
              how top producers capture, manipulate, and present the various qualities
              that constitute heaviness.
            </p>
            <p>
              To learn how internationally known <a href="team.html">producers</a> create heaviness in
              different metal subgenres, we documented their mixing for a single
              song,{" "}
              <a
                href="https://open.spotify.com/track/3qk8nfMpCTLHtGSew8oD7O?si=4c3dc468476a4426"
                target="_blank"
              >
                <u><b>'In Solitude'</b></u>
              </a>
              , which incorporates elements from doom metal,
              symphonic metal, thrash metal, and modern extreme metal. By
              alternating between these subgenres, we encouraged the <a href="team.html">producers</a>
              {" "}to respond to the changing styles in a way that is easy to observe. Each
              step in the <a href="team.html">producers'</a> process is documented through screen-captures,
              in-depth video interviews explaining their decision-making, and the final
              audio mix along with individual instrument and vocal stems.
            </p>
            <p>
              All song materials – the multitrack, drum samples taken from the kit, DI
              tracks for guitar and bass, the mix project files, the edited videos of the
              producers' sessions and interviews, and all audio bounces and stems –
              are available on this website (
              <a
                href="https://huddersfield.app.box.com/s/8gren2ma4kesvf5vwip2axzz1v8sawur"
                target="_blank"
                rel="noopener noreferrer"
              >
                <u><b>access the data here</b></u>
              </a>
              ). These resources
              provide a window into the sophisticated decision-making processes and
              techniques employed by top metal producers.
            </p>
            <p>
              The research findings are available in multiple formats: an{" "}
              <a href="findings.html"><strong>interactive online guide</strong></a> with practical explanations and audio examples, comprehensive analysis in open-access <a href="publications.html">academic journals</a>, and the complete findings compiled into books published by Routledge.
            </p>
            <p>
              HiMMP is based within the School of Arts and Humanities (AH) and
              Computing and Engineering (C&amp;E) at the University of Huddersfield. This
              project received funding from the Arts and Humanities Research Council
              (AHRC) under the reference number{" "}
              <a
                href="https://gtr.ukri.org/projects?ref=AH%2FT010991%2F1"
                target="_blank"
              >
                <u><b>AH/T010991/1</b></u>
              </a>
              {" "}(runtime: 1
              September 2020 to 31 August 2024).
              <br /><br />
              <img
                src="assets/images/logos/AHRC-Logo-colour.png"
                alt="Arts and Humanities Research Council Logo"
                className="funder-logo"
                style={{ maxWidth: "300px", height: "auto", marginTop: "10px" }}
                loading="lazy"
                decoding="async"
              />
            </p>
          </div>
        </div>
      </section>

      <section className="content-section project-aims">
        <div className="container">
          <h3>HiMMP Project Aims</h3>
          <div className="aims-grid">
            <div className="aim-item">
              <h4>1 // To determine compositional, performative and productional attributes of heaviness in metal music.</h4>
              <p>
                Heaviness in recorded metal music has largely gone unexplored in academic
                research. This project explored the relationship between musical
                structure, performance, and <a href="approach.html">production</a> to uncover the secrets behind producing
                heaviness in recorded metal music.
              </p>
            </div>
            <div className="aim-item">
              <h4>2 // To map the conceptual understanding of heaviness held by leading metal music producers.</h4>
              <p>
                <a href="team.html">Metal music producers</a> play a key role in shaping the sound of the genre and setting
                industry standards. By capturing their individual perspectives on heaviness and
                their <a href="approach.html">production approaches</a>, we added a valuable practitioner's voice to
                the scholarly discussion around metal music.
              </p>
            </div>
            <div className="aim-item">
              <h4>3 // To determine variations in the production approaches to heaviness in different subgenres of metal.</h4>
              <p>
                Heaviness in metal music is a complex blend of factors, including structural
                features, performance attributes, recording techniques, and mixing
                approaches, all of which vary across metal subgenres for both aesthetic and technical
                reasons. These stylistic differences demand distinct approaches to producing
                heaviness. By documenting the mixing processes of different producers, we gained
                valuable insights into their individual approaches and identified both
                commonalities and differences.
              </p>
            </div>
            <div className="aim-item">
              <h4>4 // To determine the relationships of technical requirements, creative freedom and individuality.</h4>
              <p>
                The production of metal music is a delicate balancing act between artistic expression
                and technical/acoustic limitations. The genre's rich instrumentation, spectral
                density, and fast tempos require meticulous sonic control. By collaborating
                with producers who specialise in different subgenres of metal, we were able to analyse
                the interplay between creative choices and technical constraints in
                shaping heaviness in recorded music. Such knowledge can only be gained from
                experienced practitioners.
              </p>
            </div>
            <div className="aim-item">
              <h4>5 // To map the process and the result of producers mixing a metal track, aiming for maximum heaviness within the expectations of the (sub)genre.</h4>
              <p>
                The research offered a behind-the-scenes look at how leading <a href="team.html">producers</a> approach
                mixing metal tracks. These insights provide a helpful resource for aspiring music
                producers and practice-led researchers, while also shedding light on the empirical
                basis of heaviness in metal music. By analysing the <a href="team.html">producers'</a> mixes, we gained
                audible demonstrations of their individual <a href="approach.html">approaches</a> and showcased the range of
                possibilities – or lack thereof – for achieving heaviness. This comprehensive
                understanding of the entire metal <a href="approach.html">production process</a> is essential for building
                a robust theory of 'heaviness'.
              </p>
            </div>
          </div>

          <div className="collaboration-note">
            <p>
              HiMMP is also interested in exploring ways of increasing our impact through
              outreach and collaboration. So, if you would like to find out more about how
              HiMMP could work with you or your institution, please{" "}
              <a href="contact.html"><u><b>get in touch</b></u></a>
              .
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
