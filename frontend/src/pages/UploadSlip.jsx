import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { uploadSlips } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import Card from '../components/Card';
import { UploadCloud, CheckCircle2, FileImage, ShieldCheck, AlertTriangle, XCircle, X, Copy } from 'lucide-react';

export default function UploadSlip() {
  const { user } = useAuth();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const onDrop = useCallback((acceptedFiles) => {
    setFiles((prev) => {
      const combined = [...prev, ...acceptedFiles];
      if (combined.length > 5) {
        toast.error(`Maximum 5 files allowed. Only the first 5 will be kept.`);
      }
      return combined.slice(0, 5);
    });
    setResult(null);
  }, []);

  const onDropRejected = useCallback(() => {
    toast.error('Some files were rejected. Only image files are accepted (max 5).');
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDropRejected,
    accept: { 'image/*': [] },
    maxFiles: 5
  });

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setLoading(true);
    setResult(null);
    const toastId = toast.loading(`Processing ${files.length} slip${files.length > 1 ? 's' : ''} with AI...`);

    try {
      const res = await uploadSlips(files, user.id);
      if (res.success) {
        setResult(res);
        setFiles([]);

        const parts = [];
        if (res.successful.length > 0) parts.push(`${res.successful.length} saved`);
        if (res.duplicates.length > 0) parts.push(`${res.duplicates.length} duplicate${res.duplicates.length > 1 ? 's' : ''}`);
        if (res.errors.length > 0) parts.push(`${res.errors.length} failed`);

        if (res.errors.length > 0 || res.duplicates.length > 0) {
          toast.error(parts.join(' · '), { id: toastId });
        } else {
          toast.success(parts.join(' · '), { id: toastId });
        }
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to process slips.', { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-2">Upload Slips</h1>
        <p className="text-gray-400">Drag and drop up to 5 Thai bank transfer slips to extract data automatically.</p>
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
          {isDragActive ? 'Drop slips here' : 'Select or drop slip images'}
        </h3>
        <p className="text-gray-400 text-sm">Supports PNG, JPG, JPEG · Up to 5 files</p>
      </div>

      {/* Selected files list */}
      {files.length > 0 && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Copy className="w-5 h-5 text-primary" />
              <h3 className="text-white font-semibold">{files.length} file{files.length > 1 ? 's' : ''} selected</h3>
            </div>
            <button
              onClick={handleUpload}
              disabled={loading}
              className="px-6 py-2.5 bg-primary hover:bg-primary-hover text-white font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_theme('colors.primary.DEFAULT')]"
            >
              {loading ? 'Processing...' : `Upload & Extract (${files.length})`}
            </button>
          </div>
          <div className="space-y-2">
            {files.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="flex items-center justify-between bg-background rounded-xl p-3 border border-white/5"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/5 rounded-lg">
                    <FileImage className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
                {!loading && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(index);
                    }}
                    className="text-gray-500 hover:text-red-400 transition-colors p-1"
                    aria-label={`Remove ${file.name}`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Batch results */}
      {result && (
        <div className="space-y-6">
          {/* Successful */}
          {result.successful.length > 0 && (
            <Card>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center ring-2 ring-green-500/30">
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{result.successful.length} Successful</h3>
                  <p className="text-xs text-gray-400">Saved to database</p>
                </div>
              </div>
              <div className="space-y-4">
                {result.successful.map((item, i) => (
                  <div key={i} className="bg-background rounded-xl p-4 border border-green-500/10">
                    <p className="text-sm font-medium text-green-400 mb-3 flex items-center gap-2">
                      <FileImage className="w-4 h-4" />
                      {item.fileName}
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      <div>
                        <p className="text-xs text-gray-500 mb-0.5">Amount</p>
                        <p className="text-white font-bold">฿{item.data.amount}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-0.5">Date</p>
                        <p className="text-white text-sm">{item.data.date} {item.data.time}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-0.5">Sender</p>
                        <p className="text-white text-sm">{item.data.senderName || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-0.5">Sender Bank</p>
                        <p className="text-white text-sm">{item.data.senderBank || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-0.5">Receiver Bank</p>
                        <p className="text-white text-sm">{item.data.receiverBank || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-0.5">Reference No.</p>
                        <p className="text-white text-sm font-mono break-all">{item.data.referenceNo || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Duplicates */}
          {result.duplicates.length > 0 && (
            <div className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-amber-500/10 backdrop-blur-sm p-5">
              <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-amber-500/10 to-amber-500/5 animate-pulse" />
              <div className="relative">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-amber-500/20 rounded-full flex items-center justify-center ring-2 ring-amber-500/30">
                    <AlertTriangle className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-amber-300">{result.duplicates.length} Duplicate{result.duplicates.length > 1 ? 's' : ''}</h3>
                    <p className="text-xs text-amber-400/70">Already registered — skipped</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {result.duplicates.map((item, i) => (
                    <div key={i} className="flex items-center gap-3 bg-amber-500/5 rounded-xl p-3 border border-amber-500/10">
                      <FileImage className="w-4 h-4 text-amber-400 flex-shrink-0" />
                      <div>
                        <p className="text-amber-200 text-sm font-medium">{item.fileName}</p>
                        <p className="text-amber-400/60 text-xs">{item.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Errors */}
          {result.errors.length > 0 && (
            <div className="relative overflow-hidden rounded-2xl border border-red-500/30 bg-red-500/10 backdrop-blur-sm p-5">
              <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 via-red-500/10 to-red-500/5 animate-pulse" />
              <div className="relative">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center ring-2 ring-red-500/30">
                    <XCircle className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-red-300">{result.errors.length} Failed</h3>
                    <p className="text-xs text-red-400/70">Could not be processed</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {result.errors.map((item, i) => (
                    <div key={i} className="flex items-center gap-3 bg-red-500/5 rounded-xl p-3 border border-red-500/10">
                      <FileImage className="w-4 h-4 text-red-400 flex-shrink-0" />
                      <div>
                        <p className="text-red-200 text-sm font-medium">{item.fileName}</p>
                        <p className="text-red-400/60 text-xs">{item.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
