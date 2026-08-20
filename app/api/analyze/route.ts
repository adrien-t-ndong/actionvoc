import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const maxDuration = 60;

const ALLOWED_MIME_TYPES = [
  "audio/mpeg",
  "audio/mp4",
  "audio/wav",
  "audio/webm",
  "audio/ogg",
  "audio/x-m4a",
  "audio/m4a",
  "video/mp4",
  "audio/mp3",
];

const ALLOWED_EXTENSIONS = ["mp3", "mp4", "mpeg", "mpga", "m4a", "wav", "webm", "ogg"];

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

const systemPrompt = `You are an expert meeting analyst.
Analyze this meeting transcript and return ONLY a valid JSON object (no markdown, no backticks) with this exact structure:
{
  "summary": "2-3 sentence summary of the meeting",
  "decisions": ["Decision 1", "Decision 2", "Decision 3"],
  "tasks": [
    {
      "title": "Task description",
      "owner_name": "First Last or team name",
      "due_date": "YYYY-MM-DD or null",
      "priority": "high|medium|low"
    }
  ]
}
Rules:
- summary: clear, concise, past tense. Write each sentence on its own line separated by \n. Use relevant emojis at the start of each sentence to make it more readable. For example:
  🎯 for objectives/goals
  ✅ for decisions made
  👥 for team/people related content
  📅 for dates/deadlines
  💡 for ideas
  ⚠️ for risks or blockers
  📊 for metrics/numbers
- decisions: 2-5 key decisions made, as strings
- tasks: all action items mentioned, with realistic due dates (7-14 days from today if not specified)
- owner_name: extract from context, use "Team" if unclear
- Return ONLY the JSON, nothing else`;

export async function POST(request: NextRequest) {
  const supabaseAdmin = getSupabaseAdmin();
  try {
    console.log("[analyze] POST received");

    const formData = await request.formData();
    const audioFile = formData.get("audio") as File | null;
    const title = formData.get("title") as string | null;
    const userId = formData.get("userId") as string | null;
    const durationStr = formData.get("duration") as string | null;

    console.log("[analyze] formData parsed", {
      hasAudio: !!audioFile,
      audioName: audioFile?.name,
      audioType: audioFile?.type,
      audioSize: audioFile?.size,
      userId,
      title,
      duration: durationStr,
    });

    if (!audioFile || !userId) {
      return NextResponse.json({ error: "Missing audio or userId" }, { status: 400 });
    }

    // Validation taille
    if (audioFile.size === 0) {
      console.error("[analyze] File is 0 bytes");
      return NextResponse.json({ error: "Audio file is empty (0 bytes)." }, { status: 400 });
    }

    const MAX_SIZE = 25 * 1024 * 1024;
    if (audioFile.size > MAX_SIZE) {
      console.error("[analyze] File too large:", audioFile.size);
      return NextResponse.json(
        { error: `File too large (${(audioFile.size / 1024 / 1024).toFixed(1)} MB). Whisper limit is 25 MB.` },
        { status: 400 }
      );
    }

    // Validation format
    const fileName = audioFile.name || "audio.webm";
    const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
    const mimeType = audioFile.type || "audio/webm";
    const validExt = ALLOWED_EXTENSIONS.includes(ext);
    const validMime = ALLOWED_MIME_TYPES.some((t) => mimeType.startsWith(t));

    console.log("[analyze] file validation", { fileName, ext, mimeType, validExt, validMime });

    if (!validExt && !validMime) {
      return NextResponse.json(
        { error: `Unsupported format "${ext || mimeType}". Use mp3, mp4, m4a, wav, webm, or ogg.` },
        { status: 400 }
      );
    }

    const whisperExt = validExt ? ext : "webm";
    const whisperFileName = `audio.${whisperExt}`;

    // Check plan limit
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("plan, meetings_count")
      .eq("id", userId)
      .single();

    if (profile?.plan === "free" && (profile?.meetings_count || 0) >= 3) {
      return NextResponse.json({ error: "upgrade_required" }, { status: 403 });
    }

    // Lecture buffer en mémoire — pas d'upload Storage
    console.log("[analyze] reading arrayBuffer...");
    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    console.log("[analyze] buffer ready, byteLength:", buffer.byteLength);

    // Whisper — appel fetch natif Node (évite l'incompatibilité node-fetch / Node 24)
    console.log("[analyze] sending to Whisper via native fetch:", { whisperFileName, mimeType, byteLength: buffer.byteLength });

    let transcript = "";
    try {
      const whisperForm = new FormData();
      whisperForm.append("file", new Blob([buffer], { type: mimeType }), whisperFileName);
      whisperForm.append("model", "whisper-1");
      whisperForm.append("response_format", "text");

      const whisperRes = await fetch("https://api.openai.com/v1/audio/transcriptions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: whisperForm,
      });

      console.log("[analyze] Whisper HTTP status:", whisperRes.status);

      if (!whisperRes.ok) {
        const errText = await whisperRes.text();
        console.error("[analyze] Whisper error response:", errText);
        throw new Error(`Whisper API error ${whisperRes.status}: ${errText}`);
      }

      transcript = await whisperRes.text();
      console.log("[analyze] Whisper OK, transcript length:", transcript.length, "| preview:", transcript.slice(0, 100));
    } catch (whisperError) {
      console.error("[analyze] Whisper fetch error:", whisperError);
      throw whisperError;
    }

    // GPT-4o — appel fetch natif (même raison que Whisper : incompatibilité node-fetch / Node 24)
    console.log("[analyze] sending to GPT-4o via native fetch...");
    const gptRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `Meeting transcript:\n\n${transcript}\n\nToday's date: ${new Date().toISOString().split("T")[0]}`,
          },
        ],
        temperature: 0.3,
        response_format: { type: "json_object" },
      }),
    });

    console.log("[analyze] GPT-4o HTTP status:", gptRes.status);

    if (!gptRes.ok) {
      const errText = await gptRes.text();
      console.error("[analyze] GPT-4o error response:", errText);
      throw new Error(`GPT-4o API error ${gptRes.status}: ${errText}`);
    }

    const gptData = await gptRes.json();
    const rawJson = gptData.choices?.[0]?.message?.content || "{}";
    console.log("[analyze] GPT-4o OK, raw response length:", rawJson.length);

    let analysisResult: {
      summary: string;
      decisions: string[];
      tasks: Array<{
        title: string;
        owner_name: string;
        due_date: string | null;
        priority: "high" | "medium" | "low";
      }>;
    };

    try {
      analysisResult = JSON.parse(rawJson);
      console.log("[analyze] JSON parsed OK:", {
        summary: analysisResult.summary?.slice(0, 60),
        decisions: analysisResult.decisions?.length,
        tasks: analysisResult.tasks?.length,
      });
    } catch {
      console.warn("[analyze] JSON parse failed, trying regex extraction");
      const match = rawJson.match(/\{[\s\S]*\}/);
      try {
        analysisResult = match ? JSON.parse(match[0]) : { summary: "", decisions: [], tasks: [] };
      } catch {
        console.error("[analyze] JSON extraction also failed, using raw text as summary");
        analysisResult = { summary: rawJson.slice(0, 500), decisions: [], tasks: [] };
      }
    }

    // Type de réunion
    const contentLower = (transcript + " " + (title || "")).toLowerCase();
    let meetingType: "internal" | "client" | "sales" = "internal";
    if (contentLower.includes("client") || contentLower.includes("customer")) meetingType = "client";
    else if (contentLower.includes("sales") || contentLower.includes("deal") || contentLower.includes("revenue")) meetingType = "sales";

    // Insertion meeting
    console.log("[analyze] inserting meeting into DB...");
    const { data: meetingData, error: meetingError } = await supabaseAdmin
      .from("meetings")
      .insert({
        user_id: userId,
        title: title || null,
        type: meetingType,
        duration_seconds: durationStr ? parseInt(durationStr) : null,
        summary: analysisResult.summary || null,
        decisions: analysisResult.decisions || [],
        transcript: transcript || null,
      })
      .select()
      .single();

    if (meetingError || !meetingData) {
      console.error("[analyze] DB insert meeting error:", meetingError?.message);
      throw new Error("Failed to save meeting: " + meetingError?.message);
    }
    console.log("[analyze] meeting inserted:", meetingData.id);

    if (analysisResult.tasks?.length > 0) {
      console.log("[analyze] inserting", analysisResult.tasks.length, "actions...");
      await supabaseAdmin.from("actions").insert(
        analysisResult.tasks.map((task) => ({
          meeting_id: meetingData.id,
          user_id: userId,
          title: task.title,
          owner_name: task.owner_name || null,
          due_date: task.due_date || null,
          priority: task.priority || "medium",
          status: "open",
        }))
      );
      console.log("[analyze] actions inserted");
    }

    await supabaseAdmin
      .from("profiles")
      .update({ meetings_count: (profile?.meetings_count || 0) + 1 })
      .eq("id", userId);

    console.log("[analyze] done, meetingId:", meetingData.id);
    return NextResponse.json({ meetingId: meetingData.id });

  } catch (error) {
    console.error("[analyze] FATAL:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Analysis failed" },
      { status: 500 }
    );
  }
}
