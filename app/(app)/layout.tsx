import Nav from '@/components/Nav'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Nav />
      <main className="flex-1 pb-20 md:pb-0">
        {children}
      </main>
    </div>
  )
}
