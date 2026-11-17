import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import AppProviders from './app/AppProviders.jsx';
import Layout from './layouts/Layout.jsx';
import AppRoutes from './routes/AppRoutes.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <AppProviders>
        <Layout>
          <AppRoutes />
        </Layout>
      </AppProviders>
    </BrowserRouter>
  );
}
