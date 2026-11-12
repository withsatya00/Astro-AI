import { Navigate, useParams } from 'react-router-dom';

// Puja pages used to be a separate, hard-coded catalogue. A puja is a seva at a temple, so /puja/:slug now opens
// that temple's page, where the real offerings and prices are booked through the backend.
export default function PujaDetailPage() {
  const { slug } = useParams();
  return <Navigate to={slug ? `/mandir-seva/temple/${encodeURIComponent(slug)}` : '/mandir-seva'} replace />;
}

