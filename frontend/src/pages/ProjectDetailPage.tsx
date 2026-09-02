import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { api } from '../lib/api';
import type { ChangeOrder, Project, RequestItem } from '../types';
import { CLASSIFICATION_LABELS, ORDER_STATUS_LABELS } from '../types';

function money(n: number) {
  return n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function AddRequestForm({ projectId, onAdded }: { projectId: number; onAdded: () => void }) {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setError('');
    setBusy(true);
    try {
      await api.addRequest(projectId, text);
      setText('');
      onAdded();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} style={{ marginBottom: 20 }}>
      {error && <div className="error-banner">{error}</div>}
      <div className="form-group" style={{ marginBottom: 8 }}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Ex.: Cliente pediu para adicionar um sistema de reservas"
          maxLength={4000}
          style={{ minHeight: 56 }}
        />
      </div>
      <button type="submit" className="btn btn-sm btn-primary" disabled={busy || !text.trim()}>
        {busy ? 'Registrando...' : 'Registrar pedido'}
      </button>
    </form>
  );
}

function RequestRow({
  req,
  onClassified,
}: {
  req: RequestItem;
  onClassified: (id: number, classification: RequestItem['classification']) => void;
}) {
  const tagClass =
    req.classification === 'IN_SCOPE' ? 'tag-in' :
    req.classification === 'OUT_OF_SCOPE' ? 'tag-out' : 'tag-discuss';

  return (
    <div className="list-item" style={{ alignItems: 'flex-start', gap: 12 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, lineHeight: 1.6 }}>{req.text}</div>
        {req.status === 'RESOLVED' && (
          <span className="muted" style={{ fontSize: 11 }}>cobrado via change order</span>
        )}
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
        <span className={`tag ${tagClass}`}>
          {CLASSIFICATION_LABELS[req.classification]}
        </span>
        {req.classification !== 'IN_SCOPE' && (
          <div className="seg">
            {(['DISCUSS', 'OUT_OF_SCOPE'] as const).map((c) => (
              <button
                key={c}
                type="button"
                className={req.classification === c ? 'active' : ''}
                onClick={() => onClassified(req.id, c)}
              >
                {c === 'OUT_OF_SCOPE' ? 'Fora' : 'Discussao'}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ChangeOrderRow({
  order,
  project,
  refresh,
}: {
  order: ChangeOrder;
  project: Project;
  refresh: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  async function setStatus(status: ChangeOrder['status']) {
    setBusy(true);
    try {
      await api.updateChangeOrder(project.id, order.id, { status });
      refresh();
    } catch {
      /* handled by api layer */
    } finally {
      setBusy(false);
    }
  }

  function copyShareLink() {
    const base = import.meta.env.VITE_API_URL
      ? `${window.location.origin}/scope-watch/`
      : `${window.location.origin}/scope-watch/`;
    const url = `${base}#share/${order.share_token}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div style={{ padding: '20px 0', borderBottom: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <strong style={{ fontSize: 15, textTransform: 'uppercase', letterSpacing: '0.02em' }}>{order.title}</strong>
            <span className="tag tag-order">{ORDER_STATUS_LABELS[order.status]}</span>
          </div>
          {order.description && (
            <div className="muted" style={{ fontSize: 13, marginBottom: 4 }}>{order.description}</div>
          )}
          <div className="muted" style={{ fontSize: 12, fontFamily: 'var(--mono)' }}>
            {order.hours}h x R$ {money(order.rate)}/h
            {order.requests.length > 0 && <> &middot; {order.requests.length} pedido(s)</>}
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 20, letterSpacing: '-0.03em', fontFamily: 'var(--mono)' }}>
            R$ {money(order.amount)}
          </div>
        </div>
      </div>
      <div className="row" style={{ gap: 8, marginTop: 8 }}>
        {order.status === 'DRAFT' && (
          <button className="btn btn-sm btn-primary" disabled={busy} onClick={() => setStatus('SENT')}>
            Enviar
          </button>
        )}
        {order.status === 'SENT' && (
          <>
            <button className="btn btn-sm btn-primary" disabled={busy} onClick={() => setStatus('APPROVED')}>
              Aprovar
            </button>
            <button className="btn btn-sm btn-danger" disabled={busy} onClick={() => setStatus('REJECTED')}>
              Recusar
            </button>
          </>
        )}
        {order.status === 'APPROVED' && (
          <button className="btn btn-sm btn-primary" disabled={busy} onClick={() => setStatus('PAID')}>
            Pago
          </button>
        )}
        <button className="btn btn-sm" onClick={copyShareLink}>
          {copied ? 'Copiado!' : 'Link'}
        </button>
      </div>
    </div>
  );
}

function NewChangeOrderForm({
  project,
  requests,
  onCreated,
}: {
  project: Project;
  requests: RequestItem[];
  onCreated: () => void;
}) {
  const outOfScope = requests.filter(
    (r) => r.classification === 'OUT_OF_SCOPE' && r.status === 'OPEN',
  );
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<number[]>([]);
  const [title, setTitle] = useState('');
  const [hours, setHours] = useState('4');
  const [rate, setRate] = useState(String(project.hourly_rate || ''));
  const [description, setDescription] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  function toggle(id: number) {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await api.createChangeOrder(project.id, {
        title,
        description,
        hours: Number(hours) || 0,
        rate: Number(rate) || 0,
        request_ids: selected,
      });
      setOpen(false);
      setSelected([]);
      setTitle('');
      setHours('4');
      setDescription('');
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro');
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button
        className="btn btn-sm"
        onClick={() => setOpen(true)}
        disabled={outOfScope.length === 0}
        title={outOfScope.length === 0 ? 'Marque pedidos como "Fora de escopo" para poder cobrar' : ''}
        style={{ marginTop: 12 }}
      >
        + Change order
      </button>
    );
  }

  return (
    <div style={{ marginTop: 16 }}>
      {error && <div className="error-banner">{error}</div>}
      <form onSubmit={submit}>
        <h4 style={{ margin: '0 0 16px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>
          Nova change order
        </h4>
        {outOfScope.length > 0 && (
          <div className="form-group">
            <label>Pedidos vinculados</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {outOfScope.map((r) => (
                <label
                  key={r.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 12px',
                    background: selected.includes(r.id) ? 'var(--surface-hover)' : 'var(--bg)',
                    border: `2px solid ${selected.includes(r.id) ? 'var(--text)' : 'var(--border)'}`,
                    cursor: 'pointer',
                    fontSize: 13,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selected.includes(r.id)}
                    onChange={() => toggle(r.id)}
                    style={{ accentColor: 'var(--text)' }}
                  />
                  {r.text.length > 80 ? r.text.slice(0, 80) + '...' : r.text}
                </label>
              ))}
            </div>
          </div>
        )}
        <div className="form-group">
          <label>Titulo</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={200} placeholder="Ex.: Sistema de reservas" />
        </div>
        <div className="row">
          <div className="form-group" style={{ flex: 1, minWidth: 120 }}>
            <label>Horas</label>
            <input type="number" value={hours} onChange={(e) => setHours(e.target.value)} min={0.25} step="0.25" required />
          </div>
          <div className="form-group" style={{ flex: 1, minWidth: 120 }}>
            <label>Valor/hora (R$)</label>
            <input type="number" value={rate} onChange={(e) => setRate(e.target.value)} min={0} step="0.01" />
          </div>
        </div>
        <div className="form-group">
          <label>Descricao</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} maxLength={10000} />
        </div>
        <div className="row">
          <button type="submit" className="btn btn-primary btn-sm" disabled={busy || !title.trim() || !(Number(hours) > 0)}>
            {busy ? 'Criando...' : 'Criar'}
          </button>
          <button type="button" className="btn btn-sm" onClick={() => setOpen(false)}>
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}

export function ProjectDetailPage({ projectId }: { projectId: number }) {
  const [project, setProject] = useState<Project | null>(null);
  const [stats, setStats] = useState<{ pending_amount: number; approved_amount: number } | null>(null);
  const [error, setError] = useState('');

  const refresh = useCallback(() => {
    api.getProject(projectId).then(setProject).catch((err) => setError(err.message));
    api.projectStats(projectId).then(setStats).catch(() => {});
  }, [projectId]);

  useEffect(refresh, [refresh]);

  if (!project) {
    return (
      <div>
        <div className="topbar">
          <div className="container topbar-inner">
            <a href="#projects" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>&larr; Voltar</a>
          </div>
        </div>
        <div className="container" style={{ paddingTop: 32 }}>
          {error ? <div className="error-banner">{error}</div> : <div className="empty">Carregando...</div>}
        </div>
      </div>
    );
  }

  async function classifyRequest(id: number, classification: RequestItem['classification']) {
    try {
      await api.updateRequest(projectId, id, { classification });
      refresh();
    } catch {
      /* handled by api layer */
    }
  }

  const openRequests = project.requests.filter((r) => r.status === 'OPEN');

  return (
    <div className="page-enter">
      <div className="topbar">
        <div className="container topbar-inner">
          <div>
            <a href="#projects" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>&larr; Projetos</a>
            <h1 style={{ margin: '4px 0 0', fontSize: 20, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.02em' }}>{project.title}</h1>
          </div>
          <span className="tag">{project.status}</span>
        </div>
      </div>

      <div className="container" style={{ paddingTop: 32, paddingBottom: 64 }}>
        {stats && (
          <div className="stat-grid">
            <div className="stat">
              <div className="label">Pedidos abertos</div>
              <div className="value">{openRequests.length}</div>
            </div>
            <div className="stat">
              <div className="label">Fora de escopo</div>
              <div className="value">
                {openRequests.filter((r) => r.classification === 'OUT_OF_SCOPE').length}
              </div>
            </div>
            <div className="stat">
              <div className="label">A receber</div>
              <div className="value">R$ {money(stats.pending_amount)}</div>
            </div>
            <div className="stat">
              <div className="label">Aprovado</div>
              <div className="value">R$ {money(stats.approved_amount)}</div>
            </div>
          </div>
        )}

        {/* Requests section */}
        <div className="card">
          <div className="section-header">
            <h3>Pedidos do cliente</h3>
          </div>
          <AddRequestForm projectId={projectId} onAdded={refresh} />
          {project.requests.length === 0 ? (
            <div className="empty">
              Registre aqui qualquer pedido extra do cliente.<br />
              <span style={{ fontSize: 12 }}>Marque como <strong>fora de escopo</strong> para transformar em cobranca.</span>
            </div>
          ) : (
            <div>
              {[...project.requests]
                .sort((a, b) => b.created_at.localeCompare(a.created_at))
                .map((r) => (
                  <RequestRow key={r.id} req={r} onClassified={classifyRequest} />
                ))}
            </div>
          )}
        </div>

        {/* Change Orders section */}
        <div className="card">
          <div className="section-header">
            <h3>Change orders</h3>
            <span className="muted" style={{ fontFamily: 'var(--mono)' }}>
              R$ {money(project.hourly_rate)}/h
            </span>
          </div>
          {project.change_orders.length === 0 ? (
            <div className="empty">
              Marque um pedido como <strong>fora de escopo</strong> e crie a primeira change order.
            </div>
          ) : (
            <div>
              {[...project.change_orders]
                .sort((a, b) => b.created_at.localeCompare(a.created_at))
                .map((o) => <ChangeOrderRow key={o.id} order={o} project={project} refresh={refresh} />)}
            </div>
          )}
          <NewChangeOrderForm project={project} requests={project.requests} onCreated={refresh} />
        </div>

        {/* Scope section */}
        <div className="card">
          <div className="section-header">
            <h3>Escopo acordado</h3>
          </div>
          {project.scope_entries.length === 0 ? (
            <div className="empty">Nenhum item de escopo registrado.</div>
          ) : (
            <ul style={{ margin: 0, paddingLeft: 0, listStyle: 'none' }}>
              {project.scope_entries.map((s) => (
                <li key={s.id} style={{ padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 14 }}>
                  {s.text}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
