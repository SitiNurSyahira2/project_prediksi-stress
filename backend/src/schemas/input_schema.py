from pydantic import BaseModel

class InputData(BaseModel):
    aktivitas: str
    durasi: float
    frekuensi: float
    jumlah_aplikasi: int
    notifikasi: int
    tidur: float
    makan: float
    olahraga: float
    main_game: float
    belajar: float
    buka_sosmed: float
    streaming: float
    scroll: float
    email: float
    panggilan: float
    waktu_pagi: int
    waktu_siang: int
    waktu_sore: int
    waktu_malam: int
    jumlah_aktivitas: int
