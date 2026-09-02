export function TermsPage() {
  return (
    <div className="lp-content-page">
      <div className="container">
        <a href="#/" className="lp-back">&larr; Scopewise</a>
        <h1>Termos de Uso</h1>
        <p className="muted">Setembro de 2026</p>

        <section>
          <h2>Uso do servico</h2>
          <p>
            O Scopewise e uma ferramenta de controle de escopo para freelancers
            e pequenas agencias. O servico e fornecido "como esta", sem
            garantias de disponibilidade ininterrupta.
          </p>
        </section>

        <section>
          <h2>Conta do usuario</h2>
          <p>
            Voce e responsavel pela seguranca da sua senha e por todas as
            atividades que ocorrem na sua conta. Notifique-nos imediatamente
            sobre uso nao autorizado.
          </p>
        </section>

        <section>
          <h2>Uso aceitavel</h2>
          <p>Ao utilizar o Scopewise, voce concorda em nao:</p>
          <ul>
            <li>Tentar acessar contas de outros usuarios</li>
            <li>Utilizar o servico para fins ilegais</li>
            <li>Tentar contornar limites de taxa ou seguranca</li>
            <li>Automatizar acessos sem autorizacao</li>
          </ul>
        </section>

        <section>
          <h2>Propriedade intelectual</h2>
          <p>
            O codigo-fonte do Scopewise esta disponivel sob licenca MIT. O
            conteudo que voce cria no servico (projetos, pedidos, change orders)
            e de sua propriedade.
          </p>
        </section>

        <section>
          <h2>Limitacao de responsabilidade</h2>
          <p>
            O Scopewise nao se responsabiliza por decisoes tomadas com base nas
            informacoes fornecidas pela ferramenta. O uso e de responsabilidade
            do usuario.
          </p>
        </section>
      </div>
    </div>
  );
}
