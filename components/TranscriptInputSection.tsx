
import React, { useState }  from 'react';
import Spinner from './Spinner';

interface TranscriptInputSectionProps {
  onGetIdeas: (transcript: string, count: number) => void;
  isLoading: boolean;
  initialTranscript?: string;
  initialImageCount?: number;
}

const TranscriptInputSection: React.FC<TranscriptInputSectionProps> = ({ 
  onGetIdeas, 
  isLoading,
  initialTranscript = "",
  initialImageCount = 3 
}) => {
  const [transcript, setTranscript] = useState<string>(initialTranscript);
  const [imageCount, setImageCount] = useState<number>(initialImageCount);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = () => {
    setError(null);
    if (!transcript.trim()) {
      setError("文字起こしを入力してください。");
      return;
    }
    if (imageCount < 3 || imageCount > 30) {
      setError("画像枚数は3枚から30枚の間で指定してください。");
      return;
    }
    onGetIdeas(transcript, imageCount);
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-xl mb-8">
      <h2 className="text-2xl font-semibold mb-6 text-indigo-300">1. コンテンツ入力</h2>
      
      {error && <div className="bg-red-700 text-white p-3 rounded-md mb-4">{error}</div>}

      <div className="mb-6">
        <label htmlFor="transcript" className="block text-sm font-medium text-gray-300 mb-1">
          コンテンツの文字起こし
        </label>
        <textarea
          id="transcript"
          rows={8}
          className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-100 placeholder-gray-400 disabled:opacity-50"
          placeholder="ここにコンテンツの文字起こし全体を貼り付けてください..."
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          disabled={isLoading}
          aria-required="true"
        />
      </div>

      <div className="mb-6">
        <label htmlFor="imageCount" className="block text-sm font-medium text-gray-300 mb-1">
          生成する画像の枚数 (3〜30枚)
        </label>
        <input
          type="number"
          id="imageCount"
          min="3"
          max="30"
          value={imageCount}
          onChange={(e) => setImageCount(parseInt(e.target.value, 10))}
          className="w-full md:w-1/3 p-3 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-100 disabled:opacity-50"
          disabled={isLoading}
          aria-required="true"
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={isLoading}
        className="w-full flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-gray-800 disabled:bg-indigo-400 disabled:cursor-not-allowed transition duration-150 ease-in-out"
      >
        {isLoading ? <Spinner size="w-5 h-5 mr-2" /> : null}
        {isLoading ? '画像案を生成中...' : '画像案を生成する'}
      </button>
    </div>
  );
};

export default TranscriptInputSection;
