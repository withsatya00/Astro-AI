import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import HomePage from '../pages/HomePage/HomePage.jsx';
import DirectoryPage from '../pages/DirectoryPage/DirectoryPage.jsx';
import ProfilePage from '../pages/ProfilePage/ProfilePage.jsx';
import MandirSevaPage from '../pages/MandirSevaPage/MandirSevaPage.jsx';
import TempleDetailPage from '../pages/TemplePage/TempleDetailPage.jsx';
import PujaDetailPage from '../pages/PujaDetailPage/PujaDetailPage.jsx';
import GauSewaPage from '../pages/GauSewaPage/GauSewaPage.jsx';
import AstroMallPage from '../pages/AstroMallPage/AstroMallPage.jsx';
import ProductDetailPage from '../pages/ProductPage/ProductDetailPage.jsx';
import CalculatorsPage from '../pages/CalculatorsPage/CalculatorsPage.jsx';
import ConsultationRoom from '../pages/ConsultationPage/ConsultationRoom.jsx';
import WalletPage from '../pages/WalletPage/WalletPage.jsx';
import AccountPage from '../pages/AccountPage/AccountPage.jsx';
import RashiphalPage from '../pages/HoroscopePage/RashiphalPage.jsx';
import PanchangPage from '../pages/PanchangPage/PanchangPage.jsx';
import NotFoundPage from '../pages/NotFoundPage/NotFoundPage.jsx';

// The Bhakti section is split into its own chunk; most visitors never open it.
const BhaktiLayout = lazy(() => import('../pages/BhaktiPage/BhaktiLayout.jsx'));
const BhaktiHome = lazy(() => import('../pages/BhaktiPage/BhaktiHome.jsx'));
const NaamJaap = lazy(() => import('../pages/BhaktiPage/NaamJaap.jsx'));
const MyBhakti = lazy(() => import('../pages/BhaktiPage/MyBhakti.jsx'));
const AartiLibrary = lazy(() => import('../pages/BhaktiPage/AartiLibrary.jsx'));
const AartiDetail = lazy(() => import('../pages/BhaktiPage/AartiDetail.jsx'));
// Gita, Bhajan Radio, Mandir Darshan, Shankaracharya, Vedanta and Admin pages are not built yet;
// their routes show ComingSoon until those pages are added.
const ComingSoon = lazy(() => import('../pages/BhaktiPage/ComingSoon.jsx'));

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/astrologers" element={<DirectoryPage />} />
      <Route path="/astrologers/:slug" element={<ProfilePage />} />
      <Route path="/consultation" element={<ConsultationRoom />} />
      <Route path="/consultation/:slug" element={<ConsultationRoom />} />
      <Route path="/consult/:slug" element={<ConsultationRoom />} />
      <Route path="/mandir-seva" element={<MandirSevaPage />} />
      <Route path="/mandir-seva/puja" element={<MandirSevaPage section="puja" />} />
      <Route path="/mandir-seva/events" element={<MandirSevaPage section="all" />} />
      <Route path="/mandir-seva/chadhava" element={<TempleDetailPage />} />
      <Route path="/chadhava" element={<TempleDetailPage />} />
      <Route path="/mandir-seva/puja/:slug" element={<PujaDetailPage />} />
      <Route path="/puja/:slug" element={<PujaDetailPage />} />
      <Route path="/mandir-seva/temple/:slug" element={<TempleDetailPage />} />
      <Route path="/temple/:slug" element={<TempleDetailPage />} />
      <Route path="/chadhava/:slug" element={<TempleDetailPage />} />
      <Route path="/mandir-seva/chadhava/:slug" element={<TempleDetailPage />} />
      <Route path="/gau-sewa" element={<GauSewaPage />} />
      <Route path="/astro-mall" element={<AstroMallPage />} />
      <Route path="/mall" element={<AstroMallPage />} />
      <Route path="/astro-mall/product/:id" element={<ProductDetailPage />} />
      <Route path="/mall/product/:id" element={<ProductDetailPage />} />
      <Route path="/calculators" element={<CalculatorsPage />} />
      <Route path="/calculators/:slug" element={<CalculatorsPage />} />
      <Route path="/rashiphal" element={<RashiphalPage />} />
      <Route path="/panchang" element={<PanchangPage />} />
      <Route path="/bhakti" element={<Suspense fallback={<div style={{ minHeight: '50vh' }} />}><BhaktiLayout /></Suspense>}>
        <Route index element={<BhaktiHome />} />
        <Route path="naam-jaap" element={<NaamJaap />} />
        <Route path="my-bhakti" element={<MyBhakti />} />
        <Route path="admin" element={<ComingSoon title="Bhakti Admin" />} />
        <Route path="aarti-chalisa" element={<AartiLibrary />} />
        <Route path="aarti-chalisa/:slug" element={<AartiDetail />} />
        <Route path="shankaracharya" element={<ComingSoon title="Shankaracharya" hi="शंकराचार्य" />} />
        <Route path="vedanta" element={<ComingSoon title="Vedanta" hi="वेदांत" />} />
        <Route path="bhagavad-gita" element={<ComingSoon title="Bhagavad Gita" hi="भगवद् गीता" />} />
        <Route path="bhagavad-gita/:chapter" element={<ComingSoon title="Bhagavad Gita" hi="भगवद् गीता" />} />
        <Route path="bhajan-radio" element={<ComingSoon title="Bhajan Radio" hi="भजन रेडियो" />} />
        <Route path="mandir-darshan" element={<ComingSoon title="Mandir Darshan" hi="मंदिर दर्शन" />} />
        <Route path="mandir-darshan/:slug" element={<ComingSoon title="Mandir Darshan" hi="मंदिर दर्शन" />} />
        <Route path="puja-vidhi" element={<ComingSoon title="Puja Vidhi" hi="पूजा विधि" />} />
        <Route path="festivals" element={<ComingSoon title="Festivals & Vrat" hi="व्रत त्योहार" />} />
      </Route>
      <Route path="/wallet" element={<WalletPage />} />
      <Route path="/profile" element={<AccountPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
