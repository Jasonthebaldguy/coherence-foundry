"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

interface Document {
  id: string;
  filename: string;
  media_type: string;
  file_size: number;
  doc_type: string;
  include_in_context: boolean;
  description: string | null;
  uploaded_at: string;
}

interface DocumentUploadProps {
  clientId?: string;
  projectId?: string;
  documents: Document[];
}

const DOC_TYPES = [
  { value: "brand_asset", label: "Brand Asset" },
  { value: "mockup", label: "Mockup" },
  { value: "content", label: "Content" },
  { value: "contract", label: "Contract" },
  { value: "report", label: "Report" },
  { value: "reference", label: "Reference" },
  { value: "general", label: "General" },
];

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DocumentUpload({
  clientId,
  projectId,
  documents,
}: DocumentUploadProps) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [docType, setDocType] = useState("general");
  const [includeInContext, setIncludeInContext] = useState(false);
  const [description, setDescription] = useState("");
  const [showUpload, setShowUpload] = useState(false);

  async function handleUpload() {
    const file = fileRef.current?.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    if (clientId) formData.append("client_id", clientId);
    if (projectId) formData.append("project_id", projectId);
    formData.append("doc_type", docType);
    formData.append("include_in_context", String(includeInContext));
    if (description) formData.append("description", description);

    try {
      console.log("[DOC UPLOAD] Starting upload...", { clientId, projectId, docType, includeInContext });
      const res = await fetch("/api/documents", {
        method: "POST",
        body: formData,
      });

      console.log("[DOC UPLOAD] Response status:", res.status, res.statusText);
      const text = await res.text();
      console.log("[DOC UPLOAD] Response body:", text);

      let data;
      try {
        data = JSON.parse(text);
      } catch {
        alert(`Upload returned non-JSON: ${text.slice(0, 200)}`);
        return;
      }

      if (!res.ok) {
        alert(`Upload failed (${res.status}): ${data.error || JSON.stringify(data)}`);
      } else {
        setShowUpload(false);
        setDescription("");
        setDocType("general");
        setIncludeInContext(false);
        if (fileRef.current) fileRef.current.value = "";
        router.refresh();
      }
    } catch (err) {
      alert(`Upload failed: ${err instanceof Error ? err.message : "unknown error"}`);
    } finally {
      setUploading(false);
    }
  }

  async function toggleContext(docId: string, current: boolean) {
    await fetch("/api/documents", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        documentId: docId,
        includeInContext: !current,
      }),
    });
    router.refresh();
  }

  async function deleteDoc(docId: string) {
    if (!confirm("Delete this document?")) return;
    await fetch("/api/documents", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ documentId: docId }),
    });
    router.refresh();
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Documents</h3>
        <button
          onClick={() => setShowUpload(!showUpload)}
          className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
        >
          {showUpload ? "Cancel" : "+ Upload"}
        </button>
      </div>

      {showUpload && (
        <div className="mb-4 p-4 bg-gray-50 rounded-lg space-y-3">
          <input
            ref={fileRef}
            type="file"
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Type
              </label>
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
                className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
              >
                {DOC_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Description (optional)
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Client's brand guidelines"
                className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={includeInContext}
              onChange={(e) => setIncludeInContext(e.target.checked)}
              className="rounded border-gray-300"
            />
            <span className="text-gray-700">
              Include in AI context
            </span>
            <span className="text-xs text-gray-400">
              — AI consulting sessions will reference this document
            </span>
          </label>

          <button
            onClick={handleUpload}
            disabled={uploading}
            className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
          >
            {uploading ? "Uploading..." : "Upload"}
          </button>
        </div>
      )}

      {documents.length === 0 ? (
        <p className="text-sm text-gray-500">No documents uploaded yet.</p>
      ) : (
        <div className="space-y-2">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900 truncate">
                    {doc.filename}
                  </span>
                  <span className="text-xs px-2 py-0.5 bg-gray-200 text-gray-600 rounded">
                    {doc.doc_type}
                  </span>
                  {doc.include_in_context && (
                    <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded">
                      AI Context
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  {formatFileSize(doc.file_size)} &middot;{" "}
                  {new Date(doc.uploaded_at).toLocaleDateString()}
                  {doc.description && ` — ${doc.description}`}
                </div>
              </div>

              <div className="flex items-center gap-2 ml-3">
                <button
                  onClick={() => toggleContext(doc.id, doc.include_in_context)}
                  className={`text-xs px-2 py-1 rounded ${
                    doc.include_in_context
                      ? "bg-purple-100 text-purple-700 hover:bg-purple-200"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                  title={
                    doc.include_in_context
                      ? "Remove from AI context"
                      : "Add to AI context"
                  }
                >
                  {doc.include_in_context ? "🧠 On" : "🧠 Off"}
                </button>
                <button
                  onClick={() => deleteDoc(doc.id)}
                  className="text-xs text-red-600 hover:text-red-800"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
