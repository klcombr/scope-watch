export function AboutPage() {
  return (
    <div className="lp-content-page">
      <div className="container">
        <a href="#/" className="lp-back">&larr; Scopewise</a>
        <h1>Sobre</h1>

        <section>
          <p className="lp-about-lead">
            O Scopewise nasceu de uma frustracao real: freelancers perdem
            dinheiro porque nao conseguem controlar pedidos extras do cliente de
            forma simples e profissional.
          </p>
        </section>

        <section>
          <h2>O problema</h2>
          <p>
            "So mais uma coisinha" e a frase que mais custa dinheiro no
            freelancing. Pedidos fora do escopo vao se acumulando. Sem
            documentacao, sem change order, sem chance de cobrar depois.
          </p>
          <p>
            Planilhas e ferramentas genericas nao resolvem porque nao
            entendem o fluxo especifico: registrar, classificar, cobrar,
            acompanhar.
          </p>
        </section>

        <section>
          <h2>A solucao</h2>
          <p>
            O Scopewise e uma ferramenta focada que faz uma coisa e faz bem:
            transformar pedidos fora do escopo em change orders cobraveis.
          </p>
          <p>E simples de proposito. Sem funcoes que voce nunca vai usar.</p>
        </section>

        <section>
          <h2>Tecnologia</h2>
          <p>
            Backend em Python com FastAPI. Frontend em React com TypeScript.
            Banco de dados SQLite (desenvolvimento) ou PostgreSQL (producao).
            Codigo-fonte aberto sob licenca MIT.
          </p>
        </section>
      </div>
    </div>
  );
}
