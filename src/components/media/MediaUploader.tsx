"use client";

import React, { useState, useRef } from "react";
import {
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  X,
  Star,
  RefreshCw,
  Loader2,
  Image as ImageIcon,
} from "lucide-react";
import { compressImage, MediaKind } from "@/lib/media/compress";
import SafeImage from "@/components/ui/SafeImage";

export interface UploadedMediaItem {
  id: string;
  url: string;
  variants?: any;
  blurData?: string;
  isCover: boolean;
  sortOrder: number;
  width?: number;
  height?: number;
  bytes?: number;
}

interface FileUploadQueueItem {
  id: string; // client temporary ID
  file: File;
  previewUrl: string;
  kind: MediaKind;
  status: "QUEUED" | "COMPRESSING" | "GETTING_URL" | "UPLOADING" | "PROCESSING" | "DONE" | "ERROR";
  progress: number; // 0 - 100
  errorMessage?: string;
  mediaId?: string;
  serverUrl?: string;
  variants?: any;
  blurData?: string;
}

interface MediaUploaderProps {
  propertyId?: string;
  roomId?: string;
  ticketId?: string;
  kind?: MediaKind;
  maxFiles?: number;
  existingMedia?: UploadedMediaItem[];
  onMediaChange?: (items: UploadedMediaItem[]) => void;
  allowedTypes?: string[];
}

export default function MediaUploader({
  propertyId,
  roomId,
  ticketId,
  kind = "PHOTO",
  maxFiles = 30,
  existingMedia = [],
  onMediaChange,
  allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"],
}: MediaUploaderProps) {
  const [items, setItems] = useState<UploadedMediaItem[]>(existingMedia);
  const [queue, setQueue] = useState<FileUploadQueueItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const notifyChange = (updated: UploadedMediaItem[]) => {
    setItems(updated);
    if (onMediaChange) onMediaChange(updated);
  };

  const handleFilesSelected = (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const availableSlots = maxFiles - (items.length + queue.filter((q) => q.status !== "ERROR").length);

    if (availableSlots <= 0) {
      alert(`Maximum file limit reached (${maxFiles} photos allowed)`);
      return;
    }

    const validFiles = fileArray.slice(0, availableSlots).filter((file) => {
      // 1. Raw byte limit check (15 MB)
      if (file.size > 15 * 1024 * 1024) {
        alert(`${file.name} exceeds 15 MB raw file size limit`);
        return false;
      }
      return true;
    });

    const newQueueItems: FileUploadQueueItem[] = validFiles.map((file) => ({
      id: `queue-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      file,
      previewUrl: URL.createObjectURL(file), // Step 2: Instant local preview
      kind,
      status: "QUEUED",
      progress: 0,
    }));

    setQueue((prev) => [...prev, ...newQueueItems]);

    // Kick off background upload for each item independently
    newQueueItems.forEach((qItem) => processUploadQueueItem(qItem));
  };

  const updateQueueItem = (id: string, patch: Partial<FileUploadQueueItem>) => {
    setQueue((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  const processUploadQueueItem = async (qItem: FileUploadQueueItem) => {
    try {
      // Step 3: Client compression (Web Worker)
      updateQueueItem(qItem.id, { status: "COMPRESSING", progress: 15 });
      const compressedFile = await compressImage(qItem.file, qItem.kind);

      // Step 4: Request presigned upload URL from App API
      updateQueueItem(qItem.id, { status: "GETTING_URL", progress: 35 });
      const urlRes = await fetch("/api/media/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          purpose: qItem.kind === "PHOTO" ? "PROPERTY_PHOTO" : qItem.kind,
          fileType: compressedFile.type || "image/webp",
          size: compressedFile.size,
          propertyId,
          roomId,
          ticketId,
          isCover: items.length === 0,
          sortOrder: items.length,
        }),
      });

      const urlData = await urlRes.json();
      if (!urlRes.ok) {
        throw new Error(urlData.error || "Failed to generate presigned upload URL");
      }

      // If deduplication matched an existing identical file
      if (urlData.isDuplicate && urlData.media) {
        updateQueueItem(qItem.id, { status: "DONE", progress: 100, mediaId: urlData.media.id });
        const newItem: UploadedMediaItem = {
          id: urlData.media.id,
          url: urlData.media.url,
          variants: urlData.media.variants,
          blurData: urlData.media.blurData,
          isCover: urlData.media.isCover,
          sortOrder: urlData.media.sortOrder,
        };
        notifyChange([...items, newItem]);
        return;
      }

      // Step 5: Direct upload to storage (PUT)
      updateQueueItem(qItem.id, { status: "UPLOADING", progress: 60, mediaId: urlData.mediaId });

      const uploadRes = await fetch(urlData.uploadUrl, {
        method: urlData.method || "PUT",
        headers: {
          "Content-Type": compressedFile.type || "image/webp",
          ...(urlData.headers || {}),
        },
        body: compressedFile,
      });

      if (!uploadRes.ok) {
        throw new Error("Direct storage upload failed. Please check network connection.");
      }

      // Step 6: Confirm upload & trigger server processing worker
      updateQueueItem(qItem.id, { status: "PROCESSING", progress: 85 });
      const completeRes = await fetch(`/api/media/${urlData.mediaId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const completeData = await completeRes.json();
      if (!completeRes.ok) {
        throw new Error(completeData.error || "Server image worker validation failed");
      }

      // Step 7: Completed successfully
      updateQueueItem(qItem.id, {
        status: "DONE",
        progress: 100,
        serverUrl: completeData.media.url,
        variants: completeData.variants,
        blurData: completeData.blurData,
      });

      const finalizedItem: UploadedMediaItem = {
        id: completeData.media.id,
        url: completeData.media.url,
        variants: completeData.variants,
        blurData: completeData.blurData,
        isCover: completeData.media.isCover,
        sortOrder: completeData.media.sortOrder,
      };

      setItems((prev) => {
        const next = [...prev, finalizedItem];
        if (onMediaChange) onMediaChange(next);
        return next;
      });
    } catch (err: any) {
      console.error("Queue item upload failed:", err);
      updateQueueItem(qItem.id, {
        status: "ERROR",
        errorMessage: err.message || "Upload failed",
      });
    }
  };

  const handleRetryItem = (qItem: FileUploadQueueItem) => {
    updateQueueItem(qItem.id, { status: "QUEUED", progress: 0, errorMessage: undefined });
    processUploadQueueItem(qItem);
  };

  const handleRemoveQueueItem = (id: string) => {
    setQueue((prev) => prev.filter((item) => item.id !== id));
  };

  const handleRemoveExistingItem = (id: string) => {
    const updated = items.filter((item) => item.id !== id);
    notifyChange(updated);
  };

  const handleSetCover = (id: string) => {
    const updated = items.map((item) => ({
      ...item,
      isCover: item.id === id,
    }));
    notifyChange(updated);
  };

  return (
    <div className="space-y-4">
      {/* Upload Dropzone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          if (e.dataTransfer.files) handleFilesSelected(e.dataTransfer.files);
        }}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
          isDragging
            ? "border-blue-600 bg-blue-50/60"
            : "border-slate-300 hover:border-slate-400 bg-slate-50/50 hover:bg-slate-50"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={allowedTypes.join(",")}
          className="hidden"
          onChange={(e) => {
            if (e.target.files) handleFilesSelected(e.target.files);
          }}
        />

        <div className="flex flex-col items-center justify-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-blue-100/80 text-blue-600 flex items-center justify-center shadow-xs">
            <UploadCloud className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-800">
              Drag &amp; drop photos here, or <span className="text-blue-600 underline">browse files</span>
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              JPEG, PNG, WebP or iPhone HEIC (up to 15 MB raw each)
            </p>
          </div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-slate-200/70 text-[10px] font-semibold text-slate-600">
            <span>Client &amp; Server Double WebP Compressor</span>
            <span>•</span>
            <span>Direct S3 Upload</span>
          </div>
        </div>
      </div>

      {/* Upload Queue Progress Cards */}
      {queue.some((q) => q.status !== "DONE") && (
        <div className="space-y-2">
          <span className="text-xs font-bold text-slate-700">Uploading in background:</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {queue
              .filter((q) => q.status !== "DONE")
              .map((q) => (
                <div
                  key={q.id}
                  className="p-2.5 rounded-xl border border-slate-200 bg-white shadow-xs flex items-center gap-3 text-xs"
                >
                  <img
                    src={q.previewUrl}
                    alt="Upload thumbnail"
                    className="w-12 h-12 object-cover rounded-lg bg-slate-100 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-800 truncate text-[11px]">
                        {q.file.name}
                      </span>
                      {q.status === "ERROR" ? (
                        <button
                          type="button"
                          onClick={() => handleRetryItem(q)}
                          className="text-[10px] text-rose-600 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <RefreshCw className="w-3 h-3" /> Retry
                        </button>
                      ) : (
                        <span className="text-[10px] font-semibold text-slate-400">
                          {q.progress}%
                        </span>
                      )}
                    </div>

                    {/* Progress bar */}
                    <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1.5 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          q.status === "ERROR"
                            ? "bg-rose-500"
                            : q.status === "PROCESSING"
                            ? "bg-amber-500 animate-pulse"
                            : "bg-blue-600"
                        }`}
                        style={{ width: `${q.progress}%` }}
                      />
                    </div>

                    <p className="text-[10px] text-slate-500 mt-1 truncate">
                      {q.status === "COMPRESSING" && "Shrinking photo locally..."}
                      {q.status === "GETTING_URL" && "Allocating direct S3 key..."}
                      {q.status === "UPLOADING" && "Uploading directly to storage..."}
                      {q.status === "PROCESSING" && "Worker: Stripping EXIF & creating WebP variants..."}
                      {q.status === "ERROR" && (q.errorMessage || "Upload failed")}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveQueueItem(q.id)}
                    className="p-1 rounded-md text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Gallery of Uploaded Photos with Cover Selection & Remove */}
      {items.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
            <span>
              Uploaded Gallery ({items.length} / {maxFiles} photos)
            </span>
            <span className="text-slate-400 font-normal text-[11px]">
              Click star to set cover photo
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {items.map((item, idx) => (
              <div
                key={item.id}
                className="group relative rounded-xl overflow-hidden border border-slate-200 bg-white aspect-[4/3] shadow-xs"
              >
                <SafeImage
                  src={item.url}
                  variants={item.variants}
                  blurData={item.blurData}
                  alt={`Photo ${idx + 1}`}
                  fill
                  className="group-hover:scale-105 transition-transform duration-300"
                />

                {/* Cover badge */}
                {item.isCover && (
                  <div className="absolute top-1.5 left-1.5 bg-blue-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs flex items-center gap-0.5">
                    <Star className="w-2.5 h-2.5 fill-white" />
                    <span>Cover</span>
                  </div>
                )}

                {/* Hover overlay with Actions */}
                <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                  {!item.isCover && (
                    <button
                      type="button"
                      onClick={() => handleSetCover(item.id)}
                      title="Set as Cover Photo"
                      className="p-1.5 rounded-lg bg-white/90 text-slate-800 hover:bg-white transition-colors cursor-pointer"
                    >
                      <Star className="w-3.5 h-3.5 text-amber-500" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemoveExistingItem(item.id)}
                    title="Remove Photo"
                    className="p-1.5 rounded-lg bg-rose-600 text-white hover:bg-rose-700 transition-colors cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
