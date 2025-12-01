'use client';

import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { getEpisodes, searchAnime } from '@/lib/danmaku/api';
import type {
  DanmakuAnime,
  DanmakuEpisode,
  DanmakuSelection,
} from '@/lib/danmaku/types';

interface DanmakuPanelProps {
  videoTitle: string;
  currentEpisodeIndex: number;
  onDanmakuSelect: (selection: DanmakuSelection) => void;
  currentSelection: DanmakuSelection | null;
}

export default function DanmakuPanel({
  videoTitle,
  currentEpisodeIndex,
  onDanmakuSelect,
  currentSelection,
}: DanmakuPanelProps) {
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchResults, setSearchResults] = useState<DanmakuAnime[]>([]);
  const [selectedAnime, setSelectedAnime] = useState<DanmakuAnime | null>(null);
  const [episodes, setEpisodes] = useState<DanmakuEpisode[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingEpisodes, setIsLoadingEpisodes] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // 搜索弹幕
  const handleSearch = useCallback(async (keyword: string) => {
    if (!keyword.trim()) {
      setSearchError('请输入搜索关键词');
      return;
    }

    setIsSearching(true);
    setSearchError(null);

    try {
      const response = await searchAnime(keyword.trim());

      if (response.success && response.animes.length > 0) {
        setSearchResults(response.animes);
        setSearchError(null);
      } else {
        setSearchResults([]);
        setSearchError(
          response.errorMessage || '未找到匹配的动漫，请尝试其他关键词'
        );
      }
    } catch (error) {
      console.error('搜索失败:', error);
      setSearchError('搜索失败，请检查弹幕 API 服务是否正常运行');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // 选择动漫，加载剧集列表
  const handleAnimeSelect = useCallback(async (anime: DanmakuAnime) => {
    setSelectedAnime(anime);
    setIsLoadingEpisodes(true);

    try {
      const response = await getEpisodes(anime.animeId);

      if (response.success && response.bangumi.episodes.length > 0) {
        setEpisodes(response.bangumi.episodes);
      } else {
        setEpisodes([]);
        setSearchError('该动漫暂无剧集信息');
      }
    } catch (error) {
      console.error('获取剧集失败:', error);
      setEpisodes([]);
      setSearchError('获取剧集失败');
    } finally {
      setIsLoadingEpisodes(false);
    }
  }, []);

  // 选择剧集
  const handleEpisodeSelect = useCallback(
    (episode: DanmakuEpisode) => {
      if (!selectedAnime) return;

      const selection: DanmakuSelection = {
        animeId: selectedAnime.animeId,
        episodeId: episode.episodeId,
        animeTitle: selectedAnime.animeTitle,
        episodeTitle: episode.episodeTitle,
      };

      onDanmakuSelect(selection);
    },
    [selectedAnime, onDanmakuSelect]
  );

  // 回到搜索结果
  const handleBackToResults = useCallback(() => {
    setSelectedAnime(null);
    setEpisodes([]);
  }, []);

  // 判断当前剧集是否已选中
  const isEpisodeSelected = useCallback(
    (episodeId: number) => {
      return currentSelection?.episodeId === episodeId;
    },
    [currentSelection]
  );

  // 当视频标题变化时，更新搜索关键词
  useEffect(() => {
    if (videoTitle && !searchKeyword) {
      setSearchKeyword(videoTitle);
    }
  }, [videoTitle, searchKeyword]);

  return (
    <div className='flex h-full flex-col'>
      {/* 搜索区域 */}
      <div className='mb-4 flex-shrink-0'>
        <div className='flex gap-2'>
          <input
            type='text'
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSearch(searchKeyword);
              }
            }}
            placeholder='输入动漫名称搜索弹幕...'
            className='flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm
                     transition-colors focus:border-green-500 focus:outline-none
                     focus:ring-2 focus:ring-green-500/20
                     dark:border-gray-600 dark:bg-gray-800 dark:text-white'
            disabled={isSearching}
          />
          <button
            onClick={() => handleSearch(searchKeyword)}
            disabled={isSearching}
            className='flex items-center gap-2 rounded-lg bg-green-500 px-4 py-2
                     text-sm font-medium text-white transition-colors
                     hover:bg-green-600 disabled:cursor-not-allowed
                     disabled:opacity-50 dark:bg-green-600 dark:hover:bg-green-700'
          >
            <MagnifyingGlassIcon className='h-4 w-4' />
            {isSearching ? '搜索中...' : '搜索'}
          </button>
        </div>

        {/* 当前选择的弹幕信息 */}
        {currentSelection && (
          <div
            className='mt-3 rounded-lg border border-green-500/30 bg-green-500/10
                        px-3 py-2 text-sm'
          >
            <p className='font-semibold text-green-600 dark:text-green-400'>
              当前弹幕
            </p>
            <p className='mt-1 text-gray-700 dark:text-gray-300'>
              {currentSelection.animeTitle}
            </p>
            <p className='text-xs text-gray-600 dark:text-gray-400'>
              {currentSelection.episodeTitle}
            </p>
          </div>
        )}

        {/* 错误提示 */}
        {searchError && (
          <div
            className='mt-3 rounded-lg border border-red-500/30 bg-red-500/10
                        px-3 py-2 text-sm text-red-600 dark:text-red-400'
          >
            {searchError}
          </div>
        )}
      </div>

      {/* 内容区域 */}
      <div className='flex-1 overflow-y-auto'>
        {/* 显示剧集列表 */}
        {selectedAnime && (
          <div className='space-y-2'>
            {/* 返回按钮 */}
            <button
              onClick={handleBackToResults}
              className='mb-2 text-sm text-green-600 hover:underline
                       dark:text-green-400'
            >
              ← 返回搜索结果
            </button>

            {/* 动漫标题 */}
            <h3 className='mb-3 text-base font-semibold text-gray-800 dark:text-white'>
              {selectedAnime.animeTitle}
            </h3>

            {/* 加载中 */}
            {isLoadingEpisodes && (
              <div className='flex items-center justify-center py-8'>
                <div
                  className='h-8 w-8 animate-spin rounded-full border-4
                              border-gray-300 border-t-green-500'
                />
              </div>
            )}

            {/* 剧集网格 */}
            {!isLoadingEpisodes && episodes.length > 0 && (
              <div className='grid grid-cols-5 gap-2'>
                {episodes.map((episode) => {
                  const isSelected = isEpisodeSelected(episode.episodeId);
                  return (
                    <button
                      key={episode.episodeId}
                      onClick={() => handleEpisodeSelect(episode)}
                      className={`rounded-lg px-2 py-2 text-xs font-medium transition-colors
                        ${
                          isSelected
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300 ' +
                              'dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                        }`}
                      title={episode.episodeTitle}
                    >
                      {episode.episodeTitle}
                    </button>
                  );
                })}
              </div>
            )}

            {!isLoadingEpisodes && episodes.length === 0 && (
              <div className='py-8 text-center text-sm text-gray-500'>
                暂无剧集信息
              </div>
            )}
          </div>
        )}

        {/* 显示搜索结果 */}
        {!selectedAnime && searchResults.length > 0 && (
          <div className='space-y-2'>
            {searchResults.map((anime) => (
              <div
                key={anime.animeId}
                onClick={() => handleAnimeSelect(anime)}
                className='flex cursor-pointer items-start gap-3 rounded-lg
                         bg-gray-100 p-3 transition-colors hover:bg-gray-200
                         dark:bg-gray-800 dark:hover:bg-gray-700'
              >
                {/* 封面 */}
                {anime.imageUrl && (
                  <div className='h-16 w-12 flex-shrink-0 overflow-hidden rounded'>
                    <img
                      src={anime.imageUrl}
                      alt={anime.animeTitle}
                      className='h-full w-full object-cover'
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                )}

                {/* 信息 */}
                <div className='min-w-0 flex-1'>
                  <p className='truncate font-semibold text-gray-800 dark:text-white'>
                    {anime.animeTitle}
                  </p>
                  <div className='mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-600 dark:text-gray-400'>
                    <span className='rounded bg-gray-200 px-2 py-0.5 dark:bg-gray-700'>
                      {anime.typeDescription || anime.type}
                    </span>
                    {anime.episodeCount && (
                      <span>{anime.episodeCount} 集</span>
                    )}
                    {anime.startDate && <span>{anime.startDate}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 空状态 */}
        {!selectedAnime && searchResults.length === 0 && !isSearching && (
          <div className='flex flex-col items-center justify-center py-12 text-center'>
            <MagnifyingGlassIcon className='mb-3 h-12 w-12 text-gray-400' />
            <p className='text-sm text-gray-500 dark:text-gray-400'>
              输入动漫名称搜索弹幕
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
