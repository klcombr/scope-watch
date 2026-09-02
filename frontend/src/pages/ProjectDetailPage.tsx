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
    <form onSubmit={submit} className="row" style={{ alignItems: 'flex-start' }}>
      <div style={{ flex: 1, minWidth: 200 }}>
        {error && <div className="error-banner">{error}</div>}
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Ex.: Cliente pediu para adicionar um sistema de reservas que não estava no escopo"
          maxLength={4000}
          style={{ minHeight: 52 }}
        />
      </div>
      <button type="submit" className="btn btn-primary" disabled={busy}>
        Registrar pedido
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
  return (
    <div className="list-item" style={{ fontSize: 14 }}>
      <div style={{ flex: 1 }}>
        {req.text}
        {req.status === 'RESOLVED' && (
          <span className="muted" style={{ marginLeft: 6 }}>
            · cobrado via change order
          </span>
        )}
      </div>
      <div className="row" style={{ gap: 8, justifyContent: 'flex-end' }}>
        <span className={`tag ${
          req.classification === 'IN_SCOPE' ? 'tag-in' : req.classification === 'OUT_OF_SCOPE' ? 'tag-out' : 'tag-discuss'
        }`}>
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
                title={c === 'OUT_OF_SCOPE' ? 'Fora do escopo — vira cobrança' : 'Em discussão'}
              >
                {c === 'OUT_OF_SCOPE' ? 'Fora de escopo' : 'Em discussão'}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ChangeOrderCard({
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
      /* error already handled by api layer */
    } finally {
      setBusy(false);
    }
  }

  function copyShareLink() {
    const url = `${window.location.origin}/scope-watch/#share/${order.share_token}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="list-item" style={{ alignItems: 'flex-start' }}>
      <div style={{ flex: 1 }}>
        <div className="pill">
          <strong>{order.title}</strong>
          <span className="tag tag-order">{ORDER_STATUS_LABELS[order.status]}</span>
        </div>
        {order.description && <div className="muted" style={{ marginTop: 2 }}>{order.description}</div>}
        <div className="muted">
          {order.hours} h × R$ {money(order.rate)}
          {order.requests.length > 0 && ` · ${order.requests.length} pedido(s) vinculado(s)`}
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontWeight: 700, fontSize: 16 }}>R$ {money(order.amount)}</div>
        <div className="row" style={{ gap: 6, marginTop: 6, justifyContent: 'flex-end' }}>
          {order.status === 'DRAFT' && (
            <button className="btn btn-sm" disabled={busy} onClick={() => setStatus('SENT')}>
              Enviar
            </button>
          )}
          {order.status === 'SENT' && (
            <>
              <button className="btn btn-sm btn-primary" disabled={busy} onClick={() => setStatus('APPROVED')}>
                Aprovar
              </button>
              <button className="btn btn-sm" disabled={busy} onClick={() => setStatus('REJECTED')}>
                Recusar
              </button>
            </>
          )}
          {order.status === 'APPROVED' && (
            <button className="btn btn-sm btn-primary" disabled={busy} onClick={() => setStatus('PAID')}>
              Marcar como pago
            </button>
          )}
          <button className="btn btn-sm" onClick={copyShareLink} title="Copiar link para o cliente">
            {copied ? 'Copiado!' : 'Compartilhar'}
          </button>
        </div>
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
        className="btn"
        onClick={() => setOpen(true)}
        disabled={outOfScope.length === 0}
        title={
          outOfScope.length === 0
            ? 'Marque pedidos como "Fora de escopo" para poder cobrá-los'
            : ''
        }
      >
        + Criar change order
      </button>
    );
  }

  return (
    <div style={{ marginTop: 8 }}>
      {error && <div className="error-banner">{error}</div>}
      <form onSubmit={submit} className="card">
        <h4 style={{ marginTop: 0 }}>Nova change order</h4>
        <div className="form-group">
          <label>Pedidos vinculados (fora de escopo)</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {outOfScope.map((r) => (
              <label key={r.id} className="pill" style={{ fontWeight: 400, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={selected.includes(r.id)}
                  onChange={() => toggle(r.id)}
                />
                {r.text.length > 90 ? r.text.slice(0, 90) + '…' : r.text}
              </label>
            ))}
          </div>
        </div>
        <div className="form-group">
          <label>Título</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={200} placeholder="Ex.: Sistema de reservas" />
        </div>
        <div className="row">
          <div className="form-group" style={{ flex: 1, minWidth: 120 }}>
            <label>Horas estimadas</label>
            <input type="number" value={hours} onChange={(e) => setHours(e.target.value)} min={0.25} step="0.25" required />
          </div>
          <div className="form-group" style={{ flex: 1, minWidth: 120 }}>
            <label>Valor/hora (R$)</label>
            <input type="number" value={rate} onChange={(e) => setRate(e.target.value)} min={0} step="0.01" placeholder="Usa a hora do projeto" />
          </div>
        </div>
        <div className="form-group">
          <label>Descrição <span className="muted">(opcional)</span></label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} maxLength={10000} />
        </div>
        <div className="row">
          <button type="submit" className="btn btn-primary" disabled={busy || !title.trim() || !(Number(hours) > 0)}>
            {busy ? 'Criando…' : 'Criar'}
          </button>
          <button type="button" className="btn" onClick={() => setOpen(false)}>
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
      <div className="container">
        <div className="topbar">
          <div className="container topbar-inner">
            <a href="#projects">← Voltar</a>
          </div>
        </div>
        {error ? <div className="error-banner">{error}</div> : <div className="empty">Carregando…</div>}
      </div>
    );
  }

  async function classifyRequest(id: number, classification: RequestItem['classification']) {
    try {
      await api.updateRequest(projectId, id, { classification });
      refresh();
    } catch {
      /* error already handled by api layer */
    }
  }

  const openRequests = project.requests.filter((r) => r.status === 'OPEN');

  return (
    <div>
      <div className="topbar">
        <div className="container topbar-inner">
          <div>
            <a href="#projects">← Projetos</a>
            <h1 style={{ margin: '2px 0 0' }}>{project.title}</h1>
          </div>
          <span className="tag">{project.status}</span>
        </div>
      </div>

      <div className="container">
        {stats && (
          <div className="stat-grid">
            <div className="stat">
              <div className="label">Pedidos abertos</div>
              <div className="value">{openRequests.length}</div>
            </div>
            <div className="stat">
              <div className="label">Fora de escopo (abertos)</div>
              <div className="value">
                {openRequests.filter((r) => r.classification === 'OUT_OF_SCOPE').length}
              </div>
            </div>
            <div className="stat">
              <div className="label">A receber</div>
              <div className="value">R$ {money(stats.pending_amount)}</div>
            </div>
            <div className="stat">
              <div className="label">Aprovado (aguardando pagamento)</div>
              <div className="value" style={{ color: 'var(--success)' }}>
                R$ {money(stats.approved_amount)}
              </div>
            </div>
          </div>
        )}

        <div className="card">
          <h3>Pedidos do cliente</h3>
          <AddRequestForm projectId={projectId} onAdded={refresh} />
          {project.requests.length === 0 ? (
            <div className="empty">
              Registre aqui qualquer pedido extra do cliente durante o projeto. Marque como{' '}
              <strong>fora de escopo</strong> para transformá-lo em cobrança.
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

        <div className="card">
          <h3>Change orders</h3>
          <div className="muted">
            Trabalho fora de escopo estimado em horas × hora vale R$ <strong>{money(project.hourly_rate)}</strong>.
          </div>
          {project.change_orders.length === 0 ? (
            <div className="empty">
              Marque um pedido como <strong>Fora de escopo</strong> e crie a primeira change order para
              transformar trabalho não previsto em cobrança.
            </div>
          ) : (
            [...project.change_orders]
              .sort((a, b) => b.created_at.localeCompare(a.created_at))
              .map((o) => <ChangeOrderCard key={o.id} order={o} project={project} refresh={refresh} />)
          )}
          <NewChangeOrderForm project={project} requests={project.requests} onCreated={refresh} />
        </div>

        <div className="card">
          <h3>Escopo acordado</h3>
          {project.scope_entries.length === 0 ? (
            <div className="empty">Nenhum item de escopo registrado.</div>
          ) : (
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {project.scope_entries.map((s) => (
                <li key={s.id}>{s.text}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}