import { useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
// @ts-expect-error types shipped separately
import Croppie from 'croppie'
import 'croppie/croppie.css'

type Props = {
  open: boolean
  onClose: () => void
  src: string | null
  onPick: () => void
  onSave: (blob: Blob) => void
}

export function CoverEditorModal({ open, onClose, src, onPick, onSave }: Props) {
  const cropElRef = useRef<HTMLDivElement | null>(null)
  const cropInstanceRef = useRef<any>(null)

  useEffect(() => {
    if (open && src && cropElRef.current) {
      const c = new Croppie(cropElRef.current, {
        // Horizontal rectangular viewport for cover
        viewport: { width: 560, height: 220, type: 'square' },
        boundary: { width: 640, height: 320 },
        showZoomer: true,
        enableOrientation: true,
      })
      cropInstanceRef.current = c
      c.bind({ url: src }).then(() => {
        try {
          c.setZoom(0)
        } catch {}
      })
    }
    return () => {
      if (cropInstanceRef.current) {
        cropInstanceRef.current.destroy()
        cropInstanceRef.current = null
      }
    }
  }, [open, src])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
      <Card className="w-full max-w-3xl">
        <CardHeader>
          <CardTitle>Capa do perfil</CardTitle>
          <CardDescription>Selecione e ajuste a imagem para a capa</CardDescription>
        </CardHeader>
        <CardContent>
          {!src && (
            <div
              className="grid place-items-center rounded-md border border-dashed bg-muted/40 px-6 py-16 text-center cursor-pointer hover:bg-muted/60"
              onClick={onPick}
            >
              <div className="text-sm text-muted-foreground">Clique para selecionar uma imagem</div>
              <div className="text-xs text-muted-foreground">PNG ou JPG até 5MB</div>
            </div>
          )}
          {src && (
            <div className="grid place-items-center">
              <div ref={cropElRef} className="rounded-md border" />
            </div>
          )}
          <div className="mt-4 flex items-center justify-between">
            <Button type="button" variant="outline" onClick={onClose}>Fechar</Button>
            <div className="flex items-center gap-2">
              {src && (
                <Button type="button" variant="outline" onClick={onPick}>Selecionar imagem</Button>
              )}
              <Button
                type="button"
                disabled={!src}
                onClick={async () => {
                  if (!cropInstanceRef.current) {
                    onPick()
                    return
                  }
                  const blob = await cropInstanceRef.current.result({ type: 'blob', size: 'viewport', format: 'png' })
                  onSave(blob)
                }}
              >
                Salvar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


