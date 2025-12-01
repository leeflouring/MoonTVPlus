// 自动匹配 API 路由
import { NextRequest, NextResponse } from 'next/server';

import { getConfig } from '@/lib/config';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fileName } = body;

    if (!fileName) {
      return NextResponse.json(
        {
          errorCode: -1,
          success: false,
          errorMessage: '缺少文件名参数',
          isMatched: false,
          matches: [],
        },
        { status: 400 }
      );
    }

    // 从数据库读取弹幕配置
    const config = await getConfig();
    const { DanmakuApiBase, DanmakuApiToken } = config.SiteConfig;

    // 构建 API URL
    const baseUrl =
      DanmakuApiToken === '87654321'
        ? DanmakuApiBase
        : `${DanmakuApiBase}/${DanmakuApiToken}`;

    const apiUrl = `${baseUrl}/api/v2/match`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fileName }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error('自动匹配代理错误:', error);
    return NextResponse.json(
      {
        errorCode: -1,
        success: false,
        errorMessage: error instanceof Error ? error.message : '匹配失败',
        isMatched: false,
        matches: [],
      },
      { status: 500 }
    );
  }
}
