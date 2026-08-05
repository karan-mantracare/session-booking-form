import Image from 'next/image';

export default function Header() {
  return (
    <header className="flex justify-center items-center py-6 border-b border-gray-100 bg-white">
      {/* Assuming Logo.png is moved to public/Logo.png */}
      <Image src="/Logo.png" alt="MantraCare Logo" width={200} height={60} className="object-contain" />
    </header>
  );
}
