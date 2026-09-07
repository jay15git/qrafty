import { BackgroundsBento } from "@/components/bento/backgrounds-bento"
import { ContentBento } from "@/components/bento/content-bento"
import { ShapesBento } from "@/components/bento/shapes-bento"
import { StyleBento } from "@/components/bento/style-bento"

export default function BentoPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#efeeec] px-6 py-10 text-[#201d1d]">
      <div className="grid gap-6 md:grid-cols-2">
        <ShapesBento />
        <BackgroundsBento />
        <StyleBento />
        <ContentBento />
      </div>
    </main>
  )
}
