import React, { useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { identity } from '../services/api.js';
import CandidateLayout from '../layouts/CandidateLayout.jsx';
import { Camera, CheckCircle, RefreshCw, ArrowRight, Loader } from 'lucide-react';
import Webcam from 'react-webcam';

export default function IdentityPage() {
  const navigate = useNavigate();
  const webcamRef = useRef(null);
  const [captured, setCaptured] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState('');
  const [cameraReady, setCameraReady] = useState(false);

  const candidateId = sessionStorage.getItem('candidateId');

  const capture = useCallback(() => {
    if (!webcamRef.current) return;
    const img = webcamRef.current.getScreenshot();
    setCaptured(img);
  }, []);

  const handleUpload = async () => {
    if (!captured || !candidateId) return;
    setUploading(true);
    setError('');
    try {
      await identity.uploadSelfie(candidateId, captured);
      setVerified(true);
      sessionStorage.setItem('selfieUploaded', 'true');
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed. Please retake.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <CandidateLayout>
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '3rem 1.5rem' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '0.375rem' }}>Identity Verification</h1>
          <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>
            Capture a clear selfie for interview integrity verification.
          </p>
        </div>

        {error && (
          <div style={{ background: 'var(--error-light)', border: '1px solid var(--error)', borderRadius: 8, padding: '0.875rem', marginBottom: '1.25rem', color: 'var(--error)', fontSize: '0.875rem' }}>
            {error}
          </div>
        )}

        <div className="card">
          {verified ? (
            <div style={{ textAlign: 'center', padding: '2rem 0' }}>
              <CheckCircle size={56} color="var(--success)" style={{ margin: '0 auto 1rem', display: 'block' }} />
              <h3 style={{ color: 'var(--success)', marginBottom: '0.5rem' }}>Identity Captured!</h3>
              <p style={{ color: 'var(--text-tertiary)', marginBottom: '1.5rem', fontSize: '0.875rem' }}>Your selfie has been uploaded for verification.</p>
              <button className="btn btn-primary" onClick={() => navigate('/interview/system-check')} style={{ width: '100%', padding: '0.875rem' }}>
                Continue to System Check <ArrowRight size={18} />
              </button>
            </div>
          ) : (
            <>
              {/* Camera Feed */}
              <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', background: '#000', marginBottom: '1.25rem', aspectRatio: '4/3' }}>
                {!captured ? (
                  <Webcam
                    ref={webcamRef}
                    screenshotFormat="image/jpeg"
                    videoConstraints={{ facingMode: 'user', width: 640, height: 480 }}
                    onUserMedia={() => setCameraReady(true)}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                ) : (
                  <img src={captured} alt="Selfie" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                )}

                {/* Face guide overlay */}
                {!captured && cameraReady && (
                  <div style={{
                    position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none',
                  }}>
                    <div style={{
                      width: 180, height: 230, border: '3px solid rgba(37,99,235,0.8)', borderRadius: '50%',
                      boxShadow: '0 0 0 2000px rgba(0,0,0,0.35)',
                    }} />
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                {!captured ? (
                  <button
                    className="btn btn-primary"
                    onClick={capture}
                    disabled={!cameraReady}
                    style={{ flex: 1, padding: '0.875rem' }}
                  >
                    <Camera size={18} /> Capture Selfie
                  </button>
                ) : (
                  <>
                    <button className="btn btn-secondary" onClick={() => setCaptured(null)} style={{ flex: 0 }}>
                      <RefreshCw size={16} /> Retake
                    </button>
                    <button
                      className="btn btn-primary"
                      onClick={handleUpload}
                      disabled={uploading}
                      style={{ flex: 1, padding: '0.875rem' }}
                    >
                      {uploading ? <><Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> Verifying...</> : <><CheckCircle size={16} /> Submit</>}
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </div>

        <p style={{ textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.78rem', marginTop: '1.25rem' }}>
          Your image is used only for interview identity verification.
        </p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </CandidateLayout>
  );
}
