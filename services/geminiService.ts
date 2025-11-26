import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import type { AspectRatio } from '../types';
// import type { ImageIdea } from '../types'; // Not used directly in this file

// Ensure API_KEY is available. In a real app, you'd have a more robust check or build-time error.
if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set. Please ensure it is configured.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const TEXT_MODEL_NAME = "gemini-2.5-flash";
const IMAGE_MODEL_NAME = "imagen-4.0-generate-001";

const parseJsonFromGeminiResponse = (text: string): any => {
  let jsonStr = text.trim();
  const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
  const match = jsonStr.match(fenceRegex);
  if (match && match[2]) {
    jsonStr = match[2].trim();
  }
  try {
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error("Failed to parse JSON response:", e, "Raw text:", text);
    throw new Error("AIからの応答の解析に失敗しました。応答は有効なJSONではありませんでした。");
  }
};

export const generateInitialImagePrompts = async (transcript: string, count: number): Promise<{ title: string; prompt: string; }[]> => {
  const systemInstruction = `あなたは、与えられたテキストトランスクリプトに基づいてインサート画像を提案するアシスタントです。
ユーザーは ${count} 枚の画像を求めています。
プロセス：
1.  まず、トランスクリプト全体を注意深く読み、内容を完全に理解してください。
2.  次に、トランスクリプトを、ユーザーが要求した画像数（${count}個）と同じ数の、互いに異なる重要なトピックまたはセクションに分割してください。これらのトピックは、トランスクリプトの主要なアイデアや場面をカバーするようにしてください。
3.  各トピックについて、そのトピックの「アイキャッチ」として最も適切で視覚的に魅力的な画像を説明する英語のプロンプトを生成してください。このプロンプトは詳細かつ具体的で、画像生成モデルが高品質な画像を生成できるようにしてください。
4.  同時に、各英語プロンプトに対応する簡潔で分かりやすい日本語のタイトルも生成してください。この日本語タイトルはユーザーに表示されます。
5.  生成されるすべての画像は、一眼レフカメラで撮影されたような、リアルで高品質な写真（フォトリアリスティック）であることを目指します。このスタイルをプロンプトに反映させてください。

応答は以下のJSON形式でお願いします:
{
  "imageSuggestions": [
    { "title": "日本語のタイトル1", "prompt": "Detailed English prompt 1, photorealistic, DSLR shot..." },
    { "title": "日本語のタイトル2", "prompt": "Detailed English prompt 2, photorealistic, DSLR shot..." },
    // ... 他の提案
  ]
}
`;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: TEXT_MODEL_NAME,
      contents: `トランスクリプト:\n\`\`\`\n${transcript}\n\`\`\`\n要求画像数: ${count}`,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        temperature: 0.8, 
      },
    });

    const parsedJson = parseJsonFromGeminiResponse(response.text);
    if (parsedJson && Array.isArray(parsedJson.imageSuggestions) && 
        parsedJson.imageSuggestions.every((s: any) => typeof s.title === 'string' && typeof s.prompt === 'string')) {
      return parsedJson.imageSuggestions.slice(0, count);
    }
    throw new Error("AIからの初期プロンプトの応答が期待された形式ではありませんでした。");
  } catch (error) {
    console.error("初期画像プロンプトの生成中にエラーが発生しました:", error);
    throw error;
  }
};

export const refineImagePrompt = async (transcript: string, currentPrompt: string, userInstruction: string): Promise<string> => {
  const systemInstruction = `あなたは、画像生成用の英語プロンプトを調整する専門のアシスタントです。
目的: ユーザーの日本語の指示と元のトランスクリプトの文脈を考慮し、現在の英語プロンプトを改善して、より詳細で、トランスクリプトの意図に合致し、かつリアルなDSLR品質の写真を生成できるように最適化すること。

入力:
1.  オリジナルのトランスクリプト（文脈理解のため）
2.  現在の英語プロンプト
3.  ユーザーからの日本語での具体的な改善指示

処理:
- ユーザーの日本語指示を最優先で考慮し、現在の英語プロンプトに反映させてください。
- トランスクリプトの内容との関連性を保ちつつ、指示に沿ってプロンプトをより鮮明で具体的にしてください。
- 生成される画像が「フォトリアリスティック」「DSLRショット」のスタイルを維持するようにしてください。
- プロンプトが既に非常に良い場合でも、ユーザーの指示を何らかの形で反映させるように努めてください。

応答は以下のJSON形式でお願いします:
{ "refinedPrompt": "ここに調整後の英語プロンプト" }`;
  
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: TEXT_MODEL_NAME,
      contents: `オリジナルのトランスクリプト:\n\`\`\`\n${transcript}\n\`\`\`\n\n現在の英語プロンプト:\n\`\`\`\n${currentPrompt}\n\`\`\`\n\nユーザーからの日本語での改善指示:\n\`\`\`\n${userInstruction}\n\`\`\``,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        temperature: 0.6, // Slightly increased to allow for more creative interpretation of user instruction
      },
    });
    
    const parsedJson = parseJsonFromGeminiResponse(response.text);
    if (parsedJson && typeof parsedJson.refinedPrompt === 'string') {
      return parsedJson.refinedPrompt;
    }
    throw new Error("AIからのプロンプト調整の応答が期待された形式ではありませんでした。");
  } catch (error) {
    console.error("画像プロンプトの調整中にエラーが発生しました:", error);
    throw error;
  }
};

export const generateImageWithImagen = async (prompt: string, aspectRatio: AspectRatio): Promise<string> => {
  const fullPrompt = `${prompt}, high detail, sharp focus, professional photography, cinematic lighting, 8k`;
  
  try {
    const response = await ai.models.generateImages({
      model: IMAGE_MODEL_NAME,
      prompt: fullPrompt,
      config: { 
        numberOfImages: 1, 
        outputMimeType: 'image/jpeg',
        aspectRatio: aspectRatio.value
      },
    });

    if (response.generatedImages && response.generatedImages.length > 0 && response.generatedImages[0].image?.imageBytes) {
      const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
      return `data:image/jpeg;base64,${base64ImageBytes}`;
    }
    throw new Error("画像の生成に失敗したか、画像データが返されませんでした。");
  } catch (error) {
    console.error("Imagen3での画像生成中にエラーが発生しました:", error);
    throw error;
  }
};