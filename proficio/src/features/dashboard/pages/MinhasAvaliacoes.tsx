import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { api } from '@/shared/lib/api'
import type { Colaborador, ColaboradorCompetencia } from '@/shared/types'
import { Card } from '@/shared/components/ui/card'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { Input } from '@/shared/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs'

type PublicEvaluation = {
  id: number
  resumo: string | null
  created_at?: string | null
}

export function MinhasAvaliacoes() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [colab, setColab] = useState<Colaborador | null>(null)
  const [publicEvals, setPublicEvals] = useState<PublicEvaluation[]>([])
  const [competencias, setCompetencias] = useState<ColaboradorCompetencia[]>([])
  const [qResumo, setQResumo] = useState('')
  const [qComp, setQComp] = useState('')

  useEffect(() => {
    if (!user?.id) return
    setLoading(true)
    Promise.all([
      // avaliações públicas
      (async () => {
        try {
          const res = await api.get<any[]>('/avaliacoes/minhas')
          const mapped: PublicEvaluation[] = (res.data || [])
            .filter((it: any) => it?.publico === true || it?.isPublic === true) // futura compat
            .map((it: any) => ({
              id: Number(it?.id ?? 0),
              resumo: it?.resumo ?? null,
              created_at: it?.created_at ?? it?.criado_em ?? null,
            }))
          setPublicEvals(mapped)
        } catch {
          setPublicEvals([])
        }
      })(),
      // perfil com competências
      api.get<any>(`/colaboradores/${encodeURIComponent(user.id)}/perfil`),
    ])
      .then(([_, perfil]) => {
        const vm = perfil.data
        setColab(vm as Colaborador)
        const list = Array.isArray(vm?.competencias) ? vm.competencias : []
        const mapped: ColaboradorCompetencia[] = list.map((cc: any) => ({
          id: Number(cc?.id ?? 0),
          id_colaborador: Number(vm?.id_colaborador ?? vm?.id ?? user.id),
          id_competencia: Number(cc?.id_competencia ?? cc?.competencia?.id_competencia ?? cc?.competenciaId ?? 0),
          proeficiencia: Number(cc?.proeficiencia ?? 0),
          ordem: cc?.ordem ?? (null as unknown as number),
          competencia: cc?.competencia ?? undefined,
        }))
        setCompetencias(mapped)
      })
      .finally(() => setLoading(false))
  }, [user?.id])

  const sortedCompetencias = useMemo(() => {
    const base = [...competencias].sort((a, b) => (b.proeficiencia ?? 0) - (a.proeficiencia ?? 0))
    const t = qComp.trim().toLowerCase()
    if (!t) return base
    return base.filter(cc => (cc.competencia?.nome ?? '').toLowerCase().includes(t))
  }, [competencias, qComp])

  const filteredPublic = useMemo(() => {
    const t = qResumo.trim().toLowerCase()
    if (!t) return publicEvals
    return publicEvals.filter(ev => (ev.resumo ?? '').toLowerCase().includes(t))
  }, [publicEvals, qResumo])

  return (
    <div className="space-y-4">
      <Tabs defaultValue="resumo">
        <TabsList className="mb-2">
          <TabsTrigger value="resumo">Resumo público</TabsTrigger>
          <TabsTrigger value="competencias">Competências</TabsTrigger>
        </TabsList>
        <TabsContent value="resumo">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-full max-w-sm">
                <Input placeholder="Buscar no resumo..." value={qResumo} onChange={(e) => setQResumo(e.target.value)} />
              </div>
            </div>
            {loading ? (
              <div className="space-y-2">
                {[...Array(6)].map((_, idx) => <Skeleton key={idx} className="h-10 w-full" />)}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-muted-foreground">
                      <th className="py-2 pr-4">Data</th>
                      <th className="py-2 pr-4">Resumo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPublic.map(ev => (
                      <tr key={ev.id} className="border-t hover:bg-muted/60 transition-colors">
                        <td className="py-3 pr-4">{ev.created_at ? new Date(ev.created_at).toLocaleString() : '—'}</td>
                        <td className="py-3 pr-4">{ev.resumo || 'Sem comentários'}</td>
                      </tr>
                    ))}
                    {filteredPublic.length === 0 && (
                      <tr>
                        <td colSpan={2} className="py-6 text-center text-sm text-muted-foreground">
                          Nenhuma avaliação pública por enquanto.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </TabsContent>
        <TabsContent value="competencias">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-full max-w-sm">
                <Input placeholder="Buscar competência..." value={qComp} onChange={(e) => setQComp(e.target.value)} />
              </div>
            </div>
            {loading ? (
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {[...Array(6)].map((_, idx) => <Skeleton key={idx} className="h-16 w-full" />)}
              </div>
            ) : sortedCompetencias.length > 0 ? (
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {sortedCompetencias.map(cc => (
                  <Card key={cc.id} className="px-3 py-2">
                    <div className="text-[11px] text-muted-foreground">Competência</div>
                    <div className="text-sm font-medium truncate">{cc.competencia?.nome ?? '—'}</div>
                    <div className="text-[11px] text-muted-foreground mt-2">Proficiência</div>
                    <div className="text-sm font-medium">{cc.proeficiencia}/5</div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">Nenhuma competência avaliada.</div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}


