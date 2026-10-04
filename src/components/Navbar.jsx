import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/languageContext';

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { lang, toggleLanguage, t } = useLanguage();

  useEffect(() => {
    if (location.hash) {
      const elementId = location.hash.slice(1);
      const element = document.getElementById(elementId);
      if (element) {
        setTimeout(() => element.scrollIntoView({ behavior: 'smooth' }), 0);
      }
    } else if (location.pathname === '/') {
      window.scrollTo(0, 0);
    }
  }, [location]);

  // Close the mobile menu on navigation (state adjusted during render, not in an effect).
  const [menuPath, setMenuPath] = useState(location.pathname);
  if (menuPath !== location.pathname) {
    setMenuPath(location.pathname);
    setMobileOpen(false);
  }

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const handleAnchorClick = (hash) => (e) => {
    e.preventDefault();
    setMobileOpen(false);
    if (location.pathname !== '/') {
      navigate('/' + hash);
    } else {
      navigate(hash);
    }
  };

  return (
    <>
      <nav className="navbar">
        <div className="logo-area">
          <Link to="/">
            <img src="/assets/idm-logo.png" alt="IDM Internacional" width="94" height="53" />
          </Link>
        </div>

        {/* Desktop nav */}
        <div className="nav-links">
          <Link to="/" className={`nav-link${location.pathname === '/' ? ' active' : ''}`}>{t('nav.home')}</Link>
          <a href="#about" onClick={handleAnchorClick('#about')} className="nav-link">{t('nav.aboutUs')}</a>
          <Link to="/machinery" className={`nav-link${location.pathname === '/machinery' ? ' active' : ''}`}>{t('nav.machinery')}</Link>
          <a href="#contact" onClick={handleAnchorClick('#contact')} className="nav-link">{t('nav.contact')}</a>

          <button
            onClick={toggleLanguage}
            className="lang-toggle"
          >
            {lang.toUpperCase()}
          </button>

          <a href="#contact" onClick={handleAnchorClick('#contact')} className="nav-cta">
            <i className="fas fa-envelope"></i> {t('nav.contactUs')}
          </a>
        </div>

        {/* Mobile right side: lang + hamburger */}
        <div className="mobile-nav-right">
          <button onClick={toggleLanguage} className="lang-toggle">
            {lang.toUpperCase()}
          </button>
          <button
            className="hamburger"
            onClick={() => setMobileOpen(o => !o)}
            aria-label="Toggle menu"
          >
            <span className={`hamburger-icon${mobileOpen ? ' open' : ''}`}>
              <span></span>
              <span></span>
              <span></span>
            </span>
          </button>
        </div>
      </nav>

      {/* Mobile menu overlay */}
      {mobileOpen && (
        <div className="mobile-overlay" onClick={() => setMobileOpen(false)} />
      )}

      {/* Mobile drawer */}
      <div className={`mobile-drawer${mobileOpen ? ' open' : ''}`}>
        <div className="mobile-drawer-inner">
          <Link to="/" className="mobile-link" onClick={() => setMobileOpen(false)}>
            <i className="fas fa-home"></i> {t('nav.home')}
          </Link>
          <a href="#about" className="mobile-link" onClick={handleAnchorClick('#about')}>
            <i className="fas fa-info-circle"></i> {t('nav.aboutUs')}
          </a>
          <Link to="/machinery" className="mobile-link" onClick={() => setMobileOpen(false)}>
            <i className="fas fa-cog"></i> {t('nav.machinery')}
          </Link>
          <a href="#contact" className="mobile-link" onClick={handleAnchorClick('#contact')}>
            <i className="fas fa-envelope"></i> {t('nav.contact')}
          </a>
          <a href="#contact" onClick={handleAnchorClick('#contact')} className="mobile-cta">
            <i className="fas fa-envelope"></i> {t('nav.contactUs')}
          </a>
        </div>
      </div>
    </>
  );
}
