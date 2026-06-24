import type { MediaDto, MediaType, PlaceDto, PlaceSocialDto, PostDto } from "types/domain";

export type RouteMediaKind = "annotation" | "photo" | "video" | "audio" | "gif";

export type RouteMediaEntry = {
  id: string;
  placeId: string;
  kind: RouteMediaKind;
  label: string;
  title: string;
  subtitle?: string;
  previewUrl?: string;
  icon: string;
};

const mediaKind: Record<MediaType, RouteMediaKind> = {
  Photo: "photo",
  Video: "video",
  Audio: "audio",
  Gif: "gif"
};

const mediaLabel: Record<MediaType, string> = {
  Photo: "Foto",
  Video: "Vídeo",
  Audio: "Áudio",
  Gif: "GIF"
};

const mediaIcon: Record<MediaType, string> = {
  Photo: "photo_camera",
  Video: "videocam",
  Audio: "mic",
  Gif: "gif_box"
};

function isDiscussionPost(post: PostDto) {
  const title = post.title?.toLowerCase() ?? "";
  const message = post.message?.toLowerCase() ?? "";
  return title.startsWith("comentários:") || message === "discussão aberta pela comunidade.";
}

function mediaEntry(media: MediaDto, post?: PostDto): RouteMediaEntry {
  const kind = mediaKind[media.type];
  return {
    id: media.id,
    placeId: post?.placeId ?? "",
    kind,
    label: mediaLabel[media.type],
    title: media.name,
    subtitle: post?.message?.trim() || undefined,
    previewUrl: media.type === "Audio" ? undefined : media.url,
    icon: mediaIcon[media.type]
  };
}

function annotationEntry(post: PostDto): RouteMediaEntry | null {
  const message = post.message?.trim();
  const title = post.title?.trim();
  if (!message && !title) return null;
  if (isDiscussionPost(post)) return null;

  return {
    id: `note-${post.id}`,
    placeId: post.placeId,
    kind: "annotation",
    label: "Anotação",
    title: title || "Anotação",
    subtitle: message || undefined,
    icon: "sticky_note_2"
  };
}

export function buildRouteMediaEntries(place: PlaceDto, social: PlaceSocialDto | null): RouteMediaEntry[] {
  if (!social) return [];

  const mediaById = new Map(social.media.map((item) => [item.id, item]));
  const entries: RouteMediaEntry[] = [];
  const seenMedia = new Set<string>();

  for (const post of social.posts) {
    const linkedMedia = post.mediaIds
      .map((id) => mediaById.get(id))
      .filter((item): item is MediaDto => Boolean(item));

    if (!linkedMedia.length) {
      const note = annotationEntry(post);
      if (note) entries.push(note);
      continue;
    }

    linkedMedia.forEach((item) => {
      if (seenMedia.has(item.id)) return;
      seenMedia.add(item.id);
      entries.push({ ...mediaEntry(item, post), placeId: place.id });
    });
  }

  social.media.forEach((item) => {
    if (seenMedia.has(item.id)) return;
    seenMedia.add(item.id);
    entries.push({ ...mediaEntry(item), placeId: place.id });
  });

  return entries;
}
