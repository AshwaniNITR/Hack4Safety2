import { Orbitron, Roboto } from 'next/font/google'

export const orbitron = Orbitron({
  weight: ['400', '500', '600', '700', '900'],
  subsets: ['latin'],
  variable: '--font-orbitron',
  display: 'swap',
})

export const roboto = Roboto({
  weight: ['300', '400', '500', '700'],
  subsets: ['latin'],
  variable: '--font-roboto',
  display: 'swap',
})