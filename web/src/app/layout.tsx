import './globals.css';
import type { Metadata } from 'next';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ContentContainer from '@/components/ContentContainer';

export const metadata: Metadata = {
  title: 'Travel Buddy | Social Travel Feed & Community',
  description: 'Connect with global travelers, share multi-photo stories, travel reels, and discover adventures on Travel Buddy.',
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
      <body className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
        <Header />
        <ContentContainer>
          {children}
        </ContentContainer>
        <Footer />
      </body>
    </html>
  );
}
