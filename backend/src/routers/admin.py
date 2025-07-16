"""
Router untuk fitur admin management
Sesuai dengan spesifikasi laporan penelitian
"""
from fastapi import APIRouter, HTTPException, Depends, Query
from schemas.digital_activity_schema import UserResponse
from config.connection import get_connection
from datetime import datetime, timedelta
from typing import List, Optional
import logging
from ml.model_evaluator import evaluate_stress_model
from ml.random_forest_model import stress_model

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Admin Management"])

# Placeholder untuk dependency authentication
def get_current_admin_user():
    """Placeholder untuk admin authentication - implementasi sesuai kebutuhan"""
    # TODO: Implementasi JWT authentication untuk admin
    return {"user_id": 1, "role": "admin"}

@router.get("/users", response_model=List[UserResponse])
def get_all_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    admin_user = Depends(get_current_admin_user)
):
    """
    Mendapatkan daftar semua pengguna (fitur admin)
    Sesuai dengan use case diagram dalam laporan
    """
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT id, nama, email, role, tanggal_daftar, is_active, last_login
            FROM users 
            ORDER BY tanggal_daftar DESC
            OFFSET %s LIMIT %s
        """, (skip, limit))
        
        users = cursor.fetchall()
        
        result = []
        for user in users:
            result.append(UserResponse(
                id=user[0],
                nama=user[1],
                email=user[2],
                role=user[3],
                tanggal_daftar=user[4].isoformat() if user[4] else "",
                is_active=user[5]
            ))
        
        cursor.close()
        conn.close()
        
        return result
        
    except Exception as e:
        logger.error(f"❌ Error getting users: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/analytics/stress-distribution")
def get_stress_distribution(
    days: int = Query(30, ge=1, le=365),
    admin_user = Depends(get_current_admin_user)
):
    """
    Analisis distribusi tingkat stres pengguna
    Fitur analisis performa sistem untuk admin
    """
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        # Distribusi tingkat stres dalam periode tertentu
        cursor.execute("""
            SELECT 
                predicted_stress_level,
                COUNT(*) as count,
                AVG(confidence_score) as avg_confidence
            FROM predictions 
            WHERE prediction_date >= %s
            GROUP BY predicted_stress_level
            ORDER BY 
                CASE predicted_stress_level 
                    WHEN 'Rendah' THEN 1
                    WHEN 'Sedang' THEN 2
                    WHEN 'Tinggi' THEN 3
                END
        """, (datetime.now() - timedelta(days=days),))
        
        distribution = cursor.fetchall()
        
        # Total prediksi
        cursor.execute("""
            SELECT COUNT(*) FROM predictions 
            WHERE prediction_date >= %s
        """, (datetime.now() - timedelta(days=days),))
        
        total_predictions = cursor.fetchone()[0]
        
        # Format hasil
        result = {
            "period_days": days,
            "total_predictions": total_predictions,
            "stress_distribution": []
        }
        
        for row in distribution:
            result["stress_distribution"].append({
                "stress_level": row[0],
                "count": row[1],
                "percentage": round((row[1] / total_predictions * 100), 2) if total_predictions > 0 else 0,
                "avg_confidence": round(row[2], 3) if row[2] else 0
            })
        
        cursor.close()
        conn.close()
        
        return result
        
    except Exception as e:
        logger.error(f"❌ Error getting stress distribution: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/analytics/feature-importance")
def get_feature_importance_analysis(
    days: int = Query(30, ge=1, le=365),
    top_k: int = Query(10, ge=5, le=20),
    admin_user = Depends(get_current_admin_user)
):
    """
    Analisis fitur-fitur penting dalam prediksi stres
    Sesuai dengan analisis Random Forest dalam laporan
    """
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        # Rata-rata importance score per fitur
        cursor.execute("""
            SELECT 
                fil.feature_name,
                AVG(fil.importance_score) as avg_importance,
                COUNT(*) as frequency,
                AVG(fil.rank_position) as avg_rank
            FROM feature_importance_logs fil
            JOIN predictions p ON fil.prediction_id = p.id
            WHERE p.prediction_date >= %s
            GROUP BY fil.feature_name
            ORDER BY avg_importance DESC
            LIMIT %s
        """, (datetime.now() - timedelta(days=days), top_k))
        
        features = cursor.fetchall()
        
        result = {
            "period_days": days,
            "analysis_date": datetime.now().isoformat(),
            "top_features": []
        }
        
        for idx, row in enumerate(features, 1):
            result["top_features"].append({
                "rank": idx,
                "feature_name": row[0],
                "avg_importance_score": round(row[1], 4),
                "frequency": row[2],
                "avg_rank_position": round(row[3], 1)
            })
        
        cursor.close()
        conn.close()
        
        return result
        
    except Exception as e:
        logger.error(f"❌ Error getting feature importance: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/analytics/user-activity")
def get_user_activity_summary(
    days: int = Query(7, ge=1, le=90),
    admin_user = Depends(get_current_admin_user)
):
    """
    Ringkasan aktivitas pengguna untuk admin
    """
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        # Aktivitas pengguna
        cursor.execute("""
            SELECT 
                DATE(da.created_at) as activity_date,
                COUNT(DISTINCT da.user_id) as active_users,
                COUNT(da.id) as total_activities,
                COUNT(p.id) as total_predictions,
                AVG(da.screen_time_total) as avg_screen_time
            FROM digital_activities da
            LEFT JOIN predictions p ON da.id = p.digital_activity_id
            WHERE da.created_at >= %s
            GROUP BY DATE(da.created_at)
            ORDER BY activity_date DESC
        """, (datetime.now() - timedelta(days=days),))
        
        activities = cursor.fetchall()
        
        result = {
            "period_days": days,
            "daily_summary": []
        }
        
        for row in activities:
            result["daily_summary"].append({
                "date": row[0].isoformat(),
                "active_users": row[1],
                "total_activities": row[2],
                "total_predictions": row[3],
                "avg_screen_time": round(row[4], 2) if row[4] else 0
            })
        
        cursor.close()
        conn.close()
        
        return result
        
    except Exception as e:
        logger.error(f"❌ Error getting user activity: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/system/performance")
def get_system_performance(admin_user = Depends(get_current_admin_user)):
    """
    Evaluasi performa sistem secara keseluruhan
    Sesuai dengan pengujian dalam laporan penelitian
    """
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        # Total statistik
        cursor.execute("SELECT COUNT(*) FROM users WHERE is_active = true")
        total_users = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM predictions")
        total_predictions = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM digital_activities")
        total_activities = cursor.fetchone()[0]
        
        # Rata-rata confidence score
        cursor.execute("SELECT AVG(confidence_score) FROM predictions")
        avg_confidence = cursor.fetchone()[0]
        
        # Prediksi 24 jam terakhir
        cursor.execute("""
            SELECT COUNT(*) FROM predictions 
            WHERE prediction_date >= %s
        """, (datetime.now() - timedelta(hours=24),))
        
        predictions_24h = cursor.fetchone()[0]
        
        cursor.close()
        conn.close()
        
        return {
            "system_health": "healthy",
            "total_active_users": total_users,
            "total_predictions": total_predictions,
            "total_activities": total_activities,
            "avg_model_confidence": round(avg_confidence, 3) if avg_confidence else 0,
            "predictions_last_24h": predictions_24h,
            "model_algorithm": "Random Forest",
            "model_version": "1.0.0",
            "last_updated": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"❌ Error getting system performance: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/audit/login-logs")
def get_login_audit_logs(
    days: int = Query(7, ge=1, le=30),
    status: Optional[str] = Query(None, regex="^(success|failed|blocked)$"),
    admin_user = Depends(get_current_admin_user)
):
    """
    Audit log login pengguna untuk keamanan sistem
    Sesuai dengan tabel LoginAuditLogs dalam laporan
    """
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        # Query dasar
        base_query = """
            SELECT 
                lal.id, lal.user_id, u.nama, u.email,
                lal.login_time, lal.logout_time, lal.ip_address,
                lal.login_status, lal.failure_reason, lal.device_info
            FROM login_audit_logs lal
            JOIN users u ON lal.user_id = u.id
            WHERE lal.login_time >= %s
        """
        
        params = [datetime.now() - timedelta(days=days)]
        
        if status:
            base_query += " AND lal.login_status = %s"
            params.append(status)
        
        base_query += " ORDER BY lal.login_time DESC LIMIT 100"
        
        cursor.execute(base_query, params)
        logs = cursor.fetchall()
        
        result = {
            "period_days": days,
            "status_filter": status,
            "logs": []
        }
        
        for log in logs:
            result["logs"].append({
                "id": log[0],
                "user_id": log[1],
                "user_name": log[2],
                "user_email": log[3],
                "login_time": log[4].isoformat() if log[4] else None,
                "logout_time": log[5].isoformat() if log[5] else None,
                "ip_address": str(log[6]) if log[6] else None,
                "status": log[7],
                "failure_reason": log[8],
                "device_info": log[9]
            })
        
        cursor.close()
        conn.close()
        
        return result
        
    except Exception as e:
        logger.error(f"❌ Error getting login audit logs: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/analytics")
def get_analytics_data(
    days: int = Query(30, ge=1, le=365)
):
    """
    Mendapatkan data analytics untuk dashboard
    Meliputi total prediksi, distribusi stres, dan tren
    """
    try:
        # Return mock data untuk sementara sampai database ada data
        return {
            "total_predictions": 0,
            "stress_distribution": {
                'Rendah': 40.0,
                'Sedang': 35.0, 
                'Tinggi': 25.0
            },
            "trend": "stabil",
            "period_days": days
        }
        
    except Exception as e:
        logger.error(f"❌ Error getting analytics: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/dashboard-stats")
def get_dashboard_stats(
    user_id: Optional[int] = None,
    admin_user = Depends(get_current_admin_user)
):
    """
    Mendapatkan statistik dashboard untuk user tertentu atau admin
    """
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        # Base query condition
        where_clause = ""
        params = []
        
        if user_id:
            where_clause = "WHERE p.user_id = %s"
            params.append(user_id)
        
        # Get total predictions
        cursor.execute(f"""
            SELECT COUNT(*) as total_predictions
            FROM predictions p
            {where_clause}
        """, params)
        
        total_predictions = cursor.fetchone()[0] or 0
        
        # Get last prediction
        cursor.execute(f"""
            SELECT p.predicted_stress_level, p.prediction_date, p.confidence_score
            FROM predictions p
            {where_clause}
            ORDER BY p.prediction_date DESC
            LIMIT 1
        """, params)
        
        last_prediction_data = cursor.fetchone()
        last_prediction = None
        if last_prediction_data:
            last_prediction = {
                "predicted_label": last_prediction_data[0],
                "prediction_date": last_prediction_data[1].isoformat(),
                "confidence_score": float(last_prediction_data[2]) * 100
            }
        
        # Get recent stress levels distribution (last 30 days)
        thirty_days_ago = datetime.now() - timedelta(days=30)
        cursor.execute(f"""
            SELECT 
                p.predicted_stress_level,
                COUNT(*) as count
            FROM predictions p
            WHERE p.prediction_date >= %s
            {' AND p.user_id = %s' if user_id else ''}
            GROUP BY p.predicted_stress_level
        """, [thirty_days_ago] + (params if user_id else []))
        
        stress_distribution = cursor.fetchall()
        recent_stress_levels = {"Rendah": 0, "Sedang": 0, "Tinggi": 0}
        
        for level, count in stress_distribution:
            if level in recent_stress_levels:
                recent_stress_levels[level] = count
        
        # Calculate weekly trend
        seven_days_ago = datetime.now() - timedelta(days=7)
        fourteen_days_ago = datetime.now() - timedelta(days=14)
        
        # Last week average
        cursor.execute(f"""
            SELECT AVG(
                CASE 
                    WHEN predicted_stress_level = 'Rendah' THEN 0
                    WHEN predicted_stress_level = 'Sedang' THEN 1
                    WHEN predicted_stress_level = 'Tinggi' THEN 2
                    ELSE 1
                END
            ) as avg_stress
            FROM predictions p
            WHERE p.prediction_date >= %s
            {' AND p.user_id = %s' if user_id else ''}
        """, [seven_days_ago] + (params if user_id else []))
        
        last_week_avg = cursor.fetchone()[0] or 1
        
        # Previous week average
        cursor.execute(f"""
            SELECT AVG(
                CASE 
                    WHEN predicted_stress_level = 'Rendah' THEN 0
                    WHEN predicted_stress_level = 'Sedang' THEN 1
                    WHEN predicted_stress_level = 'Tinggi' THEN 2
                    ELSE 1
                END
            ) as avg_stress
            FROM predictions p
            WHERE p.prediction_date >= %s AND p.prediction_date < %s
            {' AND p.user_id = %s' if user_id else ''}
        """, [fourteen_days_ago, seven_days_ago] + (params if user_id else []))
        
        prev_week_avg = cursor.fetchone()[0] or 1
        
        # Determine trend
        if last_week_avg > prev_week_avg + 0.1:
            weekly_trend = "meningkat"
        elif last_week_avg < prev_week_avg - 0.1:
            weekly_trend = "menurun"
        else:
            weekly_trend = "stabil"
        
        cursor.close()
        conn.close()
        
        return {
            "total_predictions": total_predictions,
            "last_prediction": last_prediction,
            "recent_stress_levels": recent_stress_levels,
            "weekly_trend": weekly_trend,
            "user_id": user_id
        }
        
    except Exception as e:
        logger.error(f"❌ Error fetching dashboard stats: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/model/evaluation")
def evaluate_prediction_model(admin_user = Depends(get_current_admin_user)):
    """
    Comprehensive model evaluation for stress prediction system
    Provides detailed metrics on model performance and reliability
    """
    try:
        logger.info("🔬 Starting comprehensive model evaluation...")
        
        # Evaluate the current model
        evaluation_results = evaluate_stress_model(stress_model.model, stress_model.scaler)
        
        # Generate human-readable report
        from ml.model_evaluator import StressModelEvaluator
        evaluator = StressModelEvaluator(stress_model.model, stress_model.scaler)
        evaluation_report = evaluator.generate_evaluation_report(evaluation_results)
        
        logger.info("✅ Model evaluation completed successfully")
        
        return {
            "status": "success",
            "evaluation_timestamp": datetime.now().isoformat(),
            "detailed_metrics": evaluation_results,
            "human_readable_report": evaluation_report,
            "model_version": "1.0.0",
            "recommendations": {
                "accuracy_status": "excellent" if evaluation_results.get('accuracy', 0) >= 0.85 else "good" if evaluation_results.get('accuracy', 0) >= 0.75 else "needs_improvement",
                "deployment_ready": evaluation_results.get('accuracy', 0) >= 0.75 and evaluation_results.get('clinical_metrics', {}).get('safety_score', 0) >= 0.80,
                "next_actions": [
                    "Monitor prediction confidence scores",
                    "Track real-world performance",
                    "Consider model retraining if accuracy drops below 75%"
                ]
            }
        }
        
    except Exception as e:
        logger.error(f"❌ Model evaluation error: {e}")
        raise HTTPException(status_code=500, detail=f"Model evaluation failed: {str(e)}")

@router.get("/model/feature-importance")
def get_model_feature_importance(admin_user = Depends(get_current_admin_user)):
    """
    Get current model feature importance rankings
    Helps understand which factors most influence stress predictions
    """
    try:
        if stress_model.model is None:
            raise HTTPException(status_code=503, detail="Model not loaded")
        
        # Get feature importances
        feature_importance = dict(zip(stress_model.feature_names, stress_model.model.feature_importances_))
        
        # Sort by importance
        sorted_features = sorted(feature_importance.items(), key=lambda x: x[1], reverse=True)
        
        # Calculate cumulative importance
        total_importance = sum(feature_importance.values())
        cumulative_importance = 0
        feature_analysis = []
        
        for i, (feature, importance) in enumerate(sorted_features):
            cumulative_importance += importance
            feature_analysis.append({
                "rank": i + 1,
                "feature_name": feature.replace('_', ' ').title(),
                "feature_key": feature,
                "importance_score": float(importance),
                "importance_percentage": float(importance / total_importance * 100),
                "cumulative_percentage": float(cumulative_importance / total_importance * 100),
                "interpretation": _get_feature_interpretation(feature, importance)
            })
        
        return {
            "status": "success",
            "model_version": "1.0.0",
            "analysis_timestamp": datetime.now().isoformat(),
            "top_features": feature_analysis[:10],
            "all_features": feature_analysis,
            "summary": {
                "most_important_factor": sorted_features[0][0].replace('_', ' ').title(),
                "top_3_cumulative_importance": float(sum([x[1] for x in sorted_features[:3]]) / total_importance * 100),
                "model_focus": "digital_wellness" if any("sosmed" in f[0] or "screen" in f[0] for f in sorted_features[:3]) else "lifestyle_balance"
            }
        }
        
    except Exception as e:
        logger.error(f"❌ Feature importance analysis error: {e}")
        raise HTTPException(status_code=500, detail=f"Feature analysis failed: {str(e)}")

def _get_feature_interpretation(feature_name: str, importance: float) -> str:
    """Get human-readable interpretation of feature importance"""
    
    interpretations = {
        'durasi_pemakaian': "Total screen time - key indicator of digital overwhelm",
        'buka_sosmed': "Social media usage - linked to anxiety and comparison stress",
        'notifikasi_count': "Notification frequency - causes constant interruption stress",
        'durasi_tidur': "Sleep quality - fundamental for stress resilience",
        'waktu_malam': "Night-time usage - disrupts circadian rhythm and recovery",
        'scroll_time': "Mindless scrolling - indicates compulsive usage patterns",
        'durasi_olahraga': "Physical activity - natural stress reducer",
        'jumlah_aplikasi': "App multitasking - cognitive overload indicator",
        'frekuensi_penggunaan': "Usage frequency - shows addiction-like patterns",
        'main_game': "Gaming time - can be stress relief or source of frustration"
    }
    
    base_interpretation = interpretations.get(feature_name, "Digital activity factor")
    
    if importance > 0.15:
        return f"{base_interpretation} (CRITICAL FACTOR - high predictive power)"
    elif importance > 0.08:
        return f"{base_interpretation} (Important factor - moderate influence)"
    else:
        return f"{base_interpretation} (Supporting factor - low influence)"

@router.post("/model/retrain")
def trigger_model_retraining(admin_user = Depends(get_current_admin_user)):
    """
    Trigger model retraining with latest data
    (Placeholder for production implementation)
    """
    try:
        # In production, this would:
        # 1. Fetch latest prediction data from database
        # 2. Validate data quality
        # 3. Retrain model with new data
        # 4. Evaluate new model performance
        # 5. Deploy if performance is better
        
        logger.info("🔄 Model retraining request received")
        
        # For now, return a placeholder response
        return {
            "status": "accepted",
            "message": "Model retraining request queued",
            "estimated_completion": (datetime.now() + timedelta(hours=2)).isoformat(),
            "current_model_version": "1.0.0",
            "next_model_version": "1.1.0",
            "note": "This is a placeholder implementation. Production version would retrain with real data."
        }
        
    except Exception as e:
        logger.error(f"❌ Model retraining error: {e}")
        raise HTTPException(status_code=500, detail=f"Retraining request failed: {str(e)}")

@router.post("/model/test-prediction")
def test_model_prediction(
    test_data: dict,
    admin_user = Depends(get_current_admin_user)
):
    """
    Test model prediction with custom input data
    Useful for validating model behavior with known cases
    """
    try:
        # Validate test data has required fields
        required_fields = stress_model.feature_names
        missing_fields = [field for field in required_fields if field not in test_data]
        
        if missing_fields:
            raise HTTPException(
                status_code=400, 
                detail=f"Missing required fields: {missing_fields}"
            )
        
        # Extract values in correct order
        input_values = [float(test_data[field]) for field in required_fields]
        
        # Make prediction
        prediction_class, prediction_label, probabilities, feature_importance = stress_model.predict(input_values)
        
        # Get top contributing factors
        personal_importance = sorted(feature_importance.items(), key=lambda x: x[1], reverse=True)[:5]
        
        # Calculate risk assessment
        risk_assessment = _calculate_risk_assessment(test_data)
        
        return {
            "status": "success",
            "test_timestamp": datetime.now().isoformat(),
            "input_data": test_data,
            "prediction_result": {
                "predicted_class": int(prediction_class),
                "predicted_label": prediction_label,
                "confidence_score": max(probabilities.values()),
                "probabilities": probabilities
            },
            "analysis": {
                "top_contributing_factors": [
                    {
                        "factor": factor.replace('_', ' ').title(),
                        "importance": float(importance),
                        "user_value": test_data[factor]
                    }
                    for factor, importance in personal_importance
                ],
                "risk_assessment": risk_assessment,
                "clinical_notes": _generate_clinical_notes(prediction_label, test_data)
            }
        }
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid input data: {str(e)}")
    except Exception as e:
        logger.error(f"❌ Test prediction error: {e}")
        raise HTTPException(status_code=500, detail=f"Prediction test failed: {str(e)}")

def _calculate_risk_assessment(data: dict) -> dict:
    """Calculate comprehensive risk assessment from user data"""
    
    risk_factors = []
    protective_factors = []
    risk_score = 0
    
    # Screen time risk
    screen_time = data.get('durasi_pemakaian', 0)
    if screen_time > 10:
        risk_factors.append(f"Excessive screen time ({screen_time:.1f}h)")
        risk_score += 3
    elif screen_time > 6:
        risk_factors.append(f"High screen time ({screen_time:.1f}h)")
        risk_score += 1
    
    # Social media risk
    social_media = data.get('buka_sosmed', 0)
    if social_media > 3:
        risk_factors.append(f"Heavy social media use ({social_media:.1f}h)")
        risk_score += 2
    
    # Sleep quality
    sleep = data.get('durasi_tidur', 7)
    if sleep < 6:
        risk_factors.append(f"Sleep deprivation ({sleep:.1f}h)")
        risk_score += 3
    elif sleep >= 7 and sleep <= 9:
        protective_factors.append(f"Adequate sleep ({sleep:.1f}h)")
        risk_score -= 1
    
    # Physical activity
    exercise = data.get('durasi_olahraga', 0)
    if exercise >= 0.5:
        protective_factors.append(f"Regular exercise ({exercise:.1f}h)")
        risk_score -= 1
    else:
        risk_factors.append("Insufficient physical activity")
        risk_score += 1
    
    # Night usage
    if data.get('waktu_malam', 0) == 1:
        risk_factors.append("Night-time device usage")
        risk_score += 2
    
    # Notification overload
    notifications = data.get('notifikasi_count', 0)
    if notifications > 100:
        risk_factors.append(f"Notification overload ({int(notifications)})")
        risk_score += 2
    
    # Determine risk level
    if risk_score >= 6:
        risk_level = "HIGH"
    elif risk_score >= 3:
        risk_level = "MODERATE"
    elif risk_score <= -1:
        risk_level = "LOW"
    else:
        risk_level = "NORMAL"
    
    return {
        "overall_risk_level": risk_level,
        "risk_score": risk_score,
        "risk_factors": risk_factors,
        "protective_factors": protective_factors,
        "recommendation_priority": "immediate" if risk_level == "HIGH" else "moderate" if risk_level == "MODERATE" else "maintenance"
    }

def _generate_clinical_notes(prediction_label: str, data: dict) -> list:
    """Generate clinical notes based on prediction and data"""
    
    notes = []
    
    # Primary assessment
    if prediction_label == "Tinggi":
        notes.append("🚨 HIGH STRESS ALERT: Immediate intervention recommended")
        notes.append("Consider referral to mental health professional if symptoms persist")
    elif prediction_label == "Sedang":
        notes.append("⚠️ MODERATE STRESS: Preventive measures should be implemented")
        notes.append("Monitor for progression to high stress levels")
    else:
        notes.append("✅ LOW STRESS: Current patterns appear sustainable")
        notes.append("Maintain current healthy digital habits")
    
    # Specific clinical observations
    screen_time = data.get('durasi_pemakaian', 0)
    sleep_time = data.get('durasi_tidur', 7)
    social_media = data.get('buka_sosmed', 0)
    
    if screen_time > 8:
        notes.append(f"📱 Digital overexposure: {screen_time:.1f}h exceeds healthy limits")
    
    if sleep_time < 6:
        notes.append(f"😴 Sleep deficit: {sleep_time:.1f}h insufficient for stress recovery")
    
    if social_media > 2:
        notes.append(f"📲 Social media risk: {social_media:.1f}h may contribute to comparison stress")
    
    if data.get('waktu_malam', 0) == 1:
        notes.append("🌙 Circadian disruption: Night usage affects sleep quality")
    
    # Recovery recommendations
    exercise = data.get('durasi_olahraga', 0)
    if exercise < 0.5:
        notes.append("🏃‍♂️ Activity deficit: Increase physical activity for stress relief")
    
    return notes
