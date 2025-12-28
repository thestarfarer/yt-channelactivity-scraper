import { Innertube } from 'youtubei.js';
import fs from 'fs';

// ============================================================================
// CONFIGURATION
// ============================================================================

const COOKIES = fs.readFileSync('./cookies.txt', 'utf-8').trim();

const CHANNELS = [
  { name: 'Channel Name', id: 'UCxxxxxxxxxxxxxxxxxxxxxxx' },
  // { name: 'Another Channel', id: 'UCyyyyyyyyyyyyyyyyyyyyyyy' },
];

const MAX_POSTS = 3;    // Community posts to fetch
const MAX_VIDEOS = 3;   // Recent videos
const MAX_STREAMS = 5;  // Recent streams (including live/upcoming)

// ============================================================================
// HELPERS
// ============================================================================

function findPosts(obj, posts = []) {
  if (!obj || typeof obj !== 'object') return posts;
  if (obj.backstagePostRenderer) posts.push(obj.backstagePostRenderer);
  for (const val of Object.values(obj)) findPosts(val, posts);
  return posts;
}

function extractPost(p) {
  return {
    text: p.contentText?.runs?.map(r => r.text).join('') || '',
    date: p.publishedTimeText?.runs?.[0]?.text || 'unknown'
  };
}

function extractVideo(v) {
  const published = v.published?.text || 'unknown';
  const wasStreamed = published.toLowerCase().includes('streamed');
  const date = published.replace('Streamed ', '');
  
  let type;
  if (v.is_live) type = 'live';
  else if (v.is_upcoming) type = 'upcoming';
  else if (wasStreamed) type = 'stream';
  else type = 'video';

  return {
    title: v.title?.text || '',
    type,
    date
  };
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  const yt = await Innertube.create({ cookie: COOKIES });

  for (const ch of CHANNELS) {
    console.log('# ' + ch.name);
    
    // Community posts
    const postsResp = await yt.actions.execute('/browse', {
      browseId: ch.id,
      params: 'EgVwb3N0c_IGBAoCSgA='
    });
    const posts = findPosts(postsResp.data).slice(0, MAX_POSTS).map(extractPost);
    
    console.log('Posts:');
    for (const p of posts) {
      console.log('- ' + p.text.replace(/\n/g, ' ') + ' (' + p.date + ')');
    }
    
    // Videos and streams
    const channel = await yt.getChannel(ch.id);
    
    const videosTab = await channel.getVideos();
    const videos = videosTab.videos.slice(0, MAX_VIDEOS).map(extractVideo);
    
    let streams = [];
    try {
      const liveTab = await channel.getLiveStreams();
      streams = liveTab.videos.slice(0, MAX_STREAMS).map(extractVideo);
    } catch (e) {
      // Channel has no live tab
    }
    
    console.log('Videos:');
    for (const v of videos) {
      console.log('- ' + v.title + ' — ' + v.date);
    }
    
    console.log('Streams:');
    for (const s of streams) {
      const prefix = s.type === 'live' ? '[LIVE] ' : (s.type === 'upcoming' ? '[UPCOMING] ' : '');
      console.log('- ' + prefix + s.title + ' — ' + s.date);
    }
    
    console.log('');
  }
}

main().catch(console.error);
