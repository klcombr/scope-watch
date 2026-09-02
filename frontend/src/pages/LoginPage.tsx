import { useState, type FormEvent } from 'react';
import { useAuth } from '../lib/auth';
import { FadeIn } from '../lib/motion';

export function LoginPage() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (mode === 'login') await login(email, password);
      else await register(name, email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <FadeIn delay={0} y={16} duration={400}>
          <h1>Scopewise</h1>
        </FadeIn>

        <FadeIn delay={80} y={12} duration={400}>
          <p className="subtitle">Controle de escopo para freelancers.</p>
        </FadeIn>

        <FadeIn delay={160} y={12} duration={400}>
          <div className="auth-toggle">
            <button
              type="button"
              className={mode === 'login' ? 'active' : ''}
              onClick={() => setMode('login')}
            >
              Entrar
            </button>
            <button
              type="button"
              className={mode === 'register' ? 'active' : ''}
              onClick={() => setMode('register')}
            >
              Criar conta
            </button>
          </div>

          {error && <div className="error-banner">{error}</div>}

          <form onSubmit={onSubmit}>
            {mode === 'register' && (
              <div className="form-group">
                <label>Nome</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  maxLength={120}
                  placeholder="Seu nome"
                />
              </div>
            )}
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                maxLength={255}
                placeholder="voce@email.com"
              />
            </div>
            <div className="form-group">
              <label>Senha</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                maxLength={128}
                placeholder={mode === 'register' ? 'Minimo 8 caracteres' : 'Sua senha'}
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={busy} style={{ width: '100%', padding: '12px' }}>
              {busy ? 'Aguarde...' : mode === 'login' ? 'Entrar' : 'Criar conta'}
            </button>
          </form>
        </FadeIn>

        <FadeIn delay={300} y={8} duration={300}>
          <p className="auth-footer">
            Gratis para comecar.
          </p>
        </FadeIn>
      </div>
    </div>
  );
}
