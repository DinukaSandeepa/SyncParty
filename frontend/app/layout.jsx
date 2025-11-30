import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'
import { Raleway } from 'next/font/google'
import { Header } from './components'

const raleway = Raleway({
  subsets: ['latin'],
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
  style: ['normal', 'italic']
})

export const metadata = {
  title: 'SyncParty - Watch Together',
  description: 'Synchronized media player for watching videos together',
}

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <head>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link href="https://fonts.googleapis.com/css2?family=Noto+Serif+Sinhala:wght@100..900&display=swap" rel="stylesheet" />
        </head>
        <body className={raleway.className}>
          <Header />
          <div className="pt-16">
            {children}
          </div>
        </body>
      </html>
    </ClerkProvider>
  )
}
