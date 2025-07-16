"""
Service untuk prediksi stres menggunakan Random Forest
Sesuai dengan spesifikasi laporan penelitian
"""
from ml.random_forest_model import prediksi_stres_digital
from schemas.digital_activity_schema import DigitalActivityInput, StressPredictionResponse
from config.connection import get_connection
from datetime import datetime, date
import logging

logger = logging.getLogger(__name__)

def predict_stress_from_digital_activity(activity_data: DigitalActivityInput, user_id: int = None) -> StressPredictionResponse:
    """
    Prediksi tingkat stres berdasarkan aktivitas digital menggunakan Random Forest
    Sesuai dengan metodologi dalam laporan penelitian
    """
    try:
        # Jalankan prediksi menggunakan Random Forest model
        result = prediksi_stres_digital(
            screen_time_total=activity_data.screen_time_total,  # Parameter ini untuk compatibility, tidak digunakan di model
            durasi_pemakaian=activity_data.durasi_pemakaian,
            frekuensi_penggunaan=activity_data.frekuensi_penggunaan,
            jumlah_aplikasi=activity_data.jumlah_aplikasi,
            notifikasi_count=activity_data.notifikasi_count,
            durasi_tidur=activity_data.durasi_tidur,
            durasi_makan=activity_data.durasi_makan,
            durasi_olahraga=activity_data.durasi_olahraga,
            main_game=activity_data.main_game,
            belajar_online=activity_data.belajar_online,
            buka_sosmed=activity_data.buka_sosmed,
            streaming=activity_data.streaming,
            scroll_time=activity_data.scroll_time,
            email_time=activity_data.email_time,
            panggilan_time=activity_data.panggilan_time,
            waktu_pagi=activity_data.waktu_pagi,
            waktu_siang=activity_data.waktu_siang,
            waktu_sore=activity_data.waktu_sore,
            waktu_malam=activity_data.waktu_malam,
            jumlah_aktivitas=activity_data.jumlah_aktivitas
        )
        
        # Generate rekomendasi berdasarkan hasil prediksi
        recommendations = generate_recommendations(
            result['predicted_label'], 
            result['top_features'],
            activity_data
        )
        
        # Simpan hasil ke database jika user_id tersedia
        prediction_id = None
        if user_id:
            try:
                prediction_id = save_prediction_to_database(
                    user_id=user_id,
                    activity_data=activity_data,
                    prediction_result=result
                )
                
                # Simpan feature importance logs
                if prediction_id:
                    save_feature_importance_logs(
                        prediction_id=prediction_id,
                        feature_importance=result['feature_importance'],
                        model_version=result['model_info']['version']
                    )
            except Exception as db_error:
                logger.warning(f"⚠️ Database save failed (non-critical): {str(db_error)}")
                # Continue without database save
        
        # Return response sesuai schema
        return StressPredictionResponse(
            predicted_class=result['predicted_class'],
            predicted_label=result['predicted_label'],
            confidence_score=result['confidence_score'],
            probabilities=result['probabilities'],
            top_features=result['top_features'],
            model_info=result['model_info'],
            recommendations=recommendations
        )
        
    except Exception as e:
        logger.error(f"❌ Error in stress prediction: {str(e)}")
        # Return default response instead of raising
        return StressPredictionResponse(
            predicted_class=1,
            predicted_label="Sedang",
            confidence_score=0.5,
            probabilities={"Rendah": 0.33, "Sedang": 0.34, "Tinggi": 0.33},
            top_features=[],
            model_info={"version": "1.0.0", "type": "dummy"},
            recommendations=["⚠️ Terjadi error dalam prediksi, menggunakan nilai default"]
        )

def generate_recommendations(stress_level: str, top_features: list, activity_data: DigitalActivityInput) -> list:
    """
    Generate rekomendasi berdasarkan tingkat stres dan fitur-fitur penting
    Sesuai dengan panduan dalam laporan penelitian
    """
    recommendations = []
    
    if stress_level == "Tinggi":
        recommendations.extend([
            "🚨 Segera ambil waktu untuk beristirahat total dari perangkat digital",
            "🧘‍♀️ Lakukan teknik pernapasan dalam atau meditasi 10-15 menit",
            "📱 Kurangi drastis paparan layar dan media sosial",
            "🚶‍♂️ Lakukan aktivitas fisik ringan seperti berjalan kaki",
            "💤 Pastikan tidur berkualitas minimal 7-8 jam"
        ])
        
        # Rekomendasi berdasarkan top features
        for feature_name, importance in top_features[:3]:
            if feature_name == "buka_sosmed" and activity_data.buka_sosmed > 3:
                recommendations.append("📵 Batasi penggunaan media sosial maksimal 1 jam per hari")
            elif feature_name == "waktu_malam" and activity_data.waktu_malam == 1:
                recommendations.append("🌙 Hindari penggunaan gadget 2 jam sebelum tidur")
            elif feature_name == "notifikasi_count" and activity_data.notifikasi_count > 50:
                recommendations.append("🔕 Matikan notifikasi yang tidak penting")
    
    elif stress_level == "Sedang":
        recommendations.extend([
            "⚠️ Perhatikan pola penggunaan digital Anda",
            "⏰ Buat jadwal rutin untuk istirahat dari layar",
            "🎯 Fokus pada satu aktivitas digital dalam satu waktu",
            "🏃‍♂️ Tingkatkan aktivitas fisik untuk menyeimbangkan screen time"
        ])
        
    else:  # Rendah
        recommendations.extend([
            "✅ Pola penggunaan digital Anda cukup sehat",
            "💪 Pertahankan keseimbangan digital wellness",
            "📊 Pantau terus aktivitas digital Anda"
        ])
    
    return recommendations

def save_prediction_to_database(user_id: int, activity_data: DigitalActivityInput, prediction_result: dict) -> int:
    """
    Simpan data aktivitas digital dan hasil prediksi ke database
    """
    conn = None
    cursor = None
    
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        # Simpan digital activity terlebih dahulu
        cursor.execute("""
            INSERT INTO digital_activities (
                user_id, tanggal, screen_time_total, durasi_pemakaian, frekuensi_penggunaan,
                jumlah_aplikasi, notifikasi_count, durasi_tidur, durasi_makan, durasi_olahraga,
                main_game, belajar_online, buka_sosmed, streaming, scroll_time, email_time,
                panggilan_time, waktu_pagi, waktu_siang, waktu_sore, waktu_malam, jumlah_aktivitas
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        """, (
            user_id, 
            date.today(),
            activity_data.screen_time_total, 
            activity_data.durasi_pemakaian, 
            activity_data.frekuensi_penggunaan,
            activity_data.jumlah_aplikasi, 
            activity_data.notifikasi_count, 
            activity_data.durasi_tidur,
            activity_data.durasi_makan, 
            activity_data.durasi_olahraga, 
            activity_data.main_game,
            activity_data.belajar_online, 
            activity_data.buka_sosmed, 
            activity_data.streaming,
            activity_data.scroll_time, 
            activity_data.email_time, 
            activity_data.panggilan_time,
            activity_data.waktu_pagi, 
            activity_data.waktu_siang, 
            activity_data.waktu_sore,
            activity_data.waktu_malam, 
            activity_data.jumlah_aktivitas
        ))
        
        digital_activity_result = cursor.fetchone()
        if not digital_activity_result:
            raise Exception("Failed to insert digital activity")
            
        digital_activity_id = digital_activity_result[0]
        
        # Simpan hasil prediksi
        cursor.execute("""
            INSERT INTO predictions (
                user_id, digital_activity_id, predicted_stress_level, confidence_score,
                probability_rendah, probability_sedang, probability_tinggi, model_version
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        """, (
            user_id, 
            digital_activity_id, 
            prediction_result['predicted_label'],
            prediction_result['confidence_score'],
            prediction_result['probabilities']['Rendah'],
            prediction_result['probabilities']['Sedang'],
            prediction_result['probabilities']['Tinggi'],
            prediction_result['model_info']['version']
        ))
        
        prediction_result_db = cursor.fetchone()
        if not prediction_result_db:
            raise Exception("Failed to insert prediction")
            
        prediction_id = prediction_result_db[0]
        
        conn.commit()
        logger.info(f"✅ Prediction saved to database: ID {prediction_id}")
        return prediction_id
        
    except Exception as e:
        if conn:
            conn.rollback()
        logger.error(f"❌ Error saving prediction: {str(e)}")
        return None
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

def save_feature_importance_logs(prediction_id: int, feature_importance: dict, model_version: str):
    """
    Simpan log feature importance untuk analisis
    """
    conn = None
    cursor = None
    
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        # Sort features by importance
        sorted_features = sorted(feature_importance.items(), key=lambda x: x[1], reverse=True)
        
        for rank, (feature_name, importance_score) in enumerate(sorted_features, 1):
            cursor.execute("""
                INSERT INTO feature_importance_logs (
                    prediction_id, feature_name, importance_score, rank_position, model_version
                ) VALUES (%s, %s, %s, %s, %s)
            """, (prediction_id, feature_name, importance_score, rank, model_version))
        
        conn.commit()
        logger.info(f"✅ Feature importance logs saved for prediction {prediction_id}")
        
    except Exception as e:
        if conn:
            conn.rollback()
        logger.error(f"❌ Error saving feature importance logs: {str(e)}")
        # Don't raise here as this is not critical for the main prediction
        
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

# Backward compatibility untuk API lama
def prediksi_model(data_array):
    """Backward compatibility function"""
    try:
        logger.info(f"🔄 Processing legacy prediction with {len(data_array)} features")
        
        # Legacy input hanya 19 fitur, perlu tambah screen_time_total
        if len(data_array) == 19:
            # Estimate screen_time_total dari durasi_pemakaian
            screen_time_total = data_array[0]  # durasi_pemakaian sebagai estimate
            
            # Insert screen_time_total di posisi pertama
            full_data_array = [screen_time_total] + data_array
        else:
            full_data_array = data_array
        
        # Validate data types and convert
        try:
            screen_time_total = float(full_data_array[0])
            durasi_pemakaian = float(full_data_array[1])
            frekuensi_penggunaan = float(full_data_array[2])
            jumlah_aplikasi = int(full_data_array[3])
            notifikasi_count = int(full_data_array[4])
            durasi_tidur = float(full_data_array[5])
            durasi_makan = float(full_data_array[6])
            durasi_olahraga = float(full_data_array[7])
            main_game = float(full_data_array[8])
            belajar_online = float(full_data_array[9])
            buka_sosmed = float(full_data_array[10])
            streaming = float(full_data_array[11])
            scroll_time = float(full_data_array[12])
            email_time = float(full_data_array[13])
            panggilan_time = float(full_data_array[14])
            waktu_pagi = int(full_data_array[15])
            waktu_siang = int(full_data_array[16])
            waktu_sore = int(full_data_array[17])
            waktu_malam = int(full_data_array[18])
            jumlah_aktivitas = int(full_data_array[19])
        except (ValueError, IndexError) as e:
            logger.error(f"❌ Data conversion error: {str(e)}")
            return 1, "Sedang"
        
        # Map array ke DigitalActivityInput
        activity_data = DigitalActivityInput(
            screen_time_total=screen_time_total,
            durasi_pemakaian=durasi_pemakaian, 
            frekuensi_penggunaan=frekuensi_penggunaan,
            jumlah_aplikasi=jumlah_aplikasi,
            notifikasi_count=notifikasi_count,
            durasi_tidur=durasi_tidur,
            durasi_makan=durasi_makan,
            durasi_olahraga=durasi_olahraga,
            main_game=main_game,
            belajar_online=belajar_online,
            buka_sosmed=buka_sosmed,
            streaming=streaming,
            scroll_time=scroll_time,
            email_time=email_time,
            panggilan_time=panggilan_time,
            waktu_pagi=waktu_pagi,
            waktu_siang=waktu_siang,
            waktu_sore=waktu_sore,
            waktu_malam=waktu_malam,
            jumlah_aktivitas=jumlah_aktivitas
        )
        
        result = predict_stress_from_digital_activity(activity_data, user_id=1)
        logger.info(f"✅ Legacy prediction successful: {result.predicted_label} (confidence: {result.confidence_score:.3f})")
        return result.predicted_class, result.predicted_label
        
    except Exception as e:
        logger.error(f"❌ Error in backward compatibility function: {str(e)}")
        return 1, "Sedang"
