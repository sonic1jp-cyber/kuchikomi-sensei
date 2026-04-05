import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

// 医療広告ガイドラインに違反するキーワード
const GUIDELINE_NG_KEYWORDS = [
  '治ります',
  '必ず治る',
  '完全に治す',
  '治療できます',
  '最高の治療',
  '日本一',
  '世界一',
  '最新の',
  '最先端',
  '効果的',
  '効く',
  'おすすめ',
  '一番',
  'No.1',
  '実績No.1',
  '患者様の声',
  'ビフォーアフター',
];

function checkGuidelineWarnings(text: string): string[] {
  const warnings: string[] = [];

  GUIDELINE_NG_KEYWORDS.forEach((keyword) => {
    if (text.includes(keyword)) {
      warnings.push(`"${keyword}" は医療広告ガイドラインで使用が制限されている可能性があります`);
    }
  });

  return warnings;
}

async function generateReply(reviewText: string, rating: number, tone: string): Promise<{ content: string; warnings: string[] }> {
  const toneDescription = {
    formal: '丁寧で形式的な',
    friendly: 'あたたかみのある親しみやすい',
    concise: '簡潔で分かりやすい',
  }[tone] || tone;

  const prompt = `あなたはクリニックの運営代理人です。以下のGoogle クチコミに対して、${toneDescription}トーンで返信文を作成してください。

クチコミの評価: ${rating}星
クチコミの内容:
${reviewText}

返信文は:
- 2-3文程度の適切な長さ
- 医療広告ガイドラインに準拠（治療効果の保証や過度な誇張は避ける）
- クリニックの対応状況や感謝を含める
- 特に低評価の場合は改善への意欲を示す

返信文のみを出力してください（説明は不要）。`;

  const response = await client.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 300,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  });

  const content = response.content[0].type === 'text' ? response.content[0].text.trim() : '';
  const warnings = checkGuidelineWarnings(content);

  return { content, warnings };
}

export async function POST(request: NextRequest) {
  try {
    const { reviewText, rating } = await request.json();

    if (!reviewText || !rating) {
      return NextResponse.json(
        { error: 'reviewText と rating は必須です' },
        { status: 400 }
      );
    }

    // 3つのトーンで返信を生成
    const tones = ['formal', 'friendly', 'concise'];
    const replies = await Promise.all(
      tones.map(async (tone) => {
        const { content, warnings } = await generateReply(reviewText, rating, tone);
        return {
          id: `${tone}-${Date.now()}`,
          tone: tone as 'formal' | 'friendly' | 'concise',
          content,
          guideline_warnings: warnings,
          created_at: new Date().toISOString(),
        };
      })
    );

    return NextResponse.json(replies);
  } catch (error) {
    console.error('AI返信生成エラー:', error);
    return NextResponse.json(
      { error: 'AI返信の生成に失敗しました' },
      { status: 500 }
    );
  }
}
