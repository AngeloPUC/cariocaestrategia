// src/pages/Estrutura.jsx
import "./Estrutura.css";

function Estrutura() {
  return (
    <div className="estrutura">
      <h2>Sobre o Sistema</h2>
      <p>
        O <strong>Carioca Estratégia</strong> é uma plataforma de apoio à gestão
        estratégica, baseada no ciclo PDCA: Planejar, Executar, Verificar e Agir.
        Nossa proposta é centralizar o controle de equipes, ações, feedbacks,
        tarefas e finanças em um único ambiente seguro e integrado.
      </p>

      <h3>Módulos Disponíveis</h3>
      <ul>
        <li>
          <strong>Equipe:</strong> Cadastro e gerenciamento de membros, com
          controle de aniversários e informações pessoais.
        </li>
        <li>
          <strong>Ações:</strong> Criação, acompanhamento e detalhamento de ações
          estratégicas, incluindo titulo, descrição, prazo e consulta individual.
        </li>
        <li>
          <strong>Feedback:</strong> Registro de avaliações entre colaboradores,
          cálculo de médias e relatórios de notas maiores ou menores que 7.
        </li>
        <li>
          <strong>Tarefas:</strong> Planejamento e controle de tarefas diárias,
          com indicadores de status e prazos.
        </li>
        <li>
          <strong>TDV:</strong> Gestão dos pagamentos do fluxo de TDV, com
          acompanhamento de datas de vencimento e status de pagamento.
        </li>
        <li>
          <strong>Consórcio:</strong> Administração dos pagamentos de consórcio,
          incluindo previsão de parcelas, datas e quitações.
        </li>
        <li>
          <strong>Relatórios:</strong> Dashboards interativos e exportação de
          relatórios gerenciais para análise de performance.
        </li>
      </ul>

      <p>
        Todos os módulos consomem APIs protegidas, garantindo autenticação segura
        via token JWT. O sistema oferece dashboards inteligentes para rápida
        visualização de KPIs e efetividade das ações.
      </p>
    </div>
  );
}

export default Estrutura;
