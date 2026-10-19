import type { Metadata } from 'next'
import './globals.css'
import ServiceWorker from '@/components/ServiceWorker'

export const metadata: Metadata = {
  title: 'Infinite Mage',
  description: 'Infinite Mage Light Novel Reader',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <ServiceWorker />
      </body>
    </html>
  )
}
