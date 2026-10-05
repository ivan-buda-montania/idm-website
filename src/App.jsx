import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { LanguageProvider } from './context/LanguageContext.jsx';
import { CatalogProvider } from './context/CatalogContext.jsx';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import AILayout from './components/AILayout';
import WhatsAppButton from './components/WhatsAppButton';
import HomePage from './pages/HomePage';
import MachineryPage from './pages/MachineryPage';
import ProductDetailPage from './pages/ProductDetailPage';

function PublicLayout() {
  return (
    <LanguageProvider>
      <CatalogProvider>
        <Navbar />
        <AILayout>
          <Outlet />
        </AILayout>
        <Footer />
        <WhatsAppButton />
      </CatalogProvider>
    </LanguageProvider>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/machinery" element={<MachineryPage />} />
          <Route path="/products" element={<ProductDetailPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
