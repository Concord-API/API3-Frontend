import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/shared/components/ui/dialog'
import { api } from '@/shared/lib/api'
import { Skeleton } from '@/shared/components/ui/skeleton'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  colaboradorId: number | null
  competenciaItemId: number | null
  competenciaNome?: string
}

export function CertificateViewerModal({ open, onOpenChange, colaboradorId, competenciaItemId, competenciaNome }: Props) {
  const [url, setUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let revoked = false
    if (!open || !colaboradorId || !competenciaItemId) {
      setUrl(null)
      setError(null)
      return
    }
    setLoading(true)
    setError(null)
    api.get<ArrayBuffer>(`/colaboradores/${encodeURIComponent(colaboradorId)}/competencias/${encodeURIComponent(competenciaItemId)}/certificado`, {
      responseType: 'blob',
      headers: { Accept: '*/*' },
    }).then((res) => {
      if (revoked) return
      const blob = res.data as unknown as Blob
      const objectUrl = URL.createObjectURL(blob)
      setUrl(objectUrl)
    }).catch(() => {
      if (revoked) return
      setError('Não foi possível carregar o certificado.')
    }).finally(() => {
      if (!revoked) setLoading(false)
    })

    return () => {
      revoked = true
      if (url) URL.revokeObjectURL(url)
      setUrl(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, colaboradorId, competenciaItemId])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Certificado</DialogTitle>
          <DialogDescription>
            {competenciaNome ? `Comprovação para a competência "${competenciaNome}".` : 'Visualização do certificado.'}
          </DialogDescription>
        </DialogHeader>
        <div className="mt-2 min-h-[200px]">
          {loading && (
            <div className="space-y-3">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-64 w-full" />
            </div>
          )}
          {!loading && error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
          {!loading && !error && url && (
            <div className="border rounded-md overflow-hidden h-[60vh]">
              <iframe
                src={url}
                title="Certificado"
                className="w-full h-full"
              />
            </div>
          )}
          {!loading && !error && !url && (
            <p className="text-sm text-muted-foreground">Nenhum certificado disponível.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}





