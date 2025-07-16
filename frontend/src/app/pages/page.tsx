"use client";

import Image from "next/image";
import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 via-white to-white flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-md py-5 px-8 flex justify-between items-center sticky top-0 z-10">
        <h1 className="text-3xl font-bold text-pink-600">RelaxaID</h1>
        <nav>
          <Link
            href="/login"
            className="text-pink-600 font-semibold hover:underline text-lg"
          >
            Masuk
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="flex flex-col md:flex-row items-center justify-between px-8 md:px-20 py-16 gap-10">
        {/* Text */}
        <div className="max-w-xl text-center md:text-left">
          <h2 className="text-5xl font-extrabold text-pink-700 mb-4 leading-tight">
            Cek Tingkat Stresmu <br /> Berdasarkan Aktivitas Digital
          </h2>
          <p className="text-lg text-black mb-8">
            Dapatkan gambaran tingkat stres kamu dengan mudah dan cepat. Bantu dirimu tetap seimbang dan produktif setiap hari.
          </p>
          <Link
            href="/login"
            className="bg-pink-500 hover:bg-pink-600 text-white px-8 py-3 rounded-full shadow-lg text-lg font-semibold transition hover:scale-105 inline-block"
          >
            Mulai Sekarang
          </Link>
        </div>

        {/* Illustration */}
        <div className="flex justify-center md:justify-end">
         <Image
        src="/images/ilustrasi-stress.jpg"
        alt="Ilustrasi Prediksi Stres"
        width={500}
        height={500}
/>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white py-6 text-center text-black text-sm border-t mt-auto">
        &copy; {new Date().getFullYear()} Prediksi Stres. All rights reserved.
      </footer>
    </div>
  );
}
