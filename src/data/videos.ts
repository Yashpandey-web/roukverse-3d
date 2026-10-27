// Video configuration for ROUKVERSE.
// IMPORTANT — do not invent channel data:
// - No subscriber counts, view counts, or video titles are claimed here.
// - To add a real video, put its YouTube video ID in `videos` below.
//   Example: { id: "dQw4w9WgXcQ", category: "Parkour", note: "Verified channel video" }
// - Entries with `sample: true` are placeholders for layout only and are
//   labelled as such in the UI. They are NOT claimed to be ROUKMARCO Y videos.
export const CHANNEL_URL = 'https://youtube.com/@roukmarcoy_07'
export const SUBSCRIBE_URL = 'https://www.youtube.com/@roukmarcoy_07?sub_confirmation=1'

export type VideoCategory = 'Parkour' | 'Challenges' | 'Survival' | 'Shorts'
export type VideoItem = {
  id: string
  category: VideoCategory
  sample: boolean
  note: string
}

// Add real IDs here. Until then the gallery shows the channel link and
// clearly-marked layout placeholders — no fake titles or stats.
export const videos: VideoItem[] = [
  { id: '', category: 'Parkour', sample: true, note: 'Sample layout card — add a real video ID in src/data/videos.ts' },
  { id: '', category: 'Challenges', sample: true, note: 'Sample layout card — add a real video ID in src/data/videos.ts' },
  { id: '', category: 'Survival', sample: true, note: 'Sample layout card — add a real video ID in src/data/videos.ts' },
  { id: '', category: 'Shorts', sample: true, note: 'Sample layout card — add a real video ID in src/data/videos.ts' },
]

export function youtubeEmbedUrl(id: string) {
  return `https://www.youtube.com/embed/${id}`
}
export function youtubeWatchUrl(id: string) {
  return `https://www.youtube.com/watch?v=${id}`
}
