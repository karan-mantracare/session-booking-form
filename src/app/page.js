import Header from '@/components/Header';
import BookingWizard from '@/components/BookingWizard';

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      <Header />
      <div className="max-w-4xl mx-auto px-4 py-6 sm:py-12">
        <BookingWizard />
      </div>
    </main>
  );
}
