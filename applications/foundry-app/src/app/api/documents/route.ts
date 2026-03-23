import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const clientId = formData.get("client_id") as string | null;
  const projectId = formData.get("project_id") as string | null;
  const docType = (formData.get("doc_type") as string) || "general";
  const includeInContext = formData.get("include_in_context") === "true";
  const description = formData.get("description") as string | null;
  const relevantSessionTypesRaw = formData.get("relevant_session_types") as string | null;
  const relevantSessionTypes: string[] = relevantSessionTypesRaw
    ? JSON.parse(relevantSessionTypesRaw)
    : [];
  const contextPriority = parseInt(formData.get("context_priority") as string) || 50;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (!clientId && !projectId) {
    return NextResponse.json(
      { error: "Must specify client_id or project_id" },
      { status: 400 }
    );
  }

  // Upload to Supabase Storage
  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storagePath = `${clientId || projectId}/${timestamp}-${safeName}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = new Uint8Array(arrayBuffer);

  const { error: uploadError } = await supabase.storage
    .from("documents")
    .upload(storagePath, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    return NextResponse.json(
      { error: `Upload failed: ${uploadError.message}` },
      { status: 500 }
    );
  }

  // Extract text for context (basic extraction for text-based files)
  let extractedText: string | null = null;

  if (includeInContext) {
    const textTypes = [
      "text/plain",
      "text/csv",
      "text/markdown",
      "text/html",
      "application/json",
    ];

    // Also check file extension — browsers often report .md, .txt, .csv as octet-stream
    const textExtensions = [".txt", ".md", ".markdown", ".csv", ".json", ".html", ".htm", ".xml", ".yaml", ".yml", ".toml", ".ini", ".cfg", ".log", ".rtf"];
    const ext = file.name.toLowerCase().substring(file.name.lastIndexOf("."));
    const isTextFile = textTypes.includes(file.type) || textExtensions.includes(ext);

    if (isTextFile) {
      extractedText = await file.text();
    } else if (file.type === "application/pdf") {
      extractedText = `[PDF document: ${file.name} — text extraction not yet implemented. Upload as .txt for full context.]`;
    } else {
      extractedText = `[Binary file: ${file.name} (${file.type}) — cannot extract text. Upload as .txt for full context.]`;
    }
  }

  // Insert document record
  const { data, error: dbError } = await supabase
    .from("documents")
    .insert({
      client_id: clientId,
      project_id: projectId,
      uploaded_by: user.id,
      filename: file.name,
      storage_path: storagePath,
      media_type: file.type,
      file_size: file.size,
      doc_type: docType,
      include_in_context: includeInContext,
      extracted_text: extractedText,
      description,
      relevant_session_types: relevantSessionTypes,
      context_priority: contextPriority,
    })
    .select()
    .single();

  if (dbError) {
    return NextResponse.json(
      { error: `Database error: ${dbError.message}` },
      { status: 500 }
    );
  }

  return NextResponse.json({ document: data });
}

// Toggle context inclusion
export async function PATCH(request: NextRequest) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { documentId, includeInContext, relevantSessionTypes, contextPriority } = await request.json();

  if (!documentId) {
    return NextResponse.json({ error: "Missing documentId" }, { status: 400 });
  }

  // If turning on context, try to extract text if not already done
  let extractedText: string | null = null;

  if (includeInContext) {
    const { data: doc } = await supabase
      .from("documents")
      .select("extracted_text, storage_path, media_type, filename")
      .eq("id", documentId)
      .single();

    if (doc && !doc.extracted_text) {
      const textTypes = [
        "text/plain",
        "text/csv",
        "text/markdown",
        "text/html",
        "application/json",
      ];

      if (textTypes.includes(doc.media_type)) {
        // Download and extract text
        const { data: fileData } = await supabase.storage
          .from("documents")
          .download(doc.storage_path);

        if (fileData) {
          extractedText = await fileData.text();
        }
      } else {
        extractedText = `[${doc.media_type} file: ${doc.filename} — cannot extract text automatically]`;
      }
    }
  }

  const updateData: Record<string, unknown> = {
    include_in_context: includeInContext,
  };
  if (extractedText) {
    updateData.extracted_text = extractedText;
  }
  if (relevantSessionTypes !== undefined) {
    updateData.relevant_session_types = relevantSessionTypes;
  }
  if (contextPriority !== undefined) {
    updateData.context_priority = contextPriority;
  }

  const { error } = await supabase
    .from("documents")
    .update(updateData)
    .eq("id", documentId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

// Delete a document
export async function DELETE(request: NextRequest) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { documentId } = await request.json();

  // Get storage path before deleting record
  const { data: doc } = await supabase
    .from("documents")
    .select("storage_path")
    .eq("id", documentId)
    .single();

  if (doc) {
    await supabase.storage.from("documents").remove([doc.storage_path]);
  }

  const { error } = await supabase
    .from("documents")
    .delete()
    .eq("id", documentId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
