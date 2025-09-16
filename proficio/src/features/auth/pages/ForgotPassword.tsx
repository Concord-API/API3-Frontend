import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/shared/components/ui/card'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Button } from '@/shared/components/ui/button'
import { MailCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { SlideInRight } from '@/shared/components/motion/SlideInRight'
import { Footer } from '@/shared/components/Footer'
import logoUrl from "@/assets/logo.svg"
import { FadeInLeft } from '@/shared/components/motion/FadeInLeft'
import { AnimatedLogo } from '@/shared/components/AnimatedLogo'

export function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await new Promise((r) => setTimeout(r, 800))
      setSent(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-dvh grid grid-rows-[1fr_auto]">
      <div className="md:hidden absolute inset-x-0 top-0 flex items-center justify-center px-4 py-3">
        <AnimatedLogo src={logoUrl} className="h-7" />
        <FadeInLeft>
          <div className="text-base font-semibold">Proficio</div>
        </FadeInLeft>
      </div>
      <div className="grid place-items-center p-6">
        <SlideInRight className="w-full flex justify-center" duration={0.6}>
          <Card className="w-full max-w-md lg:max-w-lg">
            <CardHeader>
            {!sent ? (
              <>
                <CardTitle>Recuperar senha</CardTitle>
                <CardDescription>Informe seu email para receber o link de redefinição.</CardDescription>
              </>
            ) : (
              <>
                <CardTitle className="flex items-center gap-2">
                  <MailCheck className="size-5" /> Email enviado
                </CardTitle>
                <CardDescription>Verifique sua caixa de entrada para continuar a redefinição.</CardDescription>
              </>
            )}
            </CardHeader>
            <CardContent>
            {!sent ? (
              <form onSubmit={handleSubmit} className="grid gap-5">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="m@exemple.com"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Enviando…' : 'Enviar link de redefinição'}
                </Button>
                <div className="text-center text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-2">
                    Você receberá um email com um link válido por tempo limitado.
                  </span>
                </div>
                <div className="text-center text-sm">
                  <Link to="/login" className="underline underline-offset-4">Voltar ao login</Link>
                </div>
              </form>
            ) : (
              <div className="grid gap-4" aria-live="polite">
                <p className="text-sm">
                  Enviamos um email para <span className="font-medium">{email}</span> com instruções para redefinir sua senha.
                  Verifique sua caixa de entrada e também a pasta de spam.
                </p>
                <div className="flex items-center justify-center gap-3">
                  <Link to="/login" className="underline underline-offset-4 text-sm">Voltar ao login</Link>
                  <button type="button" className="underline underline-offset-4 text-sm" onClick={() => setSent(false)}>
                    Enviar para outro email
                  </button>
                </div>
              </div>
            )}
            </CardContent>
          </Card>
        </SlideInRight>
      </div>
      <Footer />
    </div>
  )
}

