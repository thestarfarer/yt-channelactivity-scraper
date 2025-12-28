import { Innertube } from 'youtubei.js';
import fs from 'fs';

// ============================================================================
// CONFIGURATION
// ============================================================================

const COOKIES = fs.readFileSync('./cookies.txt', 'utf-8').trim();
const MAX_VIDEOS = 5;   // Recent videos to fetch
const MAX_STREAMS = 5;  // Recent streams (including live/upcoming)

const CHANNELS = [
  { name: 'Channel Name', id: 'UCxxxxxxxxxxxxxxxxxxxxxxx' },
  // { name: 'Another Channel', id: 'UCyyyyyyyyyyyyyyyyyyyyyyy' },
];

const OUTPUT_FILE = 'recent_videos.json';

// ============================================================================
// SCRAPER
// ============================================================================

function extractVideo(v) {
  const published = v.published?.text || 'unknown';
  const wasStreamed = published.toLowerCase().includes('streamed');
  
  let type;
  if (v.is_live) type = 'live';
  else if (v.is_upcoming) type = 'upcoming';
  else if (wasStreamed) type = 'stream';
  else type = 'video';

  return {
    id: v.id,
    title: v.title?.text || v.title?.toString() || '',
    type,
    duration: v.duration?.text || (v.is_live ? 'live' : (v.is_upcoming ? 'scheduled' : 'stream')),
    views: v.view_count?.text || v.short_view_count?.text || '?',
    published,
    thumbnail: v.thumbnails?.[0]?.url || null,
    url: 'https://youtube.com/watch?v=' + v.id
  };
}

async function scrapeVideos() {
  console.log('Initializing YouTube client...');
  const yt = await Innertube.create({ cookie: COOKIES });
  
  const output = {};

  for (const ch of CHANNELS) {
    console.log('\n=== ' + ch.name + ' ===');
    
    const channel = await yt.getChannel(ch.id);
    
    const videosTab = await channel.getVideos();
    const videos = videosTab.videos.slice(0, MAX_VIDEOS).map(extractVideo);
    
    let streams = [];
    try {
      const liveTab = await channel.getLiveStreams();
      streams = liveTab.videos.slice(0, MAX_STREAMS).map(extractVideo);
    } catch (e) {
      console.log('  (No live streams tab)');
    }
    
    console.log('  Videos: ' + videos.length + ', Streams: ' + streams.length);
    
    output[ch.name] = { videos, streams };
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));
  console.log('\n✓ Saved to ' + OUTPUT_FILE);
}

scrapeVideos().catch(console.error);
