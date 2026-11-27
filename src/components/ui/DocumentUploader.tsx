"use client";

import React, { useState, useRef } from "react";
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  ExternalLink,
} from "lucide-react";

interface DocumentUploaderProps {
  label?: string;
  helperText?: string;
  value?: string;
  onChange: (url: string) => void;
  purpose?: "KYC" | "PROPERTY_DOCUMENT" | "AGREEMENT" | "GENERAL";
  accept?: string;
  required?: boolean;
}

export default function DocumentUploader({
  label,
  helperText = "PDF, JPG, PNG or WebP up to 15MB",
  value,
  onChange,
  purpose = "KYC",
  accept = ".pdf,image/png,image/jpeg,image/webp,image/heic",
  required = false,
}: DocumentUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    setError(null);
    setIsUploading(true);
    setFileName(file.name);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("purpose", purpose);

      const res = await fetch("/api/media/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to upload file");
      }

      onChange(data.url);
    } catch (err: any) {
      console.error("Document upload error:", err);
      setError(err.message || "Failed to upload document");
      setFileName(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUpload(e.dataTransfer.files[0]);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    setFileName(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleUpload(e.target.files[0]);
          }
        }}
      />

      {value ? (
        /* Uploaded state pill / card */
        <div className="flex items-center justify-between p-3 rounded-xl border border-emerald-200 bg-emerald-50/70 text-emerald-900 transition-all">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold truncate max-w-[200px] sm:max-w-xs">
                  {fileName || "Document Uploaded ✓"}
                </span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              </div>
              <a
                href={value}
                target="_blank"
                rel="noreferrer"
                className="text-[10px] text-emerald-700 hover:text-emerald-900 hover:underline flex items-center gap-1 mt-0.5"
              >
                <span>View Document</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="text-[11px] font-bold text-emerald-800 hover:text-emerald-950 px-2 py-1 bg-white border border-emerald-200 rounded-lg shadow-xs hover:bg-emerald-50 cursor-pointer"
            >
              Replace
            </button>
            <button
              type="button"
              onClick={handleRemove}
              className="p-1 rounded-lg text-rose-500 hover:bg-rose-50 hover:text-rose-700 cursor-pointer"
              title="Remove document"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        /* Dropzone / Upload box */
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => !isUploading && inputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
            isDragging
              ? "border-blue-500 bg-blue-50/50"
              : "border-slate-200 hover:border-blue-400 bg-slate-50/70 hover:bg-slate-50"
          }`}
        >
          {isUploading ? (
            <div className="py-2 flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              <div className="text-xs font-semibold text-slate-700">
                Uploading {fileName}...
              </div>
              <div className="text-[10px] text-slate-400">Please wait a moment</div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-1.5 py-1">
              <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                <UploadCloud className="w-5 h-5" />
              </div>
              <div className="text-xs text-slate-700 font-medium">
                <span className="font-bold text-blue-600 hover:underline">Click to upload</span> or drag and drop
              </div>
              <p className="text-[11px] text-slate-400">{helperText}</p>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-1.5 text-rose-600 text-[11px] pt-1">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
