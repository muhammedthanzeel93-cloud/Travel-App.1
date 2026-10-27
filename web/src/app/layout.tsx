import './globals.css';
import type { Metadata } from 'next';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ContentContainer from '@/components/ContentContainer';

export const metadata: Metadata = {
  title: 'Travel Buddy | Enterprise Aviation & Rail Suite',
  description: 'Travel Buddy - Enterprise Multi-Platform Travel Platform with IATA & PRS Real-World Ticketing and Super Admin Desk',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#0b0f19" />
      </head>
      <body
        className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white"
        suppressHydrationWarning
      >
        <Header />
        <ContentContainer>{children}</ContentContainer>
        <Footer />
      </body>
    </html>
  );
}
