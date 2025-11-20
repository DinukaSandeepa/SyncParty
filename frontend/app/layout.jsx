import './globals.css'
import { Raleway } from 'next/font/google'

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
    <html lang="en">
      <body className={raleway.className}>{children}</body>
    </html>
  )
}
