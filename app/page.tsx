import { redirect } from 'next/navigation';

// Middleware sends unauthenticated users to /login; authenticated users land on
// the workbook (the universal CRE entry point).
export default function Home() {
  redirect('/workbook');
}
