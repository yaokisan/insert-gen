export interface ImageIdea {
  id: string;
  title: string; // Japanese title for display
  prompt: string; // Editable English prompt for generation, refined by AI
  imageUrl: string | null;
  isRefiningPrompt: boolean;
  isGeneratingImage: boolean;
  error: string | null;
  aspectRatio: AspectRatio;
}

export enum AppState {
  Idle,
  LoadingInitialIdeas,
  IdeasLoaded,
  GeneratingAllImages,
  AllImagesGenerated,
}

export interface AspectRatio {
  label: string;
  value: string;
  width: number;
  height: number;
  description: string;
}

export const ASPECT_RATIOS: AspectRatio[] = [
  {
    label: "YouTubeサムネイル",
    value: "16:9",
    width: 1920,
    height: 1080,
    description: "横長（1920×1080）"
  },
  {
    label: "正方形",
    value: "1:1",
    width: 1024,
    height: 1024,
    description: "正方形（1024×1024）"
  },
  {
    label: "写真（3:2）",
    value: "3:2",
    width: 1536,
    height: 1024,
    description: "横長（1536×1024）"
  }
];
