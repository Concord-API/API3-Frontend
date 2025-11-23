import { useEffect, useMemo, useState } from 'react'
import { Dialog as Modal, DialogContent as ModalContent, DialogHeader as ModalHeader, DialogTitle as ModalTitle, DialogFooter as ModalFooter, DialogDescription as ModalDescription } from '@/shared/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs'
import { ScrollArea } from '@/shared/components/ui/scroll-area'
import { Button } from '@/shared/components/ui/button'
import { Avatar as UiAvatar, AvatarFallback as UiAvatarFallback, AvatarImage as UiAvatarImage } from '@/shared/components/ui/avatar'
import { toast } from 'sonner'
import type { Colaborador, ColaboradorCompetencia, Equipe, Setor } from '@/shared/types'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { api } from '@/shared/lib/api'

type Props = {
  open: boolean
  onOpenChange: (v: boolean) => void
  evaluationId: number | null
  setEvaluationId: (id: number) => void
  items: Colaborador[]
  filteredIds: number[]
  competenciasByColab: Record<number, ColaboradorCompetencia[]>
  setores: Setor[]
  equipes: Equipe[]
  onSave?: () => void
  existingEvaluation?: {
    id: number
    competenciaId: number
    competenciaNome: string
    resumo: string | null
    publico: boolean
    nota?: number
  } | null
}

export function EvaluateCollaboratorModal({
  open,
  onOpenChange,
  evaluationId,
  setEvaluationId,
  items,
  filteredIds,
  competenciasByColab,
  setores,
  equipes,
  onSave,
  existingEvaluation,
}: Props) {
  const { user } = useAuth()
  const [comments, setComments] = useState<string>('')
  const [isPublic, setIsPublic] = useState<boolean>(true)
  const [selectedCompetencia, setSelectedCompetencia] = useState<number | ''>('')
  const [competenceEvaluations, setCompetenceEvaluations] = useState<Record<number, { rating: number | ''; review: string }>>({})
  const [isSaving, setIsSaving] = useState(false)

  const current = useMemo(
    () => items.find(it => ((it as any).id_colaborador ?? (it as any).id) === evaluationId),
    [items, evaluationId]
  )

  useEffect(() => {
    if (existingEvaluation && open) {
      setComments(existingEvaluation.resumo || '')
      setIsPublic(existingEvaluation.publico)
      setSelectedCompetencia(existingEvaluation.competenciaId)
      setCompetenceEvaluations({
        [existingEvaluation.competenciaId]: {
          rating: existingEvaluation.nota ?? '',
          review: existingEvaluation.resumo || ''
        }
      })
    } else {
      setComments('')
      setIsPublic(true)
      setSelectedCompetencia('')
      setCompetenceEvaluations({})
    }
  }, [evaluationId, open, existingEvaluation])

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent className="sm:max-w-[720px]">
        <ModalHeader>
          <ModalTitle className="flex items-center gap-3">
            {(() => {
              const foto = current ? (((current as any).foto_url ?? (current as any).avatar) as unknown) : undefined
              const src = (() => {
                if (!foto) return ''
                const s = String(foto)
                return s.startsWith('data:') ? s : `data:image/png;base64,${s}`
              })()
              const initial = (current?.nome?.[0] ?? current?.sobrenome?.[0] ?? (current as any)?.email?.[0] ?? '?').toUpperCase()
              const setorName = (() => {
                const setorId = (current as any)?.idSetor ?? current?.equipe?.setor?.id_setor ?? (current as any)?.id_setor
                return setores.find(s => s.id_setor === setorId)?.nome_setor
              })()
              const equipeName = (() => {
                const equipeId = (current as any)?.idEquipe ?? current?.equipe?.id_equipe ?? (current as any)?.id_equipe
                return equipes.find(e => e.id_equipe === equipeId)?.nome_equipe
              })()
              return (
                <div className="flex items-center gap-3">
                  <UiAvatar className="size-12">
                    <UiAvatarImage src={src || undefined} alt="" />
                    <UiAvatarFallback>{initial}</UiAvatarFallback>
                  </UiAvatar>
                  <div className="min-w-0">
                    <div className="text-base font-semibold leading-tight truncate">
                      {current ? `${current.nome} ${current.sobrenome}` : 'Avaliar colaborador'}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {((current as any)?.cargoNome ?? current?.cargo?.nome_cargo) ?? '—'}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px]">
                      {setorName && <span className="inline-flex items-center rounded-full border px-2 py-0.5">{setorName}</span>}
                      {equipeName && <span className="inline-flex items-center rounded-full border px-2 py-0.5">{equipeName}</span>}
                    </div>
                  </div>
                </div>
              )
            })()}
          </ModalTitle>
          <ModalDescription className="sr-only">
            Avalie as competências e deixe um resumo sobre o desempenho do colaborador.
          </ModalDescription>
        </ModalHeader>
        <ScrollArea className="max-h-[65vh] min-h-[380px]">
          <div className="px-6 pb-2">
            <Tabs defaultValue="resumo">
              <TabsList className="mb-3">
                <TabsTrigger value="resumo">Resumo</TabsTrigger>
                <TabsTrigger value="competencias">Competências</TabsTrigger>
              </TabsList>
              <TabsContent value="resumo">
                <div className="grid gap-3">
                  <div className="grid gap-1">
                    <label className="text-sm text-muted-foreground">Comentários e evidências</label>
                    <textarea
                      rows={6}
                      className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                      value={comments}
                      onChange={(e) => setComments(e.target.value)}
                      placeholder="Ex.: Resultados, comportamentos observados, metas batidas..."
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      id="flag-publica"
                      type="checkbox"
                      className="size-4 accent-primary"
                      checked={isPublic}
                      onChange={(e) => setIsPublic(e.target.checked)}
                    />
                    <label htmlFor="flag-publica" className="text-sm">Tornar avaliação pública ao avaliado</label>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="competencias">
                <div className="grid gap-3">
                  {(() => {
                    const list = evaluationId ? (competenciasByColab[evaluationId] ?? []) : []
                    if (!list.length) return <div className="text-sm text-muted-foreground">Sem competências cadastradas</div>
                    const currentEval = selectedCompetencia === '' ? undefined : competenceEvaluations[selectedCompetencia]
                    const currentRating = currentEval?.rating ?? ''
                    const currentReview = currentEval?.review ?? ''
                    return (
                      <div className="grid gap-3">
                        <div className="grid gap-1">
                          <label className="text-sm text-muted-foreground">Competência</label>
                          <select
                            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                            value={selectedCompetencia === '' ? '' : String(selectedCompetencia)}
                            onChange={(e) => {
                              const v = e.target.value ? Number(e.target.value) : ''
                              setSelectedCompetencia(v)
                            }}
                          >
                            <option value="">Selecione...</option>
                            {list.map(cc => (
                              <option key={cc.id_competencia} value={cc.id_competencia}>
                                {cc.competencia?.nome ?? '—'}
                              </option>
                            ))}
                          </select>
                        </div>
                        {selectedCompetencia !== '' && (
                          <>
                            <div className="grid gap-1">
                              <label className="text-sm text-muted-foreground">Nota (1 a 5)</label>
                              <select
                                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                                value={currentRating === '' ? '' : String(currentRating)}
                                onChange={(e) => {
                                  const val = e.target.value ? Number(e.target.value) : ''
                                  setCompetenceEvaluations((prev) => ({
                                    ...prev,
                                    [selectedCompetencia]: {
                                      rating: val,
                                      review: prev[selectedCompetencia]?.review ?? ''
                                    }
                                  }))
                                }}
                              >
                                <option value="">—</option>
                                {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
                              </select>
                            </div>
                            <div className="grid gap-1">
                              <label className="text-sm text-muted-foreground">Resenha</label>
                              <textarea
                                rows={4}
                                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                                value={currentReview}
                                onChange={(e) => {
                                  const text = e.target.value
                                  setCompetenceEvaluations((prev) => ({
                                    ...prev,
                                    [selectedCompetencia]: {
                                      rating: prev[selectedCompetencia]?.rating ?? '',
                                      review: text
                                    }
                                  }))
                                }}
                                placeholder="Descreva evidências e observações sobre a competência selecionada..."
                              />
                            </div>
                          </>
                        )}
                      </div>
                    )
                  })()}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </ScrollArea>
        <ModalFooter>
          <div className="flex w-full items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  if (!evaluationId) return
                  const idx = filteredIds.indexOf(evaluationId)
                  if (idx > 0) setEvaluationId(filteredIds[idx - 1])
                }}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  if (!evaluationId) return
                  const idx = filteredIds.indexOf(evaluationId)
                  if (idx >= 0 && idx < filteredIds.length - 1) setEvaluationId(filteredIds[idx + 1])
                }}
              >
                Próximo
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>Fechar</Button>
              <Button
                onClick={async () => {
                  if (!user?.id || !evaluationId) {
                    toast.error('Dados do usuário ou colaborador inválidos')
                    return
                  }

                  setIsSaving(true)
                  try {
                    const competenciasAvaliadas = Object.entries(competenceEvaluations)
                      .filter(([_, v]) => v.rating !== '' || (v.review && v.review.trim()))

                    if (competenciasAvaliadas.length === 0) {
                      toast.error('Avalie pelo menos uma competência')
                      setIsSaving(false)
                      return
                    }

                    const promises = competenciasAvaliadas.map(async ([competenciaIdStr, val]) => {
                      const compId = Number(competenciaIdStr)
                      const isUpdate = existingEvaluation && existingEvaluation.competenciaId === compId

                      if (isUpdate) {
                        const payload = {
                          resumo: val.review?.trim() || null,
                          competenciaId: compId,
                          status: true,
                          publico: isPublic === true,
                          nota: val.rating === '' ? undefined : Number(val.rating),
                        }
                        return api.put(`/avaliacoes/${existingEvaluation.id}`, payload)
                      } else {
                        const payload = {
                          avaliadorId: user.id,
                          avaliadoId: evaluationId,
                          resumo: val.review?.trim() || null,
                          competenciaId: compId,
                          status: true,
                          publico: isPublic === true,
                          nota: val.rating === '' ? undefined : Number(val.rating),
                        }
                        return api.post('/avaliacoes', payload)
                      }
                    })

                    await Promise.all(promises)

                    toast.success(`${competenciasAvaliadas.length} avaliação(ões) enviada(s) com sucesso!`)
                    onSave?.()
                    onOpenChange(false)
                  } catch (error: any) {
                    console.error('Erro ao salvar avaliação:', error)
                    const mensagem = error?.response?.data?.message || error?.message || 'Erro ao salvar avaliação'
                    toast.error(mensagem)
                  } finally {
                    setIsSaving(false)
                  }
                }}
                disabled={isSaving}
              >
                {isSaving ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </div>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}


