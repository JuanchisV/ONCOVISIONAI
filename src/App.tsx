import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout.tsx';
import Welcome from './pages/Welcome.tsx';
import Dashboard from './pages/Dashboard.tsx';
import TumorConfig from './pages/TumorConfig.tsx';
import TreatmentSim from './pages/TreatmentSim.tsx';
import { DiagnosticProvider } from './contexts/DiagnosticContext.tsx';

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export default function App() {
  return (
    <DiagnosticProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Welcome />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/tumor-config" element={<TumorConfig />} />
            <Route path="/simulation" element={<TreatmentSim />} />
          </Routes>
        </Layout>
      </Router>
    </DiagnosticProvider>
  );
}
