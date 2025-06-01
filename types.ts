
export interface ImageIdea {
  id: string;
  title: string; // Japanese title for display
  prompt: string; // Editable English prompt for generation, refined by AI
  imageUrl: string | null;
  isRefiningPrompt: boolean;
  isGeneratingImage: boolean;
  error: string | null;
}

export enum AppState {
  Idle,
  LoadingInitialIdeas,
  IdeasLoaded,
  GeneratingAllImages,
  AllImagesGenerated,
}
