/**
 * Home page body sections (everything after the hero) —
 * auto-generated from `index.html`'s `<main>` via
 * `scripts/port-home.mjs`. The hero itself is rendered by the
 * dedicated `<HomeHero>` component so it can own its own JSX
 * markup (per `docs/nextjs-phase-2-design-refresh-future.md`
 * § D-2 "proper"). All class names and inline styles are
 * preserved; the JSON-LD `SpeakableSpecification` selectors
 * `.hero-title` / `.hero-text` (referenced by the legacy
 * index.html JSON-LD) live on HomeHero, not here.
 *
 * Mechanical swaps applied: `class=` -> `className=`,
 * `<br>`/`<hr>`/`<input>`/`<img>`/`<source>` -> JSX void
 * self-close, `srcset=` -> `srcSet=`, `frameborder=` ->
 * `frameBorder=`, `allowfullscreen` -> `allowFullScreen`,
 * inline `style="kebab: val"` -> JSX style object literal.
 */
export function HomeMain() {
  return (
    <>
<section className="content-section" style={{ backgroundColor: "#f8f9fa", padding: "50px 0", borderTop: "1px solid #eee", borderBottom: "1px solid #eee" }}>
            <div className="container">
                <h2 style={{ textAlign: "center", fontSize: "2rem", marginBottom: "40px", color: "#333", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "1px" }}>Project Archive &amp; Key Outputs</h2>
                <div className="section-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "30px" }}>
                    
                    <div className="output-card" style={{ backgroundColor: "#fff", padding: "30px", borderRadius: "8px", textAlign: "center", boxShadow: "0 4px 15px rgba(0,0,0,0.07)", transition: "all 0.3s ease" }}>
                        <h3 style={{ marginTop: "0" }}>The Complete Dataset</h3>
                        <p>Access the full multitrack of 'In Solitude', all producer mixes, stems, and video interviews.</p>
                        <a href="https://huddersfield.app.box.com/s/8gren2ma4kesvf5vwip2axzz1v8sawur" target="_blank" rel="noopener noreferrer" className="read-more" style={{ fontSize: "1.1em" }}>+ ACCESS DATA</a>
                    </div>
                    
                    <div className="output-card" style={{ backgroundColor: "#fff", padding: "30px", borderRadius: "8px", textAlign: "center", boxShadow: "0 4px 15px rgba(0,0,0,0.07)", transition: "all 0.3s ease" }}>
                        <h3 style={{ marginTop: "0" }}>Project Publications</h3>
                        <p>Explore academic articles, book chapters, and other scholarly resources from the project.</p>
                        <a href="publications.html" className="read-more" style={{ fontSize: "1.1em" }}>+ VIEW PUBLICATIONS</a>
                    </div>
                    
                    <div className="output-card" style={{ backgroundColor: "#fff", padding: "30px", borderRadius: "8px", textAlign: "center", boxShadow: "0 4px 15px rgba(0,0,0,0.07)", transition: "all 0.3s ease" }}>
                        <h3 style={{ marginTop: "0" }}>Producer Videos &amp; Mixes</h3>
                        <p>Watch in-depth interviews and compare the final audio mixes from our producers.</p>
                        <a href="videos.html" className="read-more" style={{ fontSize: "1.1em" }}>+ WATCH &amp; LISTEN</a>
                    </div>

                    <div className="output-card" style={{ backgroundColor: "#fff", padding: "30px", borderRadius: "8px", textAlign: "center", boxShadow: "0 4px 15px rgba(0,0,0,0.07)", transition: "all 0.3s ease" }}>
                        <h3 style={{ marginTop: "0" }}>Key Findings: Producer's Guide</h3>
                        <p>An interactive HTML eBook breaking down our research with practical examples and audio.</p>
                        <a href="findings.html" className="read-more" style={{ fontSize: "1.1em" }}>+ READ GUIDE</a>
                    </div>

                </div>
            </div>
        </section>

        <section className="video-feature">
            <div className="container">
                <div className="video-container">
                    <iframe loading="lazy" src="https://www.youtube.com/embed/OU1PoktmPmc" title="HiMMP - In Solitude" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>
                </div>
            </div>
        </section>

        <section className="content-section">
            <div className="container">
                <div style={{ backgroundImage: "linear-gradient(to right, #e9f8f5, #f8f9fa)", borderLeft: "5px solid #5DC69F", padding: "25px", margin: "40px auto", textAlign: "center", borderRadius: "8px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)", maxWidth: "800px" }}>
                    <h3 style={{ marginTop: "0", color: "#333", fontSize: "1.5em" }}>Project Completed</h3>
                    <p style={{ fontSize: "1.2em", marginBottom: "0" }}>
                        The HiMMP research project has now concluded. Several outputs are still forthcoming and will be made available on this website as they are finalized. This website will be regularly updated and remain online as a resource for metal music (production) scholars, producers, artists, and anybody else who may be interested in the topic of heaviness in metal music production.
                    </p>
                </div>
            </div>
        </section>

        <section className="content-section about-section">
            <div className="container">
                <div className="section-grid">
                    <div className="section-content">
                        <h3>About HiMMP</h3>
                        <p>
                            Ever since Black Sabbath released their self-titled debut album in
                            1970, metal music has been on a quest for greater heaviness. This
                            pursuit has led to increasingly extreme performances and
                            specialised recording techniques. But it is not just about pushing the
                            limits of human performance; advancements in music production, such as layering guitar
                            sounds, enhancing drums, and digital editing, have played a
                            crucial role in creating hyperreal performances and powerful,
                            'heavy' sounds. Our aim was to gain a better understanding of what
                            defines 'heaviness', exploring how it is captured and conveyed in the{" "}
                            <a href="approach.html">production process</a>.
                        </p>
                        <a href="about.html" className="read-more">+ MORE</a>
                    </div>
                    <div className="section-content">
                        <h3>Our Approach</h3>
                        <p>
                            Heaviness in metal music results from a complex interplay of genre,
                            composition, performance, and mixing techniques. We explored this
                            intricate relationship to understand how these elements shape the{" "}
                            <a href="team.html">producer's</a> personal style, aesthetic vision, and adherence to
                            genre conventions. By collaborating with eight <a href="team.html">producers</a>
                            {" "}on a single song, 'In Solitude', we studied the diverse <a href="approach.html">approaches</a> to
                            mixing the track and creating heaviness.
                        </p>
                        <a href="approach.html" className="read-more">+ MORE</a>
                    </div>
                </div>
            </div>
        </section>

        <section className="content-section" style={{ background: "linear-gradient(135deg, #5DC69F 0%, #4BA87E 100%)", padding: "40px 0" }}>
            <div className="container" style={{ textAlign: "center", color: "white" }}>
                <h2 style={{ color: "white" }}>New: Interactive Findings Guide</h2>
                <p style={{ fontSize: "1.2em", maxWidth: "700px", margin: "0 auto 20px" }}>
                    Want a practical, accessible companion to the academic books? Our HTML-based guide translates the research into actionable insights with embedded audio examples.
                </p>
                <a href="findings.html" className="read-more" style={{ background: "white", color: "#333", padding: "12px 30px", fontSize: "1.1em" }}>Explore the Guide &rarr;</a>
            </div>
        </section>

        <section className="content-section books-section" style={{ paddingTop: "0" }}>
            <div className="container">
                <h3 style={{ textAlign: "center", marginBottom: "40px" }}>Books</h3>
                <div className="section-grid" style={{ gridTemplateColumns: "1fr 1fr", gap: "40px", alignItems: "start" }}>
                    <div className="book-item" style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
                        <picture>
                            <source srcSet="assets/images/cover/himmp1.webp" type="image/webp" />
                            <img src="assets/images/cover/himmp1.jpg" alt="Heaviness in Metal Music Production, Volume 1" style={{ width: "100%", maxWidth: "300px", border: "1px solid #ddd", marginBottom: "15px" }} loading="lazy" />
                        </picture>
                        <h4 style={{ marginBottom: "5px" }}>Volume 1: How and Why It Works</h4>
                        <a href="https://doi.org/10.4324/9781003325727" target="_blank" rel="noopener noreferrer" className="read-more" style={{ fontSize: "1em", marginTop: "10px" }}>+ OPEN ACCESS</a>
                    </div>
                    <div className="book-item" style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
                        <img src="assets/images/cover/himmp2.jpg" alt="Heaviness in Metal Music Production, Volume 2" style={{ width: "100%", maxWidth: "300px", border: "1px solid #ddd", marginBottom: "15px" }} loading="lazy" />
                        <h4 style={{ marginBottom: "5px" }}>Volume 2: Learn from the Masters</h4>
                        <a href="https://doi.org/10.4324/9781003564089" target="_blank" rel="noopener noreferrer" className="read-more" style={{ fontSize: "1em", marginTop: "10px" }}>+ OPEN ACCESS</a>
                    </div>
                </div>
                <div style={{ textAlign: "center", marginTop: "40px" }}>
                    <a href="publications.html" className="read-more" style={{ fontSize: "1.2em" }}>+ VIEW ALL PUBLICATIONS</a>
                </div>
            </div>
        </section>

        <section className="content-section team-section">
            <div className="container">
                <div className="section-grid">
                    <div className="section-content">
                        <h3>Access the Dataset</h3>
                        <p>
                            The dataset comprises the raw multi-track recording for own
                            mixing experiments, the mixes and mixing stems of the producers, the
                            video interviews, and many other things.
                        </p>
                        <a href="https://huddersfield.app.box.com/s/8gren2ma4kesvf5vwip2axzz1v8sawur" target="_blank" rel="noopener noreferrer" className="read-more">+ MORE</a>
                    </div>
                    <div className="section-content">
                        <h3>The Researchers</h3>
                        <p>
                            Our <a href="team.html">research team</a> comprises two experts in popular music and
                            music technology, both with extensive experience in
                            performing, producing, and studying music and audio
                            engineering. They are joined by an international advisory board of
                            music and music production specialists from Australia to
                            Germany. More importantly, the project relied on the collaboration
                            of eight world-renowned <a href="team.html">metal music producers</a>, whose
                            involvement is key to broadening our understanding of 'heaviness'.
                        </p>
                        <a href="team.html" className="read-more">+ MORE</a>
                    </div>
                </div>
            </div>
        </section>
    </>
  );
}
