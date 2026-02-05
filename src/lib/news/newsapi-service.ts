import axios from 'axios';
import { NewsArticle, NewsResponse, ParsedNewsArticle, NewsCategory } from '@/types/news';

const NEWSAPI_KEY = process.env.NEWSAPI_KEY;
const NEWSAPI_BASE_URL = 'https://newsapi.org/v2';

interface SearchOptions {
  query: string;
  language?: string;
  sortBy?: 'relevancy' | 'popularity' | 'publishedAt';
  pageSize?: number;
}

export class NewsAPIService {
  /**
   * NewsAPI'den haberler çek
   */
  static async searchNews(options: SearchOptions): Promise<NewsArticle[]> {
    if (!NEWSAPI_KEY) {
      throw new Error('NEWSAPI_KEY environment variable is not set');
    }

    try {
      const response = await axios.get<NewsResponse>(
        `${NEWSAPI_BASE_URL}/everything`,
        {
          params: {
            q: options.query,
            language: options.language || 'tr',
            sortBy: options.sortBy || 'publishedAt',
            pageSize: options.pageSize || 20,
            apiKey: NEWSAPI_KEY,
          },
          timeout: 10000, // 10 saniye timeout
        }
      );

      if (response.data.status === 'error') {
        console.error('NewsAPI Error:', response.data.message);
        return [];
      }

      return response.data.articles;
    } catch (error) {
      console.error('NewsAPI request error:', error);
      return [];
    }
  }

  /**
   * Türkiye haberlerini kategoriye göre çek
   */
  static async fetchNewsByCategory(
    category: 'realEstate' | 'finance' | 'economy'
  ): Promise<NewsArticle[]> {
    const queries = {
      realEstate: [
        'turkey real estate',
        'gayrimenkul haberleri',
        'konut fiyatları',
        'istanbul property',
        'turkey housing market',
      ],
      finance: [
        'turkey stock market',
        'borsa istanbul',
        'bist endeksi',
        'türkiye borsa haberleri',
      ],
      economy: [
        'turkey economy',
        'türkiye ekonomi',
        'enflasyon',
        'dolar kur',
        'faiz oranları',
      ],
    };

    const selectedQueries = queries[category];
    let allArticles: NewsArticle[] = [];

    for (const query of selectedQueries) {
      const articles = await this.searchNews({
        query,
        language: 'tr',
        sortBy: 'publishedAt',
        pageSize: 10,
      });

      allArticles = allArticles.concat(articles);

      // Rate limiting: Her istek arasında 500ms bekle
      await this.delay(500);
    }

    // Duplicate'ları kaldır (URL'ye göre)
    const uniqueArticles = this.deduplicateByUrl(allArticles);

    return uniqueArticles;
  }

  /**
   * Türkiye haberlerini merkez bankası haberleri araması
   */
  static async fetchCentralBankNews(): Promise<NewsArticle[]> {
    const queries = [
      'merkez bankası',
      'tcmb faiz',
      'para politikası',
      'merkez bankası kararı',
      'faiz kararı türkiye',
    ];

    let allArticles: NewsArticle[] = [];

    for (const query of queries) {
      const articles = await this.searchNews({
        query,
        language: 'tr',
        pageSize: 10,
      });

      allArticles = allArticles.concat(articles);
      await this.delay(500);
    }

    return this.deduplicateByUrl(allArticles);
  }

  /**
   * Haberler döndür ve parse et (Veritabanı için)
   */
  static async fetchAndParseNews(): Promise<ParsedNewsArticle[]> {
    try {
      // 3 kategori haberini paralel çek
      const [realEstateNews, financeNews, economyNews, cbNews] =
        await Promise.all([
          this.fetchNewsByCategory('realEstate'),
          this.fetchNewsByCategory('finance'),
          this.fetchNewsByCategory('economy'),
          this.fetchCentralBankNews(),
        ]);

      // Tümünü birleştir
      const allArticles = [
        ...realEstateNews,
        ...financeNews,
        ...economyNews,
        ...cbNews,
      ];

      // Deduplicate ve parse et
      const uniqueArticles = this.deduplicateByUrl(allArticles);
      const parsedArticles = uniqueArticles.map((article) =>
        this.parseArticle(article)
      );

      return parsedArticles;
    } catch (error) {
      console.error('Error fetching and parsing news:', error);
      return [];
    }
  }

  /**
   * Haber parse et (DB'ye kaydetmek için format)
   */
  private static parseArticle(article: NewsArticle): ParsedNewsArticle {
    return {
      title: article.title,
      description: article.description || '',
      content: article.content || '',
      article_url: article.url,
      image_url: article.urlToImage || null,
      category: this.categorizeArticle(article),
      published_at: new Date(article.publishedAt),
      source: article.source.name,
      importance_score: this.calculateImportance(article),
      is_featured: this.calculateImportance(article) > 0.75,
    };
  }

  /**
   * Haberi kategorize et
   */
  private static categorizeArticle(article: NewsArticle): NewsCategory {
    const content = `${article.title} ${article.description}`.toLowerCase();

    // Gayrimenkul
    if (
      content.includes('gayrimenkul') ||
      content.includes('emlak') ||
      content.includes('konut') ||
      content.includes('ev fiyat') ||
      content.includes('daire') ||
      content.includes('villa') ||
      content.includes('property') ||
      content.includes('real estate') ||
      content.includes('housing')
    ) {
      return 'gayrimenkul';
    }

    // Borsa
    if (
      content.includes('borsa') ||
      content.includes('endeks') ||
      content.includes('hisse') ||
      content.includes('bist') ||
      content.includes('stock') ||
      content.includes('market') ||
      content.includes('şirket')
    ) {
      return 'borsa';
    }

    // Merkez Bankası
    if (
      content.includes('merkez bankası') ||
      content.includes('tcmb') ||
      content.includes('faiz kararı') ||
      content.includes('para politikası') ||
      content.includes('policy rate')
    ) {
      return 'merkez_bankasi';
    }

    // Konut Kredisi
    if (
      content.includes('konut kredisi') ||
      content.includes('mortgage') ||
      content.includes('ev kredisi') ||
      content.includes('credit') ||
      content.includes('loan')
    ) {
      return 'konut_kredisi';
    }

    // Yatırım
    if (
      content.includes('yatırım') ||
      content.includes('invest') ||
      content.includes('getiri') ||
      content.includes('reit') ||
      content.includes('portfolio')
    ) {
      return 'yatirim';
    }

    // Ekonomi
    if (
      content.includes('ekonomi') ||
      content.includes('enflasyon') ||
      content.includes('dolar') ||
      content.includes('kur') ||
      content.includes('economy') ||
      content.includes('inflation')
    ) {
      return 'ekonomi';
    }

    return 'diger';
  }

  /**
   * Haber önemlilik skoru hesapla
   */
  private static calculateImportance(article: NewsArticle): number {
    const content = `${article.title} ${article.description}`.toLowerCase();

    const veryImportantKeywords = [
      'çöküş',
      'kriz',
      'kriz',
      'merkez bankası',
      'faiz kararı',
      'politika değişimi',
    ];

    const importantKeywords = [
      'fiyat artışı',
      'yükseliş',
      'düşüş',
      'kur',
      'dolar',
      'enflasyon',
      'ekonomi paketi',
      'yeni yasa',
      'yatırım teşvikleri',
      'büyük proje',
      'mega proje',
    ];

    let score = 0.5;

    // Çok önemli keywords (her biri +0.2)
    for (const keyword of veryImportantKeywords) {
      if (content.includes(keyword)) {
        score += 0.2;
      }
    }

    // Önemli keywords (her biri +0.1)
    for (const keyword of importantKeywords) {
      if (content.includes(keyword)) {
        score += 0.1;
      }
    }

    // Maksimum 1.0'a kadar
    return Math.min(score, 1.0);
  }

  /**
   * URL'ye göre duplicate'ları kaldır
   */
  private static deduplicateByUrl(articles: NewsArticle[]): NewsArticle[] {
    const seen = new Set<string>();
    return articles.filter((article) => {
      if (seen.has(article.url)) {
        return false;
      }
      seen.add(article.url);
      return true;
    });
  }

  /**
   * Gecikme fonksiyonu (Rate limiting için)
   */
  private static delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * API Status Kontrolü
   */
  static async checkApiStatus(): Promise<boolean> {
    try {
      const response = await axios.get<NewsResponse>(
        `${NEWSAPI_BASE_URL}/top-headlines`,
        {
          params: {
            country: 'tr',
            apiKey: NEWSAPI_KEY,
            pageSize: 1,
          },
          timeout: 5000,
        }
      );

      return response.data.status === 'ok';
    } catch (error) {
      console.error('API Status check failed:', error);
      return false;
    }
  }
}