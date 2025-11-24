import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { api } from '@/shared/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { Input } from '@/shared/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs'
import { Button } from '@/shared/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog'
import { Eye, Star } from 'lucide-react'
import { ScrollArea } from '@/shared/components/ui/scroll-area'
import { Separator } from '@/shared/components/ui/separator'

type PublicEvaluation = {
  id: number
  avaliadorNome?: string | null
  resumo: string | null
  nota?: number | null
  competenciaNome?: string | null
  competenciaId?: number | null
  created_at?: string | null
}

type CompetenciaEvaluations = {
  competenciaId: number
  competenciaNome: string
  avaliacoes: PublicEvaluation[]
}

export function MinhasAvaliacoes() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [publicEvals, setPublicEvals] = useState<PublicEvaluation[]>([])
  const [qResumo, setQResumo] = useState('')
  const [qComp, setQComp] = useState('')
  
  // Modal states
  const [resumoModalOpen, setResumoModalOpen] = useState(false)
  const [selectedResumo, setSelectedResumo] = useState<PublicEvaluation | null>(null)
  
  const [compModalOpen, setCompModalOpen] = useState(false)
  const [selectedCompetencia, setSelectedCompetencia] = useState<CompetenciaEvaluations | null>(null)

  useEffect(() => {
    if (!user?.id) return
    setLoading(true)
    ;(async () => {
      try {
        const res = await api.get<any[]>('/avaliacoes/minhas')
        const mapped: PublicEvaluation[] = (res.data || [])
          .filter((it: any) => it?.publico === true)
          .map((it: any) => ({
            id: Number(it?.id ?? 0),
            avaliadorNome: it?.avaliadorNome ?? null,
            resumo: it?.resumo ?? null,
            nota: it?.nota ?? null,
            competenciaNome: it?.competenciaNome ?? null,
            competenciaId: it?.competenciaId ?? null,
            created_at: it?.created_at ?? it?.criadoEm ?? null,
          }))
        setPublicEvals(mapped)
      } catch {
        setPublicEvals([])
      } finally {
        setLoading(false)
      }
    })()
  }, [user?.id])


  const filteredPublic = useMemo(() => {
    const t = qResumo.trim().toLowerCase()
    if (!t) return publicEvals
    return publicEvals.filter(ev => 
      (ev.avaliadorNome ?? '').toLowerCase().includes(t) ||
      (ev.competenciaNome ?? '').toLowerCase().includes(t)
    )
  }, [publicEvals, qResumo])

  const competenciasComAvaliacoes = useMemo(() => {
    const map = new Map<number, CompetenciaEvaluations>()
    
    publicEvals.forEach(ev => {
      if (!ev.competenciaId) return
      const compId = ev.competenciaId
      
      if (!map.has(compId)) {
        map.set(compId, {
          competenciaId: compId,
          competenciaNome: ev.competenciaNome ?? 'Competência',
          avaliacoes: []
        })
      }
      map.get(compId)!.avaliacoes.push(ev)
    })
    
    const t = qComp.trim().toLowerCase()
    const result = Array.from(map.values())
    if (!t) return result
    return result.filter(c => c.competenciaNome.toLowerCase().includes(t))
  }, [publicEvals, qComp])

  const openResumoModal = (evaluation: PublicEvaluation) => {
    setSelectedResumo(evaluation)
    setResumoModalOpen(true)
  }

  const openCompetenciaModal = (comp: CompetenciaEvaluations) => {
    setSelectedCompetencia(comp)
    setCompModalOpen(true)
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Minhas Avaliações</CardTitle>
          <CardDescription>Visualize as avaliações públicas que você recebeu</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="resumo" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="resumo">Todas as Avaliações</TabsTrigger>
              <TabsTrigger value="competencias">Por Competência</TabsTrigger>
            </TabsList>

            <TabsContent value="resumo" className="space-y-4">
              <div className="flex items-center gap-2">
                <Input 
                  placeholder="Buscar por avaliador ou competência..." 
                  value={qResumo} 
                  onChange={(e) => setQResumo(e.target.value)}
                  className="max-w-sm"
                />
              </div>

              {loading ? (
                <div className="space-y-2">
                  {[...Array(6)].map((_, idx) => <Skeleton key={idx} className="h-16 w-full" />)}
                </div>
              ) : (
                <div className="rounded-md border">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="py-3 px-4 text-left font-medium">Avaliador</th>
                          <th className="py-3 px-4 text-left font-medium">Competência</th>
                          <th className="py-3 px-4 text-left font-medium">Nota</th>
                          <th className="py-3 px-4 text-left font-medium">Data</th>
                          <th className="py-3 px-4 text-center font-medium">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredPublic.map(ev => (
                          <tr key={ev.id} className="border-b hover:bg-muted/30 transition-colors">
                            <td className="py-3 px-4">
                              <span className="font-medium">{ev.avaliadorNome ?? '—'}</span>
                            </td>
                            <td className="py-3 px-4">
                              {ev.competenciaNome ? (
                                <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary border border-primary/20">
                                  {ev.competenciaNome}
                                </span>
                              ) : (
                                <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground border">
                                  Avaliação Geral
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              {ev.nota != null ? (
                                <div className="flex items-center gap-1">
                                  <Star className="size-4 fill-yellow-500 text-yellow-500" />
                                  <span className="font-semibold">{ev.nota}/5</span>
                                </div>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-muted-foreground">
                              {ev.created_at ? new Date(ev.created_at).toLocaleDateString('pt-BR') : '—'}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => openResumoModal(ev)}
                              >
                                <Eye className="size-4 mr-1" />
                                Ver resumo
                              </Button>
                            </td>
                          </tr>
                        ))}
                        {filteredPublic.length === 0 && (
                          <tr>
                            <td colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                              Nenhuma avaliação pública encontrada.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="competencias" className="space-y-4">
              <div className="flex items-center gap-2">
                <Input 
                  placeholder="Buscar competência..." 
                  value={qComp} 
                  onChange={(e) => setQComp(e.target.value)}
                  className="max-w-sm"
                />
              </div>

              {loading ? (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {[...Array(6)].map((_, idx) => <Skeleton key={idx} className="h-32 w-full" />)}
                </div>
              ) : competenciasComAvaliacoes.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {competenciasComAvaliacoes.map(comp => (
                    <Card 
                      key={comp.competenciaId} 
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => openCompetenciaModal(comp)}
                    >
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">{comp.competenciaNome}</CardTitle>
                        <CardDescription>
                          {comp.avaliacoes.length} {comp.avaliacoes.length === 1 ? 'avaliação' : 'avaliações'}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-muted-foreground">
                            Nota média
                          </div>
                          <div className="flex items-center gap-1">
                            <Star className="size-4 fill-yellow-500 text-yellow-500" />
                            <span className="font-semibold">
                              {(comp.avaliacoes.reduce((acc, av) => acc + (av.nota ?? 0), 0) / comp.avaliacoes.length).toFixed(1)}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  Nenhuma competência avaliada ainda.
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Modal de Resumo */}
      <Dialog open={resumoModalOpen} onOpenChange={setResumoModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Resumo da Avaliação</DialogTitle>
            <DialogDescription>
              Avaliação de {selectedResumo?.avaliadorNome ?? 'Avaliador'} em {selectedResumo?.created_at ? new Date(selectedResumo.created_at).toLocaleDateString('pt-BR') : '—'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            {selectedResumo?.competenciaNome && (
              <div>
                <div className="text-sm font-medium mb-1">Competência</div>
                <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary border border-primary/20">
                  {selectedResumo.competenciaNome}
                </span>
              </div>
            )}
            {!selectedResumo?.competenciaNome && (
              <div>
                <div className="text-sm font-medium mb-1">Tipo</div>
                <span className="inline-flex items-center rounded-full bg-muted px-3 py-1 text-sm font-medium text-muted-foreground border">
                  Avaliação Geral
                </span>
              </div>
            )}
            
            {selectedResumo?.nota != null && (
              <div>
                <div className="text-sm font-medium mb-1">Nota</div>
                <div className="flex items-center gap-2">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      className={`size-5 ${i < (selectedResumo.nota ?? 0) ? 'fill-yellow-500 text-yellow-500' : 'text-muted-foreground'}`}
                    />
                  ))}
                  <span className="ml-2 font-semibold">{selectedResumo.nota}/5</span>
                </div>
              </div>
            )}

            <Separator />

            <div>
              <div className="text-sm font-medium mb-2">Comentário</div>
              <ScrollArea className="h-[200px] rounded-md border p-4">
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {selectedResumo?.resumo || 'Sem comentários adicionais.'}
                </p>
              </ScrollArea>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Competência */}
      <Dialog open={compModalOpen} onOpenChange={setCompModalOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Avaliações de {selectedCompetencia?.competenciaNome}</DialogTitle>
            <DialogDescription>
              {selectedCompetencia?.avaliacoes.length} {selectedCompetencia?.avaliacoes.length === 1 ? 'avaliação recebida' : 'avaliações recebidas'}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] mt-2">
            <div className="space-y-4 pr-4">
              {selectedCompetencia?.avaliacoes.map((av) => (
                <Card key={av.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base">{av.avaliadorNome ?? 'Avaliador'}</CardTitle>
                        <CardDescription>
                          {av.created_at ? new Date(av.created_at).toLocaleDateString('pt-BR') : '—'}
                        </CardDescription>
                      </div>
                      {av.nota != null && (
                        <div className="flex items-center gap-1">
                          <Star className="size-4 fill-yellow-500 text-yellow-500" />
                          <span className="font-semibold">{av.nota}/5</span>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {av.resumo || 'Sem comentários.'}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  )
}
