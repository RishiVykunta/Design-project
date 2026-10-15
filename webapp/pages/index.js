import Head from 'next/head';
import { useState, useEffect, useRef } from 'react';
import Header from '../components/Header';
import Hero from '../components/Hero';
import UploadCard from '../components/UploadCard';
import VerdictCard from '../components/VerdictCard';
import ConfidencePanel from '../components/ConfidencePanel';
import ForensicGrid from '../components/ForensicGrid';
import FindingsSection from '../components/FindingsSection';
import EvidenceSummary from '../components/EvidenceSummary';
import ImageModal from '../components/ImageModal';
import MethodologyModal from '../components/MethodologyModal';
import { compressImageIfNeeded, getImageDimensionsFromFile } from '../utils/helpers';

export default function Home() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [dimensions, setDimensions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState('');
  const [error, setError] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [result, setResult] = useState(null);

  // Modals state
  const [inspectImage, setInspectImage] = useState(null);
  const [isMethodologyOpen, setIsMethodologyOpen] = useState(false);

  // Keep track of object URLs to prevent memory leaks
  const prevPreviewRef = useRef(null);
  useEffect(() => {
    return () => {
      if (prevPreviewRef.current && prevPreviewRef.current.startsWith('blob:')) {
        URL.revokeObjectURL(prevPreviewRef.current);
      }
    };
  }, []);

  const handleFileSelect = async (selectedFile) => {
    if (!selectedFile) return;

    // Clean up previous blob URL
    if (prevPreviewRef.current && prevPreviewRef.current.startsWith('blob:')) {
      URL.revokeObjectURL(prevPreviewRef.current);
    }

    const objectUrl = URL.createObjectURL(selectedFile);
    prevPreviewRef.current = objectUrl;

    setFile(selectedFile);
    setPreview(objectUrl);
    setResult(null);
    setError(null);
    setStatusMessage('');

    const dims = await getImageDimensionsFromFile(selectedFile);
    if (dims) setDimensions(dims);
  };

  const handleClearFile = () => {
    if (prevPreviewRef.current && prevPreviewRef.current.startsWith('blob:')) {
      URL.revokeObjectURL(prevPreviewRef.current);
      prevPreviewRef.current = null;
    }
    setFile(null);
    setPreview(null);
    setDimensions(null);
    setResult(null);
    setError(null);
    setStatusMessage('');
  };

  const handleLoadSample = async (sample) => {
    setError(null);
    setStatusMessage(`Loading benchmark sample: ${sample.name}...`);
    try {
      const res = await fetch(`/api/sample/${sample.id}`);
      if (!res.ok) {
        throw new Error(`Failed to load benchmark file (${res.status})`);
      }
      const blob = await res.blob();
      const sampleFile = new File([blob], sample.name, {
        type: blob.type || 'image/jpeg',
        lastModified: Date.now(),
      });
      await handleFileSelect(sampleFile);
      setStatusMessage(`Loaded benchmark sample: ${sample.name}. Click Inspect Authenticity to analyze.`);
    } catch (err) {
      setError(`Unable to load sample: ${err.message}`);
      setStatusMessage('');
    }
  };

  const uploadAndAnalyze = async () => {
    if (!file) {
      setError('Please select or drop an image file before analyzing.');
      return;
    }

    setLoading(true);
    setError(null);
    setStatusMessage('');
    setLoadingStage('Inspecting bitstream & EXIF metadata...');

    try {
      // 1. Client-side pre-optimization for files > 2MB
      const fileToUpload = await compressImageIfNeeded(file);
      setLoadingStage('Evaluating multimodal deepfake features...');

      const form = new FormData();
      form.append('image', fileToUpload);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: form,
      });

      if (!res.ok) {
        const errorText = await res.text();
        let friendlyErr = errorText;
        try {
          const errObj = JSON.parse(errorText);
          friendlyErr = errObj.error || errObj.message || errorText;
        } catch (_) {}

        if (res.status === 413 || friendlyErr.includes('413') || friendlyErr.includes('Too Large')) {
          throw new Error('Image exceeds 4.5MB payload limit. Please upload a smaller image.');
        }
        throw new Error(friendlyErr || `Inspection failed with status code ${res.status}`);
      }

      setLoadingStage('Segmenting spatial mask & computing ELA diff...');
      const data = await res.json();

      let sidaData = data.sida;

      // Check if local Python SIDA server is running on localhost:8000
      if (!sidaData || sidaData.isCloudFallback) {
        try {
          const directForm = new FormData();
          directForm.append('file', fileToUpload);
          directForm.append('mode', 'detection');

          const directRes = await fetch('http://127.0.0.1:8000/api/predict', {
            method: 'POST',
            body: directForm,
          });

          if (directRes.ok) {
            const localResult = await directRes.json();
            if (localResult && localResult.verdict) {
              sidaData = localResult;
            }
          }
        } catch (_) {
          // Local SIDA engine not running; smoothly retain cloud forensic pipeline
        }
      }

      setResult({
        blobUrl: data.url,
        filename: data.filename || file.name,
        sida: sidaData,
      });

      setStatusMessage('Forensic inspection complete.');
    } catch (err) {
      console.error('Inspection error:', err);
      setError(err.message || 'An unexpected error occurred during image inspection.');
    } finally {
      setLoading(false);
      setLoadingStage('');
    }
  };

  const handleScrollToSection = (sectionId) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <>
      <Head>
        <title>SIDA Image Deepfake Forensic Suite | Authenticity & Localization</title>
        <meta
          name="description"
          content="Research-grade image authenticity analysis, SAM ViT-H pixel segmentation, differential Error Level Analysis (ELA), and forensic findings."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
      </Head>

      <div style={styles.appContainer}>
        {/* Navigation Bar */}
        <Header
          onOpenMethodology={() => setIsMethodologyOpen(true)}
          onScrollToSection={handleScrollToSection}
        />

        {/* Main Content Area */}
        <main style={styles.main}>
          {/* Hero Section */}
          <Hero />

          {/* Upload & Inspection Card */}
          <UploadCard
            file={file}
            preview={preview}
            dimensions={dimensions}
            loading={loading}
            loadingStage={loadingStage}
            error={error}
            statusMessage={statusMessage}
            onFileSelect={handleFileSelect}
            onClearFile={handleClearFile}
            onAnalyze={uploadAndAnalyze}
            onLoadSample={handleLoadSample}
          />

          {/* Active Forensic Results View */}
          {result && (
            <div className="animate-fade-in" style={styles.resultsWrapper}>
              {/* Verdict Card */}
              <VerdictCard result={result} />

              {/* Confidence Metric & Output Semantics */}
              <ConfidencePanel result={result} />

              {/* 4-Way Multi-Modal Forensic Panels */}
              <ForensicGrid
                result={result}
                onInspectImage={(imgData) => setInspectImage(imgData)}
              />

              {/* Structured Forensic Findings */}
              <FindingsSection result={result} />

              {/* Evidence Summary & Scientific Scope Limitations */}
              <EvidenceSummary result={result} />
            </div>
          )}
        </main>

        {/* Footer */}
        <footer style={styles.footer}>
          <div style={styles.footerContainer}>
            <div style={styles.footerBrand}>
              <strong>SIDA Image Deepfake Forensic Suite</strong>
              <span style={styles.footerMuted}>
                Multimodal Image Authenticity Analysis, Spatial Localization & Explanation
              </span>
            </div>
            <div style={styles.footerLinks}>
              <button
                type="button"
                onClick={() => setIsMethodologyOpen(true)}
                style={styles.footerLinkBtn}
              >
                Methodology & Limitations
              </button>
              <a
                href="https://arxiv.org/abs/2412.04292"
                target="_blank"
                rel="noreferrer"
                style={styles.footerExternalLink}
              >
                ArXiv Technical Report ↗
              </a>
            </div>
          </div>
        </footer>

        {/* Fullscreen / High-Resolution Image Inspection Modal */}
        <ImageModal
          isOpen={!!inspectImage}
          onClose={() => setInspectImage(null)}
          initialTitle={inspectImage?.title}
          initialSrc={inspectImage?.src}
          result={result}
        />

        {/* Methodology & Limitations Explanatory Modal */}
        <MethodologyModal
          isOpen={isMethodologyOpen}
          onClose={() => setIsMethodologyOpen(false)}
        />
      </div>
    </>
  );
}

const styles = {
  appContainer: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#080D1B',
    color: '#F1F5F9',
  },
  main: {
    flex: 1,
    padding: '1.5rem 1rem 3rem 1rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  resultsWrapper: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  footer: {
    width: '100%',
    backgroundColor: '#080D1B',
    borderTop: '1px solid #273449',
    padding: '1.5rem 1rem',
  },
  footerContainer: {
    maxWidth: '1240px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '1rem',
  },
  footerBrand: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.2rem',
    fontSize: '0.85rem',
  },
  footerMuted: {
    fontSize: '0.75rem',
    color: '#64748B',
  },
  footerLinks: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    flexWrap: 'wrap',
  },
  footerLinkBtn: {
    background: 'none',
    color: '#94A3B8',
    fontSize: '0.8rem',
    cursor: 'pointer',
    padding: 0,
  },
  footerExternalLink: {
    color: '#38BDF8',
    fontSize: '0.8rem',
    textDecoration: 'none',
  },
};
