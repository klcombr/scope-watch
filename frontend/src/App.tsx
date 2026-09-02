import { AuthProvider, useAuth } from './lib/auth';
import { LoginPage } from './pages/LoginPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { ProjectDetailPage } from './pages/ProjectDetailPage';
import { LandingPage } from './pages/LandingPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { TermsPage } from './pages/TermsPage';
import { AboutPage } from './pages/AboutPage';
import { SharePage } from './pages/SharePage';

function useHashRoute() {
  const hash = window.location.hash;
  const parts = hash.replace(/^#/, '').split('/').filter(Boolean);
  return { page: parts[0] ?? '', id: parts[1] ?? null };
}

const PUBLIC_ROUTES = new Set(['', 'privacy', 'terms', 'about', 'login', 'register', 'features', 'how-it-works', 'faq']);

function AppInner() {
  const { user, loading } = useAuth();
  const route = useHashRoute();

  if (loading) {
    return <div className="center-box">Carregando…</div>;
  }

  const isPublic = PUBLIC_ROUTES.has(route.page);

  if (route.page === 'share' && route.id) {
    return <SharePage token={route.id} />;
  }

  if (!user && !isPublic) {
    return <LoginPage />;
  }

  if (route.page === 'login' || route.page === 'register') {
    return <LoginPage />;
  }

  if (route.page === 'privacy') {
    return <PrivacyPage />;
  }

  if (route.page === 'terms') {
    return <TermsPage />;
  }

  if (route.page === 'about') {
    return <AboutPage />;
  }

  if (!user) {
    return <LandingPage />;
  }

  if (route.page === 'projects' && route.id) {
    return <ProjectDetailPage projectId={Number(route.id)} />;
  }

  return <ProjectsPage />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}
