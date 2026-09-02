import { useEffect, useState, type FormEvent } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import type { Project } from '../types';

function NewProjectCard({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [rate, setRate] = useState('120');
  const [scopeText, setScopeText] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const scope = scopeText
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean)
        .map((text) => ({ text }));
      await api.createProject({
        title,
        hourly_rate: Number(rate) || 0,
        notes: '',
        scope_entries: scope,
      });
      setTitle('');
      setRate('120');
      setScopeText('');
      setOpen(false);
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar projeto');
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <div style={{ marginBottom: 16 }}>
        <button className="btn btn-primary" onClick={() => setOpen(true)}>
          + Novo projeto
        </button>
      </div>
    );
  }

  return (
    <div className="card" style={{ animation: 'fadeIn 0.2s ease' }}>
      <h3 style={{ marginBottom: 20 }}>Novo projeto</h3>
      {error && <div className="error-banner">{error}</div>}
      <form onSubmit={submit}>
        <div className="form-group">
          <label>Nome do projeto</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            maxLength={200}
            placeholder="Ex.: Redesign do site da Boutique"
          />
        </div>
        <div className="form-group">
          <label>Valor da sua hora (R$)</label>
          <input
            type="number"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            min={0}
            step="0.01"
          />
        </div>
        <div className="form-group">
          <label>Escopo acordado <span className="muted">(um item por linha)</span></label>
          <textarea
            value={scopeText}
            onChange={(e) => setScopeText(e.target.value)}
            placeholder={'Pagina inicial\n5 paginas internas\nFormulario de contato'}
          />
        </div>
        <div className="row">
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? 'Criando...' : 'Criar projeto'}
          </button>
          <button type="button" className="btn" onClick={() => setOpen(false)}>
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}

function ProjectCard({ project }: { project: Project }) {
  const outOfScope = project.requests.filter((r) => r.classification === 'OUT_OF_SCOPE').length;
  const pending = project.change_orders
    .filter((o) => o.status === 'SENT' || o.status === 'APPROVED')
    .reduce((sum, o) => sum + o.amount, 0);

  return (
    <a
      href={`#projects/${project.id}`}
      className="list-item"
      style={{ textDecoration: 'none', color: 'inherit', display: 'flex' }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 15, letterSpacing: '-0.01em', marginBottom: 4 }}>
          {project.title}
        </div>
        <div className="muted">
          {project.requests.length} pedidos &middot; {project.change_orders.length} change orders
        </div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        {outOfScope > 0 && <span className="tag tag-out" style={{ marginBottom: 4, display: 'block' }}>+{outOfScope} fora de escopo</span>}
        {pending > 0 ? (
          <span className="tag tag-funded" style={{ fontWeight: 700 }}>
            R$ {pending.toLocaleString('pt-BR')}
          </span>
        ) : (
          <span className="tag">Sem pendencias</span>
        )}
      </div>
    </a>
  );
}

export function ProjectsPage() {
  const { user, logout } = useAuth();
  const [projects, setProjects] = useState<Project[] | null>(null);
  const [error, setError] = useState('');

  function load() {
    setError('');
    api
      .listProjects()
      .then(setProjects)
      .catch((err) => setError(err.message));
  }

  useEffect(load, []);

  return (
    <div className="page-enter">
      <div className="topbar">
        <div className="container topbar-inner">
          <span className="brand">
            Scopewise <small>controle de escopo</small>
          </span>
          <div className="row" style={{ gap: 12 }}>
            <span className="muted">{user?.name}</span>
            <button className="btn btn-sm" onClick={logout}>Sair</button>
          </div>
        </div>
      </div>

      <div className="container" style={{ paddingTop: 32, paddingBottom: 64 }}>
        {error && <div className="error-banner">{error}</div>}

        <NewProjectCard onCreated={load} />

        <div className="card">
          <div className="section-header" style={{ marginBottom: 8 }}>
            <h3>Seus projetos</h3>
          </div>
          {projects === null ? (
            <div className="empty">Carregando...</div>
          ) : projects.length === 0 ? (
            <div className="empty">
              Nenhum projeto ainda.<br />
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                Crie um para comecar a acompanhar pedidos e evitar trabalho fora do escopo.
              </span>
            </div>
          ) : (
            <div>
              {projects.map((p) => <ProjectCard key={p.id} project={p} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
