"""
Router untuk prediksi stres menggunakan Random Forest
Sesuai dengan spesifikasi laporan penelitian
"""
from fastapi import APIRouter, HTTPException, Depends, Query
from schemas.digital_activity_schema import DigitalActivityInput, StressPredictionResponse
from schemas.input_schema import InputData  # Backward compatibility
from services.predict import predict_stress_from_digital_activity, prediksi_model
from config.connection import get_connection
from datetime import datetime, timedelta
from typing import List, Optional
import logging

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Prediksi Stres"])

# Simplified authentication untuk development
def get_current_user_optional():
    """Optional authentication untuk development - always return default user"""
    return {"user_id": 1, "email": "test@relaxaid.com"}

def get_current_user():
    """Basic authentication untuk development - always return default user"""
    return {"user_id": 1, "email": "test@relaxaid.com"}

@router.post("/advanced")
def prediksi_stres_advanced(activity_data: DigitalActivityInput):
    """
    Advanced prediction endpoint menggunakan Random Forest sesuai penelitian
    Format input standar untuk frontend modern
    """
    try:
        result = predict_stress_from_digital_activity(
            activity_data=activity_data,
            user_id=1  # Default user untuk testing
        )
        
        logger.info(f"✅ Advanced Random Forest prediction: {result.predicted_label} (confidence: {result.confidence_score:.3f})")
        
        return {
            "status": "success",
            "predicted_class": result.predicted_class,
            "predicted_label": result.predicted_label,
            "confidence_score": result.confidence_score,
            "probabilities": result.probabilities,
            "top_features": result.top_features,
            "model_info": result.model_info,
            "recommendations": result.recommendations,
            "wellness_score": activity_data.get_digital_wellness_score(),
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"❌ Error in advanced prediction: {str(e)}")
        return {
            "status": "error",
            "predicted_label": "Sedang",
            "confidence_score": 0.5,
            "message": f"Error dalam prediksi: {str(e)}",
            "timestamp": datetime.now().isoformat()
        }

@router.post("")
def prediksi_stres_universal(data: dict):
    """
    Universal prediction endpoint yang dapat menangani berbagai format input
    """
    try:
        # Deteksi format input berdasarkan keys yang ada
        if "aktivitas" in data:
            # Format legacy dari frontend lama
            input_array = [
                float(data.get("durasi", 0)), float(data.get("frekuensi", 0)), 
                int(data.get("jumlah_aplikasi", 0)), int(data.get("notifikasi", 0)),
                float(data.get("tidur", 0)), float(data.get("makan", 0)), float(data.get("olahraga", 0)), 
                float(data.get("main_game", 0)), float(data.get("belajar", 0)),
                float(data.get("buka_sosmed", 0)), float(data.get("streaming", 0)), 
                float(data.get("scroll", 0)), float(data.get("email", 0)), float(data.get("panggilan", 0)),
                int(data.get("waktu_pagi", 0)), int(data.get("waktu_siang", 0)), 
                int(data.get("waktu_sore", 0)), int(data.get("waktu_malam", 0)),
                int(data.get("jumlah_aktivitas", 0))
            ]
            
            try:
                hasil_angka, hasil_label = prediksi_model(input_array)
                logger.info(f"✅ Legacy prediction: {hasil_label} (class: {hasil_angka})")
                
                return {
                    "status": "success",
                    "hasil": hasil_label,
                    "confidence": float(hasil_angka),
                    "message": f"Tingkat stress Anda diprediksi: {hasil_label}"
                }
            except Exception as legacy_error:
                logger.error(f"❌ Error in legacy prediction: {str(legacy_error)}")
                return {
                    "status": "error", 
                    "hasil": "Sedang",
                    "confidence": 0.5,
                    "message": f"Error dalam prediksi legacy: {str(legacy_error)}"
                }
            
        else:
            # Format baru menggunakan DigitalActivityInput
            try:
                activity_data = DigitalActivityInput(**data)
                result = predict_stress_from_digital_activity(
                    activity_data=activity_data,
                    user_id=1  # Default user untuk testing
                )
                
                logger.info(f"✅ Random Forest prediction completed: {result.predicted_label} (confidence: {result.confidence_score:.3f})")
                
                # Save prediction to database
                try:
                    conn = get_connection()
                    cursor = conn.cursor()
                    
                    # First, save digital activity
                    cursor.execute("""
                        INSERT INTO digital_activities (
                            user_id, tanggal, screen_time_total, durasi_pemakaian, 
                            frekuensi_penggunaan, jumlah_aplikasi, notifikasi_count,
                            durasi_tidur, durasi_makan, durasi_olahraga, main_game,
                            belajar_online, buka_sosmed, streaming, scroll_time,
                            email_time, panggilan_time, waktu_pagi, waktu_siang,
                            waktu_sore, waktu_malam, jumlah_aktivitas
                        ) VALUES (
                            %s, CURRENT_DATE, %s, %s, %s, %s, %s, %s, %s, %s, %s,
                            %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
                        ) RETURNING id
                    """, (
                        1, activity_data.screen_time_total, activity_data.durasi_pemakaian,
                        activity_data.frekuensi_penggunaan, activity_data.jumlah_aplikasi,
                        activity_data.notifikasi_count, activity_data.durasi_tidur,
                        activity_data.durasi_makan, activity_data.durasi_olahraga,
                        activity_data.main_game, activity_data.belajar_online,
                        activity_data.buka_sosmed, activity_data.streaming,
                        activity_data.scroll_time, activity_data.email_time,
                        activity_data.panggilan_time, activity_data.waktu_pagi,
                        activity_data.waktu_siang, activity_data.waktu_sore,
                        activity_data.waktu_malam, activity_data.jumlah_aktivitas
                    ))
                    
                    digital_activity_id = cursor.fetchone()['id']
                    
                    # Then save prediction
                    cursor.execute("""
                        INSERT INTO predictions (
                            user_id, digital_activity_id, predicted_stress_level,
                            confidence_score, prediction_date, model_version
                        ) VALUES (%s, %s, %s, %s, CURRENT_TIMESTAMP, %s)
                    """, (
                        1, digital_activity_id, result.predicted_label,
                        result.confidence_score, "1.0.0"
                    ))
                    
                    conn.commit()
                    cursor.close()
                    conn.close()
                    
                    logger.info(f"💾 Prediction saved to database successfully")
                    
                except Exception as db_error:
                    logger.error(f"❌ Error saving to database: {str(db_error)}")
                    # Continue with response even if DB save fails
                
                return {
                    "predicted_class": result.predicted_class,
                    "predicted_label": result.predicted_label,
                    "confidence_score": result.confidence_score,
                    "probabilities": result.probabilities,
                    "top_features": result.top_features,
                    "model_info": result.model_info,
                    "recommendations": result.recommendations
                }
            except Exception as modern_error:
                logger.error(f"❌ Error in modern prediction: {str(modern_error)}")
                return {
                    "status": "error",
                    "predicted_label": "Sedang",
                    "confidence_score": 0.5,
                    "message": f"Error dalam prediksi modern: {str(modern_error)}"
                }
        
    except Exception as e:
        logger.error(f"❌ Error in universal prediction: {str(e)}")
        return {
            "status": "error",
            "hasil": "Sedang", 
            "confidence": 0.5,
            "message": f"Universal prediction error: {str(e)}"
        }

@router.post("/advanced", response_model=StressPredictionResponse)
def prediksi_stres_random_forest(
    data: DigitalActivityInput,
    current_user = Depends(get_current_user)
):
    """
    Advanced prediction endpoint dengan full features Random Forest
    """
    try:
        # Jalankan prediksi Random Forest
        result = predict_stress_from_digital_activity(
            activity_data=data,
            user_id=current_user["user_id"]
        )
        
        logger.info(f"✅ Random Forest prediction completed: {result.predicted_label} (confidence: {result.confidence_score:.3f})")
        
        return result
        
    except Exception as e:
        logger.error(f"❌ Error in Random Forest prediction: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Terjadi kesalahan dalam prediksi: {str(e)}")

@router.post("/legacy")
def prediksi_stres_legacy(data: InputData):
    """
    Endpoint legacy untuk backward compatibility
    """
    try:
        input_array = [
            data.durasi, data.frekuensi, data.jumlah_aplikasi, data.notifikasi,
            data.tidur, data.makan, data.olahraga, data.main_game, data.belajar,
            data.buka_sosmed, data.streaming, data.scroll, data.email, data.panggilan,
            data.waktu_pagi, data.waktu_siang, data.waktu_sore, data.waktu_malam,
            data.jumlah_aktivitas
        ]

        hasil_angka, hasil_label = prediksi_model(input_array)

        return {
            "status": "success",
            "hasil": hasil_label,
            "confidence": float(hasil_angka),
            "message": f"Tingkat stress Anda diprediksi: {hasil_label}"
        }

    except Exception as e:
        logger.error(f"Error in legacy prediction: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Terjadi kesalahan: {str(e)}")

@router.get("/riwayat")
def get_riwayat_prediksi(
    limit: int = 10,
    days: int = 30,
    current_user = Depends(get_current_user)
):
    """
    Mendapatkan riwayat prediksi pengguna
    Sesuai dengan fitur pemantauan tren stres dalam laporan
    """
    try:
        conn = get_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT 
                p.predicted_stress_level,
                p.confidence_score,
                p.prediction_date,
                da.screen_time_total,
                da.buka_sosmed,
                da.notifikasi_count,
                da.waktu_malam
            FROM predictions p
            JOIN digital_activities da ON p.digital_activity_id = da.id
            WHERE p.user_id = %s 
            AND p.prediction_date >= %s
            ORDER BY p.prediction_date DESC 
            LIMIT %s
        """, (current_user["user_id"], datetime.now() - timedelta(days=days), limit))
        
        results = cursor.fetchall()
        cursor.close()
        conn.close()

        riwayat = []
        for row in results:
            riwayat.append({
                "predicted_stress_level": row[0],
                "confidence_score": row[1],
                "prediction_date": row[2].isoformat() if row[2] else None,
                "screen_time_total": row[3],
                "social_media_time": row[4],
                "notification_count": row[5],
                "night_usage": row[6]
            })

        return {
            "status": "success",
            "data": riwayat,
            "total": len(riwayat),
            "period_days": days
        }

    except Exception as e:
        logger.error(f"Error getting history: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Terjadi kesalahan: {str(e)}")

@router.get("/analisis/tren")
def get_analisis_tren_stres(
    days: int = 7,
    current_user = Depends(get_current_user)
):
    """
    Analisis tren tingkat stres pengguna
    Fitur visualisasi yang disebutkan dalam laporan
    """
    try:
        conn = get_connection()
        cursor = conn.cursor()

        # Tren harian tingkat stres
        cursor.execute("""
            SELECT 
                DATE(p.prediction_date) as prediction_date,
                p.predicted_stress_level,
                COUNT(*) as count,
                AVG(p.confidence_score) as avg_confidence,
                AVG(da.screen_time_total) as avg_screen_time
            FROM predictions p
            JOIN digital_activities da ON p.digital_activity_id = da.id
            WHERE p.user_id = %s 
            AND p.prediction_date >= %s
            GROUP BY DATE(p.prediction_date), p.predicted_stress_level
            ORDER BY prediction_date DESC
        """, (current_user["user_id"], datetime.now() - timedelta(days=days)))
        
        results = cursor.fetchall()
        
        # Analisis korelasi fitur
        cursor.execute("""
            SELECT 
                AVG(da.buka_sosmed) as avg_social_media,
                AVG(da.notifikasi_count) as avg_notifications,
                AVG(da.waktu_malam) as night_usage_frequency,
                AVG(da.screen_time_total) as avg_total_screen_time
            FROM predictions p
            JOIN digital_activities da ON p.digital_activity_id = da.id
            WHERE p.user_id = %s 
            AND p.prediction_date >= %s
            AND p.predicted_stress_level = 'Tinggi'
        """, (current_user["user_id"], datetime.now() - timedelta(days=days)))
        
        high_stress_factors = cursor.fetchone()
        
        cursor.close()
        conn.close()

        # Format hasil untuk visualisasi
        tren_data = {}
        for row in results:
            date_str = row[0].isoformat()
            if date_str not in tren_data:
                tren_data[date_str] = {
                    "date": date_str,
                    "stress_distribution": {},
                    "avg_screen_time": 0
                }
            
            tren_data[date_str]["stress_distribution"][row[1]] = {
                "count": row[2],
                "avg_confidence": round(row[3], 3)
            }
            tren_data[date_str]["avg_screen_time"] = round(row[4], 2)

        return {
            "status": "success",
            "period_days": days,
            "trend_data": list(tren_data.values()),
            "high_stress_factors": {
                "avg_social_media_hours": round(high_stress_factors[0] or 0, 2),
                "avg_notifications": int(high_stress_factors[1] or 0),
                "night_usage_frequency": round(high_stress_factors[2] or 0, 2),
                "avg_screen_time": round(high_stress_factors[3] or 0, 2)
            } if high_stress_factors else None,
            "recommendations": [
                "📊 Monitor pola penggunaan digital harian",
                "📱 Batasi penggunaan media sosial saat stres tinggi",
                "🔕 Kurangi notifikasi yang tidak perlu",
                "🌙 Hindari penggunaan gadget di malam hari"
            ]
        }

    except Exception as e:
        logger.error(f"Error getting trend analysis: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Terjadi kesalahan: {str(e)}")

@router.get("/model/info")
def get_model_info():
    """
    Informasi tentang model Random Forest yang digunakan
    Sesuai dengan dokumentasi teknis dalam laporan
    """
    return {
        "model_algorithm": "Random Forest",
        "model_version": "1.0.0",
        "features_count": 20,
        "stress_classes": ["Rendah", "Sedang", "Tinggi"],
        "key_features": [
            "screen_time_total",
            "buka_sosmed", 
            "notifikasi_count",
            "waktu_malam",
            "scroll_time",
            "jumlah_aktivitas",
            "durasi_tidur"
        ],
        "model_description": "Random Forest classifier untuk prediksi tingkat stres berdasarkan aktivitas digital. Model menganalisis 20 fitur aktivitas digital untuk mengklasifikasikan tingkat stres menjadi 3 kategori.",
        "training_info": {
            "algorithm_benefits": [
                "Unggul dalam akurasi prediksi",
                "Mengurangi risiko overfitting", 
                "Memberikan interpretasi fitur penting",
                "Robust terhadap outliers"
            ],
            "evaluation_metrics": [
                "Confusion Matrix",
                "Precision, Recall, F1-Score",
                "Feature Importance Analysis"
            ]
        }
    }

@router.get("/trend")
def get_stress_trend(
    days: int = Query(30, ge=1, le=365)
):
    """
    Mendapatkan tren tingkat stres pengguna dalam periode tertentu
    """
    try:
        # Return mock data untuk sementara
        return {
            "trend_data": [
                {
                    "date": "2024-07-11",
                    "Rendah": 2,
                    "Sedang": 1,
                    "Tinggi": 0,
                    "total_predictions": 3
                },
                {
                    "date": "2024-07-10", 
                    "Rendah": 1,
                    "Sedang": 2,
                    "Tinggi": 1,
                    "total_predictions": 4
                }
            ],
            "period_days": days
        }
        
    except Exception as e:
        logger.error(f"❌ Error getting trend: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/dashboard-stats")
def get_user_dashboard_stats(
    current_user = Depends(get_current_user_optional)
):
    """
    Mendapatkan statistik dashboard untuk user yang sedang login
    """
    try:
        user_id = current_user["user_id"]
        logger.info(f"🔍 Fetching dashboard stats for user_id: {user_id}")
        
        conn = get_connection()
        cursor = conn.cursor()
        
        # Get total predictions for this user
        logger.info(f"📊 Step 1: Getting total predictions...")
        cursor.execute("""
            SELECT COUNT(*) as total_predictions
            FROM predictions p
            WHERE p.user_id = %s
        """, (user_id,))
        
        result = cursor.fetchone()
        total_predictions = result['total_predictions'] if result and result.get('total_predictions') is not None else 0
        logger.info(f"   Total predictions found: {total_predictions}")
        
        # Get last prediction
        logger.info(f"📊 Step 2: Getting last prediction...")
        cursor.execute("""
            SELECT p.predicted_stress_level, p.prediction_date, p.confidence_score
            FROM predictions p
            WHERE p.user_id = %s
            ORDER BY p.prediction_date DESC
            LIMIT 1
        """, (user_id,))
        
        last_prediction_data = cursor.fetchone()
        last_prediction = None
        if last_prediction_data:
            last_prediction = {
                "predicted_label": last_prediction_data['predicted_stress_level'],
                "prediction_date": last_prediction_data['prediction_date'].isoformat(),
                "confidence_score": float(last_prediction_data['confidence_score']) * 100
            }
            logger.info(f"   Last prediction: {last_prediction['predicted_label']}")
        else:
            logger.info(f"   No previous predictions found")
        
        # Get recent stress levels distribution (last 30 days)
        logger.info(f"📊 Step 3: Getting stress distribution...")
        thirty_days_ago = datetime.now() - timedelta(days=30)
        cursor.execute("""
            SELECT 
                p.predicted_stress_level,
                COUNT(*) as count
            FROM predictions p
            WHERE p.prediction_date >= %s AND p.user_id = %s
            GROUP BY p.predicted_stress_level
        """, (thirty_days_ago, user_id))
        
        stress_distribution = cursor.fetchall()
        recent_stress_levels = {"Rendah": 0, "Sedang": 0, "Tinggi": 0}
        
        for row in stress_distribution:
            level = row['predicted_stress_level']
            count = row['count']
            if level in recent_stress_levels:
                recent_stress_levels[level] = count
        
        logger.info(f"   Stress distribution: {recent_stress_levels}")
        
        # Calculate weekly trend
        logger.info(f"📊 Step 4: Calculating weekly trends...")
        seven_days_ago = datetime.now() - timedelta(days=7)
        fourteen_days_ago = datetime.now() - timedelta(days=14)
        
        # Last week average
        cursor.execute("""
            SELECT AVG(
                CASE 
                    WHEN predicted_stress_level = 'Rendah' THEN 0
                    WHEN predicted_stress_level = 'Sedang' THEN 1
                    WHEN predicted_stress_level = 'Tinggi' THEN 2
                    ELSE 1
                END
            ) as avg_stress
            FROM predictions p
            WHERE p.prediction_date >= %s AND p.user_id = %s
        """, (seven_days_ago, user_id))
        
        result = cursor.fetchone()
        last_week_avg = float(result['avg_stress']) if result and result.get('avg_stress') is not None else 1.0
        
        # Previous week average
        cursor.execute("""
            SELECT AVG(
                CASE 
                    WHEN predicted_stress_level = 'Rendah' THEN 0
                    WHEN predicted_stress_level = 'Sedang' THEN 1
                    WHEN predicted_stress_level = 'Tinggi' THEN 2
                    ELSE 1
                END
            ) as avg_stress
            FROM predictions p
            WHERE p.prediction_date >= %s AND p.prediction_date < %s AND p.user_id = %s
        """, (fourteen_days_ago, seven_days_ago, user_id))
        
        result = cursor.fetchone()
        prev_week_avg = float(result['avg_stress']) if result and result.get('avg_stress') is not None else 1.0
        
        # Determine trend
        if last_week_avg > prev_week_avg + 0.1:
            weekly_trend = "meningkat"
        elif last_week_avg < prev_week_avg - 0.1:
            weekly_trend = "menurun"
        else:
            weekly_trend = "stabil"
        
        # Get recent activities (last 7 days)
        cursor.execute("""
            SELECT 
                da.tanggal,
                da.screen_time_total,
                da.buka_sosmed,
                da.notifikasi_count,
                p.predicted_stress_level
            FROM digital_activities da
            LEFT JOIN predictions p ON da.user_id = p.user_id 
                AND DATE(da.tanggal) = DATE(p.prediction_date)
            WHERE da.user_id = %s AND da.tanggal >= %s
            ORDER BY da.tanggal DESC
            LIMIT 7
        """, (user_id, seven_days_ago))
        
        recent_activities = []
        for activity in cursor.fetchall():
            recent_activities.append({
                "date": activity['tanggal'].isoformat() if activity.get('tanggal') else None,
                "screen_time": float(activity['screen_time_total']) if activity.get('screen_time_total') else 0,
                "social_media": float(activity['buka_sosmed']) if activity.get('buka_sosmed') else 0,
                "notifications": int(activity['notifikasi_count']) if activity.get('notifikasi_count') else 0,
                "stress_level": activity.get('predicted_stress_level') or "Tidak Ada Data"
            })
        
        logger.info(f"📊 Step 5: Completed successfully!")
        logger.info(f"   Found {len(recent_activities)} recent activities")
        
        cursor.close()
        conn.close()
        
        return {
            "total_predictions": total_predictions,
            "last_prediction": last_prediction,
            "recent_stress_levels": recent_stress_levels,
            "weekly_trend": weekly_trend,
            "recent_activities": recent_activities,
            "user_id": user_id
        }
        
    except Exception as e:
        logger.error(f"❌ Error fetching user dashboard stats: {type(e).__name__}: {str(e)}")
        logger.error(f"   User ID: {current_user.get('user_id', 'unknown') if current_user else 'no user'}")
        import traceback
        logger.error(f"   Traceback: {traceback.format_exc()}")
        
        # Return fallback data instead of raising exception
        return {
            "total_predictions": 0,
            "last_prediction": None,
            "recent_stress_levels": {"Rendah": 0, "Sedang": 0, "Tinggi": 0},
            "weekly_trend": "stabil",
            "recent_activities": [],
            "user_id": current_user.get("user_id", 1) if current_user else 1,
            "error": f"Database error: {str(e)}"
        }

@router.get("/dashboard-stats-public")
def get_dashboard_stats_public():
    """
    Endpoint untuk statistik dashboard (versi public untuk development)
    """
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        # Total prediksi hari ini
        cursor.execute("""
            SELECT COUNT(*) as count FROM predictions 
            WHERE DATE(prediction_date) = CURRENT_DATE
        """)
        result = cursor.fetchone()
        total_prediksi_hari_ini = result['count'] if result else 0
        
        # Distribusi stress level minggu terakhir
        cursor.execute("""
            SELECT predicted_stress_level, COUNT(*) as count
            FROM predictions 
            WHERE prediction_date >= CURRENT_DATE - INTERVAL '7 days'
            GROUP BY predicted_stress_level
        """)
        distribusi_results = cursor.fetchall()
        distribusi_stress = {row['predicted_stress_level']: row['count'] for row in distribusi_results}
        
        # Rata-rata confidence score
        cursor.execute("""
            SELECT AVG(confidence_score) as avg_confidence
            FROM predictions 
            WHERE prediction_date >= CURRENT_DATE - INTERVAL '7 days'
        """)
        result = cursor.fetchone()
        avg_confidence = result['avg_confidence'] if result and result['avg_confidence'] else 0.5
        
        # Top features yang mempengaruhi stress (dummy data untuk sekarang)
        top_features_data = [
            {"name": "Penggunaan Media Sosial", "impact": 0.85},
            {"name": "Notifikasi per Hari", "impact": 0.72},
            {"name": "Waktu Layar Malam", "impact": 0.68},
            {"name": "Durasi Tidur", "impact": 0.65},
            {"name": "Aktivitas Olahraga", "impact": 0.58}
        ]
        
        cursor.close()
        conn.close()
        
        return {
            "status": "success",
            "data": {
                "total_prediksi_hari_ini": total_prediksi_hari_ini,
                "distribusi_stress": {
                    "Rendah": distribusi_stress.get("Rendah", 0),
                    "Sedang": distribusi_stress.get("Sedang", 0),
                    "Tinggi": distribusi_stress.get("Tinggi", 0)
                },
                "rata_rata_confidence": round(float(avg_confidence), 3),
                "top_features": top_features_data,
                "last_updated": datetime.now().isoformat()
            }
        }
        
    except Exception as e:
        logger.error(f"❌ Error getting dashboard stats: {str(e)}")
        # Return dummy data on error
        return {
            "status": "success",
            "data": {
                "total_prediksi_hari_ini": 0,
                "distribusi_stress": {"Rendah": 0, "Sedang": 0, "Tinggi": 0},
                "rata_rata_confidence": 0.5,
                "top_features": [
                    {"name": "Penggunaan Media Sosial", "impact": 0.85},
                    {"name": "Notifikasi per Hari", "impact": 0.72},
                    {"name": "Waktu Layar Malam", "impact": 0.68}
                ],
                "last_updated": datetime.now().isoformat()
            }
        }
