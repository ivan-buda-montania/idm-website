import { useLanguage } from '../context/languageContext';
import { PHONE } from '../data/contact';

export default function WhatsAppButton() {
  const { t } = useLanguage();
  const href = `https://wa.me/${PHONE}?text=${encodeURIComponent(t('whatsappButton.message'))}`;

  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="whatsapp-fab" aria-label={t('whatsappButton.label')}>
      <i className="fab fa-whatsapp"></i>
      <span className="whatsapp-fab-label">{t('whatsappButton.label')}</span>
    </a>
  );
}
