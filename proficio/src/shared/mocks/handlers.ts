import { http, HttpResponse } from 'msw'
import { authUsersMock } from './data/authUsers'
import { colaboradores, colaboradorCompetencias, emailToColaboradorId, competencias } from './data/colaboradores'

export const handlers = [
  http.post('/api/login', async ({ request }) => {
    const body = await request.json().catch(() => ({} as any)) as { email?: string }
    const email = body?.email?.toLowerCase?.()
    const found = authUsersMock.find((u) => u.email.toLowerCase() === email)
    if (!found) {
      return HttpResponse.json({ message: 'Usuário não autorizado' }, { status: 401 })
    }
    return HttpResponse.json({ token: `fake-token-${Date.now()}`, user: found }, { status: 200 })
  }),

  http.get('/api/perfil', async ({ request }) => {
    const url = new URL(request.url)
    const authUserId = url.searchParams.get('id') ?? ''
    const authUser = authUsersMock.find((u) => u.id === authUserId)
    if (!authUser) {
      return HttpResponse.json({ message: 'Usuário não encontrado' }, { status: 404 })
    }
    const colabId = emailToColaboradorId[authUser.email.toLowerCase()] ?? null
    if (!colabId) {
      return HttpResponse.json({ message: 'Colaborador não encontrado' }, { status: 404 })
    }
    const colab = colaboradores.find(c => c.id_colaborador === colabId)
    if (!colab) {
      return HttpResponse.json({ message: 'Colaborador não encontrado' }, { status: 404 })
    }
    const comps = colaboradorCompetencias
      .filter(cc => cc.id_colaborador === colabId)
      .sort((a, b) => {
        const ao = a.ordem ?? 0
        const bo = b.ordem ?? 0
        if (ao === 0 && bo === 0) return 0
        if (ao === 0) return 1
        if (bo === 0) return -1
        return ao - bo
      })
    const payload = { ...colab, competencias: comps }
    return HttpResponse.json(payload, { status: 200 })
  }),

  http.patch('/api/perfil', async ({ request }) => {
    const body = await request.json().catch(() => ({} as any)) as { id?: string; competencias?: { id?: number; id_competencia?: number; ordem: number }[], foto_url?: string, cover_url?: string }
    const authUserId = body?.id ?? ''
    const authUser = authUsersMock.find((u) => u.id === authUserId)
    if (!authUser) {
      return HttpResponse.json({ message: 'Usuário não encontrado' }, { status: 404 })
    }
    const colabId = emailToColaboradorId[authUser.email.toLowerCase()] ?? null
    if (!colabId) {
      return HttpResponse.json({ message: 'Colaborador não encontrado' }, { status: 404 })
    }
    // Atualização de foto
    if (typeof body.foto_url === 'string') {
      const colab = colaboradores.find(c => c.id_colaborador === colabId)
      if (colab) {
        colab.foto_url = body.foto_url
        colab.updated_at = new Date().toISOString()
      }
    }
    // Atualização de capa
    if (typeof body.cover_url === 'string') {
      const colab = colaboradores.find(c => c.id_colaborador === colabId)
      if (colab) {
        colab.cover_url = body.cover_url
        colab.updated_at = new Date().toISOString()
      }
    }

    // Atualização de competências (cria se vier id_competencia sem id) e SETA ordem apenas nas destacadas (demais ficam null)
    const updates = (body.competencias ?? []).slice(0, 4)
    const desiredPairs: Array<{ id: number; ordem: number }> = []
    for (const u of updates) {
      if (u.id) {
        desiredPairs.push({ id: u.id, ordem: u.ordem })
      } else if (u.id_competencia) {
        const compId = u.id_competencia
        const compRef = competencias.find(c => c.id_competencia === compId)
        if (compRef) {
          const existing = colaboradorCompetencias.find(cc => cc.id_colaborador === colabId && cc.id_competencia === compId)
          if (existing) {
            desiredPairs.push({ id: existing.id, ordem: u.ordem })
          } else {
            const newId = Math.max(0, ...colaboradorCompetencias.map(cc => cc.id)) + 1
            colaboradorCompetencias.push({
              id: newId,
              id_colaborador: colabId,
              id_competencia: compId,
              proeficiencia: 0,
              ordem: u.ordem,
              competencia: compRef,
            })
            desiredPairs.push({ id: newId, ordem: u.ordem })
          }
        }
      }
    }

    // Zera ordem de todas as competências do colaborador (não destacadas)
    for (const cc of colaboradorCompetencias) {
      if (cc.id_colaborador === colabId) cc.ordem = null as unknown as number
    }
    // Aplica ordem somente às destacadas informadas
    for (const pair of desiredPairs) {
      const item = colaboradorCompetencias.find(cc => cc.id === pair.id && cc.id_colaborador === colabId)
      if (item) item.ordem = pair.ordem
    }
    // seta updated_at ao salvar competências
    const colab = colaboradores.find(c => c.id_colaborador === colabId)
    if (colab) colab.updated_at = new Date().toISOString()
    return HttpResponse.json({ ok: true }, { status: 200 })
  }),
  // Lista de competências
  http.get('/api/competencias', async () => {
    return HttpResponse.json(competencias, { status: 200 })
  }),

  // Competências do usuário (listar)
  http.get('/api/usuario/competencias', async ({ request }) => {
    const url = new URL(request.url)
    const authUserId = url.searchParams.get('id') ?? ''
    const authUser = authUsersMock.find((u) => u.id === authUserId)
    if (!authUser) return HttpResponse.json({ message: 'Usuário não encontrado' }, { status: 404 })
    const colabId = emailToColaboradorId[authUser.email.toLowerCase()]
    if (!colabId) return HttpResponse.json({ message: 'Colaborador não encontrado' }, { status: 404 })
    const items = colaboradorCompetencias
      .filter(cc => cc.id_colaborador === colabId)
      .map(cc => ({ ...cc }))
    return HttpResponse.json(items, { status: 200 })
  }),

  // Competências do usuário (atualizar/adicionar)
  http.patch('/api/usuario/competencias', async ({ request }) => {
    const body = await request.json().catch(() => ({} as any)) as { id?: string; competencias: { id?: number; id_competencia?: number; proeficiencia: number }[] }
    const authUser = authUsersMock.find((u) => u.id === body.id)
    if (!authUser) return HttpResponse.json({ message: 'Usuário não encontrado' }, { status: 404 })
    const colabId = emailToColaboradorId[authUser.email.toLowerCase()]
    if (!colabId) return HttpResponse.json({ message: 'Colaborador não encontrado' }, { status: 404 })

    for (const u of body.competencias ?? []) {
      if (u.id) {
        const item = colaboradorCompetencias.find(cc => cc.id === u.id && cc.id_colaborador === colabId)
        if (item) item.proeficiencia = u.proeficiencia
      } else if (u.id_competencia) {
        let item = colaboradorCompetencias.find(cc => cc.id_colaborador === colabId && cc.id_competencia === u.id_competencia)
        if (!item) {
          const compRef = competencias.find(c => c.id_competencia === u.id_competencia)
          if (!compRef) continue
          const newId = Math.max(0, ...colaboradorCompetencias.map(cc => cc.id)) + 1
          item = {
            id: newId,
            id_colaborador: colabId,
            id_competencia: compRef.id_competencia,
            proeficiencia: u.proeficiencia,
            ordem: null as unknown as number,
            competencia: compRef,
          }
          colaboradorCompetencias.push(item)
        } else {
          item.proeficiencia = u.proeficiencia
        }
      }
    }
    return HttpResponse.json({ ok: true }, { status: 200 })
  }),

  // Competências do usuário (excluir)
  http.delete('/api/usuario/competencias', async ({ request }) => {
    const body = await request.json().catch(() => ({} as any)) as { id?: string; id_item?: number }
    const authUser = authUsersMock.find((u) => u.id === body.id)
    if (!authUser) return HttpResponse.json({ message: 'Usuário não encontrado' }, { status: 404 })
    const colabId = emailToColaboradorId[authUser.email.toLowerCase()]
    if (!colabId) return HttpResponse.json({ message: 'Colaborador não encontrado' }, { status: 404 })
    const idx = colaboradorCompetencias.findIndex(cc => cc.id === (body.id_item as number) && cc.id_colaborador === colabId)
    if (idx >= 0) {
      colaboradorCompetencias.splice(idx, 1)
    }
    return HttpResponse.json({ ok: true }, { status: 200 })
  }),

  // Criar nova competência global
  http.post('/api/competencias', async ({ request }) => {
    const body = await request.json().catch(() => ({} as any)) as { nome?: string; tipo?: 'HARD' | 'SOFT' }
    const nome = (body.nome ?? '').trim()
    if (!nome) return HttpResponse.json({ message: 'Nome é obrigatório' }, { status: 400 })
    const exists = competencias.find(c => c.nome.toLowerCase() === nome.toLowerCase())
    if (exists) return HttpResponse.json(exists, { status: 200 })
    const nextId = Math.max(0, ...competencias.map(c => c.id_competencia)) + 1
    const novo = { id_competencia: nextId, nome, tipo: body.tipo ?? 'HARD' as const }
    competencias.push(novo)
    return HttpResponse.json(novo, { status: 201 })
  }),
]


