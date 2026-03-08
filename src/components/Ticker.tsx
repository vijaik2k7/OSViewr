import { useEffect, useState } from 'react';
import { fetchNewsFeed, type NewsItem, type NewsFeedType } from '../services/news';
import { RadioTower, Activity, ChevronUp, ChevronDown } from 'lucide-react';

export default function Ticker() {
    const [news, setNews] = useState<NewsItem[]>([]);
    const [activeFeed, setActiveFeed] = useState<NewsFeedType>('bbc');
    const [isLoading, setIsLoading] = useState(true);
    const [isExpanded, setIsExpanded] = useState(false);

    const feeds: { id: NewsFeedType; label: string }[] = [
        { id: 'bbc', label: 'BBC World' },
        { id: 'nyt', label: 'NYT World' },
        { id: 'aj', label: 'Al Jazeera' },
        { id: 'guardian', label: 'The Guardian' },
        { id: 'un', label: 'UN News' },
        { id: 'nasa', label: 'NASA' },
        { id: 'hn', label: 'Hacker News' }
    ];

    useEffect(() => {
        let mounted = true;

        const loadFeed = async () => {
            setIsLoading(true);
            const items = await fetchNewsFeed(activeFeed);
            if (mounted) {
                setNews(items);
                setIsLoading(false);
            }
        };

        if (isExpanded || news.length === 0) {
            loadFeed();
        }

        // Refresh every 5 minutes
        const interval = setInterval(loadFeed, 300000);

        return () => {
            mounted = false;
            clearInterval(interval);
        };
    }, [activeFeed, isExpanded]);

    return (
        <div className={`ticker-wrapper glass-panel ${isExpanded ? 'expanded' : 'collapsed'}`}>
            <div className="ticker-header" onClick={() => setIsExpanded(!isExpanded)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <RadioTower size={16} className={isExpanded ? 'ticker-icon active' : 'ticker-icon'} style={{ color: isExpanded ? 'var(--accent-hover)' : 'var(--text-secondary)' }} />
                    <span style={{ fontSize: '0.85rem', fontWeight: 500, color: isExpanded ? 'var(--text-primary)' : 'var(--text-secondary)' }}>World Events Feed</span>
                </div>
                {isExpanded ? <ChevronUp size={16} color="var(--text-secondary)" /> : <ChevronDown size={16} color="var(--text-secondary)" />}
            </div>

            {isExpanded && (
                <>
                    <div className="ticker-controls">
                        <div className="feed-selectors">
                            {feeds.map(feed => (
                                <button
                                    key={feed.id}
                                    className={`feed-btn ${activeFeed === feed.id ? 'active' : ''}`}
                                    onClick={() => setActiveFeed(feed.id)}
                                >
                                    {feed.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="ticker-scroll-container vertical">
                        {isLoading ? (
                            <div className="ticker-loading">
                                <Activity className="animate-pulse" size={14} style={{ marginRight: '8px' }} />
                                Fetching live feed...
                            </div>
                        ) : news.length > 0 ? (
                            <div className="ticker-track vertical-track">
                                {/* Duplicate the news track to create a seamless infinite loop */}
                                {news.concat(news).map((item, i) => (
                                    <a
                                        key={`${item.id}-${i}`}
                                        href={item.link}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="ticker-item vertical-item"
                                        title={`Source: ${item.source}`}
                                    >
                                        <span className="ticker-time">{item.pubDate}</span>
                                        <span className="ticker-title">{item.title}</span>
                                    </a>
                                ))}
                            </div>
                        ) : (
                            <div className="ticker-loading" style={{ color: '#ef4444' }}>
                                Feed unavailable. Try another.
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
