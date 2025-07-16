"use client";

import { useState } from "react";
import axios from "axios";

export default function InputPage() {
  const [form, setForm] = useState({
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
    waktu_pagi: "",
    waktu_siang: "",
    waktu_sore: "",
    waktu_malam: "",
    jumlah_aktivitas: "",
  });

  const [hasil, setHasil] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://127.0.0.1:8000/prediksi", {
        ...form,
        durasi: parseFloat(form.durasi),
        frekuensi: parseFloat(form.frekuensi),
        jumlah_aplikasi: parseInt(form.jumlah_aplikasi),
        notifikasi: parseInt(form.notifikasi),
        tidur: parseFloat(form.tidur),
        makan: parseFloat(form.makan),
        olahraga: parseFloat(form.olahraga),
        main_game: parseFloat(form.main_game),
        belajar: parseFloat(form.belajar),
        buka_sosmed: parseFloat(form.buka_sosmed),
        streaming: parseFloat(form.streaming),
        scroll: parseFloat(form.scroll),
        email: parseFloat(form.email),
        panggilan: parseFloat(form.panggilan),
        waktu_pagi: parseInt(form.waktu_pagi),
        waktu_siang: parseInt(form.waktu_siang),
        waktu_sore: parseInt(form.waktu_sore),
        waktu_malam: parseInt(form.waktu_malam),
        jumlah_aktivitas: parseInt(form.jumlah_aktivitas),
      });

      // Ubah hasil angka jadi label (rendah, sedang, tinggi)
      const hasilLabel =
        res.data.hasil === "0"
          ? "Rendah"
          : res.data.hasil === "1"
          ? "Sedang"
          : "Tinggi";

      setHasil(hasilLabel);
    } catch (error) {
      console.error("Gagal prediksi:", error);
      setHasil("Terjadi kesalahan");
    }
  };

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Form Prediksi Stres</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        {Object.keys(form).map((key) => (
          <input
            key={key}
            type="text"
            name={key}
            placeholder={key}
            value={form[key as keyof typeof form]}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />
        ))}
        <button
          type="submit"
          className="bg-pink-400 hover:bg-pink-500 text-white px-4 py-2 rounded"
        >
          Prediksi
        </button>
      </form>
      {hasil && (
        <div className="mt-4 p-4 bg-gray-100 rounded">
          <p>Hasil Prediksi Stres: <strong>{hasil}</strong></p>
        </div>
      )}
    </div>
  );
}
