/**
 * Publications page — tenth page to leave the legacy injected-HTML
 * pipeline. This is by far the largest port (2400 legacy lines,
 * 600+ lines of <main> content with 4 accordion-wrapped sections,
 * dozens of citation entries, a publication-section-nav header).
 * Hand transcription was rejected as too error-prone.
 *
 * The body content was produced from a one-shot mechanical
 * conversion at `scripts/port-publications.mjs` — same approach
 * proven safe on the privacy port. The script applies five regex
 * swaps (`class=` -> `className=`, `for=` -> `htmlFor=`,
 * `<br>` -> `<br />`, `<hr>` -> `<hr />`, `<input ...>` ->
 * `<input ... />`); the hero <section> is written manually with a
 * JSX style prop. The page has 0 inputs in main but the void-element
 * self-close rules are kept for symmetry with sibling port scripts.
 *
 * Body scripts preserved:
 *
 * - section-nav-button scrolling (5 buttons + scroll-to-target +
 *   active-section-highlight) — same pattern as the videos page.
 * - accordion toggle behaviour for the 4 `<button class="accordion">`
 *   sections.
 * - publication-section-nav highlight on scroll.
 *
 * All three scripts come through the standard
 * <LegacyScripts scripts={content.bodyScripts}> path in the route
 * file. They only ADD event listeners; they do not write to React-
 * managed DOM, so no hydration race is expected.
 *
 * `parity:text` byte-compares visible <main> text against the
 * legacy file and confirms zero content drift — this is the
 * primary safety net for a port of this size.
 */
export function PublicationsPage() {
  return (
    <main id="main-content">
      <section
        className="hero"
        style={{
          backgroundImage: "url('assets/images/background/HiMMP-bg-publications.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          position: "relative"
        }}
      >
        <div className="hero-overlay"></div>
        <div className="container">
          <div className="hero-content">
            <h1 className="hero-title">Publications, Articles &amp; Resources</h1>
            <p className="hero-text">
              Below you will find an extensive list of project outputs alongside previously
              published works and articles from the lead HiMMP researchers. For academic inquiries about a specific publication, please <a href="contact.html" style={{ color: "white", textDecoration: "underline" }}><b>get in touch</b></a>.
            </p>
          </div>
        </div>
      </section>
<div className="publication-section-nav">
            <div className="container">
                <h3>Navigate to Section</h3>
                <div className="section-nav-buttons">
                    <button className="section-nav-button" data-target="himmp-outputs">HiMMP Project Outputs</button>
                    <button className="section-nav-button" data-target="herbst-publications">Jan Herbst Publications</button>
                    <button className="section-nav-button" data-target="mynett-publications">Mark Mynett Publications</button>
                    <button className="section-nav-button" data-target="other-research">Additional Research</button>
                    <button className="section-nav-button" data-target="professional-resources">Professional Resources</button>
                </div>
            </div>
        </div>

        <section className="content-section publications-section" id="himmp-outputs">
            <div className="container">
                <h3>HiMMP Project Outputs</h3>
                <p><em>Although the research and data collection for the HiMMP project were completed in 2024, several academic publications arising from the research are still in the process of being published. This section will be updated as they become available.</em></p>

                <div style={{ backgroundColor: "#f0f8f5", borderLeft: "5px solid #5DC69F", padding: "30px", margin: "30px 0", borderRadius: "4px" }}>
                    <h3 style={{ marginTop: "0" }}>📖 Practical Findings Guide</h3>
                    <p>Looking for a more accessible entry point? Our <strong>HTML-based eBook</strong> presents the research findings in a practical, producer-friendly format with direct links to audio examples throughout.</p>
                    <a href="findings.html" className="read-more">Read the Interactive Guide &rarr;</a>
                    <p style={{ marginTop: "15px", fontSize: "0.95em", color: "#666" }}>For scholarly citations and in-depth analysis, see the academic publications below.</p>
                </div>

                <h4 className="section-heading">Audio and Video</h4>
                <div className="publication-grid">
                    <div className="publication-card">
                        <div className="publication-type">Media</div>
                        <div className="publication-content">
                            <div className="publication-title">HiMMP version of 'In Solitude' on Spotify</div>
                            <div className="publication-meta">Music recording (2023)</div>
                            <div className="publication-links">
                                <a href="https://open.spotify.com/track/3qk8nfMpCTLHtGSew8oD7O?si=33ea874c740f4a6d&nd=1&dlsi=a9255e2c17b74579" className="publication-link" target="_blank" rel="noopener noreferrer">Listen</a>
                            </div>
                        </div>
                    </div>
                    
                    <div className="publication-card">
                        <div className="publication-type">Media</div>
                        <div className="publication-content">
                            <div className="publication-title">HiMMP YouTube video channel</div>
                            <div className="publication-meta">Video collection (2023-2025)</div>
                            <div className="publication-links">
                                <a href="https://www.youtube.com/@HiMMP-Research" className="publication-link" target="_blank" rel="noopener noreferrer">Watch</a>
                            </div>
                        </div>
                    </div>
                    
                    <div className="publication-card">
                        <div className="publication-type">Dataset</div>
                        <div className="publication-content">
                            <div className="publication-title">Complete HiMMP Research Dataset</div>
                            <div className="publication-meta">Including multitrack of 'In Solitude', producers' mixes, and video interviews</div>
                            <div className="publication-links">
                                <a href="https://huddersfield.app.box.com/s/8gren2ma4kesvf5vwip2axzz1v8sawur" className="publication-link" target="_blank" rel="noopener noreferrer">Access</a>
                            </div>
                        </div>
                    </div>
                </div>
                
                <h4 className="section-heading">Books</h4>
                <div className="publication-grid">
                    <div className="publication-card">
                        <div className="publication-type">Book</div>
                        <div className="publication-content">
                            <div className="publication-year">2025</div>
                            <div className="publication-title">Heaviness in Metal Music Production, Volume 1: How and Why It Works</div>
                            <div className="publication-authors">
                                <span className="publication-author">Herbst, Jan</span> & 
                                <span className="publication-author">Mynett, Mark</span>
                            </div>
                            <div className="publication-meta">Abingdon: Routledge</div>
                            <div className="publication-links">
                                <a href="https://doi.org/10.4324/9781003325727" className="publication-link" target="_blank" rel="noopener noreferrer">Open Access</a>
                                <a href="https://www.routledge.com/Heaviness-in-Metal-Music-Production-Volume-I-How-and-Why-it-Works/Herbst-Mynett/p/book/9781032346212" className="publication-link" target="_blank" rel="noopener noreferrer">Learn More</a>
                            </div>
                        </div>
                    </div>

                    <div className="publication-card">
                        <div className="publication-type">Book</div>
                        <div className="publication-content">
                            <div className="publication-year">2025</div>
                            <div className="publication-title">Heaviness in Metal Music Production, Volume 2: Learn from the Masters</div>
                            <div className="publication-authors">
                                <span className="publication-author">Herbst, Jan</span> & 
                                <span className="publication-author">Mynett, Mark</span>
                            </div>
                            <div className="publication-meta">Abingdon: Routledge</div>
                            <div className="publication-links">
                                <a href="https://doi.org/10.4324/9781003564089" className="publication-link" target="_blank" rel="noopener noreferrer">Open Access</a>
                                <a href="https://www.routledge.com/Heaviness-in-Metal-Music-Production-Volume-II-Learn-from-the-Masters/Herbst-Mynett/p/book/9781032915586" className="publication-link" target="_blank" rel="noopener noreferrer">Learn More</a>
                            </div>
                        </div>
                    </div>
                    
                    <div className="publication-card">
                        <div className="publication-type">Book</div>
                        <div className="publication-content">
                            <div className="publication-year">2025</div>
                            <div className="publication-title">Heaviness in Metal Music Production: A Practical Guide (Findings eBook)</div>
                            <div className="publication-authors">
                                <span className="publication-author">Herbst, Jan</span> &
                                <span className="publication-author">Mynett, Mark</span>
                            </div>
                            <div className="publication-meta">Huddersfield: HiMMP (Self-Published)</div>
                            <div className="publication-links">
                                <a href="./findings.html" className="publication-link">Read Online</a>
                                <a href="https://doi.org/10.5281/zenodo.17608064" className="publication-link" target="_blank" rel="noopener noreferrer">DOI</a>
                            </div>
                        </div>
                    </div>
                </div>
                
                <h4 className="section-heading">Articles and chapters</h4>
                <div className="publication-grid">
                    
                   <div className="publication-card">
                        <div className="publication-type">Article</div>
                        <div className="publication-content">
                            <div className="publication-year">2025</div>
                            <div className="publication-title">Metal Music and the Aesthetics of Heaviness: Sonic, Structural, and Affective Perspectives</div>
                            <div className="publication-authors">
                                <span className="publication-author">Herbst, Jan</span> & 
                                <span className="publication-author">Mynett, Mark</span>
                            </div>
                            <div className="publication-meta"><em>Rock Music Studies</em></div>
                            <div className="publication-links">
                                <a href="https://doi.org/10.1080/19401159.2025.2535100" className="publication-link" target="_blank" rel="noopener noreferrer">Open Access</a>
                            </div>
                        </div>
                    </div>

                   <div className="publication-card">
                        <div className="publication-type">Article</div>
                        <div className="publication-content">
                            <div className="publication-year">2025</div>
                            <div className="publication-title">Aesthetic Tensions in Metal Production: Genre Expectations, Technological Mediation, and Creative Freedom</div>
                            <div className="publication-authors">
                                <span className="publication-author">Herbst, Jan</span> & 
                                <span className="publication-author">Mynett, Mark</span>
                            </div>
                            <div className="publication-meta"><em>Popular Music & Society</em> 49(2)</div>
                            <div className="publication-links">
                                <a href="https://doi.org/10.1080/03007766.2025.2530807" className="publication-link" target="_blank" rel="noopener noreferrer">Open Access</a>
                            </div>
                        </div>
                    </div>

                   <div className="publication-card">
                        <div className="publication-type">Article</div>
                        <div className="publication-content">
                            <div className="publication-year">2025</div>
                            <div className="publication-title">"Mixed" Results: An Introduction to Analyzing Metal Production through Eight Commissioned Metal Mixes</div>
                            <div className="publication-authors">
                                <span className="publication-author">Herbst, Jan</span> & 
                                <span className="publication-author">Smialek, Eric</span>
                            </div>
                            <div className="publication-meta"><em>Zeitschrift der Gesellschaft für Musiktheorie</em> (Journal of the German-Speaking Society for Music Theory), 22/1</div>
                            <div className="publication-links">
                                <a href="https://doi.org/10.31751/1222" className="publication-link" target="_blank" rel="noopener noreferrer">Open Access</a>
                            </div>


                        </div>
                    </div>
                    
                    
                    <div className="publication-card">
                        <div className="publication-type">Chapter</div>
                        <div className="publication-content">
                            <div className="publication-year">2025</div>
                            <div className="publication-title">Contemporary Approaches to Metal Music Mixing and Production: Heavy Metal, Death Metal, and Metalcore</div>
                            <div className="publication-authors">
                                <span className="publication-author">Herbst, Jan</span> & 
                                <span className="publication-author">Mynett, Mark</span>
                            </div>
                            <div className="publication-meta">In Lori Burns & Ciro Scotto (eds.). The Routledge Handbook of Metal Music Composition. Abingdon: Routledge, pp. 469–481</div>
                            <div className="publication-links">
                                <a href="https://doi.org/10.4324/9781003354451-34" className="publication-link" target="_blank" rel="noopener noreferrer">Open Access</a>
                            </div>
                        </div>
                    </div>
                    
                    <div className="publication-card">
                        <div className="publication-type">Article</div>
                        <div className="publication-content">
                            <div className="publication-year">2024</div>
                            <div className="publication-title">Masters of the Art of Mixing: 8 Producers – One Song – Infinite Insights</div>
                            <div className="publication-authors">
                                <span className="publication-author">Mynett, Mark</span> & 
                                <span className="publication-author">Herbst, Jan</span>
                            </div>
                            <div className="publication-meta">Sound on Sound, 9/2024, pp. 52–61</div>
                            <div className="publication-links">
                                <a href="https://www.soundonsound.com/techniques/masters-art-mixing" className="publication-link" target="_blank" rel="noopener noreferrer">Open Access</a>
                            </div>
                        </div>
                    </div>
                    
                    <div className="publication-card">
                        <div className="publication-type">Chapter</div>
                        <div className="publication-content">
                            <div className="publication-year">2023</div>
                            <div className="publication-title">Mapping the Origins of Heaviness Between 1970 and 1995: A Historical Overview of Metal Music Production</div>
                            <div className="publication-authors">
                                <span className="publication-author">Herbst, Jan</span> & 
                                <span className="publication-author">Mynett, Mark</span>
                            </div>
                            <div className="publication-meta">In Jan Herbst (ed.). The Cambridge Companion to Metal Music. Cambridge: Cambridge University Press, pp. 29–42</div>
                            <div className="publication-links">
                                <a href="https://doi.org/10.1017/9781108991162.003" className="publication-link" target="_blank" rel="noopener noreferrer">Access</a>
                            </div>
                        </div>
                    </div>
                    
                    <div className="publication-card">
                        <div className="publication-type">Article</div>
                        <div className="publication-content">
                            <div className="publication-year">2023</div>
                            <div className="publication-title">Lorna Shore's 'To the Hellfire': A Study in Heaviness</div>
                            <div className="publication-authors">
                                <span className="publication-author">Herbst, Jan</span> & 
                                <span className="publication-author">Mynett, Mark</span>
                            </div>
                            <div className="publication-meta">Metal Music Studies, 9(2), pp. 189–213</div>
                            <div className="publication-links">
                                <a href="https://intellectdiscover.com/content/journals/10.1386/mms_00105_1" className="publication-link" target="_blank" rel="noopener noreferrer">Open Access</a>
                            </div>
                        </div>
                    </div>
                    
                    <div className="publication-card">
                        <div className="publication-type">Article</div>
                        <div className="publication-content">
                            <div className="publication-year">2023</div>
                            <div className="publication-title">"I Just Go with What Feels Right." Variance and Commonality in Metal Music Mixing Practice</div>
                            <div className="publication-authors">
                                <span className="publication-author">Herbst, Jan</span> & 
                                <span className="publication-author">Mynett, Mark</span>
                            </div>
                            <div className="publication-meta">El Oido Pensante, 11(1), pp. 4–31</div>
                            <div className="publication-links">
                                <a href="https://doi.org/10.34096/oidopensante.v11n1.10704" className="publication-link" target="_blank" rel="noopener noreferrer">Open Access</a>
                            </div>
                        </div>
                    </div>
                    
                    <div className="publication-card">
                        <div className="publication-type">Article</div>
                        <div className="publication-content">
                            <div className="publication-year">2022</div>
                            <div className="publication-title">What Exactly Is "Heaviness" in Heavy Metal Music?</div>
                            <div className="publication-authors">
                                <span className="publication-author">Herbst, Jan</span> & 
                                <span className="publication-author">Mynett, Mark</span>
                            </div>
                            <div className="publication-meta">Futurum, 9/2022</div>
                            <div className="publication-links">
                                <a href="https://doi.org/10.33424/FUTURUM297" className="publication-link" target="_blank" rel="noopener noreferrer">Open Access</a>
                            </div>
                        </div>
                    </div>
                    
                    <div className="publication-card">
                        <div className="publication-type">Article</div>
                        <div className="publication-content">
                            <div className="publication-year">2022</div>
                            <div className="publication-title">What is 'Heavy' in Metal? A Netnographic Analysis of Online Forums for Metal Musicians and Producers</div>
                            <div className="publication-authors">
                                <span className="publication-author">Herbst, Jan</span> & 
                                <span className="publication-author">Mynett, Mark</span>
                            </div>
                            <div className="publication-meta">Popular Music and Society, 45(5), pp. 633–653</div>
                            <div className="publication-links">
                                <a href="https://doi.org/10.1080/03007766.2022.2114155" className="publication-link" target="_blank" rel="noopener noreferrer">Open Access</a>
                            </div>
                        </div>
                    </div>
                    
                    <div className="publication-card">
                        <div className="publication-type">Article</div>
                        <div className="publication-content">
                            <div className="publication-year">2022</div>
                            <div className="publication-title">Toward a Systematic Understanding of "Heaviness" in Metal Music Production</div>
                            <div className="publication-authors">
                                <span className="publication-author">Herbst, Jan</span> & 
                                <span className="publication-author">Mynett, Mark</span>
                            </div>
                            <div className="publication-meta">Rock Music Studies, 10(1), pp. 16–37</div>
                            <div className="publication-links">
                                <a href="https://doi.org/10.1080/19401159.2022.2109358" className="publication-link" target="_blank" rel="noopener noreferrer">Open Access</a>
                            </div>
                        </div>
                    </div>
                    
                    <div className="publication-card">
                        <div className="publication-type">Article</div>
                        <div className="publication-content">
                            <div className="publication-year">2021</div>
                            <div className="publication-title">Nail the Mix: Standardization in Mixing Metal Music?</div>
                            <div className="publication-authors">
                                <span className="publication-author">Herbst, Jan</span> & 
                                <span className="publication-author">Mynett, Mark</span>
                            </div>
                            <div className="publication-meta">Popular Music and Society, 44(5), pp. 628–649</div>
                            <div className="publication-links">
                                <a href="https://doi.org/10.1080/03007766.2021.1957544" className="publication-link" target="_blank" rel="noopener noreferrer">Open Access</a>
                            </div>
                        </div>
                    </div>
                    
                    <div className="publication-card">
                        <div className="publication-type">Article</div>
                        <div className="publication-content">
                            <div className="publication-year">2021</div>
                            <div className="publication-title">(No?) Adventures in Recording Land: Engineering Conventions in Metal Music</div>
                            <div className="publication-authors">
                                <span className="publication-author">Herbst, Jan</span> & 
                                <span className="publication-author">Mynett, Mark</span>
                            </div>
                            <div className="publication-meta">Rock Music Studies, 9(2), pp. 137–156</div>
                            <div className="publication-links">
                                <a href="https://doi.org/10.1080/19401159.2021.1936410" className="publication-link" target="_blank" rel="noopener noreferrer">Open Access</a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <button className="accordion">Prof. Dr. Dr. Jan Herbst // HiMMP Principal Investigator</button>
        <div className="panel">
            <section className="content-section researcher-publications" id="herbst-publications" style={{ paddingTop: "20px" }}>
                <div className="container">
                    <h4 className="section-heading">Books (selection)</h4>
                <div className="publication-grid">
                    <div className="publication-card">
                        <div className="publication-type">Book</div>
                        <div className="publication-content">
                            <div className="publication-year">2023</div>
                            <div className="publication-title">The Cambridge Companion to Metal Music</div>
                            <div className="publication-authors">
                                <span className="publication-author">Herbst, Jan</span> (Editor)
                            </div>
                            <div className="publication-meta">Cambridge University Press</div>
                            <div className="publication-links">
                                <a href="https://doi.org/10.1017/9781108991162" className="publication-link" target="_blank" rel="noopener noreferrer">Access</a>
                            </div>
                        </div>
                    </div>
                    
                    <div className="publication-card">
                        <div className="publication-type">Book</div>
                        <div className="publication-content">
                            <div className="publication-year">2023</div>
                            <div className="publication-title">Rock Guitar Virtuosos. Advances in Electric Guitar Playing, Technology, and Culture</div>
                            <div className="publication-authors">
                                <span className="publication-author">Herbst, Jan</span> & 
                                <span className="publication-author">Vallejo, Alexander</span>
                            </div>
                            <div className="publication-meta">Cambridge: Cambridge University Press</div>
                            <div className="publication-links">
                                <a href="https://www.cambridge.org/core/elements/abs/rock-guitar-virtuosos/0D40C7DF7198C027B276A85AD74B9E0D" className="publication-link" target="_blank" rel="noopener noreferrer">Access</a>
                            </div>
                        </div>
                    </div>
                    
                    <div className="publication-card">
                        <div className="publication-type">Book</div>
                        <div className="publication-content">
                            <div className="publication-year">2022</div>
                            <div className="publication-title">Rammsteins "Deutschland": Pop - Politik - Provokationen</div>
                            <div className="publication-authors">
                                <span className="publication-author">Herbst, Jan</span> et al.
                            </div>
                            <div className="publication-meta">Stuttgart: J.B. Metzler</div>
                            <div className="publication-links">
                                <a href="https://link.springer.com/book/10.1007/978-3-662-64766-0" className="publication-link" target="_blank" rel="noopener noreferrer">Access</a>
                            </div>
                        </div>
                    </div>
                    
                    <div className="publication-card">
                        <div className="publication-type">Book</div>
                        <div className="publication-content">
                            <div className="publication-year">2016</div>
                            <div className="publication-title">Die Gitarrenverzerrung in der Rockmusik. Studien zu Spielweise und Ästhetik</div>
                            <div className="publication-authors">
                                <span className="publication-author">Herbst, Jan</span>
                            </div>
                            <div className="publication-meta">Münster: LIT</div>
                            <div className="publication-links">
                                <a href="https://lit-verlag.de/isbn/978-3-643-13553-7/" className="publication-link" target="_blank" rel="noopener noreferrer">Access</a>
                            </div>
                        </div>
                    </div>
                </div>
                
                <h4 className="section-heading">Academic Articles (selection)</h4>
                <ul className="publication-list">
                    <li className="publication-item">
                        <div className="publication-year">2023</div>
                        <div className="publication-title">Harmonic Structures in Twenty-First-Century Metal Music: A Harmonic Analysis of Five Major Metal Genres</div>
                        <div className="publication-authors">
                            <span className="publication-author">Herbst, Jan</span> & 
                            <span className="publication-author">Boddington-Jordan, Jamie</span>
                        </div>
                        <div className="publication-meta">Metal Music Studies, 9(1), pp. 27–58</div>
                        <a href="https://janherbst.net/publications/research_articles/Boddington%20&%20Herbst%202023%20-%20Harmonic%20Structures.pdf" className="external-link" target="_blank" rel="noopener noreferrer">Download</a>
                    </li>
                    
                    <li className="publication-item">
                        <div className="publication-year">2022</div>
                        <div className="publication-title">Dissonance in Metal Music: Musical and Sociocultural Reasons for Metal's Appreciation of Dissonance</div>
                        <div className="publication-authors">
                            <span className="publication-author">Herbst, Jan</span> & 
                            <span className="publication-author">Swallow, Reuben</span>
                        </div>
                        <div className="publication-meta">Metal Music Studies, 8(3), pp. 351–379</div>
                        <a href="https://janherbst.net/publications/research_articles/Swallow%20&%20Herbst%202022%20-%20Dissonance%20in%20Metal%20Music.pdf" className="external-link" target="_blank" rel="noopener noreferrer">Download</a>
                    </li>
                    
                    <li className="publication-item">
                        <div className="publication-year">2022</div>
                        <div className="publication-title">Keeper of the Seven Keys: Audio Heritage in Metal Music Production</div>
                        <div className="publication-authors">
                            <span className="publication-author">Herbst, Jan</span>
                        </div>
                        <div className="publication-meta">Metal Music Studies, 8(1), pp. 109–126</div>
                        <a href="https://janherbst.net/publications/research_articles/Herbst%202022%20-%20Keeper.pdf" className="external-link" target="_blank" rel="noopener noreferrer">Download</a>
                    </li>
                    
                    <li className="publication-item">
                        <div className="publication-year">2021</div>
                        <div className="publication-title">Teutonic Metal: Effects of Place- and Mythology-Based Labels on Record Production</div>
                        <div className="publication-authors">
                            <span className="publication-author">Herbst, Jan</span> &
                            <span className="publication-author">Bauerfeind, Karl</span>
                        </div>
                        <div className="publication-meta">International Journal of the Sociology of Leisure, 4, pp. 291–313</div>
                        <a href="https://doi.org/10.1007/s41978-021-00084-5" className="external-link" target="_blank" rel="noopener noreferrer">Download</a>
                    </li>
                    
                    <li className="publication-item">
                        <div className="publication-year">2022</div>
                        <div className="publication-title">The Recording Industry as the Enemy? A Case Study of Early West German Metal Music</div>
                        <div className="publication-authors">
                            <span className="publication-author">Herbst, Jan</span>
                        </div>
                        <div className="publication-meta">International Journal of the Sociology of Leisure, 5, pp. 229–254</div>
                        <a href="https://link.springer.com/article/10.1007%2Fs41978-021-00098-z" className="external-link" target="_blank" rel="noopener noreferrer">Download</a>
                    </li>
                    
                    <li className="publication-item">
                        <div className="publication-year">2021</div>
                        <div className="publication-title">The Politics of Rammstein's Sound: Decoding a Production Aesthetic</div>
                        <div className="publication-authors">
                            <span className="publication-author">Herbst, Jan</span>
                        </div>
                        <div className="publication-meta">Journal of Popular Music Studies, 33(2), pp. 51–76</div>
                        <a href="https://janherbst.net/publications/research_articles/Herbst%202021%20-%20Politics.pdf" className="external-link" target="_blank" rel="noopener noreferrer">Download</a>
                    </li>
                    
                    <li className="publication-item">
                        <div className="publication-year">2021</div>
                        <div className="publication-title">Culture-Specific Production and Performance Characteristics. An Interview Study with "Teutonic" Metal Producers</div>
                        <div className="publication-authors">
                            <span className="publication-author">Herbst, Jan</span>
                        </div>
                        <div className="publication-meta">Metal Music Studies, 7(3), pp. 445–467</div>
                        <a href="http://gfpm-samples.de/Samples18/Herbst2.pdf" className="external-link" target="_blank" rel="noopener noreferrer">Download</a>
                    </li>
                    
                    <li className="publication-item">
                        <div className="publication-year">2020</div>
                        <div className="publication-title">Metronomic Precision of 'Teutonic Metal': A Methodological Challenge for Rhythm and Performance Research</div>
                        <div className="publication-authors">
                            <span className="publication-author">Herbst, Jan</span>
                        </div>
                        <div className="publication-meta">ASPM Samples, 18, pp. 1–27</div>
                        <a href="http://gfpm-samples.de/Samples18/Herbst.pdf" className="external-link" target="_blank" rel="noopener noreferrer">Download</a>
                    </li>
                    
                    <li className="publication-item">
                        <div className="publication-year">2020</div>
                        <div className="publication-title">Sonic Signatures in Metal Music Production. Teutonic vs British vs American Sound</div>
                        <div className="publication-authors">
                            <span className="publication-author">Herbst, Jan</span>
                        </div>
                        <div className="publication-meta">ASPM Samples, 18, pp. 1–26</div>
                        <a href="https://janherbst.net/publications/research_articles/Herbst%202020%20-%20From%20Bach%20to%20Helloween.pdf" className="external-link" target="_blank" rel="noopener noreferrer">Download</a>
                    </li>
                    
                    <li className="publication-item">
                        <div className="publication-year">2020</div>
                        <div className="publication-title">From Bach to Helloween. "Teutonic" Stereotypes in the History of Popular Music</div>
                        <div className="publication-authors">
                            <span className="publication-author">Herbst, Jan</span>
                        </div>
                        <div className="publication-meta">Metal Music Studies, 6(1), pp. 87–108</div>
                        <a href="https://janherbst.net/publications/research_articles/Herbst%202019%20-%20Distortion%20and%20Rock%20Guitar%20Harmony.pdf" className="external-link" target="_blank" rel="noopener noreferrer">Download</a>
                    </li>
                    
                    <li className="publication-item">
                        <div className="publication-year">2019</div>
                        <div className="publication-title">Distortion and Rock Guitar Harmony. The Influence of Distortion Level and Structural Complexity on Acoustic Features and Perceived Pleasantness of Guitar Chords</div>
                        <div className="publication-authors">
                            <span className="publication-author">Herbst, Jan</span>
                        </div>
                        <div className="publication-meta">Music Perception, 36(4), pp. 335-352</div>
                        <a href="https://janherbst.net/publications/research_articles/Herbst%202019%20-%20Formation.pdf" className="external-link" target="_blank" rel="noopener noreferrer">Download</a>
                    </li>
                    
                    <li className="publication-item">
                        <div className="publication-year">2019</div>
                        <div className="publication-title">The Formation of the West German Power Metal Scene and the Question of a "Teutonic" Sound</div>
                        <div className="publication-authors">
                            <span className="publication-author">Herbst, Jan</span>
                        </div>
                        <div className="publication-meta">Metal Music Studies, 5(2), pp. 201–223</div>
                        <a href="https://janherbst.net/publications/research_articles/Herbst%202019%20-%20Old%20Sounds.pdf" className="external-link" target="_blank" rel="noopener noreferrer">Download</a>
                    </li>
                    
                    <li className="publication-item">
                        <div className="publication-year">2019</div>
                        <div className="publication-title">Old Sounds with New Technologies? Examining the Creative Potential of Guitar "Profiling" Technology and the Future of Metal Music from Producers' Perspectives</div>
                        <div className="publication-authors">
                            <span className="publication-author">Herbst, Jan</span>
                        </div>
                        <div className="publication-meta">Metal Music Studies, 5(1), pp. 53–69</div>
                        <a href="https://janherbst.net/publications/research_articles/Herbst%20et%20al%202018%20-%20Profiling.pdf" className="external-link" target="_blank" rel="noopener noreferrer">Download</a>
                    </li>
                    
                    <li className="publication-item">
                        <div className="publication-year">2018</div>
                        <div className="publication-title">Guitar Profiling Technology in Metal Music Production: Public Reception, Capability, Consequences and Perspectives</div>
                        <div className="publication-authors">
                            <span className="publication-author">Herbst, Jan</span>,
                            <span className="publication-author">Czedik-Eysenberg, Isabella</span> &
                            <span className="publication-author">Reuter, Christoph</span>
                        </div>
                        <div className="publication-meta">Metal Music Studies, 4(3), pp. 481-506</div>
                        <a href="https://janherbst.net/publications/research_articles/Herbst%202018%20-%20Heaviness.pdf" className="external-link" target="_blank" rel="noopener noreferrer">Download</a>
                    </li>
                    
                    <li className="publication-item">
                        <div className="publication-year">2018</div>
                        <div className="publication-title">Heaviness and the Electric Guitar: Considering the Interaction Between Distortion and Harmonic Structures</div>
                        <div className="publication-authors">
                            <span className="publication-author">Herbst, Jan</span>
                        </div>
                        <div className="publication-meta">Metal Music Studies, 4(1), pp. 95–113</div>
                        <a href="https://janherbst.net/publications/research_articles/Herbst%202017%20-%20Historical%20Development.pdf" className="external-link" target="_blank" rel="noopener noreferrer">Download</a>
                    </li>
                    
                    <li className="publication-item">
                        <div className="publication-year">2017</div>
                        <div className="publication-title">Historical Development, Sound Aesthetics and Production Techniques of the Distorted Electric Guitar in Metal Music</div>
                        <div className="publication-authors">
                            <span className="publication-author">Herbst, Jan</span>
                        </div>
                        <div className="publication-meta">Metal Music Studies, 3(1), pp. 24–46</div>
                        <a href="https://www.psycharchives.org/bitstream/20.500.12034/2420/1/27_2017_02_Herbst.pdf" className="external-link" target="_blank" rel="noopener noreferrer">Download</a>
                    </li>
                </ul>
                
                <h4 className="section-heading">Book Chapters</h4>
                <ul className="publication-list">
                    <li className="publication-item">
                        <div className="publication-year">2020</div>
                        <div className="publication-title">German Metal Attack: Power Metal in and from Germany</div>
                        <div className="publication-authors">
                            <span className="publication-author">Herbst, Jan</span>
                        </div>
                        <div className="publication-meta">In Oliver Seibt, Martin Ringsmut & David-Emil Wickström (eds). Made in Germany. Abingdon: Routledge, pp. 81–89</div>
                    </li>
                    
                    <li className="publication-item">
                        <div className="publication-year">2020</div>
                        <div className="publication-title">Views of German Producers on "Teutonic" metal: Production Approaches and Generational Effects</div>
                        <div className="publication-authors">
                            <span className="publication-author">Herbst, Jan</span>
                        </div>
                        <div className="publication-meta">In Ralf von Appen & Thorsten Hindrichs (eds). One Nation Under a Groove. Nation als Kategorie populärer Musik?. Bielefeld: transcript, 183–206</div>
                        <a href="https://janherbst.net/publications/chapters/Herbst%202020%20-%20Views%20of%20German%20Producers%20on%20Teutonic%20Metal.pdf" className="external-link" target="_blank" rel="noopener noreferrer">Download</a>
                    </li>
                    
                    <li className="publication-item">
                        <div className="publication-year">2017</div>
                        <div className="publication-title">Influence of Distortion on Guitar Chord Structures: Acoustic Effects and Perceptual Correlates</div>
                        <div className="publication-authors">
                            <span className="publication-author">Herbst, Jan</span>
                        </div>
                        <div className="publication-meta">In Wolfgang Auhagen, Claudia Bullerjahn & Christoph Louven (eds). Musikpsychologie, vol. 27: Akustik und musikalische Hörwahrnehmung. Göttingen: Hogrefe, pp. 26–47</div>
                        <a href="#" className="external-link">Download</a>
                    </li>
                </ul>
                
                <h4 className="section-heading">Thesis</h4>
                <ul className="publication-list">
                    <li className="publication-item">
                        <div className="publication-year">2024</div>
                        <div className="publication-title">The Electric Guitar in Rock Music: Guitar Playing, Technology, and Culture</div>
                        <div className="publication-authors">
                            <span className="publication-author">Herbst, Jan</span>
                        </div>
                        <div className="publication-meta">Higher Doctorate by Publication, Leuphana University of Lüneburg</div>
                        <a href="https://doi.org/10.48548/pubdata-1664" className="external-link" target="_blank" rel="noopener noreferrer">Open Access</a>
                    </li>
                    
                    <li className="publication-item">
                        <div className="publication-year">2023</div>
                        <div className="publication-title">Metal Music in the Federal Republic of Germany in the 1980s and 1990s: Record Production, Industry, and Heritage</div>
                        <div className="publication-authors">
                            <span className="publication-author">Herbst, Jan</span>
                        </div>
                        <div className="publication-meta">PhD by Publication, University of Huddersfield</div>
                        <a href="https://pure.hud.ac.uk/en/studentTheses/metal-music-in-the-federal-republic-of-germany-in-the-1980s-and-1" className="external-link" target="_blank" rel="noopener noreferrer">Open Access</a>
                    </li>
                </ul>
                
                    <p className="see-more-link">The complete list of Jan's published work is available <a href="https://pure.hud.ac.uk/en/persons/jan-herbst" className="external-link">here</a>.</p>
                </div>
            </section>
        </div>

        <button className="accordion">Dr. Mark Mynett // HiMMP Co-Investigator</button>
        <div className="panel">
            <section className="content-section researcher-publications" id="mynett-publications" style={{ paddingTop: "20px" }}>
                <div className="container">
                    <h4 className="section-heading">Thesis</h4>
                <ul className="publication-list">
                    <li className="publication-item">
                        <div className="publication-year">2013</div>
                        <div className="publication-title">Contemporary Metal Music Production</div>
                        <div className="publication-authors">
                            <span className="publication-author">Mynett, Mark</span>
                        </div>
                        <div className="publication-meta">PhD thesis, University of Huddersfield</div>
                        <a href="http://eprints.hud.ac.uk/id/eprint/19314/" className="external-link" target="_blank" rel="noopener noreferrer">Open Access</a>
                    </li>
                </ul>

                <h4 className="section-heading">Books</h4>
                <div className="publication-grid">
                    <div className="publication-card">
                        <div className="publication-type">Book</div>
                        <div className="publication-content">
                            <div className="publication-year">2017</div>
                            <div className="publication-title">Metal Music Manual: Producing, Engineering, Mixing, and Mastering Contemporary Heavy Music</div>
                            <div className="publication-authors">
                                <span className="publication-author">Mynett, Mark</span>
                            </div>
                            <div className="publication-meta">Routledge</div>
                            <div className="publication-links">
                                <a href="https://www.routledge.com/Metal-Music-Manual-Producing-Engineering-Mixing-and-Mastering-Contemporary/Mynett/p/book/9781138809321" className="publication-link" target="_blank" rel="noopener noreferrer">Access</a>
                            </div>
                        </div>
                    </div>
                </div>

                <h4 className="section-heading">Academic Articles</h4>
                <ul className="publication-list">
                    <li className="publication-item">
                        <div className="publication-year">2019</div>
                        <div className="publication-title">Defining Contemporary Metal Music: Performance, Sounds and Practices</div>
                        <div className="publication-authors">
                            <span className="publication-author">Mynett, Mark</span>
                        </div>
                        <div className="publication-meta">Metal Music Studies, 5(3), pp. 297–313</div>
                        <a href="https://www.ingentaconnect.com/contentone/intellect/mms/2019/00000005/00000003/art00002" className="external-link" target="_blank" rel="noopener noreferrer">Open Access</a>
                    </li>
                    
                    <li className="publication-item">
                        <div className="publication-year">2012</div>
                        <div className="publication-title">Achieving Intelligibility whilst Maintaining Heaviness when Producing Contemporary Metal Music</div>
                        <div className="publication-authors">
                            <span className="publication-author">Mynett, Mark</span>
                        </div>
                        <div className="publication-meta">Journal on the Art of Record Production, 6</div>
                        <a href="https://www.arpjournal.com/asarpwp/achieving-intelligibility-whilst-maintaining-heaviness-when-producing-contemporary-metal-music" className="external-link" target="_blank" rel="noopener noreferrer">Open Access</a>
                    </li>
                    
                    <li className="publication-item">
                        <div className="publication-year">2011</div>
                        <div className="publication-title">Sound at Source: The Creative Practice of Re-Heading, Dampening and Drum Tuning for the Contemporary Metal Genre</div>
                        <div className="publication-authors">
                            <span className="publication-author">Mynett, Mark</span>
                        </div>
                        <div className="publication-meta">Journal on the Art of Record Production, 5</div>
                        <a href="https://www.arpjournal.com/asarpwp/sound-at-source-the-creative-practice-of-re-heading-dampening-and-drum-tuning-for-the-contemporary-metal-genre" className="external-link" target="_blank" rel="noopener noreferrer">Open Access</a>
                    </li>
                </ul>

                <h4 className="section-heading">Book Chapters</h4>
                <ul className="publication-list">
                    <li className="publication-item">
                        <div className="publication-year">2020</div>
                        <div className="publication-title">Maximum Sonic Impact: (Authenticity/Commerciality) Fidelity-Dualism in Contemporary Metal Music Production</div>
                        <div className="publication-authors">
                            <span className="publication-author">Mynett, Mark</span>
                        </div>
                        <div className="publication-meta">In Simon Zagorski-Thomas & Andrew Bourbon (eds). The Bloomsbury Handbook of Music Production. London: Bloomsbury, pp. 293–302</div>
                        <a href="https://www.bloomsbury.com/us/the-bloomsbury-handbook-of-music-production-9781501334047" className="external-link" target="_blank" rel="noopener noreferrer">Access</a>
                    </li>
                    
                    <li className="publication-item">
                        <div className="publication-year">2019</div>
                        <div className="publication-title">Heaviness in Three Dimensions: The Use of Sonic Space in Contemporary Metal Music Production</div>
                        <div className="publication-authors">
                            <span className="publication-author">Mynett, Mark</span>
                        </div>
                        <div className="publication-meta">In Simon Zagorski-Thomas, Katia Isakoff, Sophie Stévance & Serge Lacasse (eds). The Art of Record Production: Creative Practice in the Studio. Abingdon: Routledge, pp. 66–79</div>
                        <a href="https://www.routledge.com/The-Art-of-Record-Production-Creative-Practice-in-the-Studio/Zagorski-Thomas-Isakoff-Lacasse-Stevance/p/book/9781138205161" className="external-link" target="_blank" rel="noopener noreferrer">Access</a>
                    </li>
                    
                    <li className="publication-item">
                        <div className="publication-year">2016</div>
                        <div className="publication-title">The Distortion Paradox: Analysing Contemporary Metal Production</div>
                        <div className="publication-authors">
                            <span className="publication-author">Mynett, Mark</span>
                        </div>
                        <div className="publication-meta">In Andy R. Brown, Karl Spracklen, Keith Kahn-Harris & Niall Scott (eds). Global Metal Music and Culture: Current Directions in Metal Studies. Abingdon: Routledge, pp. 68–87</div>
                        <a href="https://www.routledge.com/Global-Metal-Music-and-Culture-Current-Directions-in-Metal-Studies-1st/Brown-Spracklen-Kahn-Harris-Scott/p/book/9781138822382" className="external-link" target="_blank" rel="noopener noreferrer">Access</a>
                    </li>
                    
                    <li className="publication-item">
                        <div className="publication-year">2010</div>
                        <div className="publication-title">Intelligent Equalisation Principles and Techniques for Minimising Masking when Mixing the Extreme Modern Metal Genre</div>
                        <div className="publication-authors">
                            <span className="publication-author">Mynett, Mark</span>,
                            <span className="publication-author">Wakefield, Jonathan</span> &
                            <span className="publication-author">Till, Rupert</span>
                        </div>
                        <div className="publication-meta">In Rosemary Hill & Karl Spracklen (eds). Heavy Fundamentalisms: Music, Metal and Politics. Oxford: Inter-Disciplinary Press, pp. 141–146</div>
                        <a href="https://core.ac.uk/download/pdf/51866.pdf" className="external-link" target="_blank" rel="noopener noreferrer">Open Access</a>
                    </li>
                </ul>

                <h4 className="section-heading">Magazine Articles</h4>
                <div className="publication-grid">
                    <div className="publication-card">
                        <div className="publication-type">Article</div>
                        <div className="publication-content">
                            <div className="publication-year">2018</div>
                            <div className="publication-title">Session Notes Pt. 3; Making Modern Metal, Mixing and Mastering</div>
                            <div className="publication-authors">
                                <span className="publication-author">Mynett, Mark</span>
                            </div>
                            <div className="publication-meta">Sound on Sound, 3/2018</div>
                            <div className="publication-links">
                                <a href="https://www.soundonsound.com/techniques/making-modern-metal-part-3" className="publication-link" target="_blank" rel="noopener noreferrer">Open Access</a>
                            </div>
                        </div>
                    </div>
                    
                    <div className="publication-card">
                        <div className="publication-type">Article</div>
                        <div className="publication-content">
                            <div className="publication-year">2018</div>
                            <div className="publication-title">Session Notes Pt. 2; Making Modern Metal, Engineering</div>
                            <div className="publication-authors">
                                <span className="publication-author">Mynett, Mark</span>
                            </div>
                            <div className="publication-meta">Sound on Sound, 2/2018</div>
                            <div className="publication-links">
                                <a href="https://www.soundonsound.com/techniques/making-modern-metal-part-2" className="publication-link" target="_blank" rel="noopener noreferrer">Open Access</a>
                            </div>
                        </div>
                    </div>
                    
                    <div className="publication-card">
                        <div className="publication-type">Article</div>
                        <div className="publication-content">
                            <div className="publication-year">2018</div>
                            <div className="publication-title">Session Notes Pt. 1; Making Modern Metal, Pre-Production</div>
                            <div className="publication-authors">
                                <span className="publication-author">Mynett, Mark</span>
                            </div>
                            <div className="publication-meta">Sound on Sound, 1/2018</div>
                            <div className="publication-links">
                                <a href="https://www.soundonsound.com/techniques/making-modern-metal-part-1" className="publication-link" target="_blank" rel="noopener noreferrer">Open Access</a>
                            </div>
                        </div>
                    </div>
                    
                    <div className="publication-card">
                        <div className="publication-type">Article</div>
                        <div className="publication-content">
                            <div className="publication-year">2010</div>
                            <div className="publication-title">Get the Perfect Bass</div>
                            <div className="publication-authors">
                                <span className="publication-author">Mynett, Mark</span>
                            </div>
                            <div className="publication-meta">Computer Music, 12/2010, pp. 63–70</div>
                        </div>
                    </div>
                    
                    <div className="publication-card">
                        <div className="publication-type">Article</div>
                        <div className="publication-content">
                            <div className="publication-year">2010</div>
                            <div className="publication-title">The Sound and the Fury: Part 2</div>
                            <div className="publication-authors">
                                <span className="publication-author">Mynett, Mark</span>
                            </div>
                            <div className="publication-meta">Guitar World, 5/2010, pp. 72–86</div>
                            <div className="publication-links">
                                <a href="http://eprints.hud.ac.uk/id/eprint/9917" className="publication-link" target="_blank" rel="noopener noreferrer">Open Access</a>
                            </div>
                        </div>
                    </div>
                    
                    <div className="publication-card">
                        <div className="publication-type">Article</div>
                        <div className="publication-content">
                            <div className="publication-year">2010</div>
                            <div className="publication-title">The Sound and the Fury: Part 1</div>
                            <div className="publication-authors">
                                <span className="publication-author">Mynett, Mark</span>
                            </div>
                            <div className="publication-meta">Guitar World, 4/2010, pp. 71–80</div>
                            <div className="publication-links">
                                <a href="http://eprints.hud.ac.uk/id/eprint/9916" className="publication-link" target="_blank" rel="noopener noreferrer">Open Access</a>
                            </div>
                        </div>
                    </div>
                    
                    <div className="publication-card">
                        <div className="publication-type">Article</div>
                        <div className="publication-content">
                            <div className="publication-year">2009</div>
                            <div className="publication-title">Mixing Metal: The SOS Guide to Extreme Metal Production: Part 2</div>
                            <div className="publication-authors">
                                <span className="publication-author">Mynett, Mark</span>
                            </div>
                            <div className="publication-meta">Sound on Sound, 12/2009, pp. 118–126</div>
                            <div className="publication-links">
                                <a href="https://www.soundonsound.com/techniques/mixing-metal" className="publication-link" target="_blank" rel="noopener noreferrer">Open Access</a>
                            </div>
                        </div>
                    </div>
                    
                    <div className="publication-card">
                        <div className="publication-type">Article</div>
                        <div className="publication-content">
                            <div className="publication-year">2009</div>
                            <div className="publication-title">Extreme Metal: The SOS Guide to Recording & Producing Modern Metal</div>
                            <div className="publication-authors">
                                <span className="publication-author">Mynett, Mark</span>
                            </div>
                            <div className="publication-meta">Sound on Sound, 11/2009, pp. 120–133</div>
                            <div className="publication-links">
                                <a href="https://www.soundonsound.com/techniques/extreme-metal" className="publication-link" target="_blank" rel="noopener noreferrer">Open Access</a>
                            </div>
                        </div>
                    </div>
                </div>
                
                    <p className="see-more-link">The complete list of Mark's published work is available <a href="https://pure.hud.ac.uk/en/persons/mark-mynett" className="external-link" target="_blank" rel="noopener noreferrer">here</a>.</p>
                </div>
            </section>
        </div>

        <button className="accordion">Additional Research // Bibliography</button>
        <div className="panel">
            <section className="content-section bibliography-section" id="other-research" style={{ paddingTop: "20px" }}>
                <div className="container">
                    <h4 className="section-heading">Academic Texts</h4>
                <ul className="publication-list">
                    <li className="publication-item">
                        <div className="publication-title">Heaviness in the Perception of Heavy Metal Guitar Timbres: The Match of Perceptual and Acoustic Features over Time</div>
                        <div className="publication-authors">
                            <span className="publication-author">Berger, Harris M.</span> & 
                            <span className="publication-author">Fales, Cornelia</span> (2005)
                        </div>
                        <div className="publication-meta">In Paul D. Greene & Thomas Porcello (eds). Wired for Sound. Engineering and Technology in Sonic Cultures. Connecticut: Wesleyan University Press, pp. 181–197</div>
                        <a href="https://www.hfsbooks.com/books/wired-for-sound-greene-porcello/" className="external-link" target="_blank" rel="noopener noreferrer">Access</a>
                    </li>
                    
                    <li className="publication-item">
                        <div className="publication-title">Was macht Musik "hart"? Klangliche Merkmale zur genreübergreifenden Identifikation musikalischer Härte ('What makes music "heavy"?')</div>
                        <div className="publication-authors">
                            <span className="publication-author">Czedik-Eysenberg, Isabella</span>,
                            <span className="publication-author">Knauf, Denis</span> & 
                            <span className="publication-author">Reuter, Christoph</span> (2017)
                        </div>
                        <div className="publication-meta">Fortschritte der Akustik. DAGA 2017, 43th German Annual Conference for Acoustics, Kiel, 3–5 March, pp. 186–89</div>
                        <a href="https://homepage.univie.ac.at/christoph.reuter/unterwegs/DAGA2017_Paper_Czedik-Eysenberg_Knauf_Reuter.pdf" className="external-link" target="_blank" rel="noopener noreferrer">Open Access</a>
                    </li>
                    
                    <li className="publication-item">
                        <div className="publication-title">"Hardness" as a Semantic Audio Descriptor for Music Using Automatic Feature Extraction</div>
                        <div className="publication-authors">
                            <span className="publication-author">Czedik-Eysenberg, Isabella</span>,
                            <span className="publication-author">Knauf, Denis</span> & 
                            <span className="publication-author">Reuter, Christoph</span> (2017)
                        </div>
                        <div className="publication-meta">Informatik 2017, Chemnitz</div>
                        <a href="https://www.researchgate.net/publication/320373714_Hardness_as_a_semantic_audio_descriptor_for_music_using_automatic_feature_extraction" className="external-link" target="_blank" rel="noopener noreferrer">Open Access</a>
                    </li>
                    
                    <li className="publication-item">
                        <div className="publication-title">Extended Range Guitars: Cultural Impact, Specifications, and the Context of a Mix</div>
                        <div className="publication-authors">
                            <span className="publication-author">Gil, Victor</span> (2014)
                        </div>
                        <div className="publication-meta">MA thesis, California State University</div>
                        <a href="https://www.academia.edu/11771703/Extended_Range_Guitars_Cultural_Impact_Specifications_and_the_Context_of_a_Mix" className="external-link" target="_blank" rel="noopener noreferrer">Open Access</a>
                    </li>
                    
                    <li className="publication-item">
                        <div className="publication-title">Musical Style, Ideology, and Mythology in Norwegian Black Metal</div>
                        <div className="publication-authors">
                            <span className="publication-author">Hagen, Ross</span> (2011)
                        </div>
                        <div className="publication-meta">In Jeremy Wallach, Harris M. Berger & Paul D. Greene (eds). Metal Rules the Globe. Heavy Metal Music Around the World. Durham: Duke University Press, pp. 180–199</div>
                        <a href="https://read.dukeupress.edu/books/book/1452/chapter-abstract/169796/Musical-Style-Ideology-and-Mythology-in-Norwegian?redirectedFrom=fulltext" className="external-link" target="_blank" rel="noopener noreferrer">Access</a>
                    </li>
                    
                    <li className="publication-item">
                        <div className="publication-title">Difficulty as Heaviness: Links Between Rhythmic Difficulty and Perceived Heaviness in the Music of Meshuggah and The Dillinger Escape Plan</div>
                        <div className="publication-authors">
                            <span className="publication-author">Hannan, Calder</span> (2018)
                        </div>
                        <div className="publication-meta">Metal Music Studies, 3(1), pp. 433–458</div>
                        <a href="https://www.ingentaconnect.com/content/intellect/mms/2018/00000004/00000003/art00003" className="external-link" target="_blank" rel="noopener noreferrer">Access</a>
                    </li>
                    
                    <li className="publication-item">
                        <div className="publication-title">Discordant Systems: Uses and Meanings of Rhythmic Difficulty in the Music of Meshuggah and Related Extreme and Progressive Metal Bands</div>
                        <div className="publication-authors">
                            <span className="publication-author">Hannan, Calder</span> (2017)
                        </div>
                        <div className="publication-meta">Major thesis, University of Virginia</div>
                        <a href="https://libraetd.lib.virginia.edu/public_view/f7623c97q" className="external-link" target="_blank" rel="noopener noreferrer">Open Access</a>
                    </li>
                    
                    <li className="publication-item">
                        <div className="publication-title">Dealing with the 3rd: Anatomy of distorted chords and subsequent compositional features of classic heavy metal</div>
                        <div className="publication-authors">
                            <span className="publication-author">Lilja, Esa</span> (2015)
                        </div>
                        <div className="publication-meta">In Toni-Matti Karjalainen & Kimi Kärki (eds). Modern Heavy Metal. Markets, Practices and Cultures. Helsinki, Finland: Aalto University, pp. 393–403</div>
                        <a href="https://pdfs.semanticscholar.org/b2e2/c20f8fe3ad45d39bc8f5623b50100338e35c.pdf" className="external-link" target="_blank" rel="noopener noreferrer">Open Access</a>
                    </li>
                    
                    <li className="publication-item">
                        <div className="publication-title">What Makes Heavy Metal 'Heavy'?</div>
                        <div className="publication-authors">
                            <span className="publication-author">Miller, Jason</span> (2021)
                        </div>
                        <div className="publication-meta">The Journal of Aesthetics and Art Criticism, 80(1), pp. 70–82</div>
                        <a href="https://doi.org/10.1093/jaac/kpab065" className="external-link" target="_blank" rel="noopener noreferrer">Access</a>
                    </li>
                    
                    <li className="publication-item">
                        <div className="publication-title">Blacker than Death: Recollecting the "Black Turn" in Metal Aesthetics</div>
                        <div className="publication-authors">
                            <span className="publication-author">Reyes, Ian</span> (2013)
                        </div>
                        <div className="publication-meta">Journal of Popular Music Studies, 25, pp. 240–257</div>
                        <a href="https://digitalcommons.uri.edu/cgi/viewcontent.cgi?article=1034&context=com_facpubs" className="external-link" target="_blank" rel="noopener noreferrer">Open Access</a>
                    </li>
                    
                    <li className="publication-item">
                        <div className="publication-title">Sound, Technology, and the Interpretation in Subcultures of Heavy Music Production</div>
                        <div className="publication-authors">
                            <span className="publication-author">Reyes, Ian</span> (2008)
                        </div>
                        <div className="publication-meta">PhD thesis, Pittsburgh University</div>
                        <a href="https://core.ac.uk/download/pdf/12207017.pdf" className="external-link" target="_blank" rel="noopener noreferrer">Open Access</a>
                    </li>
                    
                    <li className="publication-item">
                        <div className="publication-title">Genre and Expression in Extreme Metal Music, ca. 1990–2015</div>
                        <div className="publication-authors">
                            <span className="publication-author">Smialek, Eric</span> (2015)
                        </div>
                        <div className="publication-meta">PhD thesis, McGill University</div>
                        <a href="https://www.academia.edu/24562305/Genre_and_Expression_in_Extreme_Metal_Music_ca_1990_2015" className="external-link" target="_blank" rel="noopener noreferrer">Open Access</a>
                    </li>
                    
                    <li className="publication-item">
                        <div className="publication-title">"It's kind of in the middle": The 'Mid-Fi' Aesthetic: Toward a New Designation of Black Metal Aesthetic of Recording. The Case of the Québec Black Metal Scene</div>
                        <div className="publication-authors">
                            <span className="publication-author">St-Laurent, Méi-Ra</span> (2019)
                        </div>
                        <div className="publication-meta">In Gullö, J.O., Rambarran, S., & Isakoff, K., (Eds.), Proceedings of the 12th Art of Record Production Conference Mono: Stereo: Multi. Stockholm: Royal College of Music, pp. 267–286</div>
                        <a href="https://www.arpjournal.com/asarpwp/wp-content/uploads/2021/12/Mei-Ra-St-Laurent_ARP2019.pdf" className="external-link" target="_blank" rel="noopener noreferrer">Open Access</a>
                    </li>
                    
                    <li className="publication-item">
                        <div className="publication-title">Production Perspectives of Heavy Metal Record Producers</div>
                        <div className="publication-authors">
                            <span className="publication-author">Thomas, Niall</span> (2019)
                        </div>
                        <div className="publication-meta">Popular Music, 38(3), pp. 498–517</div>
                        <a href="https://cris.winchester.ac.uk/ws/portalfiles/portal/2648727/271019_Thomas_ProductionHeavyMetal_withstatement.pdf" className="external-link" target="_blank" rel="noopener noreferrer">Open Access</a>
                    </li>
                    
                    <li className="publication-item">
                        <div className="publication-title">The Development of Technology and its Influence on Recorded Heavy Metal Music 1969-2015</div>
                        <div className="publication-authors">
                            <span className="publication-author">Thomas, Niall</span> (2015)
                        </div>
                        <div className="publication-meta">PhD thesis, University of Hull</div>
                        <a href="https://www.academia.edu/25049600/The_Development_of_Technology_and_its_Influence_on_Recorded_Heavy_Metal_Music_1969_2015" className="external-link" target="_blank" rel="noopener noreferrer">Open Access</a>
                    </li>
                    
                    <li className="publication-item">
                        <div className="publication-title">Outlining the Fundamental Production Aesthetics of Commercial Heavy Metal Music Utilising Systematic Empirical Analysis</div>
                        <div className="publication-authors">
                            <span className="publication-author">Turner, Dan</span> (2009)
                        </div>
                        <div className="publication-meta">The Art of Record Production Conference, Cardiff</div>
                        <a href="https://www.artofrecordproduction.com/aorpjoom/arp-conferences/arp-archive-conference-papers/21-arp-2009/117-turner-2009" className="external-link" target="_blank" rel="noopener noreferrer">Open Access</a>
                    </li>
                    
                    <li className="publication-item">
                        <div className="publication-title">Heaviness: A Key Concept of Metal Music Through the Lens of Deleuzian Philosophy</div>
                        <div className="publication-authors">
                            <span className="publication-author">Volák, Vojtěch</span> (2022)
                        </div>
                        <div className="publication-meta">Studia de Cultura, 14(3), pp. 53–62</div>
                        <a href="https://doi.org/10.24917/20837275.14.3.4" className="external-link" target="_blank" rel="noopener noreferrer">Access</a>
                    </li>
                    
                    <li className="publication-item">
                        <div className="publication-title">Tracking Timbral Changes in Metal Productions from 1990 to 2013</div>
                        <div className="publication-authors">
                            <span className="publication-author">Williams, Duncan</span> (2015)
                        </div>
                        <div className="publication-meta">Metal Music Studies, 1(1), pp. 39–68</div>
                        <a href="https://www.ingentaconnect.com/content/intellect/mms/2014/00000001/00000001/art00004" className="external-link" target="_blank" rel="noopener noreferrer">Access</a>
                    </li>
                    
                    <li className="publication-item">
                        <div className="publication-title">Real and Unreal Performances: The Interaction of Recording Technology and Rock Drum Kit Performance</div>
                        <div className="publication-authors">
                            <span className="publication-author">Zagorski-Thomas, Simon</span> (2010)
                        </div>
                        <div className="publication-meta">In Anne Danielsen (ed). Musical Rhythm in the Age of Digital Reproduction. Farnham: Ashgate, pp. 195–212</div>
                        <a href="https://www.academia.edu/1554745/_Real_and_Unreal_Performances_Chapter_in_Rhythm_In_The_Age_of_Digital_Reproduction_edited_by_Anne_Danielsen" className="external-link" target="_blank" rel="noopener noreferrer">Open Access</a>
                    </li>
                </ul>
                </div>
            </section>
        </div>

        <button className="accordion">Professional Resources</button>
        <div className="panel">
            <section className="content-section bibliography-section" id="professional-resources" style={{ paddingTop: "20px" }}>
                <div className="container">
                <h4 className="section-heading">Professional Resources</h4>
                <ul className="publication-list">
                    <li className="publication-item">
                        <div className="publication-title"><a href="https://www.youtube.com/channel/UCsP-jKD7lKkfBZZ-wfzTocQ" target="_blank">Mark Mynett's YouTube channel with tutorials and video interviews with renowned metal producers</a></div>
                    </li>
                    
                    <li className="publication-item">
                        <div className="publication-title"><a href="https://www.youtube.com/watch?v=f-Uy9d2H2ak" target="_blank">Mark Mynett's tutorial to recording and mixing metal music</a></div>
                    </li>
                    
                    <li className="publication-item">
                        <div className="publication-title"><a href="https://www.soundonsound.com/" target="_blank">Sound on Sound: Useful (online) magazine and forum for music production with many resources for rock and metal</a></div>
                    </li>
                    
                    <li className="publication-item">
                        <div className="publication-title"><a href="https://www.nailthemix.com/" target="_blank">Nail the Mix: Online recording school for metal production with monthly mix-throughs by internationally renowned producers</a></div>
                    </li>
                    
                    <li className="publication-item">
                        <div className="publication-title"><a href="https://www.pensadosplace.tv/category/into-the-lair" target="_blank">Pensado's Place – Into the Lair: Not focused on metal, but tons of studio tricks by renowned mixing engineer Dave Pensado</a></div>
                    </li>
                    
                    <li className="publication-item">
                        <div className="publication-title"><a href="https://www.recordproduction.com/" target="_blank">Record Production: Great resource for all sorts of recording, engineering and production</a></div>
                    </li>
                </ul>
                </div>
            </section>
        </div>
    </main>
  );
}
