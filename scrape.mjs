import { Innertube } from 'youtubei.js';
import fs from 'fs';

// ============================================================================
// CONFIGURATION
// ============================================================================

const COOKIES = fs.readFileSync('./cookies.txt', 'utf-8').trim();
const MAX_POSTS = 10;  // Posts to fetch per channel (most recent)

const CHANNELS = [
  { name: 'Channel Name', id: 'UCxxxxxxxxxxxxxxxxxxxxxxx' },
  // { name: 'Another Channel', id: 'UCyyyyyyyyyyyyyyyyyyyyyyy' },
];

const OUTPUT_FILE = 'community_posts.json';

// ============================================================================
// SCRAPER
// ============================================================================

function findPosts(obj, posts = []) {
  if (!obj || typeof obj !== 'object') return posts;
  if (obj.backstagePostRenderer) posts.push(obj.backstagePostRenderer);
  for (const val of Object.values(obj)) findPosts(val, posts);
  return posts;
}

function extractPost(p) {
  const singleImage = p.backstageAttachment?.backstageImageRenderer?.image?.thumbnails?.slice(-1)?.[0]?.url;
  const multiImages = p.backstageAttachment?.postMultiImageRenderer?.images?.map(i => 
    i.backstageImageRenderer?.image?.thumbnails?.slice(-1)?.[0]?.url
  ).filter(Boolean);

  return {
    id: p.postId,
    date: p.publishedTimeText?.runs?.[0]?.text || 'unknown',
    text: p.contentText?.runs?.map(r => r.text).join('') || '',
    likes: p.voteCount?.simpleText || p.voteCount?.accessibility?.accessibilityData?.label || '?',
    hasImage: !!(p.backstageAttachment?.backstageImageRenderer || p.backstageAttachment?.postMultiImageRenderer),
    imageUrls: multiImages?.length ? multiImages : singleImage || null
  };
}

async function scrapeAllChannels() {
  console.log('Initializing YouTube client...');
  const yt = await Innertube.create({ cookie: COOKIES });
  
  const output = {};

  for (const ch of CHANNELS) {
    console.log(`\n=== ${ch.name} ===`);
    
    const response = await yt.actions.execute('/browse', {
      browseId: ch.id,
      params: 'EgVwb3N0c_IGBAoCSgA='  // community posts tab
    });

    const allPosts = findPosts(response.data);
    const posts = allPosts.slice(0, MAX_POSTS);
    
    console.log(`  Found ${allPosts.length}, keeping top ${posts.length}`);
    output[ch.name] = posts.map(extractPost);
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));
  console.log(`\n✓ Saved to ${OUTPUT_FILE}`);
}

scrapeAllChannels().catch(console.error);
