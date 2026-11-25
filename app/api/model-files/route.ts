import {
  getHuggingFaceModelFiles,
  isValidHuggingFaceModelId,
} from "@/lib/model-sources/huggingface";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const modelId = searchParams.get("model");
  const cursor = searchParams.get("cursor");

  if (!modelId || !isValidHuggingFaceModelId(modelId)) {
    return Response.json(
      { error: "A valid Hugging Face model ID is required." },
      { status: 400 },
    );
  }
  if (cursor && (cursor.length > 4096 || /[\u0000-\u001f]/.test(cursor))) {
    return Response.json(
      { error: "The requested file cursor is invalid." },
      { status: 400 },
    );
  }

  try {
    return Response.json(await getHuggingFaceModelFiles(modelId, cursor));
  } catch (error) {
    console.error("Hugging Face model files request failed.", {
      modelId,
      cause: error,
    });

    const message =
      error instanceof Error ? error.message : "The Hub request failed.";
    const upstreamStatus = message.match(/returned (\d{3})\./)?.[1];
    if (upstreamStatus === "404") {
      return Response.json(
        { error: "This model repository could not be found." },
        { status: 404 },
      );
    }
    if (upstreamStatus === "401" || upstreamStatus === "403") {
      return Response.json(
        { error: "The repository files are private or gated." },
        { status: 403 },
      );
    }

    return Response.json(
      { error: "Repository files could not be loaded. Please try again." },
      { status: 502 },
    );
  }
}
