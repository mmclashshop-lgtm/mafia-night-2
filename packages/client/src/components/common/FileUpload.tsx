import { useRef, useState } from 'react';
import { Upload, Link, X } from 'lucide-react';

interface FileUploadProps {
  value: string;
  onChange: (url: string) => void;
  accept?: string;
  placeholder?: string;
}

export function FileUpload({ value, onChange, accept = 'image/*,.mp3,.wav,.ogg', placeholder = 'https://...' }: FileUploadProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 10 * 1024 * 1024) {
      alert('File too large (max 10MB)');
      return;
    }
    setUploading(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(f);
      await new Promise<void>((resolve, reject) => {
        reader.onload = () => resolve();
        reader.onerror = () => reject();
      });
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(',')[1];
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file: base64, name: f.name }),
      });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      if (data.success) {
        onChange(data.url);
      }
    } catch {
      alert('Upload failed');
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div className="flex items-stretch gap-2">
      <div className="flex-1 relative">
        <input
          className="w-full bg-white/[0.03] border border-white/10 rounded-lg pl-3 pr-8 py-2 text-sm text-white outline-none focus:border-[#8B0000]/40 font-mono text-xs"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        {value && (
          <button
            onClick={() => onChange('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-red-400"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      <label className={`btn-secondary text-xs flex items-center gap-1.5 cursor-pointer px-3 py-2 ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
        <Upload className="w-3.5 h-3.5" />
        {uploading ? '...' : 'Upload'}
        <input ref={fileRef} type="file" accept={accept} className="hidden" onChange={handleFile} disabled={uploading} />
      </label>
    </div>
  );
}
