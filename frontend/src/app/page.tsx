"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation"; // Ganti dari 'next/router'

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.push("/login"); // Redirect ke halaman login
  }, [router]);

  return null; // Tidak tampilkan apapun di halaman /
}
