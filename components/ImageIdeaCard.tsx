
import React, { useState } from 'react';
import type { ImageIdea } from '../types';
import Spinner from './Spinner';

interface ImageIdeaCardProps {
  idea: ImageIdea;
  onPromptChange: (id: string, newPrompt: string) => void;
  onRefinePrompt: (id: string, currentPrompt: string, userInstruction: string) => void;
  onGenerateSingleImage: (id: string) => void; // New prop
  isGeneratingAll: boolean;
}

const ImageIdeaCard: React.FC<ImageIdeaCardProps> = ({ 
  idea, 
  onPromptChange, 
  onRefinePrompt, 
  onGenerateSingleImage, // New prop
  isGeneratingAll 
}) => {
  const [showRefineInput, setShowRefineInput] = useState(false);
  const [userInstruction, setUserInstruction] = useState('');

  const handleToggleRefineInput = () => {
    if (idea.isRefiningPrompt || isGeneratingAll || idea.isGeneratingImage) return;
    setShowRefineInput(!showRefineInput);
    setUserInstruction(''); // Reset instruction on toggle
  };

  const handleRefineWithInstruction = () => {
    if (!userInstruction.trim()) {
      alert("調整内容を日本語で入力してください。");
      return;
    }
    if (!idea.isRefiningPrompt && !isGeneratingAll && !idea.isGeneratingImage) {
      onRefinePrompt(idea.id, idea.prompt, userInstruction);
      setShowRefineInput(false); 
      setUserInstruction('');
    }
  };
  
  const canInteractGenerally = !idea.isRefiningPrompt && !isGeneratingAll && !idea.isGeneratingImage;
  const canEditText = canInteractGenerally && !showRefineInput;
  const canTriggerRefine = canInteractGenerally;
  const canTriggerSingleGenerate = canInteractGenerally && !!idea.prompt.trim();


  const sanitizeFilename = (filename: string) => {
    return filename.replace(/[\\/:*?"<>|#%&{}]/g, '').replace(/\s+/g, '_');
  };

  const handleSaveImage = () => {
    if (idea.imageUrl) {
      const link = document.createElement('a');
      link.href = idea.imageUrl;
      const filename = idea.title ? `${sanitizeFilename(idea.title.substring(0,50))}.jpg` : `generated_image_${idea.id.substring(0,8)}.jpg`;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleRegenerateThisImage = () => {
    if (canTriggerSingleGenerate) {
        onGenerateSingleImage(idea.id);
    }
  }

  return (
    <div className="bg-gray-800 p-5 rounded-lg shadow-lg transition-all duration-300 ease-in-out hover:shadow-2xl border border-gray-700 flex flex-col">
      <div className="mb-3">
        <h3 className="text-lg font-semibold text-indigo-300 mb-2 truncate" title={idea.title}>
          {idea.title || "画像案"}
        </h3>
        <label htmlFor={`prompt-${idea.id}`} className="block text-sm font-medium text-gray-400 mb-1">
          画像生成プロンプト（英語・編集可能）
        </label>
        <textarea
          id={`prompt-${idea.id}`}
          rows={4}
          value={idea.prompt}
          onChange={(e) => onPromptChange(idea.id, e.target.value)}
          className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-100 placeholder-gray-400 disabled:opacity-60"
          placeholder="Describe the image you want to generate in English..."
          disabled={!canEditText}
          aria-label={`画像「${idea.title}」の英語プロンプト`}
        />
      </div>

      <div className="flex flex-col space-y-2 mb-3">
        {!showRefineInput && (
          <div className="flex space-x-2">
            <button
              onClick={handleToggleRefineInput}
              disabled={!canTriggerRefine}
              className="flex-1 flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-indigo-700 bg-indigo-200 hover:bg-indigo-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-gray-800 disabled:bg-indigo-100 disabled:text-indigo-400 disabled:cursor-not-allowed transition duration-150"
              aria-label={`AIでプロンプト「${idea.prompt}」を調整する`}
            >
              {idea.isRefiningPrompt ? <Spinner size="w-4 h-4 mr-2" color="text-indigo-700" /> : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L1.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.25 12L17 13.75a1.5 1.5 0 000 2.5L18.25 18l1.25-1.75a1.5 1.5 0 000-2.5L18.25 12zM12.75 5.25L11 3.5a1.5 1.5 0 00-2.5 0L7.25 5.25l1.75 1.25a1.5 1.5 0 002.5 0L12.75 5.25z" />
                </svg>
              )}
              {idea.isRefiningPrompt ? '調整中...' : 'AIでプロンプトを調整'}
            </button>
            <button
                onClick={handleRegenerateThisImage}
                disabled={!canTriggerSingleGenerate}
                className="flex-1 flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-teal-700 bg-teal-200 hover:bg-teal-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 focus:ring-offset-gray-800 disabled:bg-teal-100 disabled:text-teal-400 disabled:cursor-not-allowed transition duration-150"
                aria-label={`画像「${idea.title}」のみ再生成する`}
            >
                {idea.isGeneratingImage && !isGeneratingAll ? <Spinner size="w-4 h-4 mr-2" color="text-teal-700" /> : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                </svg>
                )}
                {idea.isGeneratingImage && !isGeneratingAll ? 'この画像生成中...' : 'この画像のみ再生成'}
            </button>
          </div>
        )}

        {showRefineInput && !idea.isRefiningPrompt && (
          <div className="p-3 bg-gray-750 rounded-md border border-gray-600">
            <label htmlFor={`refine-instruction-${idea.id}`} className="block text-sm font-medium text-gray-300 mb-1">
              調整内容を日本語で入力:
            </label>
            <textarea
              id={`refine-instruction-${idea.id}`}
              rows={3}
              value={userInstruction}
              onChange={(e) => setUserInstruction(e.target.value)}
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-100 placeholder-gray-400"
              placeholder="例: 「もっと笑顔を増やして」「背景を夜にして」など"
              disabled={!canTriggerRefine}
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={handleRefineWithInstruction}
                disabled={!canTriggerRefine || !userInstruction.trim()}
                className="flex-1 px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-green-400"
              >
                この内容で調整を依頼
              </button>
              <button
                onClick={handleToggleRefineInput} 
                disabled={!canTriggerRefine}
                className="flex-1 px-4 py-2 border border-gray-500 text-sm font-medium rounded-md shadow-sm text-gray-300 bg-gray-600 hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                キャンセル
              </button>
            </div>
          </div>
        )}
      </div>
      
      {idea.imageUrl && (
          <button
            onClick={handleSaveImage}
            disabled={!canInteractGenerally || idea.isGeneratingImage}
            className="w-full mb-3 flex items-center justify-center px-4 py-2 border border-sky-500 text-sm font-medium rounded-md shadow-sm text-sky-300 bg-sky-700 hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            この画像を保存
          </button>
      )}


      {idea.error && <p className="text-red-400 text-sm mt-0 mb-2 px-1">{idea.error}</p>}

      <div className="mt-auto h-64 bg-gray-700 rounded-md flex items-center justify-center overflow-hidden border border-gray-600">
        {idea.isGeneratingImage ? (
          <div className="text-center">
            <Spinner />
            <p className="text-sm text-gray-400 mt-2">画像を生成中...</p>
          </div>
        ) : idea.imageUrl ? (
          <img 
            src={idea.imageUrl} 
            alt={idea.prompt} 
            className="w-full h-full object-cover" 
            aria-label={`生成された画像: ${idea.title}`}
          />
        ) : (
          <div className="text-center text-gray-500">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 mx-auto opacity-50">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
            <p className="mt-2 text-sm">画像はここに表示されます</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageIdeaCard;
