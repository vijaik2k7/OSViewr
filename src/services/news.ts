export type NewsItem = {
    id: string;
    title: string;
    link: string;
    pubDate: string;
    timestamp: number;
    source: string;
};

export type NewsFeedType = 'bbc' | 'nyt' | 'un' | 'aj' | 'guardian' | 'nasa';

const FEED_CONFIGS: Record<NewsFeedType, { url: string, name: string }> = {
    bbc: { url: '/api/news/bbc/news/world/rss.xml', name: 'BBC World News' },
    nyt: { url: '/api/news/nyt/services/xml/rss/nyt/World.xml', name: 'NYT World' },
    un: { url: '/api/news/un/feed/subscribe/en/news/all/rss.xml', name: 'UN News Global' },
    aj: { url: '/api/news/aj/xml/rss/all.xml', name: 'Al Jazeera' },
    guardian: { url: '/api/news/guardian/world/rss', name: 'The Guardian' },
    nasa: { url: '/api/news/nasa-breaking/news-release/feed/', name: 'NASA News' }
};

export const fetchNewsFeed = async (feedType: NewsFeedType): Promise<NewsItem[]> => {
    try {
        const config = FEED_CONFIGS[feedType];
        const res = await fetch(config.url);

        if (!res.ok) {
            throw new Error(`Failed to fetch ${config.name} RSS feed`);
        }

        const xmlString = await res.text();
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlString, 'text/xml');

        // Parse standard RSS <item> tags
        const items = Array.from(xmlDoc.querySelectorAll('item'));

        const newsItems: NewsItem[] = items.map((item, index) => {
            const title = item.querySelector('title')?.textContent || 'Breaking News';
            const link = item.querySelector('link')?.textContent || '#';
            const pubDateStr = item.querySelector('pubDate')?.textContent || '';

            // Format pub date nicely if possible
            let pubDate = '';
            let timestamp = 0;
            if (pubDateStr) {
                try {
                    const d = new Date(pubDateStr);
                    timestamp = d.getTime();
                    pubDate = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                } catch (e) {
                    pubDate = pubDateStr;
                }
            }

            return {
                id: `${feedType}-${index}-${Date.now()}`,
                title,
                link,
                pubDate,
                timestamp,
                source: config.name
            };
        });

        // Sort by timestamp ascending (latest at bottom)
        return newsItems.sort((a, b) => a.timestamp - b.timestamp);
    } catch (e) {
        console.error('RSS Fetch Error:', e);
        return [];
    }
};
