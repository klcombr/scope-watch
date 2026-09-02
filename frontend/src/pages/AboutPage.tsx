export function AboutPage() {
  return (
    <div className="lp-content-page">
      <div className="container">
        <a href="#/" className="lp-back">← Scopewise</a>
        <h1>Sobre o Scopewise</h1>

        <section>
          <p className="lp-about-lead">
            O Scopewise nasceu de uma frustração real: freelancers perdem
            dinheiro porque não conseguem controlar pedidos extras do cliente de
            forma simples e profissional.
          </p>
        </section>

        <section>
          <h2>O problema</h2>
          <p>
            "Só mais uma coisinha" é a frase que mais custa dinheiro no
            freelancing. Pedidos fora do escopo vão se acumulando. Sem
            documentação, sem change order, sem chance de cobrar depois.
          </p>
          <p>
            Existentes planilhas e ferramentas genéricas não resolvem porque não
            entendem o fluxo específico: registrar → classificar → cobrar →
            acompanhar.
          </p>
        </section>

        <section>
          <h2>A solução</h2>
          <p>
            O Scopewise é uma ferramenta focada que faz uma coisa e faz bem:
            transformar pedidos fora do escopo em change orders cobráveis.
          </p>
          <p>É simples de propósito. Sem funções que você nunca vai usar.</p>
        </section>

        <section>
          <h2>Tecnologia</h2>
          <p>
            Backend em Python com FastAPI. Frontend em React com TypeScript.
            Banco de dados SQLite (desenvolvimento) ou PostgreSQL (produção).
            Código-fonte aberto sob licença MIT.
          </p>
        </section>

        <section>
          <h2>Contato</h2>
          <p>
            O projeto é open-source. Contribuições, issues e sugestões são
            bem-vindas no repositório do GitHub.
          </p>
        </section>
      </div>
    </div>
  );
}
