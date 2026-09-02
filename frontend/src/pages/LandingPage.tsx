import { useState } from 'react';
import { useAuth } from '../lib/auth';

function Hero() {
  const { user } = useAuth();
  return (
    <section className="lp-hero">
      <div className="container">
        <h1>Stop working<br />for free.</h1>
        <p className="lp-hero-sub">
          Registre pedidos do cliente, identifique o que esta fora do escopo e
          transforme em change orders cobraveis.
        </p>
        <div className="lp-hero-cta">
          {user ? (
            <a href="#projects" className="btn btn-primary lp-btn-lg">
              Acessar projetos
            </a>
          ) : (
            <a href="#register" className="btn btn-primary lp-btn-lg">
              Comecar gratis
            </a>
          )}
          <span className="lp-hero-note">Gratis &middot; 3 projetos &middot; Sem cartao</span>
        </div>

        <div className="lp-flow">
          <div className="lp-flow-step">Pedido extra</div>
          <div className="lp-flow-step">Fora do escopo</div>
          <div className="lp-flow-step">Change order</div>
          <div className="lp-flow-step">Aprovacao</div>
          <div className="lp-flow-step">Receita</div>
        </div>
      </div>
    </section>
  );
}

function Problem() {
  return (
    <section className="lp-section">
      <div className="container">
        <h2>O problema</h2>
        <div className="lp-problem-grid">
          <div className="lp-problem-card">
            <div className="lp-problem-icon">01</div>
            <h3>"So mais uma coisinha"</h3>
            <p>
              O cliente pede algo fora do escopo. Voce aceita para
              manter a relacao. Depois vem outro. E outro.
            </p>
          </div>
          <div className="lp-problem-card">
            <div className="lp-problem-icon">02</div>
            <h3>Horas nao cobradas</h3>
            <p>
              Trabalho extra acumula. Voce percebe quando o projeto ja esta
              atrasado e o valor nao previsto come seu lucro.
            </p>
          </div>
          <div className="lp-problem-card">
            <div className="lp-problem-icon">03</div>
            <h3>Sem documento</h3>
            <p>
              Cobra depois e o cliente nao entende. Sem change order,
              sem registro, sem chance.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function Solution() {
  return (
    <section className="lp-section">
      <div className="container">
        <h2>Como funciona</h2>
        <div className="lp-steps">
          <div className="lp-step">
            <div className="lp-step-num">01</div>
            <h3>Registre</h3>
            <p>
              Quando o cliente pede algo fora do escopo, registre no Scopewise.
              Um texto rapido, sem burocracia.
            </p>
          </div>
          <div className="lp-step">
            <div className="lp-step-num">02</div>
            <h3>Classifique</h3>
            <p>
              Marque como <strong>em escopo</strong>, <strong>fora de escopo</strong> ou{' '}
              <strong>em discussao</strong>. Cada classificacao tem um destino.
            </p>
          </div>
          <div className="lp-step">
            <div className="lp-step-num">03</div>
            <h3>Cobre</h3>
            <p>
              Crie uma change order com horas estimadas e valor.
              Envie ao cliente para aprovacao.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function Features() {
  return (
    <section className="lp-section">
      <div className="container">
        <h2>Controle total</h2>
        <div className="lp-features">
          <div className="lp-feature">
            <h3>Pedidos do cliente</h3>
            <p>
              Registre cada solicitacao extra. Nada se perde entre WhatsApp,
              email e planilha.
            </p>
          </div>
          <div className="lp-feature">
            <h3>Classificacao</h3>
            <p>
              Cada pedido e classificado: dentro do escopo, fora do escopo ou
              em discussao. Sem ambiguidade.
            </p>
          </div>
          <div className="lp-feature">
            <h3>Change orders</h3>
            <p>
              Transforme trabalho fora do escopo em documentos formais com
              horas, valor e status.
            </p>
          </div>
          <div className="lp-feature">
            <h3>Visao do projeto</h3>
            <p>
              Dashboard com o que esta pendente, o que foi cobrado e o que
              foi pago. Tudo em R$.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      q: 'O que e scope creep?',
      a: 'Scope creep e a expansao gradual e nao controlada do escopo de um projeto. Acontece quando pedidos extras sao aceitos sem formalizacao e sem cobranca. Trabalho adicional que come seu lucro.',
    },
    {
      q: 'Como evitar trabalho fora do escopo?',
      a: 'Documente o escopo desde o inicio. Registre todo pedido. Classifique o que esta dentro e fora do acordado. Para trabalho fora do escopo, crie uma change order formal e so comece apos aprovacao.',
    },
    {
      q: 'Como cobrar por alteracoes?',
      a: 'Registre o pedido fora do escopo. Crie uma change order estimando horas e valor/hora. Envie ao cliente para aprovacao. Acompanhe o status: rascunho, enviada, aprovada, rejeitada ou paga.',
    },
    {
      q: 'O que e uma change order?',
      a: 'Documento formal que descreve uma alteracao no escopo: descricao, horas estimadas, valor/hora e total. Serve como registro e base para cobranca.',
    },
    {
      q: 'E gratuito?',
      a: 'Sim. Plano gratuito permite ate 3 projetos ativos com todas as funcionalidades: pedidos, classificacao, change orders, dashboard e escopo acordado.',
    },
  ];

  return (
    <section className="lp-section">
      <div className="container">
        <h2>FAQ</h2>
        <div className="lp-faq-list">
          {faqs.map((faq, i) => (
            <div key={i} className="lp-faq-item">
              <button
                className="lp-faq-q"
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                aria-expanded={openIndex === i}
              >
                {faq.q}
                <span className="lp-faq-arrow">{openIndex === i ? '\u2212' : '+'}</span>
              </button>
              {openIndex === i && <p className="lp-faq-a">{faq.a}</p>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="lp-footer">
      <div className="container lp-footer-inner">
        <div>
          <strong>SCOPEWISE</strong>
        </div>
        <nav className="lp-footer-links" aria-label="Links do rodape">
          <a href="#privacy">Privacidade</a>
          <a href="#terms">Termos</a>
          <a href="#about">Sobre</a>
          <a href="#login">Entrar</a>
        </nav>
      </div>
    </footer>
  );
}

export function LandingPage() {
  return (
    <div className="lp">
      <header className="lp-header">
        <div className="container lp-header-inner">
          <a href="#/" className="lp-logo">Scopewise</a>
          <nav className="lp-header-nav" aria-label="Navegacao principal">
            <a href="#features">Funcionalidades</a>
            <a href="#how-it-works">Como funciona</a>
            <a href="#faq">FAQ</a>
            <a href="#login" className="btn btn-sm">Entrar</a>
          </nav>
        </div>
      </header>

      <main>
        <Hero />
        <Problem />
        <div id="how-it-works"><Solution /></div>
        <div id="features"><Features /></div>
        <div id="faq"><FAQ /></div>
      </main>

      <Footer />
    </div>
  );
}
