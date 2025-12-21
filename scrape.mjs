import { Innertube } from 'youtubei.js';
import fs from 'fs';

// ============================================================================
// CONFIGURATION
// ============================================================================

// Load cookies from file or paste directly
const COOKIES = fs.existsSync('./cookies.txt') 
  ? fs.readFileSync('./cookies.txt', 'utf-8').trim()
  : `PASTE_YOUR_COOKIES_HERE`;

// Add channels to scrape (get ID from channel page source)
const CHANNELS = [
  { name: 'Channel Name', id: 'UCxxxxxxxxxxxxxxxxxxxxxxx' },
  // { name: 'Another Channel', id: 'UCyyyyyyyyyyyyyyyyyyyyyyy' },
];

// Output filename
const OUTPUT_FILE = 'members_posts.json';

// ============================================================================
// SCRAPER LOGIC (no need to modify)
// ============================================================================

// Recursively find all backstagePostRenderer objects in response
function findPosts(obj, posts = []) {
  if (!obj || typeof obj !== 'object') return posts;
  if (obj.backstagePostRenderer) posts.push(obj.backstagePostRenderer);
  for (const val of Object.values(obj)) findPosts(val, posts);
  return posts;
}

// Extract continuation token for pagination
function findContinuation(obj) {
  const str = JSON.stringify(obj);
  const match = str.match(/"continuationCommand"[^}]*"token"\s*:\s*"([^"]+)"/);
  return match?.[1];
}

// Transform raw post data into clean format
function extractPost(p) {
  // Handle single image
  const singleImage = p.backstageAttachment?.backstageImageRenderer?.image?.thumbnails?.slice(-1)?.[0]?.url;
  
  // Handle multiple images
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

// Main scraper
async function scrapeAllChannels() {
  console.log('Initializing YouTube client...');
  const yt = await Innertube.create({ cookie: COOKIES });
  
  const output = {};

  for (const ch of CHANNELS) {
    console.log(`\n=== ${ch.name} ===`);
    const posts = [];
    let page = 1;

    // Initial request - members-only posts endpoint
    console.log(`  Page ${page}...`);
    let response = await yt.actions.execute('/browse', {
      browseId: ch.id,
      params: 'EgVwb3N0c_IGBAoCSgA='  // members-only posts
    });

    posts.push(...findPosts(response.data));
    let cont = findContinuation(response.data);

    // Follow continuation tokens until exhausted
    while (cont) {
      page++;
      console.log(`  Page ${page}...`);
      response = await yt.actions.execute('/browse', { continuation: cont });
      posts.push(...findPosts(response.data));
      cont = findContinuation(response.data);
    }

    console.log(`  Total: ${posts.length} posts`);
    output[ch.name] = posts.map(extractPost);
  }

  // Save output
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));
  console.log(`\n✓ Saved to ${OUTPUT_FILE}`);

  // Summary
  console.log('\n=== SUMMARY ===');
  let total = 0;
  for (const [name, posts] of Object.entries(output)) {
    console.log(`${name}: ${posts.length} posts`);
    total += posts.length;
  }
  console.log(`Total: ${total} posts`);
}

// Run
scrapeAllChannels().catch(console.error);
