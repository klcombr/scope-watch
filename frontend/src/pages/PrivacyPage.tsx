export function PrivacyPage() {
  return (
    <div className="lp-content-page">
      <div className="container">
        <a href="#/" className="lp-back">← Scopewise</a>
        <h1>Política de Privacidade</h1>
        <p className="muted">Última atualização: setembro de 2026</p>

        <section>
          <h2>Dados coletados</h2>
          <p>
            O Scopewise coleta apenas os dados necessários para o funcionamento
            do serviço: nome, email e senha (armazenada em formato hash, nunca
            em texto plano).
          </p>
          <p>
            Dados de projetos, pedidos e change orders são armazenados no banco
            de dados do serviço e são acessíveis apenas pelo titular da conta.
          </p>
        </section>

        <section>
          <h2>Uso dos dados</h2>
          <p>Os dados são utilizados exclusivamente para:</p>
          <ul>
            <li>Autenticação e acesso ao serviço</li>
            <li>Funcionalidade dos projetos e change orders</li>
            <li>Melhoria do produto</li>
          </ul>
        </section>

        <section>
          <h2>Compartilhamento</h2>
          <p>
            O Scopewise não compartilha dados pessoais com terceiros. Não
            vendemos, alugamos ou distribuímos informações de usuários.
          </p>
        </section>

        <section>
          <h2>Segurança</h2>
          <p>
            Senhas são armazenadas com bcrypt (custo 12). Comunicação utiliza
            HTTPS. Rate limiting protege contra abuso. Headers de segurança
            estão habilitados em todas as respostas.
          </p>
        </section>

        <section>
          <h2>Retenção</h2>
          <p>
            Os dados são mantidos enquanto a conta estiver ativa. Você pode
            solicitar exclusão da conta e de todos os dados associados entrando
            em contato.
          </p>
        </section>

        <section>
          <h2>Contato</h2>
          <p>
            Para dúvidas sobre privacidade, entre em contato pelo email
            informado no repositório do projeto no GitHub.
          </p>
        </section>
      </div>
    </div>
  );
}
