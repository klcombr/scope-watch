export function PrivacyPage() {
  return (
    <div className="lp-content-page">
      <div className="container">
        <a href="#/" className="lp-back">&larr; Scopewise</a>
        <h1>Politica de Privacidade</h1>
        <p className="muted">Setembro de 2026</p>

        <section>
          <h2>Dados coletados</h2>
          <p>
            O Scopewise coleta apenas os dados necessarios para o funcionamento
            do servico: nome, email e senha (armazenada em formato hash, nunca
            em texto plano).
          </p>
          <p>
            Dados de projetos, pedidos e change orders sao armazenados no banco
            de dados do servico e sao acessiveis apenas pelo titular da conta.
          </p>
        </section>

        <section>
          <h2>Uso dos dados</h2>
          <p>Os dados sao utilizados exclusivamente para:</p>
          <ul>
            <li>Autenticacao e acesso ao servico</li>
            <li>Funcionalidade dos projetos e change orders</li>
            <li>Melhoria do produto</li>
          </ul>
        </section>

        <section>
          <h2>Compartilhamento</h2>
          <p>
            O Scopewise nao compartilha dados pessoais com terceiros. Nao
            vendemos, alugamos ou distribuimos informacoes de usuarios.
          </p>
        </section>

        <section>
          <h2>Seguranca</h2>
          <p>
            Senhas sao armazenadas com bcrypt (custo 12). Comunicacao utiliza
            HTTPS. Rate limiting protege contra abuso. Headers de seguranca
            estao habilitados em todas as respostas.
          </p>
        </section>

        <section>
          <h2>Retencao</h2>
          <p>
            Os dados sao mantidos enquanto a conta estiver ativa. Voce pode
            solicitar exclusao da conta e de todos os dados associados entrando
            em contato.
          </p>
        </section>
      </div>
    </div>
  );
}
