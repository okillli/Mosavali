import React, { useState, useEffect, ReactNode, Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import { PageLoader } from './components/PageLoader';
import { STRINGS } from './lib/strings';

// Eagerly load auth pages (needed immediately)
import Landing from './app/page';
import Login from './app/login/page';
import AppLayout from './app/app/layout';

// Lazy load all app pages for code splitting
const Dashboard = lazy(() => import('./app/app/page'));
const FieldsList = lazy(() => import('./app/app/fields/page'));
const NewFieldPage = lazy(() => import('./app/app/fields/new/page'));
const FieldDetailPage = lazy(() => import('./app/app/fields/[id]/page'));
const FieldEditPage = lazy(() => import('./app/app/fields/[id]/edit/page'));
const WorksList = lazy(() => import('./app/app/works/page'));
const NewWorkPage = lazy(() => import('./app/app/works/new/page'));
const WorkDetailPage = lazy(() => import('./app/app/works/[id]/page'));
const WorkEditPage = lazy(() => import('./app/app/works/[id]/edit/page'));
const LotsList = lazy(() => import('./app/app/lots/page'));
const NewLotPage = lazy(() => import('./app/app/lots/new/page'));
const LotDetailPage = lazy(() => import('./app/app/lots/[id]/page'));
const LotEditPage = lazy(() => import('./app/app/lots/[id]/edit/page'));
const WarehousesList = lazy(() => import('./app/app/warehouses/page'));
const NewWarehousePage = lazy(() => import('./app/app/warehouses/new/page'));
const WarehouseDetailPage = lazy(() => import('./app/app/warehouses/[id]/page'));
const WarehouseEditPage = lazy(() => import('./app/app/warehouses/[id]/edit/page'));
const SalesList = lazy(() => import('./app/app/sales/page'));
const NewSalePage = lazy(() => import('./app/app/sales/new/page'));
const SaleDetailPage = lazy(() => import('./app/app/sales/[id]/page'));
const SaleEditPage = lazy(() => import('./app/app/sales/[id]/edit/page'));
const ExpensesList = lazy(() => import('./app/app/expenses/page'));
const NewExpensePage = lazy(() => import('./app/app/expenses/new/page'));
const ExpenseDetailPage = lazy(() => import('./app/app/expenses/[id]/page'));
const ExpenseEditPage = lazy(() => import('./app/app/expenses/[id]/edit/page'));
const ReportsPage = lazy(() => import('./app/app/reports/page'));
const TransferPage = lazy(() => import('./app/app/transfer/page'));
const SettingsPage = lazy(() => import('./app/app/settings/page'));
const SeasonsSettings = lazy(() => import('./app/app/settings/seasons/page'));
const VarietiesSettings = lazy(() => import('./app/app/settings/varieties/page'));
const BuyersSettings = lazy(() => import('./app/app/settings/buyers/page'));
const WorkTypesSettings = lazy(() => import('./app/app/settings/work-types/page'));

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

    // App Routes - wrapped in Suspense for lazy loading
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
      else if (route === '/app/settings/work-types') page = <WorkTypesSettings />;

      // Dynamic Matches - Edit pages (must be before detail pages)
      else if (route.match(/^\/app\/fields\/[^/]+\/edit$/)) page = <FieldEditPage />;
      else if (route.match(/^\/app\/works\/[^/]+\/edit$/)) page = <WorkEditPage />;
      else if (route.match(/^\/app\/lots\/[^/]+\/edit$/)) page = <LotEditPage />;
      else if (route.match(/^\/app\/warehouses\/[^/]+\/edit$/)) page = <WarehouseEditPage />;
      else if (route.match(/^\/app\/sales\/[^/]+\/edit$/)) page = <SaleEditPage />;
      else if (route.match(/^\/app\/expenses\/[^/]+\/edit$/)) page = <ExpenseEditPage />;

      // Dynamic Matches - Detail pages
      else if (route.match(/^\/app\/fields\/[^/]+$/)) page = <FieldDetailPage />;
      else if (route.match(/^\/app\/works\/[^/]+$/)) page = <WorkDetailPage />;
      else if (route.match(/^\/app\/lots\/[^/]+$/)) page = <LotDetailPage />;
      else if (route.match(/^\/app\/warehouses\/[^/]+$/)) page = <WarehouseDetailPage />;
      else if (route.match(/^\/app\/sales\/[^/]+$/)) page = <SaleDetailPage />;
      else if (route.match(/^\/app\/expenses\/[^/]+$/)) page = <ExpenseDetailPage />;

      return (
        <AppLayout>
          <Suspense fallback={<PageLoader />}>
            {page}
          </Suspense>
        </AppLayout>
      );
    }

    return <div className="p-4 text-center">{STRINGS.PAGE_NOT_FOUND}</div>;
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
  declare props: ErrorBoundaryProps;
  state: ErrorBoundaryState = { hasError: false, message: '' };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, message: error.message || String(error) };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 text-red-600 bg-red-50 min-h-screen">
          <h2 className="font-bold mb-2">{STRINGS.APP_ERROR}</h2>
          <pre className="text-sm overflow-auto">{this.state.message}</pre>
          <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-red-600 text-white rounded">
            {STRINGS.RELOAD}
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
