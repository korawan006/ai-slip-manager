import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { uploadSlip } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import Card from '../components/Card';
import { UploadCloud, CheckCircle2, FileImage, ShieldCheck, AlertTriangle } from 'lucide-react';

export default function UploadSlip() {
  const { user } = useAuth();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [duplicateError, setDuplicateError] = useState(false);

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setResult(null);
      setDuplicateError(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    maxFiles: 1
  });

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    const toastId = toast.loading('Extracting data with AI...');
    
    try {
      const res = await uploadSlip(file, user.id);
      if (res.success) {
        setResult(res.data);
        toast.success('Saved to Supabase & Google Sheets!', { id: toastId });
      }
    } catch (error) {
      console.error(error);
      if (error.status === 409) {
        setDuplicateError(true);
        setFile(null);
        toast.error('Duplicate slip detected!', { id: toastId });
      } else {
        toast.error('Failed to extract slip data.', { id: toastId });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-2">Upload Slip</h1>
        <p className="text-gray-400">Drag and drop a Thai bank transfer slip to extract data automatically.</p>
      </div>

      <div 
        {...getRootProps()} 
        className={`glass rounded-3xl p-12 text-center cursor-pointer border-2 border-dashed transition-all duration-300 ${
          isDragActive ? 'border-primary bg-primary/10 neon-border' : 'border-white/10 hover:border-primary/50 hover:bg-card/80'
        }`}
      >
        <input {...getInputProps()} />
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center">
            <UploadCloud className={`w-10 h-10 ${isDragActive ? 'text-primary neon-text' : 'text-primary'}`} />
          </div>
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">
          {isDragActive ? 'Drop slip here' : 'Select or drop slip image'}
        </h3>
        <p className="text-gray-400 text-sm">Supports PNG, JPG, JPEG</p>
      </div>

      {duplicateError && (
        <div className="relative overflow-hidden rounded-2xl border border-red-500/30 bg-red-500/10 backdrop-blur-sm p-5 animate-[fadeIn_0.3s_ease-out]">
          <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 via-red-500/10 to-red-500/5 animate-pulse" />
          <div className="relative flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center ring-2 ring-red-500/30 animate-[pulse_2s_ease-in-out_infinite]">
              <AlertTriangle className="w-6 h-6 text-red-400" />
            </div>
            <div className="flex-1">
              <h4 className="text-red-400 font-bold text-lg mb-1">Duplicate Slip Detected</h4>
              <p className="text-red-300/80 text-sm leading-relaxed">
                This transaction has already been registered. Please upload a different slip.
              </p>
            </div>
            <button
              onClick={() => setDuplicateError(false)}
              className="flex-shrink-0 text-red-400/60 hover:text-red-300 transition-colors text-xl leading-none mt-1"
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {file && (
        <Card className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/5 rounded-xl">
              <FileImage className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-white font-medium">{file.name}</p>
              <p className="text-xs text-gray-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
          </div>
          <button
            onClick={handleUpload}
            disabled={loading}
            className="px-6 py-2.5 bg-primary hover:bg-primary-hover text-white font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_theme('colors.primary.DEFAULT')]"
          >
            {loading ? 'Processing...' : 'Upload & Extract'}
          </button>
        </Card>
      )}

      {result && (
        <Card>
          <div className="flex items-center gap-3 mb-6">
            <ShieldCheck className="w-6 h-6 text-green-400" />
            <h3 className="text-lg font-bold text-white">Extracted Information</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-background rounded-xl p-4 border border-white/5">
              <p className="text-xs text-gray-500 mb-1">Amount</p>
              <p className="text-xl font-bold text-white">฿{result.amount}</p>
            </div>
            <div className="bg-background rounded-xl p-4 border border-white/5">
              <p className="text-xs text-gray-500 mb-1">Date</p>
              <p className="text-lg font-medium text-white">{result.date} {result.time}</p>
            </div>
            <div className="bg-background rounded-xl p-4 border border-white/5">
              <p className="text-xs text-gray-500 mb-1">Sender Name</p>
              <p className="text-lg font-medium text-white">{result.senderName || 'N/A'}</p>
            </div>
            <div className="bg-background rounded-xl p-4 border border-white/5">
              <p className="text-xs text-gray-500 mb-1">Sender Bank</p>
              <p className="text-lg font-medium text-white">{result.senderBank || 'N/A'}</p>
            </div>
            <div className="bg-background rounded-xl p-4 border border-white/5">
              <p className="text-xs text-gray-500 mb-1">Receiver Bank</p>
              <p className="text-lg font-medium text-white">{result.receiverBank || 'N/A'}</p>
            </div>
            <div className="bg-background rounded-xl p-4 border border-white/5">
              <p className="text-xs text-gray-500 mb-1">Reference No.</p>
              <p className="text-lg font-medium text-white font-mono break-all">{result.referenceNo || 'N/A'}</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
