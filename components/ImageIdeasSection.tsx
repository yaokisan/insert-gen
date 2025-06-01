
import React, { useState } from 'react';
import type { ImageIdea } from '../types';
import { AppState } from '../types';
import ImageIdeaCard from './ImageIdeaCard';
import Spinner from './Spinner';
import JSZip from 'jszip'; // Import JSZip

interface ImageIdeasSectionProps {
  ideas: ImageIdea[];
  onPromptChange: (id: string, newPrompt: string) => void;
  onRefinePrompt: (id: string, currentPrompt: string, userInstruction: string) => void;
  onGenerateAllImages: () => void;
  onGenerateSingleImage: (id: string) => void; // New prop
  appState: AppState;
  overallError: string | null;
}

const ImageIdeasSection: React.FC<ImageIdeasSectionProps> = ({
  ideas,
  onPromptChange,
  onRefinePrompt,
  onGenerateAllImages,
  onGenerateSingleImage, // New prop
  appState,
  overallError
}) => {
  const [isZipping, setIsZipping] = useState(false);
  const [zipError, setZipError] = useState<string | null>(null);

  if (ideas.length === 0 && appState !== AppState.LoadingInitialIdeas) {
    return null;
  }

  const generatedImages = ideas.filter(idea => idea.imageUrl);
  const canGenerateAll = appState !== AppState.GeneratingAllImages && !ideas.some(i => i.isRefiningPrompt || !i.prompt.trim() || i.isGeneratingImage);
  const canDownloadZip = generatedImages.length > 0 && !isZipping && appState !== AppState.GeneratingAllImages;

  const sanitizeFilename = (filename: string) => {
    return filename.replace(/[\\/:*?"<>|#%&{}]/g, '').replace(/\s+/g, '_');
  };

  const handleDownloadAllAsZip = async () => {
    if (!canDownloadZip) return;

    setIsZipping(true);
    setZipError(null);
    const zip = new JSZip();

    try {
      for (let i = 0; i < generatedImages.length; i++) {
        const idea = generatedImages[i];
        if (idea.imageUrl) {
          // Assuming imageUrl is a base64 data URL: "data:image/jpeg;base64,..."
          const base64Data = idea.imageUrl.split(',')[1];
          const filename = idea.title ? `${sanitizeFilename(idea.title.substring(0,50))}_${i + 1}.jpg` : `image_${i + 1}.jpg`;
          zip.file(filename, base64Data, { base64: true });
        }
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(zipBlob);
      link.download = 'AI_Generated_Images.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href); // Clean up
    } catch (error) {
      console.error("Failed to create ZIP:", error);
      setZipError(error instanceof Error ? error.message : "ZIPファイルの作成に失敗しました。");
    } finally {
      setIsZipping(false);
    }
  };


  return (
    <div className="mt-8">
      <h2 className="text-2xl font-semibold mb-6 text-indigo-300">2. 画像案の確認と調整</h2>
      
      {appState === AppState.LoadingInitialIdeas && (
        <div className="flex flex-col items-center justify-center p-10 bg-gray-800 rounded-lg shadow-xl">
          <Spinner size="w-12 h-12" />
          <p className="mt-4 text-xl text-gray-300">初期画像案を生成中...</p>
        </div>
      )}

      {overallError && appState !== AppState.LoadingInitialIdeas && (
        <div className="bg-red-700 text-white p-4 rounded-md mb-6 shadow-lg" role="alert">{overallError}</div>
      )}

      {ideas.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {ideas.map((idea) => (
              <ImageIdeaCard
                key={idea.id}
                idea={idea}
                onPromptChange={onPromptChange}
                onRefinePrompt={onRefinePrompt}
                onGenerateSingleImage={onGenerateSingleImage} // Pass new prop
                isGeneratingAll={appState === AppState.GeneratingAllImages}
              />
            ))}
          </div>

          <div className="mt-8 pt-8 border-t border-gray-700">
            <h2 className="text-2xl font-semibold mb-6 text-indigo-300">3. 画像を生成・保存する</h2>
            <div className="space-y-4">
                <button
                  onClick={onGenerateAllImages}
                  disabled={!canGenerateAll}
                  className="w-full flex items-center justify-center px-8 py-4 border border-transparent text-lg font-medium rounded-md shadow-xl text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 focus:ring-offset-gray-800 disabled:bg-green-400 disabled:cursor-not-allowed transition duration-150 ease-in-out"
                  aria-live="polite"
                >
                  {appState === AppState.GeneratingAllImages ? <Spinner size="w-6 h-6 mr-3" /> : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 mr-3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                    </svg>
                  )}
                  {appState === AppState.GeneratingAllImages ? '全画像を生成中...' : `全 ${ideas.length} 枚の画像を生成する`}
                </button>

                {appState === AppState.AllImagesGenerated && !overallError && (
                     <p className="text-center text-green-400 text-lg" role="status">すべての画像が正常に生成されました。</p>
                )}
                
                {generatedImages.length > 0 && (
                    <button
                        onClick={handleDownloadAllAsZip}
                        disabled={!canDownloadZip}
                        className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md shadow-lg text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 focus:ring-offset-gray-800 disabled:bg-purple-400 disabled:cursor-not-allowed transition duration-150 ease-in-out"
                        aria-label="生成されたすべての画像をZIPファイルとしてダウンロードします"
                    >
                        {isZipping ? <Spinner size="w-5 h-5 mr-2" /> : (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 13.5l3 3m0 0l3-3m-3 3v-6m1.06-4.19l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
                        </svg>
                        )}
                        {isZipping ? 'ZIP準備中...' : `生成済み ${generatedImages.length} 枚の画像をまとめて保存`}
                    </button>
                )}
                {zipError && <p className="text-red-400 text-sm text-center mt-2">{zipError}</p>}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ImageIdeasSection;
