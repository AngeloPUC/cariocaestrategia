import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Dashday.css";

const API_URL = "https://api-estrategia.vercel.app";

function isoDateOnly(d) {
  if (!d) return null;
  try {
    const dt = d instanceof Date ? d : new Date(d);
    return dt.toISOString().slice(0, 10);
  } catch {
    return null;
  }
}

export default function Dashday() {
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState([]);
  const [acoes, setAcoes] = useState([]);
  const [tarefas, setTarefas] = useState([]);
  const [esteira, setEsteira] = useState([]);
  const [agenda, setAgenda] = useState([]);
  const [equipe, setEquipe] = useState([]);

  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const headers = token ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } : {};

  useEffect(() => {
    setLoading(true);
    setErrors([]);

    const endpoints = [
      { key: "acoes", url: `${API_URL}/acoes/` },
      { key: "tarefas", url: `${API_URL}/tarefas/` },
      { key: "esteira", url: `${API_URL}/esteira/` },
      { key: "agenda", url: `${API_URL}/agenda/` },
      { key: "equipe", url: `${API_URL}/equipe/` },
    ];

    Promise.all(
      endpoints.map(e =>
        fetch(e.url, { headers }).then(async r => {
          if (!r.ok) {
            const txt = await r.text().catch(() => "");
            throw new Error(`${e.key} ${r.status} ${txt}`);
          }
          return r.json();
        })
      )
    )
      .then(([resAcoes, resTarefas, resEsteira, resAgenda, resEquipe]) => {
        setAcoes(Array.isArray(resAcoes) ? resAcoes : []);
        setTarefas(Array.isArray(resTarefas) ? resTarefas : []);
        setEsteira(Array.isArray(resEsteira) ? resEsteira : []);
        setAgenda(Array.isArray(resAgenda) ? resAgenda : []);
        setEquipe(Array.isArray(resEquipe) ? resEquipe : []);
      })
      .catch(e => {
        console.error("Dashday fetch error:", e);
        setErrors(prev => [...prev, String(e)]);
      })
      .finally(() => setLoading(false));
  }, [token]);

  const classifyList = (list) => {
    const overdue = [];
    const today = [];
    const todayIso = isoDateOnly(new Date());

    list.forEach(item => {
      const raw =
        item.dt_venc ||
        item.vencimento ||
        item.data ||
        item.data_iso ||
        item.due_date ||
        item.nascimento ||
        null;
      const iso = isoDateOnly(raw);
      if (!iso) return; // ignora itens sem data
      if (iso < todayIso) overdue.push(item);
      else if (iso === todayIso) today.push(item);
    });

    return { overdue, today };
  };

  const clsAcoes = classifyList(acoes);
  const clsTarefas = classifyList(tarefas);
  const clsEsteira = classifyList(esteira);
  const clsAgenda = classifyList(agenda);

  // birthdays: list people whose nascimento matches today (ignore year)
  const today = new Date();
  const mmddToday = `${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const birthdaysToday = equipe.filter(u => {
    const d = u.dt_niver || u.nascimento;
    if (!d) return false;
    const parts = String(d).split("-");
    if (parts.length < 3) return false;
    return `${parts[1]}-${parts[2]}` === mmddToday;
  });

  if (loading) return <div className="dashday">Carregando Dash Day…</div>;

  return (
    <div className="dashday">
      <header className="dashday-header">
        <h2>Dash Day — Vencidos e vencendo hoje (listagem)</h2>
        {errors.length > 0 && (
          <div className="dashday-errors">
            {errors.map((e, i) => <div key={i} className="error-item">{e}</div>)}
          </div>
        )}
      </header>

      <section className="dashday-grid">
        <div className="dashcard">
          <h3>Ações vencendo hoje</h3>
          {clsAcoes.today.length === 0 ? <p className="vazio">Nenhuma ação vencendo hoje</p> : (
            <ul className="items">
              {clsAcoes.today.map(a => (
                <li key={a.id || a.titulo}>
                  <strong className="link-like" onClick={() => navigate(`/acoes/${a.id || ""}`)}>{a.titulo || a.nome}</strong>
                  <div className="meta">{isoDateOnly(a.dt_venc || a.data || a.data_iso)} {a.obs ? `• ${a.obs}` : ""}</div>
                </li>
              ))}
            </ul>
          )}

          <h4 style={{ marginTop: 12 }}>Ações vencidas</h4>
          {clsAcoes.overdue.length === 0 ? <p className="vazio">Nenhuma ação vencida</p> : (
            <ul className="items">
              {clsAcoes.overdue.map(a => (
                <li key={a.id || a.titulo}>
                  <strong className="link-like" onClick={() => navigate(`/acoes/${a.id || ""}`)}>{a.titulo || a.nome}</strong>
                  <div className="meta">{isoDateOnly(a.dt_venc || a.data || a.data_iso)} {a.obs ? `• ${a.obs}` : ""}</div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="dashcard">
          <h3>Tarefas vencendo hoje</h3>
          {clsTarefas.today.length === 0 ? <p className="vazio">Nenhuma tarefa vencendo hoje</p> : (
            <ul className="items">
              {clsTarefas.today.map(t => (
                <li key={t.id || t.titulo}>
                  <strong className="link-like" onClick={() => navigate(`/tarefas/${t.id || ""}`)}>{t.titulo}</strong>
                  <div className="meta">{isoDateOnly(t.dt_venc || t.vencimento || t.data)} {t.obs ? `• ${t.obs}` : ""}</div>
                </li>
              ))}
            </ul>
          )}

          <h4 style={{ marginTop: 12 }}>Tarefas vencidas</h4>
          {clsTarefas.overdue.length === 0 ? <p className="vazio">Nenhuma tarefa vencida</p> : (
            <ul className="items">
              {clsTarefas.overdue.map(t => (
                <li key={t.id || t.titulo}>
                  <strong className="link-like" onClick={() => navigate(`/tarefas/${t.id || ""}`)}>{t.titulo}</strong>
                  <div className="meta">{isoDateOnly(t.dt_venc || t.vencimento || t.data)} {t.obs ? `• ${t.obs}` : ""}</div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="dashcard">
          <h3>Esteira vencendo hoje</h3>
          {clsEsteira.today.length === 0 ? <p className="vazio">Nenhuma esteira vencendo hoje</p> : (
            <ul className="items">
              {clsEsteira.today.map(e => (
                <li key={e.id || e.titulo}>
                  <strong className="link-like" onClick={() => navigate(`/esteira/${e.id || ""}`)}>{e.titulo || e.nome}</strong>
                  <div className="meta">{isoDateOnly(e.dt_venc || e.data)} {e.obs ? `• ${e.obs}` : ""}</div>
                </li>
              ))}
            </ul>
          )}

          <h4 style={{ marginTop: 12 }}>Esteira vencida</h4>
          {clsEsteira.overdue.length === 0 ? <p className="vazio">Nenhuma esteira vencida</p> : (
            <ul className="items">
              {clsEsteira.overdue.map(e => (
                <li key={e.id || e.titulo}>
                  <strong className="link-like" onClick={() => navigate(`/esteira/${e.id || ""}`)}>{e.titulo || e.nome}</strong>
                  <div className="meta">{isoDateOnly(e.dt_venc || e.data)} {e.obs ? `• ${e.obs}` : ""}</div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="dashcard">
          <h3>Agenda vencendo hoje</h3>
          {clsAgenda.today.length === 0 ? <p className="vazio">Nenhum compromisso hoje</p> : (
            <ul className="items">
              {clsAgenda.today.map(a => (
                <li key={a.id}>
                  <strong className="link-like" onClick={() => navigate(`/agenda/${a.id}`)}>{a.titulo}</strong>
                  <div className="meta">{isoDateOnly(a.data || a.data_iso)} {a.hora ? `• ${a.hora}` : ""} {a.obs ? `• ${a.obs}` : ""}</div>
                </li>
              ))}
            </ul>
          )}

          <h4 style={{ marginTop: 12 }}>Agenda vencida</h4>
          {clsAgenda.overdue.length === 0 ? <p className="vazio">Nenhum compromisso vencido</p> : (
            <ul className="items">
              {clsAgenda.overdue.map(a => (
                <li key={a.id}>
                  <strong className="link-like" onClick={() => navigate(`/agenda/${a.id}`)}>{a.titulo}</strong>
                  <div className="meta">{isoDateOnly(a.data || a.data_iso)} {a.hora ? `• ${a.hora}` : ""} {a.obs ? `• ${a.obs}` : ""}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="dashday-extra">
        <div className="birthdays">
          <h3>Aniversariantes hoje</h3>
          {birthdaysToday.length === 0 ? <p>Nenhum</p> : (
            <ul>{birthdaysToday.map(p => <li key={p.id || p.email}>{p.nome || p.nome_completo || p.email} — {p.dt_niver || p.nascimento}</li>)}</ul>
          )}
        </div>
      </section>
    </div>
  );
}
