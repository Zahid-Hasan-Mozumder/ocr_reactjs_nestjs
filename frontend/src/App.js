import React, { useState } from 'react';
import './App.css';
import ImageUploadZone from './components/ImageUploadZone';
import ExtractedDataCard from './components/ExtractedDataCard';
import { extractInsuranceCard } from './api/ocrApi';

function App() {
  const [frontFile, setFrontFile] = useState(null);
  const [backFile, setBackFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleExtract = async () => {
    if (!frontFile && !backFile) {
      setError('Please upload at least one image of the insurance card.');
      return;
    }
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const response = await extractInsuranceCard(frontFile, backFile);
      setResult(response.data);
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to extract text. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFrontFile(null);
    setBackFile(null);
    setResult(null);
    setError(null);
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <div className="header-icon">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="2"/>
              <path d="M2 10h20" stroke="currentColor" strokeWidth="2"/>
              <path d="M6 15h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <path d="M14 15h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <h1 className="app-title">Insurance Card OCR</h1>
            <p className="app-subtitle">Extract information from USA medical insurance cards using AI</p>
          </div>
        </div>
      </header>

      <main className="app-main">
        <div className="upload-section">
          <div className="section-header">
            <h2 className="section-title">Upload Insurance Card</h2>
            <p className="section-desc">
              Upload the front and/or back of your insurance card. Higher quality images yield better results.
            </p>
          </div>

          <div className="upload-grid">
            <ImageUploadZone
              label="Front Side"
              side="front"
              file={frontFile}
              onFileSelect={setFrontFile}
              onFileClear={() => setFrontFile(null)}
            />
            <ImageUploadZone
              label="Back Side"
              side="back"
              file={backFile}
              onFileSelect={setBackFile}
              onFileClear={() => setBackFile(null)}
            />
          </div>

          {error && (
            <div className="error-banner">
              <svg viewBox="0 0 24 24" fill="none" className="error-icon">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <line x1="12" y1="16" x2="12.01" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <span>{error}</span>
            </div>
          )}

          <div className="action-row">
            <button
              className="extract-btn"
              onClick={handleExtract}
              disabled={loading || (!frontFile && !backFile)}
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Analyzing with AI...
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" fill="none" className="btn-icon">
                    <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Extract Information
                </>
              )}
            </button>
            {(frontFile || backFile || result) && (
              <button className="reset-btn" onClick={handleReset} disabled={loading}>
                Reset
              </button>
            )}
          </div>
        </div>

        {loading && (
          <div className="loading-section">
            <div className="loading-card">
              <div className="loading-spinner-large"></div>
              <p className="loading-text">AI is analyzing your insurance card...</p>
              <p className="loading-subtext">This may take 10–20 seconds</p>
            </div>
          </div>
        )}

        {result && !loading && (
          <div className="results-section">
            <ExtractedDataCard data={result} />
          </div>
        )}
      </main>

      <footer className="app-footer">
        <p>Powered by OpenAI GPT-4o Vision · For informational use only</p>
      </footer>
    </div>
  );
}

export default App;
