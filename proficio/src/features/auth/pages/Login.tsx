import { LoginForm } from "../components/LoginForm"
import { Footer } from "@/shared/components/Footer"
import { FadeInLeft } from "@/shared/components/motion/FadeInLeft"
import { SlideInRight } from "@/shared/components/motion/SlideInRight"
import { AnimatedLogo } from "@/shared/components/AnimatedLogo"
import logoUrl from "@/assets/logo.svg"

export function Login() {
 
  return (
    <div className="min-h-dvh grid grid-rows-[1fr_auto] relative">
      <div className="md:hidden absolute inset-x-0 top-0 flex items-center justify-center px-4 py-3">
        <AnimatedLogo src={logoUrl} className="h-7" />
        <FadeInLeft>
          <div className="text-base font-semibold">Proficio</div>
        </FadeInLeft>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2">
        <div className="hidden md:flex items-center justify-center p-6 md:p-10">
          <div className="max-w-2xl space-y-4">
            <div className="flex items-center justify-center mr-4">
              <AnimatedLogo src={logoUrl} className="h-32 md:h-32" />
              <FadeInLeft>
                <h2 className="text-6xl md:text-7xl font-extrabold tracking-tight">Proficio</h2>
              </FadeInLeft>
            </div>
            <FadeInLeft delay={0.05}>
              <p className="text-base md:text-lg leading-relaxed text-foreground/90 text-center">
                Mapeie e exiba suas soft e hard skills. Receba feedbacks dos gestores, identifique
                gaps de tecnologia no time e descubra oportunidades de realocação — tudo em um só lugar.
              </p>
            </FadeInLeft>
          </div>
        </div>

        <div className="flex items-center justify-center p-6 md:p-10">
          <SlideInRight className="w-full flex justify-center">
            <LoginForm className="w-full max-w-md lg:max-w-lg" />
          </SlideInRight>
        </div>
      </div>
      <Footer />
    </div>
  )
}