// src/pages/Home.jsx
import "./Home.css";

function Home() {
  return (
    <div className="home">
      <h1>Carioca Estratégia</h1>

      <div className="home-descricao">
        <p><em>
          Em um ambiente empresarial cada vez mais competitivo, planejamento,
          controle e estratégia são fundamentais para guiar decisões e alcançar
          metas com consistência. O planejamento define o caminho, o controle
          monitora o progresso e a estratégia adapta ações para maximizar
          resultados.
        </em></p>

        <p>
          Para ampliar seu arsenal de ferramentas e otimizar processos em outras
          frentes, visite&nbsp;
          <a
            href="https://solucoescarioca.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Soluções Carioca
          </a>.
        </p>
      </div>
    </div>
  );
}

export default Home;
