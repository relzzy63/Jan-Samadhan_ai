import type { Metadata } from 'next';
import './globals.css';
import { TicketProvider } from '@/context/TicketContext';
import ToastContainer from '@/components/ToastContainer';

export const metadata: Metadata = {
  title: 'Jan-Samadhan AI | Bengaluru Civic Grievance AI',
  description:
    'Minimalist, Zero-Cost Multilingual Civic Grievance Redressal and Ward Officer SLA Command Center.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased selection:bg-emerald-500 selection:text-slate-950">
        <TicketProvider>
          {children}
          <ToastContainer />
        </TicketProvider>
      </body>
    </html>
  );
}
