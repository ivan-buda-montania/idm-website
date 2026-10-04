import { Link } from 'react-router-dom';
import { useLanguage } from '../context/languageContext';
import { PHONE, EMAIL } from '../data/contact';

export default function Footer() {
  const { t } = useLanguage();
  return (
    <footer className="footer-main">
      <div className="footer-grid">
        <div className="footer-brand footer-col">
          <img src="/assets/idm-logo.png" alt="IDM Internacional" style={{ height: 64, filter: 'brightness(0) invert(1)', opacity: 0.9 }} />
          <p>{t('footer.description')}</p>
        </div>

        <div className="footer-col">
          <h4>{t('footer.navigation')}</h4>
          <Link to="/">{t('nav.home')}</Link>
          <Link to="/#about">{t('nav.aboutUs')}</Link>
          <Link to="/#contact">{t('nav.contact')}</Link>
        </div>

        <div className="footer-col">
          <h4>{t('footer.products')}</h4>
          <Link to="/machinery">{t('nav.machinery')}</Link>
        </div>

        <div className="footer-col">
          <h4>{t('footer.contactInfo')}</h4>
          <a href={`tel:+${PHONE}`}>{t('common.phone')}</a>
          <a href={`mailto:${EMAIL}`}>{EMAIL}</a>
          <p>{t('common.location')}</p>
        </div>
      </div>

      <div className="footer-bottom">
        <span>{t('footer.allRightsReserved')}</span>
        <div className="footer-bottom-links">
          <Link to="/#contact">{t('footer.contactUsLink')}</Link>
        </div>
      </div>
    </footer>
  );
}
