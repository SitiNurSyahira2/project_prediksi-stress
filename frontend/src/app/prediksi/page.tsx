// /app/prediksi/page.tsx (Next.js 13+ with App Router)
"use client";

import { useState } from "react";
import axios from "axios";

export default function FormPrediksi() {
  const [formData, setFormData] = useState({
    aktivitas: "",
    durasi: "",
    frekuensi: "",
    jumlah_aplikasi: "",
    notifikasi: "",
    tidur: "",
    makan: "",
    olahraga: "",
    main_game: "",
    belajar: "",
    buka_sosmed: "",
    streaming: "",
    scroll: "",
    email: "",
    panggilan: "",
    waktu_pagi: "0",
    waktu_siang: "0",
    waktu_sore: "0",
    waktu_malam: "0",
    jumlah_aktivitas: "",
  });

  const [hasil, setHasil] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post("http://127.0.0.1:8000/prediksi", formData);
      setHasil(response.data.hasil);
    } catch (err) {
      setHasil("Terjadi kesalahan.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-pink-50 px-4 py-12">
      <h1 className="text-3xl font-bold text-pink-600 mb-6">Form Prediksi Stres</h1>

      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-md rounded-lg p-6 w-full max-w-md space-y-4"
      >
        {Object.entries(formData)
          .filter(([key]) => !["waktu_pagi", "waktu_siang", "waktu_sore", "waktu_malam"].includes(key))
          .map(([key, value]) => (
            <div key={key}>
              <label htmlFor={key} className="block text-sm font-medium text-black">
                {key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
              </label>
              <input
                type={key === "aktivitas" ? "text" : "number"}
                name={key}
                value={value}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-400 shadow-sm focus:ring-pink-500 focus:border-pink-500"
                required
              />
            </div>
          ))}

        <button
          type="submit"
          className="w-full bg-pink-600 hover:bg-pink-700 text-white py-2 px-4 rounded-lg font-semibold"
          disabled={loading}
        >
          {loading ? "Memproses..." : "Prediksi"}
        </button>
      </form>

      {hasil && (
        <div className="mt-6 p-4 bg-white rounded-lg shadow text-pink-700 text-lg font-medium">
          Hasil Prediksi: {hasil}
        </div>
      )}
    </div>
  );
}
