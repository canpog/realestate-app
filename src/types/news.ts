export type NewsCategory = 
  | 'gayrimenkul'
  | 'borsa'
  | 'ekonomi'
  | 'merkez_bankasi'
  | 'konut_kredisi'
  | 'yatirim'
  | 'diger';

export interface NewsArticle {
  id?: string;
  title: string;
  description: string;
  content: string;
  url: string;
  urlToImage: string | null;
  source: {
    id: string | null;
    name: string;
  };
  author: string | null;
  publishedAt: string;
  category?: NewsCategory;
  importance_score?: number;
}

export interface NewsResponse {
  status: 'ok' | 'error';
  totalResults: number;
  articles: NewsArticle[];
  message?: string;
}

export interface ParsedNewsArticle {
  title: string;
  description: string;
  content: string;
  article_url: string;
  image_url: string | null;
  category: NewsCategory;
  published_at: Date;
  source: string;
  importance_score: number;
  is_featured: boolean;
}