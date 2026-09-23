import * as ImagePicker from "expo-image-picker";
import { Alert } from "react-native";
import { supabase, supabaseConfigured } from "./supabase";

export type EvidenceItem = {
  id: string;
  mediaType: "photo" | "video";
  localUri: string;
  mimeType: string | null;
  fileName: string | null;
  fileSize: number | null;
  durationSeconds: number | null;
  width: number | null;
  height: number | null;
  storagePath: string | null;
  locationOnMedia: boolean;
};

export const MAX_PHOTOS = 5;
export const MAX_VIDEO = 1;
export const MAX_VIDEO_SECONDS = 30;

export function canAddPhoto(items: EvidenceItem[]): boolean {
  const hasVideo = items.some((i) => i.mediaType === "video");
  const photos = items.filter((i) => i.mediaType === "photo").length;
  return !hasVideo && photos < MAX_PHOTOS;
}

export function canAddVideo(items: EvidenceItem[]): boolean {
  return items.length === 0;
}

function makeId(): string {
  return `ev_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

async function ensureMediaPermission(
  kind: "library" | "camera"
): Promise<boolean> {
  if (kind === "library") {
    const { status } =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission needed",
        "Allow photo library access to add evidence."
      );
      return false;
    }
    return true;
  }
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== "granted") {
    Alert.alert("Permission needed", "Allow camera access to take a photo.");
    return false;
  }
  return true;
}

function assetToEvidence(
  asset: ImagePicker.ImagePickerAsset,
  mediaType: "photo" | "video",
  locationOnMedia: boolean
): EvidenceItem | null {
  if (mediaType === "video") {
    const duration = asset.duration != null ? asset.duration / 1000 : null;
    if (duration != null && duration > MAX_VIDEO_SECONDS) {
      Alert.alert(
        "Video too long",
        `Please use a video of ${MAX_VIDEO_SECONDS} seconds or less.`
      );
      return null;
    }
  }
  return {
    id: makeId(),
    mediaType,
    localUri: asset.uri,
    mimeType: asset.mimeType ?? null,
    fileName: asset.fileName ?? null,
    fileSize: asset.fileSize ?? null,
    durationSeconds:
      asset.duration != null ? asset.duration / 1000 : null,
    width: asset.width ?? null,
    height: asset.height ?? null,
    storagePath: null,
    locationOnMedia,
  };
}

export async function pickFromGallery(
  items: EvidenceItem[],
  locationOnMedia: boolean
): Promise<EvidenceItem | null> {
  if (!(await ensureMediaPermission("library"))) return null;

  const prefersVideo = canAddVideo(items) && !canAddPhoto(items);
  const mediaTypes: ImagePicker.MediaType[] =
    canAddVideo(items) && canAddPhoto(items)
      ? ["images", "videos"]
      : prefersVideo
        ? ["videos"]
        : ["images"];

  if (!canAddPhoto(items) && !canAddVideo(items)) {
    Alert.alert(
      "Limit reached",
      `You can add up to ${MAX_PHOTOS} photos or 1 video (max ${MAX_VIDEO_SECONDS}s).`
    );
    return null;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes,
    quality: 0.85,
    videoMaxDuration: MAX_VIDEO_SECONDS,
    allowsMultipleSelection: false,
  });

  if (result.canceled || !result.assets?.[0]) return null;
  const asset = result.assets[0];
  const isVideo =
    asset.type === "video" ||
    (asset.mimeType?.startsWith("video") ?? false);
  if (isVideo) {
    if (!canAddVideo(items)) {
      Alert.alert(
        "Cannot add video",
        "Remove existing media first. Max 1 video, or up to 5 photos."
      );
      return null;
    }
    return assetToEvidence(asset, "video", locationOnMedia);
  }
  if (!canAddPhoto(items)) {
    Alert.alert("Photo limit", `You can add up to ${MAX_PHOTOS} photos.`);
    return null;
  }
  return assetToEvidence(asset, "photo", locationOnMedia);
}

export async function takePhoto(
  items: EvidenceItem[],
  locationOnMedia: boolean
): Promise<EvidenceItem | null> {
  if (!canAddPhoto(items)) {
    Alert.alert(
      "Cannot add photo",
      items.some((i) => i.mediaType === "video")
        ? "Remove the video first, or skip photos."
        : `You can add up to ${MAX_PHOTOS} photos.`
    );
    return null;
  }
  if (!(await ensureMediaPermission("camera"))) return null;

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ["images"],
    quality: 0.85,
  });
  if (result.canceled || !result.assets?.[0]) return null;
  return assetToEvidence(result.assets[0], "photo", locationOnMedia);
}

export async function recordVideo(
  items: EvidenceItem[],
  locationOnMedia: boolean
): Promise<EvidenceItem | null> {
  if (!canAddVideo(items)) {
    Alert.alert(
      "Cannot add video",
      "Remove existing media first. Max 1 video (30s), or up to 5 photos."
    );
    return null;
  }
  if (!(await ensureMediaPermission("camera"))) return null;

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ["videos"],
    videoMaxDuration: MAX_VIDEO_SECONDS,
    quality: 0.8,
  });
  if (result.canceled || !result.assets?.[0]) return null;
  return assetToEvidence(result.assets[0], "video", locationOnMedia);
}

/**
 * Upload to private Supabase Storage bucket `report-evidence`.
 * Requires bucket created manually. Returns storage path or null.
 */
export async function uploadEvidenceToStorage(
  item: EvidenceItem,
  draftKey: string
): Promise<string | null> {
  if (!supabaseConfigured || !supabase) return null;

  const ext =
    item.mediaType === "video"
      ? "mp4"
      : item.fileName?.split(".").pop() || "jpg";
  const path = `${draftKey}/${item.id}.${ext}`;

  try {
    const response = await fetch(item.localUri);
    const blob = await response.blob();
    const { error } = await supabase.storage
      .from("report-evidence")
      .upload(path, blob, {
        contentType: item.mimeType ?? undefined,
        upsert: true,
      });
    if (error) return null;
    return path;
  } catch {
    return null;
  }
}
