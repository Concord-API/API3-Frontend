import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog'
import { ScrollArea } from '@/shared/components/ui/scroll-area'
import { Separator } from '@/shared/components/ui/separator'
import { Star } from 'lucide-react'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  evaluation: {
    colaboradorNome: string
    colaboradorEmail?: string
    competenciaNome?: string | null
    nota?: number | null
    resumo?: string | null
    criadoEm?: string | null
    atualizadoEm?: string | null
    publico?: boolean
  } | null
}

export function ViewEvaluationModal({ open, onOpenChange, evaluation }: Props) {
  if (!evaluation) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Detalhes da Avaliação</DialogTitle>
          <DialogDescription>
            Avaliação de {evaluation.colaboradorNome}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div>
            <div className="text-sm font-medium mb-1">Colaborador</div>
            <div className="text-sm text-muted-foreground">{evaluation.colaboradorNome}</div>
            {evaluation.colaboradorEmail && (
              <div className="text-xs text-muted-foreground">{evaluation.colaboradorEmail}</div>
            )}
          </div>

          <Separator />

          <div>
            <div className="text-sm font-medium mb-1">Tipo de Avaliação</div>
            {evaluation.competenciaNome ? (
              <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary border border-primary/20">
                {evaluation.competenciaNome}
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-muted px-3 py-1 text-sm font-medium text-muted-foreground border">
                Avaliação Geral
              </span>
            )}
          </div>

          {evaluation.nota != null && (
            <>
              <Separator />
              <div>
                <div className="text-sm font-medium mb-2">Nota</div>
                <div className="flex items-center gap-2">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      className={`size-5 ${i < (evaluation.nota ?? 0) ? 'fill-yellow-500 text-yellow-500' : 'text-muted-foreground'}`}
                    />
                  ))}
                  <span className="ml-2 font-semibold">{evaluation.nota}/5</span>
                </div>
              </div>
            </>
          )}

          <Separator />

          <div>
            <div className="text-sm font-medium mb-2">Comentário</div>
            <ScrollArea className="h-[200px] rounded-md border p-4">
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {evaluation.resumo || 'Sem comentários adicionais.'}
              </p>
            </ScrollArea>
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground">Criada em</div>
              <div className="font-medium">
                {evaluation.criadoEm ? new Date(evaluation.criadoEm).toLocaleString('pt-BR') : '—'}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Atualizada em</div>
              <div className="font-medium">
                {evaluation.atualizadoEm ? new Date(evaluation.atualizadoEm).toLocaleString('pt-BR') : '—'}
              </div>
            </div>
          </div>

          <div>
            <div className="text-sm text-muted-foreground">
              Visibilidade: <span className="font-medium text-foreground">
                {evaluation.publico ? 'Pública (visível ao colaborador)' : 'Privada (apenas gestores)'}
              </span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}




