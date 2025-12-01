// 弹幕搜索 API 路由
import { NextRequest, NextResponse } from 'next/server';

import { getConfig } from '@/lib/config';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const keyword = searchParams.get('keyword');

    if (!keyword) {
      return NextResponse.json(
        {
          errorCode: -1,
          success: false,
          errorMessage: '缺少关键词参数',
          animes: [],
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

    const apiUrl = `${baseUrl}/api/v2/search/anime?keyword=${encodeURIComponent(keyword)}`;

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error('弹幕搜索代理错误:', error);
    return NextResponse.json(
      {
        errorCode: -1,
        success: false,
        errorMessage: error instanceof Error ? error.message : '搜索失败',
        animes: [],
      },
      { status: 500 }
    );
  }
}
