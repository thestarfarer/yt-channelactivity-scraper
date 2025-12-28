# YouTube Channel OSINT

Monitor YouTube channels: community posts, videos, and live streams.

Built for keeping tabs on VTubers and other creators. Pulls data via the internal YouTube API. Authenticated cookies let you see members-only content if you're subscribed.

## Scripts

| Script | Output | Use Case |
|--------|--------|----------|
| `osint.mjs` | Clean text to stdout | Quick status check, piping to other tools |
| `scrape.mjs` | `community_posts.json` | Community posts with full metadata |
| `videos.mjs` | `recent_videos.json` | Videos + streams with thumbnails, views, duration |

## Quick Start

```bash
npm install

# Add your cookies (see below)
cp cookies.example.txt cookies.txt

# Edit channels in the script you want to run
# Then:
node osint.mjs 2>/dev/null     # Text summary
node scrape.mjs 2>/dev/null    # Posts JSON
node videos.mjs 2>/dev/null    # Videos JSON
```

Always redirect stderr (`2>/dev/null`) — the library is chatty.

## Output Examples

### osint.mjs
```
# Channel Name
Posts:
- Full post text here (3 weeks ago)
- Another post (2 months ago)
Videos:
- Video title — 9 days ago
Streams:
- [LIVE] Currently live stream — now
- [UPCOMING] Scheduled stream — in 2 hours
- Past stream title — 4 days ago
```

### scrape.mjs
```json
{
  "Channel Name": [
    {
      "id": "post_id",
      "date": "3 weeks ago",
      "text": "Post content...",
      "likes": "288",
      "hasImage": true,
      "imageUrls": ["https://..."]
    }
  ]
}
```

### videos.mjs
```json
{
  "Channel Name": {
    "videos": [
      {
        "id": "dQw4w9WgXcQ",
        "title": "Video title",
        "type": "video",
        "duration": "3:32",
        "views": "1.2M views",
        "published": "2 days ago",
        "url": "https://youtube.com/watch?v=dQw4w9WgXcQ"
      }
    ],
    "streams": [
      {
        "id": "...",
        "title": "Stream title",
        "type": "live",
        "duration": "live",
        "views": "1.2K watching"
      }
    ]
  }
}
```

## Configuration

Each script has a `CHANNELS` array at the top:

```javascript
const CHANNELS = [
  { name: 'Channel Name', id: 'UCxxxxxxxxxxxxxxxxxxxxxxx' },
];
```

And limits you can adjust:
```javascript
const MAX_POSTS = 10;   // scrape.mjs, osint.mjs
const MAX_VIDEOS = 5;   // videos.mjs, osint.mjs
const MAX_STREAMS = 5;  // videos.mjs, osint.mjs
```

## Getting Channel IDs

- From URL: `youtube.com/channel/UCxxxxxxxxxxxxxxxxxxxxxxx`
- From page source: search for `"channelId"` or `"externalId"`
- From DevTools: Network tab → filter `browse` → check request payloads

## Cookies

**Critical**: YouTube binds session cookies to whichever Google account was logged in *first* in that browser session. The account switcher doesn't change the underlying session.

To get working cookies:

1. Open browser in **incognito/private mode**
2. Log in with **only** the account that has memberships
3. Export cookies (browser extension or DevTools → Application → Cookies)
4. Save to `cookies.txt` in Netscape format

Required cookies: `SID`, `HSID`, `SSID`, `APISID`, `SAPISID`, `LOGIN_INFO`, and all `__Secure-*` variants.

### Cookie Expiration

Cookies expire after a few weeks. Signs of expired cookies:
- Empty results for channels you have membership to
- Authentication errors in responses

Re-export from a fresh browser session when this happens.

## Technical Notes

- Uses `youtubei.js` for YouTube innertube API access
- Community posts use a raw API call (`yt.actions.execute`) because the library's parser breaks on certain response structures
- The magic params `EgVwb3N0c_IGBAoCSgA=` decode to the community posts tab
- Stream types detected: `live` (currently streaming), `upcoming` (scheduled), `stream` (past VOD), `video` (regular upload)

## Requirements

- Node.js 18+
- Authenticated session cookies
- Active membership (only needed if you want members-only posts/videos)

## License

MIT
