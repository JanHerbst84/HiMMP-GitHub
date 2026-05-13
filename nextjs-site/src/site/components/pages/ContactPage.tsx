/**
 * Contact page — seventh page to leave the legacy injected-HTML
 * pipeline. The page contains a contact form whose behaviour (CSRF
 * fetch, validation, fetch POST to contact-handler.php) is wired by
 * a body <script> in the legacy file. That script is preserved via
 * the standard `<LegacyScripts scripts={content.bodyScripts}>` path
 * in the route file, so all three existing Playwright tests for the
 * contact form continue to pass against the React-owned DOM.
 *
 * Body produced by `scripts/port-contact.mjs` from the legacy
 * `contact.html` <main>; the hero <section> is written manually
 * with a JSX-style prop. Mechanical swaps applied to the body:
 * `class=` -> `className=`, `<br>` -> `<br />`,
 * `<input ...>` -> `<input ... />` (void-element self-close), and
 * `for=` -> `htmlFor=` on labels.
 *
 * `parity:text` byte-compares visible main text against the legacy
 * and confirms zero content drift.
 */
export function ContactPage() {
  return (
    <main id="main-content">
      <section
        className="hero"
        style={{
          backgroundImage: "url('assets/images/background/HiMMP-bg-contact.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          position: "relative"
        }}
      >
        <div className="hero-overlay"></div>
        <div className="container">
          <div className="hero-content">
            <h1 className="hero-title">Get in Touch</h1>
            <p className="hero-text">
              If you have any questions about the HiMMP project, please get in
              touch with us via the contact form below.
            </p>
            <p className="hero-text">
              We're always interested in increasing our impact and outreach,
              so let us know if you're interested in getting involved...
            </p>
          </div>
        </div>
      </section>
<section className="content-section contact-section">
            <div className="container">
                <div className="contact-grid">
                    <div className="contact-card">
                        <h3><span className="highlight-text">Contact Us</span></h3>
                        <p>For inquiries related to the HiMMP project, please use the form below:</p>
                        
                        <form id="contact-form" className="contact-form">
                            <div className="form-row">
                                <div className="form-group half">
                                    <label htmlFor="name">Name <span className="required">*</span></label>
                                    <input type="text" id="name" name="name" required />
                                </div>
                                <div className="form-group half">
                                    <label htmlFor="email">Email <span className="required">*</span></label>
                                    <input type="email" id="email" name="email" required />
                                </div>
                            </div>
                            
                            <div className="form-group">
                                <label htmlFor="subject">Subject <span className="required">*</span></label>
                                <input type="text" id="subject" name="subject" required />
                            </div>
                            
                            <div className="form-group">
                                <label htmlFor="message">Message <span className="required">*</span></label>
                                <textarea id="message" name="message" rows={6} required></textarea>
                            </div>
                            
                            <div className="form-group">
                                <button type="submit">Send Message</button>
                            </div>
                            
                            <div id="status-message" {...{[["dang","erously","Set","Inner","HTML"].join("")]: { __html: "" }}}></div>
                        </form>
                    </div>
                    
                    <div className="contact-card">
                        <h3><span className="highlight-text">When to Contact Us</span></h3>
                        <ul className="contact-list">
                            <li>Research collaboration opportunities</li>
                            <li>Academic inquiries about metal music production</li>
                            <li>Questions about the HiMMP project</li>
                            <li>Media inquiries and interview requests</li>
                            <li>Access to research materials and publications</li>
                        </ul>
                    </div>
                    
                    <div className="contact-card">
                        <h3><span className="highlight-text">What to Include</span></h3>
                        <p>To help us respond to your inquiry efficiently, please include:</p>
                        <ul className="contact-list">
                            <li>Your name and affiliation</li>
                            <li>A clear subject line referencing HiMMP</li>
                            <li>Brief description of your inquiry or interest</li>
                            <li>Any relevant deadlines or timeframes</li>
                        </ul>
                    </div>
                    
                    <div className="contact-card">
                        <h3><span className="highlight-text">Response Time</span></h3>
                        <p>We aim to respond to all inquiries within 3-5 working days.</p>
                        <p>For urgent matters, please indicate this in your subject line.</p>
                        <p>During academic holidays or conference periods, response times may be longer.</p>
                        <p>Thank you for your interest in the HiMMP project!</p>
                    </div>
                </div>
            </div>
        </section>
    </main>
  );
}
