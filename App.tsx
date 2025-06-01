
import React, { useState, useCallback } from 'react';
import type { ImageIdea } from './types';
import { AppState } from './types';
import TranscriptInputSection from './components/TranscriptInputSection';
import ImageIdeasSection from './components/ImageIdeasSection';
import { generateInitialImagePrompts, refineImagePrompt, generateImageWithImagen } from './services/geminiService';

// A simple polyfill for crypto.randomUUID if it's not available (e.g., older environments)
if (typeof crypto.randomUUID === 'undefined') {
  // @ts-ignore
  crypto.randomUUID = function randomUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };
}


const App: React.FC = () => {
  const [transcript, setTranscript] = useState<string>('');
  const [imageIdeas, setImageIdeas] = useState<ImageIdea[]>([]);
  const [appState, setAppState] = useState<AppState>(AppState.Idle);
  const [overallError, setOverallError] = useState<string | null>(null);
  // Store initial user inputs for the "Start Over" functionality to optionally reset to these
  const [initialUserTranscript, setInitialUserTranscript] = useState<string>('');
  const [initialUserImageCount, setInitialUserImageCount] = useState<number>(3);


  const handleGetIdeas = useCallback(async (currentTranscript: string, count: number) => {
    setTranscript(currentTranscript);
    setInitialUserTranscript(currentTranscript); 
    setInitialUserImageCount(count);      

    setAppState(AppState.LoadingInitialIdeas);
    setOverallError(null);
    setImageIdeas([]); 

    try {
      const promptObjects = await generateInitialImagePrompts(currentTranscript, count);
      const newIdeas: ImageIdea[] = promptObjects.map(pObj => ({
        id: crypto.randomUUID(),
        title: pObj.title, 
        prompt: pObj.prompt, 
        imageUrl: null,
        isRefiningPrompt: false,
        isGeneratingImage: false,
        error: null,
      }));
      setImageIdeas(newIdeas);
      setAppState(AppState.IdeasLoaded);
    } catch (error) {
      console.error("Failed to get initial ideas:", error);
      setOverallError(error instanceof Error ? error.message : "画像案の取得中に不明なエラーが発生しました。");
      setAppState(AppState.Idle);
    }
  }, []);

  const handlePromptChange = useCallback((id: string, newPrompt: string) => {
    setImageIdeas(prevIdeas =>
      prevIdeas.map(idea =>
        idea.id === id ? { ...idea, prompt: newPrompt, error: null } : idea
      )
    );
  }, []);

  const handleRefinePrompt = useCallback(async (id: string, currentPromptValue: string, userInstruction: string) => {
    setOverallError(null);
    setImageIdeas(prevIdeas =>
      prevIdeas.map(idea =>
        idea.id === id ? { ...idea, isRefiningPrompt: true, error: null } : idea
      )
    );

    try {
      const refinedPromptText = await refineImagePrompt(transcript, currentPromptValue, userInstruction);
      setImageIdeas(prevIdeas =>
        prevIdeas.map(idea =>
          idea.id === id ? { ...idea, prompt: refinedPromptText, isRefiningPrompt: false } : idea
        )
      );
    } catch (error) {
      console.error(`Failed to refine prompt for idea ${id}:`, error);
      setImageIdeas(prevIdeas =>
        prevIdeas.map(idea =>
          idea.id === id ? { ...idea, isRefiningPrompt: false, error: error instanceof Error ? error.message : "プロンプトの調整に失敗しました。" } : idea
        )
      );
    }
  }, [transcript]); 

  const handleGenerateSingleImage = useCallback(async (id: string) => {
    const ideaToGenerate = imageIdeas.find(idea => idea.id === id);
    if (!ideaToGenerate || !ideaToGenerate.prompt.trim()) {
      setImageIdeas(prevIdeas =>
        prevIdeas.map(idea =>
          idea.id === id ? { ...idea, error: "プロンプトが空です。入力してください。" } : idea
        )
      );
      return;
    }

    setOverallError(null);
    setImageIdeas(prevIdeas =>
      prevIdeas.map(idea =>
        idea.id === id ? { ...idea, isGeneratingImage: true, imageUrl: null, error: null } : idea
      )
    );

    try {
      const imageUrl = await generateImageWithImagen(ideaToGenerate.prompt);
      setImageIdeas(prevIdeas =>
        prevIdeas.map(idea =>
          idea.id === id ? { ...idea, imageUrl, isGeneratingImage: false, error: null } : idea
        )
      );
    } catch (error) {
      console.error(`Failed to generate image for idea ${id}:`, error);
      setImageIdeas(prevIdeas =>
        prevIdeas.map(idea =>
          idea.id === id ? { ...idea, isGeneratingImage: false, imageUrl: null, error: error instanceof Error ? error.message : "この画像の生成に失敗しました。" } : idea
        )
      );
    }
  }, [imageIdeas]);

  const handleGenerateAllImages = useCallback(async () => {
    if (imageIdeas.some(idea => !idea.prompt.trim())) {
      setOverallError("画像を生成する前に、すべてのプロンプトが入力されていることを確認してください。");
      return;
    }
    setAppState(AppState.GeneratingAllImages);
    setOverallError(null);

    setImageIdeas(prevIdeas =>
      prevIdeas.map(idea => ({ ...idea, isGeneratingImage: true, imageUrl: null, error: null }))
    );

    const imageGenerationPromises = imageIdeas.map(async (idea) => {
      try {
        const imageUrl = await generateImageWithImagen(idea.prompt);
        return { id: idea.id, imageUrl, error: null };
      } catch (error) {
        console.error(`Failed to generate image for idea ${idea.id}:`, error);
        return { id: idea.id, imageUrl: null, error: error instanceof Error ? error.message : "この画像の生成に失敗しました。" };
      }
    });

    const results = await Promise.all(imageGenerationPromises);

    let anyIndividualErrors = false;
    setImageIdeas(prevIdeas =>
      prevIdeas.map(idea => {
        const result = results.find(r => r.id === idea.id);
        if (result && result.error) {
          anyIndividualErrors = true;
        }
        return result ? { ...idea, imageUrl: result.imageUrl, error: result.error, isGeneratingImage: false } : { ...idea, isGeneratingImage: false };
      })
    );
    
    if (anyIndividualErrors) {
        setOverallError("一部の画像の生成に失敗しました。各画像のエラーメッセージを確認してください。");
    } else {
        setOverallError(null); 
    }

    setAppState(AppState.AllImagesGenerated);
  }, [imageIdeas]); 
  
  const resetApp = () => {
    setTranscript(''); 
    setInitialUserTranscript('');
    setInitialUserImageCount(3);

    setImageIdeas([]);
    setAppState(AppState.Idle);
    setOverallError(null);
  };


  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-4 md:p-8 selection:bg-indigo-500 selection:text-white">
      <header className="mb-10 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-pink-500">
          AIインサート画像ジェネレーター
        </h1>
        <p className="mt-3 text-lg text-gray-400 max-w-2xl mx-auto">
          魅力的なビジュアルストーリーを作成します。コンテンツの文字起こしを入力し、AIによる画像案を取得、調整し、リアルで高品質な画像を生成します。
        </p>
      </header>
      
      <main className="max-w-4xl mx-auto">
        <TranscriptInputSection
          key={appState === AppState.Idle ? 'initial-form' : 'active-form'} 
          onGetIdeas={handleGetIdeas}
          isLoading={appState === AppState.LoadingInitialIdeas}
          initialTranscript={initialUserTranscript} 
          initialImageCount={initialUserImageCount} 
        />

        {(appState !== AppState.Idle || imageIdeas.length > 0) && (
          <ImageIdeasSection
            ideas={imageIdeas}
            onPromptChange={handlePromptChange}
            onRefinePrompt={handleRefinePrompt}
            onGenerateAllImages={handleGenerateAllImages}
            onGenerateSingleImage={handleGenerateSingleImage} // Pass new handler
            appState={appState}
            overallError={overallError}
          />
        )}
        
        {(appState !== AppState.Idle || imageIdeas.length > 0) && (
            <div className="mt-12 text-center">
                <button
                    onClick={resetApp}
                    className="px-6 py-3 border border-gray-600 text-base font-medium rounded-md text-gray-300 bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-gray-900 transition duration-150 ease-in-out"
                    aria-label="アプリケーションを初期状態にリセットします"
                >
                    最初からやり直す
                </button>
            </div>
        )}
      </main>

      <footer className="mt-16 pt-8 border-t border-gray-700 text-center">
        <p className="text-sm text-gray-500">
          &copy; {new Date().getFullYear()} AIインサート画像ジェネレーター. すべての権利予約済み。
        </p>
      </footer>
    </div>
  );
};

export default App;
