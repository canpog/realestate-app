import { createClient } from '@/lib/supabase/server';
import { NewsAPIService } from './newsapi-service';
import { ParsedNewsArticle } from '@/types/news';

export class SupabaseNewsService {
  private static getClient() {
    return createClient();
  }

  /**
   * Haberler çek ve Supabase'e kaydet
   */
  static async fetchAndSaveNews(): Promise<{
    success: boolean;
    articlesAdded: number;
    errors: string[];
  }> {
    const errors: string[] = [];
    let articlesAdded = 0;

    try {
      // NewsAPI'den haberler çek
      console.log('Fetching news from NewsAPI...');
      const parsedArticles = await NewsAPIService.fetchAndParseNews();

      if (parsedArticles.length === 0) {
        errors.push('No articles fetched from NewsAPI');
        return { success: false, articlesAdded: 0, errors };
      }

      console.log(`Fetched ${parsedArticles.length} articles`);

      // Her haber için kontrol et ve kaydet
      for (const article of parsedArticles) {
        try {
          // Duplicate kontrol (URL bazında)
          const { data: existing, error: checkError } = await this.getClient()
            .from('news_articles')
            .select('id')
            .eq('article_url', article.article_url)
            .single();

          if (checkError && checkError.code !== 'PGRST116') {
            // PGRST116 = hiç kayıt yok (normal)
            console.error(`Error checking duplicate: ${article.article_url}`, checkError);
            errors.push(
              `Duplicate check failed for ${article.title}: ${checkError.message}`
            );
            continue;
          }

          if (existing) {
            console.log(`Duplicate found: ${article.title}`);
            continue; // Zaten var, skip
          }

          // Yeni haber ekle
          const { error: insertError } = await this.getClient()
            .from('news_articles')
            .insert({
              title: article.title,
              description: article.description,
              content: article.content,
              article_url: article.article_url,
              image_url: article.image_url,
              category: article.category,
              published_at: article.published_at.toISOString(),
              importance_score: article.importance_score,
              is_featured: article.is_featured,
              source: article.source,
            });

          if (insertError) {
            console.error(`Error inserting article: ${article.title}`, insertError);
            errors.push(`Insert failed for ${article.title}: ${insertError.message}`);
            continue;
          }

          articlesAdded++;
          console.log(`✓ Added: ${article.title}`);
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error';
          console.error(`Error processing article: ${article.title}`, error);
          errors.push(`Error processing article: ${errorMessage}`);
        }
      }

      // Eski haberler temizle (30 günden eski)
      console.log('Cleaning old articles...');
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const { error: deleteError } = await this.getClient()
        .from('news_articles')
        .delete()
        .lt('published_at', thirtyDaysAgo.toISOString());

      if (deleteError) {
        console.error('Error cleaning old articles:', deleteError);
        errors.push(`Error cleaning old articles: ${deleteError.message}`);
      }

      console.log(`News fetch completed: ${articlesAdded} new articles added`);

      return {
        success: articlesAdded > 0 || errors.length === 0,
        articlesAdded,
        errors,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      console.error('Fatal error in fetchAndSaveNews:', error);
      return {
        success: false,
        articlesAdded: 0,
        errors: [`Fatal error: ${errorMessage}`],
      };
    }
  }

  /**
   * En son haberler getir (UI için)
   */
  static async getLatestNews(
    category?: string,
    limit: number = 10
  ): Promise<ParsedNewsArticle[]> {
    try {
      let query = this.getClient()
        .from('news_articles')
        .select('*')
        .order('published_at', { ascending: false })
        .limit(limit);

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching latest news:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getLatestNews:', error);
      return [];
    }
  }

  /**
   * Öne çıkan haberler getir
   */
  static async getFeaturedNews(limit: number = 5): Promise<ParsedNewsArticle[]> {
    try {
      const { data, error } = await this.getClient()
        .from('news_articles')
        .select('*')
        .eq('is_featured', true)
        .order('published_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching featured news:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getFeaturedNews:', error);
      return [];
    }
  }

  /**
   * Kategoriye göre haberler getir
   */
  static async getNewsByCategory(category: string, limit: number = 15): Promise<ParsedNewsArticle[]> {
    try {
      const { data, error } = await this.getClient()
        .from('news_articles')
        .select('*')
        .eq('category', category)
        .order('published_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error(`Error fetching ${category} news:`, error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error(`Error in getNewsByCategory(${category}):`, error);
      return [];
    }
  }

  /**
   * Haber ara (arama fonksiyonu)
   */
  static async searchNews(
    searchTerm: string,
    limit: number = 20
  ): Promise<ParsedNewsArticle[]> {
    try {
      const { data, error } = await this.getClient()
        .from('news_articles')
        .select('*')
        .or(
          `title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%`
        )
        .order('published_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error searching news:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in searchNews:', error);
      return [];
    }
  }
}