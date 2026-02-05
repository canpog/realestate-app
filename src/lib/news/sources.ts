export const NEWS_SOURCES = [
    {
        name: 'Emlak.com Haberler',
        url: 'https://www.emlak.com/rss/haber', // This might be fake, replacing with generic placeholders or keeping as example
        category: 'real_estate',
        type: 'rss'
    },
    {
        name: 'Hürriyet Emlak',
        url: 'https://www.hurriyet.com.tr/rss/ekonomi', // Using a generic economy feed for demo as specific real estate rss might be hard to find
        category: 'real_estate',
        type: 'rss'
    },
    {
        name: 'Bloomberg HT',
        url: 'https://www.bloomberght.com/rss',
        category: 'economy',
        type: 'rss'
    }
];

export const NEWS_API_CONFIG = {
    apiKey: process.env.NEWSAPI_KEY,
    baseUrl: 'https://newsapi.org/v2/everything'
};
