import { useState } from 'react';
import { useAuth } from '../lib/auth';

function Hero() {
  const { user } = useAuth();
  return (
    <section className="lp-hero">
      <div className="container">
        <h1>Scope creep acabou.</h1>
        <p className="lp-hero-sub">
          Registre pedidos do cliente, classifique o que está fora do escopo e
          transforme em change orders cobráveis. Em minutos, não em horas.
        </p>
        <div className="lp-hero-cta">
          {user ? (
            <a href="#projects" className="btn btn-primary lp-btn-lg">
              Abrir projetos
            </a>
          ) : (
            <a href="#register" className="btn btn-primary lp-btn-lg">
              Começar grátis
            </a>
          )}
          <span className="lp-hero-note">Grátis · Sem cartão · 3 projetos</span>
        </div>
      </div>
    </section>
  );
}

function Problem() {
  return (
    <section className="lp-section">
      <div className="container">
        <h2>O problema que todo freelancer conhece</h2>
        <div className="lp-problem-grid">
          <div className="lp-problem-card">
            <div className="lp-problem-icon">📋</div>
            <h3>"Só mais uma coisinha"</h3>
            <p>
              O cliente pede algo que não estava no escopo. Você aceita para
              manter a boa relação. Depois vem outro pedido. E outro.
            </p>
          </div>
          <div className="lp-problem-card">
            <div className="lp-problem-icon">⏱️</div>
            <h3>Horas não cobradas</h3>
            <p>
              Trabalho extra acumula. Você percebe quando o projeto já está
              atrasado e o valor não previsto come seu lucro.
            </p>
          </div>
          <div className="lp-problem-card">
            <div className="lp-problem-icon">😤</div>
            <h3>Conversa difícil</h3>
            <p>
              Cobra depois e o cliente não entende por que está pagando mais.
              Sem documento, sem registro, sem chance.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function Solution() {
  return (
    <section className="lp-section lp-section-alt">
      <div className="container">
        <h2>Como funciona</h2>
        <p className="lp-section-desc">
          Três passos para transformar pedidos fora do escopo em receita.
        </p>
        <div className="lp-steps">
          <div className="lp-step">
            <div className="lp-step-num">1</div>
            <h3>Registre o pedido</h3>
            <p>
              Quando o cliente pede algo fora do escopo, registre no Scopewise.
              Um texto rápido, sem burocracia.
            </p>
          </div>
          <div className="lp-step">
            <div className="lp-step-num">2</div>
            <h3>Classifique</h3>
            <p>
              Marque como <strong>em escopo</strong>, <strong>fora de escopo</strong> ou{' '}
              <strong>em discussão</strong>. Cada classificação tem um destino.
            </p>
          </div>
          <div className="lp-step">
            <div className="lp-step-num">3</div>
            <h3>Cobre com uma change order</h3>
            <p>
              Para pedidos fora do escopo, crie uma change order com horas
              estimadas e valor. Envie ao cliente para aprovação.
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
        <h2>O que você controla</h2>
        <div className="lp-features">
          <div className="lp-feature">
            <h3>Pedidos do cliente</h3>
            <p>
              Registre cada solicitação extra. Nada se perde entre WhatsApp,
              email e planilha.
            </p>
          </div>
          <div className="lp-feature">
            <h3>Classificação clara</h3>
            <p>
              Cada pedido é classificado: dentro do escopo, fora do escopo ou
              em discussão. Sem ambiguidade.
            </p>
          </div>
          <div className="lp-feature">
            <h3>Change orders</h3>
            <p>
              Transforme trabalho fora do escopo em documentos formais com
              horas, valor e status de aprovação.
            </p>
          </div>
          <div className="lp-feature">
            <h3>Visão do projeto</h3>
            <p>
              Dashboard com o que está pendente, o que foi cobrado e o que
              foi pago. Tudo em R$.
            </p>
          </div>
          <div className="lp-feature">
            <h3>Escopo acordado</h3>
            <p>
              Documente o escopo original. Compare com os pedidos extras para
              ter provas quando necessário.
            </p>
          </div>
          <div className="lp-feature">
            <h3>Isolamento por projeto</h3>
            <p>
              Cada projeto é independente. Freelancers com múltiplos clientes
              mantêm tudo organizado.
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
      q: 'O que é scope creep?',
      a: 'Scope creep é a expansão gradual e não controlada do escopo de um projeto. Geralmente acontece quando pedidos extras do cliente vão sendo aceitos sem formalização, sem registro e sem cobrança. O resultado: trabalho adicional que come seu lucro.',
    },
    {
      q: 'Como evitar trabalho fora do escopo?',
      a: 'Documente o escopo desde o início. Registre todo pedido do cliente. Classifique o que está dentro e fora do acordado. Para trabalho fora do escopo, crie uma change order formal e só comece após aprovação. O Scopewise automatiza esse processo.',
    },
    {
      q: 'Como cobrar por alterações fora do escopo?',
      a: 'Ao registrar um pedido fora do escopo, crie uma change order estimando horas e valor/hora. Envie ao cliente para aprovação. O Scopewise acompanha o status: rascunho, enviada, aprovada, rejeitada ou paga.',
    },
    {
      q: 'O que é uma change order?',
      a: 'É um documento formal que descreve uma alteração no escopo do projeto: descrição do trabalho, horas estimadas, valor/hora e total. Serve como registro e base para cobrança. No Scopewise, você vincula os pedidos do cliente diretamente na change order.',
    },
    {
      q: 'O Scopewise é gratuito?',
      a: 'Sim. O plano gratuito permite até 3 projetos ativos com todas as funcionalidades: registro de pedidos, classificação, change orders, dashboard e escopo acordado.',
    },
    {
      q: 'Para quem é o Scopewise?',
      a: 'Freelancers e pequenas agências que trabalham com projetos sob demanda: desenvolvimento web, design, consultoria, marketing digital, tradução, e qualquer área onde o escopo pode mudar durante o projeto.',
    },
  ];

  return (
    <section className="lp-section lp-section-alt">
      <div className="container">
        <h2>Perguntas frequentes</h2>
        <div className="lp-faq-list">
          {faqs.map((faq, i) => (
            <div key={i} className="lp-faq-item">
              <button
                className="lp-faq-q"
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                aria-expanded={openIndex === i}
              >
                {faq.q}
                <span className="lp-faq-arrow">{openIndex === i ? '−' : '+'}</span>
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
          <strong>Scopewise</strong>
          <span className="lp-footer-sep">·</span>
          Controle de escopo para freelancers
        </div>
        <nav className="lp-footer-links" aria-label="Links do rodapé">
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
          <nav className="lp-header-nav" aria-label="Navegação principal">
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
