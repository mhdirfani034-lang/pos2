/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { POSProvider, usePOS } from './context/POSContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar, ActiveTab } from './components/layout/Sidebar';
import { POSCashier } from './components/pos/POSCashier';
import { ProductManagement } from './components/products/ProductManagement';
import { UserManagement } from './components/users/UserManagement';
import { SalesReport } from './components/reports/SalesReport';
import { TransactionHistory } from './components/history/TransactionHistory';
import { LaravelBackendHub } from './components/laravel/LaravelBackendHub';
import { ReceiptModal } from './components/pos/ReceiptModal';
import { LoginModal } from './components/auth/LoginModal';

function POSAppContent() {
  const { currentUser, activeReceipt, setActiveReceipt } = usePOS();
  const [activeTab, setActiveTab] = useState<ActiveTab>('pos');
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // If user is Kasir and navigates to reports or user management, fallback to 'pos'
  const isKasir = currentUser?.role === 'kasir';
  const effectiveTab: ActiveTab =
    isKasir && (activeTab === 'reports' || activeTab === 'users') ? 'pos' : activeTab;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
      {/* Top Navbar */}
      <Navbar onOpenLogin={() => setIsLoginModalOpen(true)} />

      {/* Main Layout Area */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Navigation Sidebar */}
        <Sidebar activeTab={effectiveTab} setActiveTab={setActiveTab} />

        {/* Content Viewport */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-950">
          <div className="max-w-7xl mx-auto h-full">
            {effectiveTab === 'pos' && <POSCashier />}
            {effectiveTab === 'products' && <ProductManagement />}
            {effectiveTab === 'users' && <UserManagement />}
            {effectiveTab === 'reports' && <SalesReport />}
            {effectiveTab === 'history' && <TransactionHistory />}
            {effectiveTab === 'laravel' && <LaravelBackendHub />}
          </div>
        </main>
      </div>

      {/* Global Thermal Receipt Modal */}
      <ReceiptModal
        receipt={activeReceipt}
        onClose={() => setActiveReceipt(null)}
      />

      {/* Login / Auth Modal */}
      <LoginModal
        isOpen={isLoginModalOpen || !currentUser}
        onClose={() => setIsLoginModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <POSProvider>
      <POSAppContent />
    </POSProvider>
  );
}
