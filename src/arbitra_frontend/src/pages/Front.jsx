import React, { useState, useEffect } from 'react';
import { ArrowRight, ShieldCheck, Zap, Globe, Code } from 'lucide-react';
import { Link } from 'react-router-dom';
import arbitraLogo from '../assets/arbitra.png';
import './Front.css';

// Feature Card Component
const FeatureCard = ({ icon, title, description }) => {
  return (
    <div className="feature-card">
      <div className="feature-icon-container">
        {icon}
      </div>
      <h3 className="feature-title">{title}</h3>
      <p className="feature-description">{description}</p>
    </div>
  );
};

const Front = () => {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="landing-container">
      {/* Navigation */}
      <nav className="main-nav">
        <div to="/" className="logo-container">
          <div className="logo">
            <img src={arbitraLogo} alt="Arbitra logo" />
          </div>
          <span className="logo-text">Arbitra</span>
        </div>
        <div className="nav-links">
          <a href="#features" className="nav-link">Features</a>
          <a href="#ecosystem" className="nav-link">Ecosystem</a>
          <a href="#developers" className="nav-link">Developers</a>
          <a href="#roadmap" className="nav-link">Roadmap</a>
        </div>
        <button className="btn-primary">
          Launch App
        </button>
      </nav>

      {/* Hero Section */}
      <div className={`hero-section ${isVisible ? 'visible' : 'hidden'}`}>
        <div className="hero-content">
          <div className="hero-text">
            <h1 className="hero-title">
              Smart Contracts Reimagined on ICP
            </h1>
            <p className="hero-subtitle">
              Arbitra brings powerful, secure, and scalable smart contract solutions to the Internet Computer Protocol ecosystem.
            </p>
            <div className="hero-buttons">
              <Link to="/Login" className="btn-primary btn-with-icon">
                Get Started <ArrowRight className="btn-icon" />
              </Link>
              <button className="btn-secondary">
                Read Docs
              </button>
            </div>
          </div>
          <div className="hero-visual">
            <div className="code-container">
              <div className="code-glow"></div>
              <div className="code-card">
                <div className="code-header">
                  <Code className="code-icon" />
                  <div className="code-title">Arbitra Smart Contract</div>
                </div>
                <div className="code-block">
                  <div className="code-line">{'function createContract() {'}</div>
                  <div className="code-line code-indent">{'const terms = defineTerms();'}</div>
                  <div className="code-line code-indent">{'const validation = setValidation();'}</div>
                  <div className="code-line code-indent">{'return deployToICP(terms, validation);'}</div>
                  <div className="code-line">{'}'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="features-section">
        <div className="section-container">
          <div className="section-header">
            <h2 className="section-title">Why Choose Arbitra</h2>
            <p className="section-subtitle">
              Leveraging the power of ICP to bring next-generation smart contract capabilities
            </p>
          </div>
          
          <div className="features-grid">
            <FeatureCard 
              icon={<ShieldCheck className="feature-icon" />}
              title="Bulletproof Security"
              description="Advanced security protocols with formal verification and multi-stage audits to protect your assets"
            />
            <FeatureCard 
              icon={<Zap className="feature-icon" />}
              title="Lightning Fast"
              description="Unprecedented transaction speeds with near-instant finality powered by ICP's architecture"
            />
            <FeatureCard 
              icon={<Globe className="feature-icon" />}
              title="True Decentralization"
              description="Built on ICP for a fully decentralized experience without compromising on performance"
            />
          </div>
        </div>
      </div>

      {/* Ecosystem Section */}
      <div id="ecosystem" className="ecosystem-section">
        <div className="section-container">
          <div className="section-header">
            <h2 className="section-title">Powered by ICP Ecosystem</h2>
            <p className="section-subtitle">
              Seamlessly integrating with the Internet Computer Protocol to deliver the future of smart contracts
            </p>
          </div>
          
          <div className="ecosystem-container">
            <div className="ecosystem-glow"></div>
            <div className="ecosystem-content">
              <div className="ecosystem-grid">
                <div className="ecosystem-text">
                  <h3 className="ecosystem-title">Internet Computer Protocol</h3>
                  <p className="ecosystem-description">
                    Arbitra leverages the revolutionary capabilities of ICP to create a new generation of smart contracts that are faster, more secure, and truly scalable.
                  </p>
                  <ul className="ecosystem-list">
                    {[ 
                      "Canister-based smart contracts",
                      "Chain-key cryptography",
                      "WebAssembly execution environment",
                      "HTTP outcalls for oracle functionality"
                    ].map((item, index) => (
                      <li key={index} className="ecosystem-list-item">
                        <div className="list-bullet">
                          <ArrowRight className="bullet-icon" />
                        </div>
                        <span className="list-text">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="ecosystem-visual">
                  <div className="icp-orbit">
                    <div className="icp-glow"></div>
                    <div className="icp-circle">
                      <div className="icp-inner">
                        <div className="icp-content">
                          <div className="icp-title">ICP</div>
                          <div className="icp-subtitle">Ecosystem</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="cta-section">
        <div className="cta-container">
          <div className="cta-card">
            <div className="cta-glow"></div>
            <div className="cta-content">
              <h2 className="cta-title">Ready to Build the Future?</h2>
              <p className="cta-description">
                Join the growing community of developers and businesses leveraging Arbitra on ICP.
              </p>
              <button className="btn-primary btn-large">
                Launch Arbitra Platform
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="main-footer">
        <div className="footer-container">
          <div className="footer-content">
            <div className="footer-brand">
              <div className="footer-logo">Arbitra</div>
              <div className="footer-tagline">Smart Contracts on ICP</div>
            </div>
            <div className="footer-links">
              <div className="footer-column">
                <div className="footer-column-title">Platform</div>
                <ul className="footer-menu">
                  <li><a href="#" className="footer-link">Features</a></li>
                  <li><a href="#" className="footer-link">Security</a></li>
                  <li><a href="#" className="footer-link">Roadmap</a></li>
                </ul>
              </div>
              <div className="footer-column">
                <div className="footer-column-title">Developers</div>
                <ul className="footer-menu">
                  <li><a href="#" className="footer-link">Documentation</a></li>
                  <li><a href="#" className="footer-link">API</a></li>
                  <li><a href="#" className="footer-link">GitHub</a></li>
                </ul>
              </div>
              <div className="footer-column">
                <div className="footer-column-title">Community</div>
                <ul className="footer-menu">
                  <li><a href="#" className="footer-link">Discord</a></li>
                  <li><a href="#" className="footer-link">Twitter</a></li>
                  <li><a href="#" className="footer-link">Blog</a></li>
                </ul>
              </div>
              <div className="footer-column">
                <div className="footer-column-title">Resources</div>
                <ul className="footer-menu">
                  <li><a href="#" className="footer-link">About ICP</a></li>
                  <li><a href="#" className="footer-link">Whitepaper</a></li>
                  <li><a href="#" className="footer-link">Contact</a></li>
                </ul>
              </div>
            </div>
          </div>
          <div className="footer-copyright">
            &copy; {new Date().getFullYear()} Arbitra. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Front;
