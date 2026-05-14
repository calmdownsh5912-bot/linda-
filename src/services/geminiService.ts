import { GoogleGenAI, Type } from "@google/genai";
import { OCRResult, AnalogousQuestion } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function recognizeMistake(base64Image: string, mimeType: string): Promise<OCRResult> {
  const model = "gemini-3-flash-preview";
  
  const prompt = `
    你是一个专业的学科识别助手。请识别并提取这张图片中的错题内容。
    提取要求：
    1. 题目正文 (text)
    2. 选项 (options, 如果是选择题)
    3. 用户原答案 (userAnswer, 如果有批改痕迹或手写内容)
    4. 标准答案 (correctAnswer, 如果有)
    5. 核心知识点 (knowledgePoint, 如 "一元二次方程根的判别式", "现在完成时" 等)

    请以 JSON 格式输出。
  `;

  const response = await ai.models.generateContent({
    model,
    contents: [
      {
        parts: [
          { inlineData: { data: base64Image, mimeType } },
          { text: prompt }
        ]
      }
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          text: { type: Type.STRING },
          options: { type: Type.ARRAY, items: { type: Type.STRING } },
          userAnswer: { type: Type.STRING },
          correctAnswer: { type: Type.STRING },
          knowledgePoint: { type: Type.STRING },
        },
        required: ["text", "knowledgePoint"]
      }
    }
  });

  return JSON.parse(response.text || '{}') as OCRResult;
}

export async function generateAnalogousQuestions(originalText: string, knowledgePoint: string): Promise<AnalogousQuestion[]> {
  const model = "gemini-3-flash-preview";
  
  const prompt = `
    题目内容：${originalText}
    知识点：${knowledgePoint}

    请根据以上知识点，生成 3 道举一反三的变式题。
    要求：
    1. 覆盖同一知识点的不同角度或变式。
    2. 难度与原题相当或略有梯度。
    3. 每道题附带正确答案。
    4. 提供侧重“易错点”详细解析（例如提示常见的思考陷阱、公式漏用情况等）。

    请以 JSON 数组格式输出。
  `;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            question: { type: Type.STRING },
            answer: { type: Type.STRING },
            analysis: { type: Type.STRING },
          },
          required: ["question", "answer", "analysis"]
        }
      }
    }
  });

  return JSON.parse(response.text || '[]') as AnalogousQuestion[];
}
