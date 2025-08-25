// src/pages/tarefas/Tarefas.jsx
import React, { useState, useEffect } from 'react'
import './Tarefas.css'

const API_URL = 'https://api-estrategia.vercel.app'

export default function Tarefas() {
  const [tarefas, setTarefas]     = useState([])
  const [detalhe, setDetalhe]     = useState(null)
  const [editingTask, setEditing] = useState(null)
  const [creating, setCreating]   = useState(false)
  const [formData, setFormData]   = useState({
    titulo: '',
    descricao: '',
    dt_venc: ''
  })

  const token   = localStorage.getItem('token')
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  }

  // fetch inicial
  useEffect(() => {
    fetch(`${API_URL}/tarefas`, { headers })
      .then(r => r.json())
      .then(data => Array.isArray(data) && setTarefas(data))
      .catch(console.error)
  }, [token])

  // ações CRUD na mesma página
  const handleDelete = async id => {
    if (!window.confirm('Confirma exclusão desta tarefa?')) return
    await fetch(`${API_URL}/tarefas/${id}`, {
      method: 'DELETE',
      headers
    })
    setTarefas(tarefas.filter(t => t.id !== id))
    closeForms()
  }

  const handleConsult = async id => {
    const res  = await fetch(`${API_URL}/tarefas/${id}`, { headers })
    const data = await res.json()
    setDetalhe(data)
    setEditing(null)
    setCreating(false)
  }

  const handleEditClick = t => {
    setEditing(t)
    setFormData({
      titulo: t.titulo,
      descricao: t.descricao,
      dt_venc: t.dt_venc
    })
    setDetalhe(null)
    setCreating(false)
  }

  const handleNewClick = () => {
    setCreating(true)
    setEditing(null)
    setDetalhe(null)
    setFormData({ titulo: '', descricao: '', dt_venc: '' })
  }

  const handleChange = e => {
    const { name, value } = e.target
    setFormData(f => ({ ...f, [name]: value }))
  }

  const handleFormSubmit = async () => {
    const method = creating ? 'POST' : 'PUT'
    const url    = creating
      ? `${API_URL}/tarefas`
      : `${API_URL}/tarefas/${editingTask.id}`

    const res   = await fetch(url, {
      method,
      headers,
      body: JSON.stringify(formData)
    })
    const saved = await res.json()

    if (creating) {
      setTarefas(prev => [...prev, saved])
    } else {
      setTarefas(prev =>
        prev.map(t => (t.id === saved.id ? saved : t))
      )
    }
    closeForms()
  }

  const closeForms = () => {
    setCreating(false)
    setEditing(null)
    setDetalhe(null)
  }

  // categorização de datas
  const hoje      = new Date().toISOString().slice(0, 10)
  const limite    = new Date()
  limite.setDate(limite.getDate() + 7)
  const semanaStr = limite.toISOString().slice(0, 10)

  const vencidas  = tarefas.filter(t => t.dt_venc < hoje)
  const doDia     = tarefas.filter(t => t.dt_venc === hoje)
  const daSemana  = tarefas.filter(
    t => t.dt_venc > hoje && t.dt_venc <= semanaStr
  )
  const demais    = tarefas.filter(t => t.dt_venc > semanaStr)

  const renderSection = (titulo, lista) => {
    if (!lista.length) return null
    return (
      <section className="tarefas-section">
        <h3>{titulo} ({lista.length})</h3>
        <table className="tabela-tarefas">
          <thead>
            <tr>
              <th>Título</th>
              <th>Vencimento</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {lista.map(t => (
              <tr key={t.id}>
                <td>{t.titulo}</td>
                <td>{t.dt_venc}</td>
                <td className="acoes-tabela">
                  <button
                    className="btn-editar"
                    onClick={() => handleEditClick(t)}
                  >✏️</button>
                  <button
                    className="btn-excluir"
                    onClick={() => handleDelete(t.id)}
                  >🗑️</button>
                  <button
                    className="btn-consultar"
                    onClick={() => handleConsult(t.id)}
                  >🔍</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    )
  }

  return (
    <div className="tarefas-container">
      <div className="tarefas-header">
        <div className="linha-topo">
          <button
            className="btn-voltar"
            onClick={() => window.history.back()}
          >
            ← Voltar
          </button>
          <h2>Tarefas</h2>
        </div>
        <div className="linha-novo">
          <button
            className="btn-novo"
            onClick={handleNewClick}
          >
            ➕ Novo
          </button>
        </div>
      </div>

      {renderSection('Tarefas Vencidas:', vencidas)}
      {renderSection('Tarefas do Dia:', doDia)}
      {renderSection('Tarefas proximos 7 dias:', daSemana)}
      {renderSection('Demais Tarefas:', demais)}

      {/* form de criação/edição */}
      {(creating || editingTask) && (
        <div className="form-tarefa">
          <h4>{creating ? '➕ Nova Tarefa' : '✏️ Editar Tarefa'}</h4>
          <label>
            Título:
            <input
              name="titulo"
              value={formData.titulo}
              onChange={handleChange}
            />
          </label>
          <label>
            Descrição:
            <textarea
              name="descricao"
              value={formData.descricao}
              onChange={handleChange}
            />
          </label>
          <label>
            Vencimento:
            <input
              type="date"
              name="dt_venc"
              value={formData.dt_venc}
              onChange={handleChange}
            />
          </label>
          <button onClick={handleFormSubmit}>Salvar</button>
          <button
            className="btn-voltar"
            onClick={closeForms}
          >
            ← Voltar
          </button>
        </div>
      )}

      {/* detalhes da tarefa */}
      {!creating && !editingTask && detalhe && (
        <div className="detalhes-tarefa">
          <button
            className="btn-voltar"
            onClick={() => setDetalhe(null)}
          >
            ← Voltar
          </button>
          <h4>📄 Detalhes da Tarefa</h4>
          <p><strong>Título:</strong> {detalhe.titulo || '—'}</p>
          <p><strong>Descrição:</strong> {detalhe.descricao || '—'}</p>
          <p><strong>Vencimento:</strong> {detalhe.dt_venc || '—'}</p>
        </div>
      )}
    </div>
  )
}
