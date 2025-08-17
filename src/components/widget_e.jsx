// src/components/WidgetE.jsx

import React, { useEffect, useState } from 'react';
import './Widget.css';

const API = 'https://api-estrategia.vercel.app';

export default function WidgetE() {
  const [funcionariosCount, setFuncs] = useState(0);
  const [acoesCount, setAcoesCount] = useState(0);
  const [erro, setErro] = useState('');

  const token = localStorage.getItem('token');
  const email = localStorage.getItem('usuario');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    if (!token || !email) {
      setErro('Usuário ou sessão inválidos');
      return;
    }

    (async () => {
      try {
        // 1) busca todos os "equipe" (que na swagger são os membros)
        const eqRes = await fetch(`${API}/equipe`, { headers });
        if (!eqRes.ok) throw new Error(`Equipe(${eqRes.status})`);
        const allMembros = await eqRes.json();
        // filtra pelos membros que pertencem ao seu time (owner_email === seu email)
        const meusMembros = allMembros.filter(m => m.owner_email === email);
        setFuncs(meusMembros.length);

        // 2) busca todas as ações
        const acRes = await fetch(`${API}/acoes`, { headers });
        if (!acRes.ok) throw new Error(`Ações(${acRes.status})`);
        const allAcoes = await acRes.json();
        // filtra as que são de sua responsabilidade (owner_email === seu email)
        const minhasAcoes = allAcoes.filter(a => a.owner_email === email);
        setAcoesCount(minhasAcoes.length);

      } catch (e) {
        console.error(e);
        setErro('Não foi possível carregar dados.');
      }
    })();
  }, [token, email]);

  return (
    <div className="widget">
      <h3>Minha Equipe</h3>

      {erro
        ? <p className="error">{erro}</p>
        : (
          <>
            <p><strong>Equipe total:</strong> {funcionariosCount}</p>
            <p><strong>Ações totais:</strong> {acoesCount}</p>
          </>
        )
      }
    </div>
  );
}
