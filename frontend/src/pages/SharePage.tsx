import { useEffect, useState } from 'react';

const API_BASE = import.meta.env.VITE_API_URL ?? '';

interface SharedOrder {
  id: number;
  title: string;
  description: string;
  hours: number;
  rate: number;
  amount: number;
  status: string;
  created_at: string;
  decided_at: string | null;
  project_title: string;
}

function money(n: number) {
  return n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Rascunho',
  SENT: 'Enviada',
  APPROVED: 'Aprovada',
  REJECTED: 'Rejeitada',
  PAID: 'Paga',
};

export function SharePage({ token }: { token: string }) {
  const [order, setOrder] = useState<SharedOrder | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [deciding, setDeciding] = useState(false);
  const [decision, setDecision] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/share/${token}`)
      .then((r) => {
        if (!r.ok) throw new Error('Change order não encontrada');
        return r.json();
      })
      .then(setOrder)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [token]);

  async function respond(dec: 'APPROVED' | 'REJECTED') {
    setDeciding(true);
    try {
      const r = await fetch(`${API_BASE}/api/share/${token}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision: dec }),
      });
      if (!r.ok) {
        const body = await r.json().catch(() => ({}));
        throw new Error(body.detail || 'Erro ao processar');
      }
      const updated = await r.json();
      setOrder((prev) => (prev ? { ...prev, status: updated.status, decided_at: updated.decided_at } : prev));
      setDecision(dec);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro');
    } finally {
      setDeciding(false);
    }
  }

  if (loading) {
    return (
      <div className="share-page">
        <div className="container share-center">Carregando…</div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="share-page">
        <div className="container share-center">
          <div className="share-error">{error || 'Change order não encontrada'}</div>
        </div>
      </div>
    );
  }

  const canDecide = order.status === 'SENT' && !decision;

  return (
    <div className="share-page">
      <div className="container share-container">
        <header className="share-header">
          <strong>Scopewise</strong>
          <span className="muted">· change order</span>
        </header>

        <main className="share-main">
          <div className="share-project">{order.project_title}</div>
          <h1 className="share-title">{order.title}</h1>
          <span className="tag tag-order">{STATUS_LABELS[order.status] || order.status}</span>

          {order.description && <p className="share-desc">{order.description}</p>}

          <div className="share-amount">R$ {money(order.amount)}</div>
          <div className="share-detail">
            {order.hours} h × R$ {money(order.rate)}/h
          </div>

          {canDecide && (
            <div className="share-actions">
              <button
                className="btn btn-primary share-btn"
                disabled={deciding}
                onClick={() => respond('APPROVED')}
              >
                {deciding ? 'Processando…' : 'Aprovar'}
              </button>
              <button
                className="btn share-btn share-btn-reject"
                disabled={deciding}
                onClick={() => respond('REJECTED')}
              >
                Recusar
              </button>
            </div>
          )}

          {decision && (
            <div className={`share-result ${decision === 'APPROVED' ? 'share-result-ok' : 'share-result-no'}`}>
              {decision === 'APPROVED' ? 'Aprovada com sucesso.' : 'Recusada.'}
            </div>
          )}

          {order.status !== 'SENT' && !decision && (
            <div className="share-result share-result-info">
              Esta change order já foi respondida.
            </div>
          )}
        </main>

        <footer className="share-footer">
          Gerenciado com Scopewise
        </footer>
      </div>
    </div>
  );
}
