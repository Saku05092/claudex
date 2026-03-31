import type { GeneratedContent } from "../core/types.js";
import {
  generatePostImage,
  savePostImage,
} from "../core/image-generator.js";
import { randomUUID } from "crypto";

interface InstagramConfig {
  readonly accessToken: string;
  readonly businessAccountId: string;
}

const GRAPH_API_BASE = "https://graph.facebook.com/v21.0";

export function createInstagramClient(config: InstagramConfig) {
  async function postWithImage(
    content: GeneratedContent,
    imageUrl: string
  ): Promise<string> {
    // Step 1: Create media container
    const containerId = await createMediaContainer(imageUrl, content);

    // Step 2: Publish the container
    return publishMedia(containerId);
  }

  async function postCarousel(
    contents: readonly GeneratedContent[],
    imageUrls: readonly string[]
  ): Promise<string> {
    // Step 1: Create individual media items
    const childIds: string[] = [];
    for (let i = 0; i < imageUrls.length; i++) {
      const id = await createMediaContainer(
        imageUrls[i],
        contents[i],
        true
      );
      childIds.push(id);
    }

    // Step 2: Create carousel container
    const carouselResponse = await fetch(
      `${GRAPH_API_BASE}/${config.businessAccountId}/media`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          media_type: "CAROUSEL",
          children: childIds.join(","),
          caption: formatCaption(contents[0]),
          access_token: config.accessToken,
        }),
      }
    );

    if (!carouselResponse.ok) {
      throw new Error(`Instagram API error: ${carouselResponse.status} ${await carouselResponse.text()}`);
    }

    const carouselData = await carouselResponse.json();

    // Step 3: Publish
    return publishMedia(carouselData.id);
  }

  async function generateAndPost(
    content: GeneratedContent
  ): Promise<string> {
    // Generate image from text content
    const imageBuffer = await generatePostImage({
      text: content.text,
      category: content.category,
    });

    const filename = `ig_${randomUUID()}.png`;
    const localPath = await savePostImage(imageBuffer, filename);

    // Note: Instagram API requires a publicly accessible URL
    // In production, upload to a CDN first
    // For now, return the local path for preview
    return localPath;
  }

  return { postWithImage, postCarousel, generateAndPost };
}

async function createMediaContainer(
  imageUrl: string,
  content: GeneratedContent,
  isCarouselItem: boolean = false
): Promise<string> {
  const body: Record<string, string> = {
    image_url: imageUrl,
    is_carousel_item: String(isCarouselItem),
  };

  if (!isCarouselItem) {
    body.caption = formatCaption(content);
  }

  // Note: access_token would be added from config in real implementation
  const response = await fetch(
    `${GRAPH_API_BASE}/me/media?${new URLSearchParams(body)}`,
    { method: "POST" }
  );

  if (!response.ok) {
    throw new Error(`Instagram API error: ${response.status} ${await response.text()}`);
  }

  const data = await response.json();
  return data.id;
}

async function publishMedia(containerId: string): Promise<string> {
  const response = await fetch(
    `${GRAPH_API_BASE}/me/media_publish?creation_id=${containerId}`,
    { method: "POST" }
  );

  if (!response.ok) {
    throw new Error(`Instagram API error: ${response.status} ${await response.text()}`);
  }

  const data = await response.json();
  return data.id;
}

function formatCaption(content: GeneratedContent): string {
  const parts: string[] = [content.text];

  // Instagram: links in captions are not clickable
  // Direct users to link in bio
  if (content.referralLink) {
    parts.push("\n\nDetails: link in bio");
  }

  parts.push(`\n\n${content.disclaimer}`);

  if (content.hashtags.length > 0) {
    parts.push(`\n\n${content.hashtags.join(" ")}`);
  }

  return parts.join("");
}
