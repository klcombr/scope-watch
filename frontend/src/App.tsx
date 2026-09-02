import { AuthProvider, useAuth } from './lib/auth';
import { LoginPage } from './pages/LoginPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { ProjectDetailPage } from './pages/ProjectDetailPage';
import { LandingPage } from './pages/LandingPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { TermsPage } from './pages/TermsPage';
import { AboutPage } from './pages/AboutPage';
import { SharePage } from './pages/SharePage';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';

function useHashRoute() {
  const parse = useCallback(() => {
    const hash = window.location.hash;
    const parts = hash.replace(/^#/, '').split('/').filter(Boolean);
    return { page: parts[0] ?? '', id: parts[1] ?? null };
  }, []);

  const [route, setRoute] = useState(parse);

  useEffect(() => {
    function onHashChange() {
      setRoute(parse());
    }
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, [parse]);

  return route;
}

const PUBLIC_ROUTES = new Set(['', 'privacy', 'terms', 'about', 'login', 'register', 'features', 'how-it-works', 'faq']);

function PageTransition({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  const prevChildren = useRef<ReactNode>(children);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (children !== prevChildren.current) {
      setVisible(false);
      prevChildren.current = children;
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setVisible(true), 20);
    } else {
      setVisible(true);
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [children]);

  return (
    <div
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'none' : 'translateY(6px)',
        transition: 'opacity 250ms cubic-bezier(0.16, 1, 0.3, 1), transform 250ms cubic-bezier(0.16, 1, 0.3, 1)',
        willChange: 'opacity, transform',
      }}
    >
      {children}
    </div>
  );
}

function AppInner() {
  const { user, loading } = useAuth();
  const route = useHashRoute();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
      </div>
    );
  }

  const isPublic = PUBLIC_ROUTES.has(route.page);

  let page: React.ReactNode;

  if (route.page === 'share' && route.id) {
    page = <SharePage token={route.id} />;
  } else if (!user && !isPublic) {
    page = <LoginPage />;
  } else if (route.page === 'login' || route.page === 'register') {
    page = <LoginPage />;
  } else if (route.page === 'privacy') {
    page = <PrivacyPage />;
  } else if (route.page === 'terms') {
    page = <TermsPage />;
  } else if (route.page === 'about') {
    page = <AboutPage />;
  } else if (!user) {
    page = <LandingPage />;
  } else if (route.page === 'projects' && route.id) {
    page = <ProjectDetailPage projectId={Number(route.id)} />;
  } else {
    page = <ProjectsPage />;
  }

  return <PageTransition>{page}</PageTransition>;
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}
