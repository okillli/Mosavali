import React, { useState, useEffect, ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import Landing from './app/page';
import Login from './app/login/page';
import AppLayout from './app/app/layout';

// Pages
import Dashboard from './app/app/page';
import FieldsList from './app/app/fields/page';
import NewFieldPage from './app/app/fields/new/page';
import FieldDetailPage from './app/app/fields/[id]/page';
import WorksList from './app/app/works/page';
import NewWorkPage from './app/app/works/new/page';
import WorkDetailPage from './app/app/works/[id]/page';
import LotsList from './app/app/lots/page';
import NewLotPage from './app/app/lots/new/page';
import LotDetailPage from './app/app/lots/[id]/page';
import WarehousesList from './app/app/warehouses/page';
import NewWarehousePage from './app/app/warehouses/new/page';
import WarehouseDetailPage from './app/app/warehouses/[id]/page';
import SalesList from './app/app/sales/page';
import NewSalePage from './app/app/sales/new/page';
import SaleDetailPage from './app/app/sales/[id]/page';
import ExpensesList from './app/app/expenses/page';
import NewExpensePage from './app/app/expenses/new/page';
import ReportsPage from './app/app/reports/page';
import TransferPage from './app/app/transfer/page';
import SettingsPage from './app/app/settings/page';
import SeasonsSettings from './app/app/settings/seasons/page';
import VarietiesSettings from './app/app/settings/varieties/page';
import BuyersSettings from './app/app/settings/buyers/page';

// Declare global to fix window property error
declare global {
  interface Window {
    mockNavigate: (path: string) => void;
  }
}

// Global navigation shim
window.mockNavigate = (path: string) => {
  window.location.hash = path;
};

const Router = () => {
  const [route, setRoute] = useState(window.location.hash.slice(1) || '/');

  useEffect(() => {
    const onHashChange = () => setRoute(window.location.hash.slice(1));
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  // Simple Router Matching
  const renderContent = () => {
    if (route === '/' || route === '') return <Landing />;
    if (route === '/login') return <Login />;

    // App Routes
    if (route.startsWith('/app')) {
      let page: ReactNode = <Dashboard />;
      
      // Exact Matches
      if (route === '/app') page = <Dashboard />;
      else if (route === '/app/fields') page = <FieldsList />;
      else if (route === '/app/fields/new') page = <NewFieldPage />;
      else if (route === '/app/works') page = <WorksList />;
      else if (route === '/app/works/new') page = <NewWorkPage />;
      else if (route === '/app/lots') page = <LotsList />;
      else if (route === '/app/lots/new') page = <NewLotPage />;
      else if (route === '/app/warehouses') page = <WarehousesList />;
      else if (route === '/app/warehouses/new') page = <NewWarehousePage />;
      else if (route === '/app/sales') page = <SalesList />;
      else if (route === '/app/sales/new') page = <NewSalePage />;
      else if (route === '/app/expenses') page = <ExpensesList />;
      else if (route === '/app/expenses/new') page = <NewExpensePage />;
      else if (route === '/app/reports') page = <ReportsPage />;
      else if (route === '/app/transfer') page = <TransferPage />;
      else if (route === '/app/settings') page = <SettingsPage />;
      else if (route === '/app/settings/seasons') page = <SeasonsSettings />;
      else if (route === '/app/settings/varieties') page = <VarietiesSettings />;
      else if (route === '/app/settings/buyers') page = <BuyersSettings />;

      // Dynamic Matches (Basic regex or split)
      else if (route.match(/^\/app\/fields\/[^/]+$/)) page = <FieldDetailPage />;
      else if (route.match(/^\/app\/works\/[^/]+$/)) page = <WorkDetailPage />;
      else if (route.match(/^\/app\/lots\/[^/]+$/)) page = <LotDetailPage />;
      else if (route.match(/^\/app\/warehouses\/[^/]+$/)) page = <WarehouseDetailPage />;
      else if (route.match(/^\/app\/sales\/[^/]+$/)) page = <SaleDetailPage />;

      // Fix "Property children is missing" error by explicitly passing prop
      return <AppLayout children={page} />;
    }

    return <div className="p-4 text-center">404 - Not Found</div>;
  };

  return <>{renderContent()}</>;
};

// Types for ErrorBoundary
interface ErrorBoundaryProps { 
  children: ReactNode;
}
interface ErrorBoundaryState { 
  hasError: boolean; 
  message: string; 
}

// Error Boundary to catch Router hooks errors
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, message: '' };
  
  static getDerivedStateFromError(error: any): ErrorBoundaryState {
    return { hasError: true, message: error.message || String(error) };
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 text-red-600 bg-red-50 min-h-screen">
          <h2 className="font-bold mb-2">Application Error</h2>
          <pre className="text-sm overflow-auto">{this.state.message}</pre>
          <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-red-600 text-white rounded">
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const root = createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <Router />
    </ErrorBoundary>
  </React.StrictMode>
);