"""
Model Evaluation Module for Stress Prediction System
Provides comprehensive model validation and accuracy metrics
"""
import numpy as np
import pandas as pd
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score, f1_score
from sklearn.model_selection import cross_val_score, StratifiedKFold
from typing import Dict, List, Tuple
import logging

logger = logging.getLogger(__name__)

class StressModelEvaluator:
    """
    Evaluasi komprehensif untuk model prediksi stres
    Berdasarkan standar validasi machine learning untuk healthcare
    """
    
    def __init__(self, model, scaler=None):
        self.model = model
        self.scaler = scaler
        self.stress_labels = {0: "Rendah", 1: "Sedang", 2: "Tinggi"}
    
    def evaluate_model_performance(self, X_test: np.ndarray, y_test: np.ndarray) -> Dict:
        """
        Comprehensive model evaluation with medical-grade metrics
        """
        try:
            # Make predictions
            if self.scaler:
                X_test_scaled = self.scaler.transform(X_test)
            else:
                X_test_scaled = X_test
                
            y_pred = self.model.predict(X_test_scaled)
            y_pred_proba = self.model.predict_proba(X_test_scaled)
            
            # Calculate core metrics
            accuracy = accuracy_score(y_test, y_pred)
            f1_macro = f1_score(y_test, y_pred, average='macro')
            f1_weighted = f1_score(y_test, y_pred, average='weighted')
            
            # Classification report
            class_report = classification_report(y_test, y_pred, 
                                               target_names=list(self.stress_labels.values()),
                                               output_dict=True)
            
            # Confusion matrix
            conf_matrix = confusion_matrix(y_test, y_pred)
            
            # Cross-validation scores
            cv_scores = self._cross_validation_analysis(X_test_scaled, y_test)
            
            # Model reliability metrics
            reliability = self._calculate_reliability_metrics(y_pred_proba)
            
            # Clinical significance metrics
            clinical_metrics = self._calculate_clinical_metrics(y_test, y_pred)
            
            evaluation_results = {
                'accuracy': float(accuracy),
                'f1_macro': float(f1_macro),
                'f1_weighted': float(f1_weighted),
                'classification_report': class_report,
                'confusion_matrix': conf_matrix.tolist(),
                'cross_validation': cv_scores,
                'reliability_metrics': reliability,
                'clinical_metrics': clinical_metrics,
                'model_info': {
                    'algorithm': 'Random Forest',
                    'n_estimators': getattr(self.model, 'n_estimators', 'Unknown'),
                    'max_depth': getattr(self.model, 'max_depth', 'Unknown'),
                    'oob_score': getattr(self.model, 'oob_score_', None)
                }
            }
            
            logger.info(f"✅ Model evaluation completed:")
            logger.info(f"   📊 Accuracy: {accuracy:.3f}")
            logger.info(f"   📈 F1-Score (macro): {f1_macro:.3f}")
            logger.info(f"   🎯 Clinical accuracy: {clinical_metrics['clinical_accuracy']:.3f}")
            
            return evaluation_results
            
        except Exception as e:
            logger.error(f"❌ Model evaluation error: {e}")
            return {'error': str(e)}
    
    def _cross_validation_analysis(self, X: np.ndarray, y: np.ndarray) -> Dict:
        """Perform stratified cross-validation for robust evaluation"""
        try:
            cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
            
            # Accuracy scores
            accuracy_scores = cross_val_score(self.model, X, y, cv=cv, scoring='accuracy')
            
            # F1 scores
            f1_scores = cross_val_score(self.model, X, y, cv=cv, scoring='f1_macro')
            
            # Precision scores
            precision_scores = cross_val_score(self.model, X, y, cv=cv, scoring='precision_macro')
            
            # Recall scores
            recall_scores = cross_val_score(self.model, X, y, cv=cv, scoring='recall_macro')
            
            return {
                'accuracy': {
                    'mean': float(accuracy_scores.mean()),
                    'std': float(accuracy_scores.std()),
                    'scores': accuracy_scores.tolist()
                },
                'f1_macro': {
                    'mean': float(f1_scores.mean()),
                    'std': float(f1_scores.std()),
                    'scores': f1_scores.tolist()
                },
                'precision_macro': {
                    'mean': float(precision_scores.mean()),
                    'std': float(precision_scores.std()),
                    'scores': precision_scores.tolist()
                },
                'recall_macro': {
                    'mean': float(recall_scores.mean()),
                    'std': float(recall_scores.std()),
                    'scores': recall_scores.tolist()
                }
            }
            
        except Exception as e:
            logger.warning(f"Cross-validation failed: {e}")
            return {'error': str(e)}
    
    def _calculate_reliability_metrics(self, y_pred_proba: np.ndarray) -> Dict:
        """Calculate model reliability and confidence metrics"""
        
        # Average confidence scores
        max_probabilities = np.max(y_pred_proba, axis=1)
        avg_confidence = np.mean(max_probabilities)
        
        # Confidence distribution
        high_confidence = np.sum(max_probabilities > 0.8) / len(max_probabilities)
        medium_confidence = np.sum((max_probabilities > 0.6) & (max_probabilities <= 0.8)) / len(max_probabilities)
        low_confidence = np.sum(max_probabilities <= 0.6) / len(max_probabilities)
        
        # Prediction certainty
        entropy = -np.sum(y_pred_proba * np.log(y_pred_proba + 1e-15), axis=1)
        avg_entropy = np.mean(entropy)
        
        return {
            'average_confidence': float(avg_confidence),
            'high_confidence_rate': float(high_confidence),
            'medium_confidence_rate': float(medium_confidence),
            'low_confidence_rate': float(low_confidence),
            'average_entropy': float(avg_entropy),
            'confidence_threshold_recommended': 0.6  # Based on healthcare standards
        }
    
    def _calculate_clinical_metrics(self, y_true: np.ndarray, y_pred: np.ndarray) -> Dict:
        """Calculate clinically relevant metrics for stress assessment"""
        
        # Clinical accuracy: How often we correctly identify high-stress cases
        high_stress_mask = y_true == 2
        high_stress_accuracy = accuracy_score(y_true[high_stress_mask], y_pred[high_stress_mask]) if np.any(high_stress_mask) else 0.0
        
        # Conservative prediction rate (predicting higher stress than actual)
        conservative_predictions = np.sum(y_pred > y_true) / len(y_true)
        
        # Underestimation rate (predicting lower stress than actual) - clinically dangerous
        underestimation_rate = np.sum(y_pred < y_true) / len(y_true)
        
        # Exact match rate
        exact_match_rate = accuracy_score(y_true, y_pred)
        
        # Adjacent class accuracy (within 1 stress level)
        adjacent_accuracy = np.sum(np.abs(y_pred - y_true) <= 1) / len(y_true)
        
        return {
            'clinical_accuracy': float(exact_match_rate),
            'high_stress_detection_accuracy': float(high_stress_accuracy),
            'conservative_prediction_rate': float(conservative_predictions),
            'underestimation_rate': float(underestimation_rate),  # Should be minimized
            'adjacent_class_accuracy': float(adjacent_accuracy),
            'safety_score': float(1 - underestimation_rate)  # Higher is safer
        }
    
    def generate_evaluation_report(self, evaluation_results: Dict) -> str:
        """Generate human-readable evaluation report"""
        
        if 'error' in evaluation_results:
            return f"❌ Evaluation failed: {evaluation_results['error']}"
        
        report = []
        report.append("🔬 **STRESS PREDICTION MODEL EVALUATION REPORT**\n")
        
        # Core Performance
        report.append("📊 **CORE PERFORMANCE METRICS**")
        report.append(f"   • Overall Accuracy: {evaluation_results['accuracy']:.1%}")
        report.append(f"   • F1-Score (Macro): {evaluation_results['f1_macro']:.1%}")
        report.append(f"   • F1-Score (Weighted): {evaluation_results['f1_weighted']:.1%}")
        
        # Clinical Metrics
        clinical = evaluation_results['clinical_metrics']
        report.append(f"\n🏥 **CLINICAL RELEVANCE**")
        report.append(f"   • High-Stress Detection: {clinical['high_stress_detection_accuracy']:.1%}")
        report.append(f"   • Safety Score: {clinical['safety_score']:.1%}")
        report.append(f"   • Adjacent Accuracy: {clinical['adjacent_class_accuracy']:.1%}")
        
        # Reliability
        reliability = evaluation_results['reliability_metrics']
        report.append(f"\n🎯 **MODEL RELIABILITY**")
        report.append(f"   • Average Confidence: {reliability['average_confidence']:.1%}")
        report.append(f"   • High Confidence Predictions: {reliability['high_confidence_rate']:.1%}")
        report.append(f"   • Low Confidence Predictions: {reliability['low_confidence_rate']:.1%}")
        
        # Cross-validation
        if 'error' not in evaluation_results['cross_validation']:
            cv = evaluation_results['cross_validation']
            report.append(f"\n✅ **CROSS-VALIDATION ROBUSTNESS**")
            report.append(f"   • CV Accuracy: {cv['accuracy']['mean']:.1%} (±{cv['accuracy']['std']:.1%})")
            report.append(f"   • CV F1-Score: {cv['f1_macro']['mean']:.1%} (±{cv['f1_macro']['std']:.1%})")
        
        # Recommendations
        report.append(f"\n💡 **RECOMMENDATIONS**")
        if evaluation_results['accuracy'] >= 0.85:
            report.append("   ✅ Model performance is excellent for clinical use")
        elif evaluation_results['accuracy'] >= 0.75:
            report.append("   ⚠️ Model performance is good but needs monitoring")
        else:
            report.append("   ❌ Model needs improvement before clinical deployment")
            
        if clinical['underestimation_rate'] > 0.15:
            report.append("   ⚠️ High underestimation rate - consider threshold adjustment")
            
        if reliability['low_confidence_rate'] > 0.20:
            report.append("   ⚠️ Many low-confidence predictions - consider model retraining")
        
        return "\n".join(report)

def evaluate_stress_model(model, scaler=None, test_data=None) -> Dict:
    """
    Quick evaluation function for the stress prediction model
    """
    evaluator = StressModelEvaluator(model, scaler)
    
    if test_data is None:
        # Generate synthetic test data if none provided
        logger.info("🔧 Generating synthetic test data for evaluation...")
        np.random.seed(123)  # Different seed from training
        n_test = 500
        
        # Generate test features with different patterns than training
        X_test = np.random.rand(n_test, len(model.feature_importances_))
        
        # Simple stress classification for testing
        y_test = np.random.choice([0, 1, 2], n_test, p=[0.4, 0.4, 0.2])
        
    else:
        X_test, y_test = test_data
    
    return evaluator.evaluate_model_performance(X_test, y_test)
