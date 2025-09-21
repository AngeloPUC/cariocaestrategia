// src/pages/esteira/Esteira.jsx
import React, { useState, useEffect } from 'react'
import './Esteira.css'

const API_URL = 'https://api-estrategia.vercel.app'

export default function Esteira() {
  const [rows, setRows]           = useState([])
  const [detalhe, setDetalhe]     = useState(null)
  const [editingRow, setEditing]  = useState(null)
  const [creating, setCreating]   = useState(false)
  const [formData, setFormData]   = useState({
    nome: '',
    cnpjcpf: '',
    operacao: '',
    valor: '',
    data: ''
  })

  const token   = localStorage.getItem('token')
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  }

  // fetch inicial
  useEffect(() => {
    fetch(`${API_URL}/esteira/`, { headers })
      .then(r => r.json())
      .then(data => Array.isArray(data) && setRows(data))
      .catch(console.error)
  }, [token])

  // CRUD
  const handleDelete = async id => {
    if (!window.confirm('Confirma exclusão deste registro?')) return
    await fetch(`${API_URL}/esteira/${id}`, {
      method: 'DELETE',
      headers
    })
    setRows(rows.filter(r => r.id !== id))
    closeForms()
  }

  const handleConsult = async id => {
    const res  = await fetch(`${API_URL}/esteira/${id}`, { headers })
    const data = await res.json()
    setDetalhe(data)
    setEditing(null)
    setCreating(false)
  }

  const handleEditClick = r => {
    setEditing(r)
    setFormData({
      nome: r.nome || '',
      cnpjcpf: r.cnpjcpf || '',
      operacao: r.operacao || '',
      valor: r.valor || '',
      data: r.data ? r.data.split('T')[0] : ''
    })
    setDetalhe(null)
    setCreating(false)
  }

  const handleNewClick = () => {
    setCreating(true)
    setEditing(null)
    setDetalhe(null)
    setFormData({ nome: '', cnpjcpf: '', operacao: '', valor: '', data: '' })
  }

  const handleChange = e => {
    const { name, value } = e.target
    setFormData(f => ({ ...f, [name]: value }))
  }

  const handleFormSubmit = async () => {
    const method = creating ? 'POST' : 'PUT'
    const url    = creating
      ? `${API_URL}/esteira/`
      : `${API_URL}/esteira/${editingRow.id}`

    // normalizar valor: remover pontos e deixar com vírgula ou decimal conforme backend
    const payload = {
      ...formData,
      // garantir que data seja ISO yyyy-mm-ddT00:00:00Z se backend esperar datetime
      data: formData.data ? new Date(formData.data).toISOString() : null
    }

    const res   = await fetch(url, {
      method,
      headers,
      body: JSON.stringify(payload)
    })
    const saved = await res.json()

    if (res.ok) {
      if (creating) {
        setRows(prev => [...prev, saved].sort((a,b) => (a.data||'').localeCompare(b.data||'')))
      } else {
        setRows(prev => prev.map(r => (r.id === saved.id ? saved : r)))
      }
      closeForms()
    } else {
      const err = typeof saved === 'object' ? JSON.stringify(saved) : String(saved)
      alert('Erro: ' + err)
    }
  }

  const closeForms = () => {
    setCreating(false)
    setEditing(null)
    setDetalhe(null)
    setEditing(null)
  }

  // helpers de datas e ordenação
  const today        = new Date()
  const yyyy         = today.getFullYear()
  const monthStart   = new Date(yyyy, today.getMonth(), 1)
  const monthEnd     = new Date(yyyy, today.getMonth() + 1, 0)

  const formatDMY = iso => {
    if (!iso) return '—'
    const d = new Date(iso)
    const dd = String(d.getDate()).padStart(2, '0')
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const yy = d.getFullYear()
    return `${dd}/${mm}/${yy}`
  }

  // mapear operacao em categorias
  const categoryOf = operacao => {
    if (!operacao) return 'Outras'
    const op = operacao.toLowerCase()
    // Pessoa Juridica: livre ou direcionado (assumir contains)
    if (op.includes('livre') || op.includes('direcionado') || op.includes('pj')) return 'Pessoa Juridica'
    // Habitação
    if (op.includes('sbpe') || op.includes('fgts') || op.includes('egi') || op.includes('habitação') || op.includes('habitacao')) return 'Habitação'
    return 'Outras'
  }

  // separar por mês atual / próximos meses e por esteira (categoria)
  const withParsed = rows
    .map(r => ({ ...r, data_iso: r.data || null }))
    .sort((a, b) => (a.data_iso || '').localeCompare(b.data_iso || ''))

  const esteiraAtual = withParsed.filter(r => {
    if (!r.data_iso) return false
    const d = new Date(r.data_iso)
    return d >= monthStart && d <= monthEnd
  })

  const proximos = withParsed.filter(r => {
    if (!r.data_iso) return true // registros sem data ficam em próximos
    const d = new Date(r.data_iso)
    return d > monthEnd
  })

  const groupByCategory = list => {
    const map = { 'Pessoa Juridica': [], 'Habitação': [], 'Outras': [] }
    list.forEach(r => {
      const cat = categoryOf(r.operacao)
      map[cat] = map[cat] || []
      map[cat].push(r)
    })
    return map
  }

  const renderTable = lista => {
    if (!lista || !lista.length) return <p className="vazio">Nenhum registro</p>
    return (
      <table className="tabela-esteira">
        <thead>
          <tr>
            <th>Nome</th>
            <th>CNPJ/CPF</th>
            <th>Operação</th>
            <th>Valor (R$)</th>
            <th>Data</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {lista.map(r => (
            <tr key={r.id}>
              <td>{r.nome}</td>
              <td>{r.cnpjcpf}</td>
              <td>{r.operacao}</td>
              <td>{r.valor}</td>
              <td>{formatDMY(r.data_iso)}</td>
              <td className="acoes-tabela">
                <button className="btn-editar" onClick={() => { setEditing(r); handleEditClick(r); }}>✏️</button>
                <button className="btn-excluir" onClick={() => handleDelete(r.id)}>🗑️</button>
                <button className="btn-consultar" onClick={() => handleConsult(r.id)}>🔍</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    )
  }

  const renderCategorySection = (titulo, lista) => {
    if (!lista.length) return null
    return (
      <section className="esteira-section">
        <h4>{titulo} ({lista.length})</h4>
        {renderTable(lista)}
      </section>
    )
  }

  const atualGroups = groupByCategory(esteiraAtual)
  const proximosGroups = groupByCategory(proximos)

  return (
    <div className="esteira-container">
      <div className="esteira-header">
        <div className="linha-topo">
          <button className="btn-voltar" onClick={() => window.history.back()}>← Voltar</button>
          <h2>Esteira</h2>
        </div>
        <div className="linha-novo">
          <button className="btn-novo" onClick={handleNewClick}>➕ Novo</button>
        </div>
      </div>

      {(creating || editingRow) && (
        <div className="form-esteira">
          <h4>{creating ? '➕ Nova Esteira' : '✏️ Editar Esteira'}</h4>

          <label>
            Nome (empresa):
            <input name="nome" value={formData.nome} onChange={handleChange} />
          </label>

          <label>
            CNPJ / CPF:
            <input name="cnpjcpf" value={formData.cnpjcpf} onChange={handleChange} />
          </label>

          <label>
            Operação:
            <select name="operacao" value={formData.operacao} onChange={handleChange}>
              <option value="">-- selecione --</option>
              <option value="Livre">Pessoa Juridica - Livre</option>
              <option value="Direcionado">Pessoa Juridica - Direcionado</option>
              <option value="SBPE">Habitação - SBPE</option>
              <option value="FGTS">Habitação - FGTS</option>
              <option value="EGI">Habitação - EGI</option>
              <option value="Outras">Outras</option>
            </select>
          </label>

          <label>
            Valor (R$):
            <input name="valor" value={formData.valor} onChange={handleChange} />
          </label>

          <label>
            Data ( previsão ):
            <input type="date" name="data" value={formData.data} onChange={handleChange} />
          </label>

          <div className="form-actions">
            <button onClick={handleFormSubmit}>Salvar</button>
            <button className="btn-voltar" onClick={closeForms}>← Voltar</button>
          </div>
        </div>
      )}

      {!creating && !editingRow && detalhe && (
        <div className="detalhes-esteira">
          <button className="btn-voltar" onClick={() => setDetalhe(null)}>← Voltar</button>
          <h4>📄 Detalhes</h4>
          <p><strong>Nome:</strong> {detalhe.nome || '—'}</p>
          <p><strong>CNPJ/CPF:</strong> {detalhe.cnpjcpf || '—'}</p>
          <p><strong>Operação:</strong> {detalhe.operacao || '—'}</p>
          <p><strong>Valor:</strong> {detalhe.valor || '—'}</p>
          <p><strong>Data:</strong> {formatDMY(detalhe.data)}</p>
          <p><strong>Obs:</strong> {detalhe.obs || '—'}</p>
        </div>
      )}

      <section className="grupo-meses">
        <h3>Mês Atual ({monthStart.toLocaleString('pt-BR', { month: 'long' })})</h3>
        {renderCategorySection('Pessoa Juridica', atualGroups['Pessoa Juridica'] || [])}
        {renderCategorySection('Habitação', atualGroups['Habitação'] || [])}
        {renderCategorySection('Outras', atualGroups['Outras'] || [])}
      </section>

      <section className="grupo-meses">
        <h3>Próximos Meses</h3>
        {renderCategorySection('Pessoa Juridica', proximosGroups['Pessoa Juridica'] || [])}
        {renderCategorySection('Habitação', proximosGroups['Habitação'] || [])}
        {renderCategorySection('Outras', proximosGroups['Outras'] || [])}
      </section>
    </div>
  )
}
