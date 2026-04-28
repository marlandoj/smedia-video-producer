#!/usr/bin/env bun
import { fal } from "@fal-ai/client";
import { parseArgs } from "util";
import { writeFile, readFile, mkdir } from "fs/promises";
import { basename, join, dirname } from "path";

fal.config({ credentials: process.env.FAL_KEY! });

const IMAGE_MODELS: Record<string, string> = {
  "nano-banana-2": "fal-ai/nano-banana-2",
  "nano-banana-pro": "fal-ai/nano-banana-pro",
  "gpt-image-2": "fal-ai/gpt-image-2",
  "flux-schnell": "fal-ai/flux/schnell",
  "flux-dev": "fal-ai/flux/dev",
  "flux-pro": "fal-ai/flux-pro/v1.1",
  "flux-ultra": "fal-ai/flux-pro/v1.1-ultra",
  "flux-2-flex": "fal-ai/flux-2-flex",
  "flux-2-pro": "fal-ai/flux-2-pro",
  "qwen-image": "fal-ai/qwen-image",
  "qwen-image-2": "fal-ai/qwen-image-2/text-to-image",
  "qwen-image-2-pro": "fal-ai/qwen-image-2/pro/text-to-image",
  "seedream": "fal-ai/bytedance/seedream/v4",
  "seedream-4.5": "fal-ai/bytedance/seedream/v4.5",
  "recraft-v3": "fal-ai/recraft-v3",
};

const EDIT_MODELS: Record<string, string> = {
  "nano-banana-2": "fal-ai/nano-banana-2/edit",
  "nano-banana-pro": "fal-ai/nano-banana-pro/edit",
  "gpt-image-2": "fal-ai/gpt-image-2/edit",
  "flux-kontext": "fal-ai/flux-pro/kontext",
  "flux-kontext-dev": "fal-ai/flux-kontext-lora",
  "flux-2-pro": "fal-ai/flux-2-pro/edit",
  "qwen-image-2": "fal-ai/qwen-image-2/pro/edit",
  "qwen-image-2-pro": "fal-ai/qwen-image-2/pro/edit",
  "seedream": "fal-ai/bytedance/seedream/v4/edit",
  "firered": "fal-ai/firered-image-edit-v1.1",
};

const VIDEO_MODELS: Record<string, string> = {
  "kling-v3-pro": "fal-ai/kling-video/v3/pro/image-to-video",
  "kling-v3-std": "fal-ai/kling-video/v3/standard/image-to-video",
  "kling-o3": "fal-ai/kling-video/o3/standard/image-to-video",
  "veo3.1": "fal-ai/veo3.1/image-to-video",
  "veo3.1-fast": "fal-ai/veo3.1/fast/image-to-video",
  "veo3.1-ref": "fal-ai/veo3.1/reference-to-video",
  "wan-2.2": "fal-ai/wan/v2.2-a14b/image-to-video/lora",
  "ltx-2-19b": "fal-ai/ltx-2-19b/image-to-video",
  "ltx-2.3": "fal-ai/ltx-2.3/image-to-video",
  "ltx-2.3-fast": "fal-ai/ltx-2.3/image-to-video/fast",
  "cosmos": "fal-ai/cosmos-predict-2.5/image-to-video",
};

const T2V_MODELS: Record<string, string> = {
  "veo3.1": "fal-ai/veo3.1",
  "veo3.1-fast": "fal-ai/veo3.1/fast",
  "ltx-2.3": "fal-ai/ltx-2.3/text-to-video",
  "ltx-2.3-fast": "fal-ai/ltx-2.3/text-to-video/fast",
  "wan-2.2": "fal-ai/wan/v2.2-a14b/text-to-video",
  "cosmos": "fal-ai/cosmos-predict-2.5/text-to-video",
};

async function uploadFile(filePath: string): Promise<string> {
  const data = await readFile(filePath);
  const ext = filePath.split(".").pop() || "png";
  const mimeMap: Record<string, string> = {
    png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg",
    webp: "image/webp", gif: "image/gif", mp4: "video/mp4",
    mov: "video/quicktime", svg: "image/svg+xml",
  };
  const file = new File([data], basename(filePath), { type: mimeMap[ext] || "application/octet-stream" });
  const url = await fal.storage.upload(file);
  return url;
}

async function downloadFile(url: string, outputPath: string): Promise<void> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, buf);
}

function printHelp() {
  console.log(`
fal-media — Generate images and video via fal.ai API

Usage:
  bun fal-media.ts <command> [options]

Commands:
  generate    Text-to-image generation
  edit        Edit an existing image
  video       Image-to-video generation
  t2v         Text-to-video generation
  models      List available models
  upload      Upload a file to fal storage (returns URL)

Generate Options:
  --prompt <text>         Required. Image description
  --model <name>          Model alias (default: nano-banana-2)
  --output <path>         Output file path (default: ./output.png)
  --width <n>             Image width (default: 1024)
  --height <n>            Image height (default: 1024)
  --aspect-ratio <r>      Aspect ratio (e.g. 16:9, 9:16, 1:1)
  --num-images <n>        Number of images (default: 1)
  --seed <n>              Random seed
  --quality <tier>        Quality tier: low|medium|high (gpt-image-2 only)

Edit Options:
  --prompt <text>         Required. Edit instruction
  --image <path|url>      Required. Source image
  --model <name>          Model alias (default: nano-banana-2)
  --output <path>         Output file path (default: ./edited.png)
  --quality <tier>        Quality tier: low|medium|high (gpt-image-2 only)

Video Options:
  --prompt <text>         Required. Video description
  --image <path|url>      Required. Source image
  --model <name>          Model alias (default: kling-v3-std)
  --output <path>         Output file path (default: ./output.mp4)
  --duration <n>          Duration in seconds (model-dependent)
  --aspect-ratio <r>      Aspect ratio

T2V Options:
  --prompt <text>         Required. Video description
  --model <name>          Model alias (default: veo3.1-fast)
  --output <path>         Output file path (default: ./output.mp4)
  --duration <n>          Duration in seconds
  --aspect-ratio <r>      Aspect ratio

Upload Options:
  --file <path>           Required. File to upload
`);
}

async function resolveImageUrl(pathOrUrl: string): Promise<string> {
  if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) return pathOrUrl;
  return await uploadFile(pathOrUrl);
}

async function cmdGenerate(args: string[]) {
  const { values } = parseArgs({
    args,
    options: {
      prompt: { type: "string" },
      model: { type: "string", default: "nano-banana-2" },
      output: { type: "string", default: "./output.png" },
      width: { type: "string", default: "1024" },
      height: { type: "string", default: "1024" },
      "aspect-ratio": { type: "string" },
      "num-images": { type: "string", default: "1" },
      seed: { type: "string" },
      quality: { type: "string" },
    },
    strict: true,
  });
  if (!values.prompt) { console.error("Error: --prompt is required"); process.exit(1); }

  const modelId = IMAGE_MODELS[values.model!];
  if (!modelId) { console.error(`Unknown model: ${values.model}. Run 'models' to see options.`); process.exit(1); }

  const input: Record<string, any> = {
    prompt: values.prompt,
    image_size: { width: parseInt(values.width!), height: parseInt(values.height!) },
    num_images: parseInt(values["num-images"]!),
  };
  if (values["aspect-ratio"]) {
    input.aspect_ratio = values["aspect-ratio"];
    delete input.image_size;
  }
  if (values.seed) input.seed = parseInt(values.seed);
  if (values.quality) input.quality = values.quality;

  console.log(`Generating with ${values.model} (${modelId})...`);
  const result = await fal.subscribe(modelId, {
    input,
    logs: true,
    onQueueUpdate: (u) => { if (u.status === "IN_PROGRESS") process.stderr.write("."); },
  }) as any;

  const images = result.data?.images || result.images || [];
  if (images.length === 0) { console.error("No images returned"); console.log(JSON.stringify(result, null, 2)); process.exit(1); }

  for (let i = 0; i < images.length; i++) {
    const outPath = images.length === 1 ? values.output! : values.output!.replace(/(\.\w+)$/, `_${i + 1}$1`);
    await downloadFile(images[i].url, outPath);
    console.log(`\nSaved: ${outPath}`);
  }
}

async function cmdEdit(args: string[]) {
  const { values } = parseArgs({
    args,
    options: {
      prompt: { type: "string" },
      image: { type: "string" },
      model: { type: "string", default: "nano-banana-2" },
      output: { type: "string", default: "./edited.png" },
      quality: { type: "string" },
    },
    strict: true,
  });
  if (!values.prompt || !values.image) { console.error("Error: --prompt and --image are required"); process.exit(1); }

  const modelId = EDIT_MODELS[values.model!];
  if (!modelId) { console.error(`Unknown edit model: ${values.model}. Run 'models' to see options.`); process.exit(1); }

  const imageUrl = await resolveImageUrl(values.image!);

  const input: Record<string, any> = { prompt: values.prompt, image_url: imageUrl };
  if (values.quality) input.quality = values.quality;

  console.log(`Editing with ${values.model} (${modelId})...`);
  const result = await fal.subscribe(modelId, {
    input,
    logs: true,
    onQueueUpdate: (u) => { if (u.status === "IN_PROGRESS") process.stderr.write("."); },
  }) as any;

  const images = result.data?.images || result.images || [];
  if (images.length === 0) { console.error("No images returned"); console.log(JSON.stringify(result, null, 2)); process.exit(1); }

  await downloadFile(images[0].url, values.output!);
  console.log(`\nSaved: ${values.output}`);
}

async function cmdVideo(args: string[]) {
  const { values } = parseArgs({
    args,
    options: {
      prompt: { type: "string" },
      image: { type: "string" },
      model: { type: "string", default: "kling-v3-std" },
      output: { type: "string", default: "./output.mp4" },
      duration: { type: "string" },
      "aspect-ratio": { type: "string" },
    },
    strict: true,
  });
  if (!values.prompt || !values.image) { console.error("Error: --prompt and --image are required"); process.exit(1); }

  const modelId = VIDEO_MODELS[values.model!];
  if (!modelId) { console.error(`Unknown video model: ${values.model}. Run 'models' to see options.`); process.exit(1); }

  const imageUrl = await resolveImageUrl(values.image!);

  const input: Record<string, any> = { prompt: values.prompt, image_url: imageUrl };
  if (values.duration) input.duration = parseInt(values.duration);
  if (values["aspect-ratio"]) input.aspect_ratio = values["aspect-ratio"];

  console.log(`Generating video with ${values.model} (${modelId})...`);
  const result = await fal.subscribe(modelId, {
    input,
    logs: true,
    onQueueUpdate: (u) => { if (u.status === "IN_PROGRESS") process.stderr.write("."); },
  }) as any;

  const videoUrl = result.data?.video?.url || result.video?.url;
  if (!videoUrl) { console.error("No video returned"); console.log(JSON.stringify(result, null, 2)); process.exit(1); }

  await downloadFile(videoUrl, values.output!);
  console.log(`\nSaved: ${values.output}`);
}

async function cmdT2V(args: string[]) {
  const { values } = parseArgs({
    args,
    options: {
      prompt: { type: "string" },
      model: { type: "string", default: "veo3.1-fast" },
      output: { type: "string", default: "./output.mp4" },
      duration: { type: "string" },
      "aspect-ratio": { type: "string" },
    },
    strict: true,
  });
  if (!values.prompt) { console.error("Error: --prompt is required"); process.exit(1); }

  const modelId = T2V_MODELS[values.model!];
  if (!modelId) { console.error(`Unknown t2v model: ${values.model}. Run 'models' to see options.`); process.exit(1); }

  const input: Record<string, any> = { prompt: values.prompt };
  if (values.duration) input.duration = parseInt(values.duration);
  if (values["aspect-ratio"]) input.aspect_ratio = values["aspect-ratio"];

  console.log(`Generating video with ${values.model} (${modelId})...`);
  const result = await fal.subscribe(modelId, {
    input,
    logs: true,
    onQueueUpdate: (u) => { if (u.status === "IN_PROGRESS") process.stderr.write("."); },
  }) as any;

  const videoUrl = result.data?.video?.url || result.video?.url;
  if (!videoUrl) { console.error("No video returned"); console.log(JSON.stringify(result, null, 2)); process.exit(1); }

  await downloadFile(videoUrl, values.output!);
  console.log(`\nSaved: ${values.output}`);
}

async function cmdUpload(args: string[]) {
  const { values } = parseArgs({
    args,
    options: { file: { type: "string" } },
    strict: true,
  });
  if (!values.file) { console.error("Error: --file is required"); process.exit(1); }
  const url = await uploadFile(values.file);
  console.log(url);
}

function cmdModels() {
  console.log("\n=== Text-to-Image Models ===");
  for (const [alias, id] of Object.entries(IMAGE_MODELS)) console.log(`  ${alias.padEnd(20)} → ${id}`);
  console.log("\n=== Image Edit Models ===");
  for (const [alias, id] of Object.entries(EDIT_MODELS)) console.log(`  ${alias.padEnd(20)} → ${id}`);
  console.log("\n=== Image-to-Video Models ===");
  for (const [alias, id] of Object.entries(VIDEO_MODELS)) console.log(`  ${alias.padEnd(20)} → ${id}`);
  console.log("\n=== Text-to-Video Models ===");
  for (const [alias, id] of Object.entries(T2V_MODELS)) console.log(`  ${alias.padEnd(20)} → ${id}`);
}

const [cmd, ...rest] = process.argv.slice(2);
switch (cmd) {
  case "generate": await cmdGenerate(rest); break;
  case "edit": await cmdEdit(rest); break;
  case "video": await cmdVideo(rest); break;
  case "t2v": await cmdT2V(rest); break;
  case "models": cmdModels(); break;
  case "upload": await cmdUpload(rest); break;
  case "--help": case "-h": case undefined: printHelp(); break;
  default: console.error(`Unknown command: ${cmd}`); printHelp(); process.exit(1);
}
