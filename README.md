# YouTube Members-Only Posts Scraper

Extracts members-only community posts from YouTube channels using cookie authentication.

## Requirements

- Node.js 18+
- Active YouTube membership for target channels
- Cookies from authenticated session

## Installation

```bash
npm install
```

## Usage

1. Export cookies from a browser session where **only your member account** is logged in (critical - YouTube binds session to first logged-in account)

2. Create `cookies.txt` with your cookies (see `cookies.example.txt` for format)

3. Edit `scrape.mjs` to add target channel IDs:
```javascript
const CHANNELS = [
  { name: 'Channel Name', id: 'UCxxxxxxxxxxxxxxxxxxxxxxx' },
];
```

4. Run:
```bash
node scrape.mjs
```

Output saves to `members_posts.json`

## Getting Channel IDs

- Go to channel page → View Page Source → search for `channelId` or `browse_id`
- Or use: `https://www.youtube.com/channel/CHANNEL_ID_HERE`

## Getting Cookies

1. Open browser in incognito/private mode
2. Log in to YouTube with **only** your member account (no account switching)
3. Export cookies using browser extension or DevTools:
   - DevTools → Application → Cookies → youtube.com
   - Copy values for: `SID`, `HSID`, `SSID`, `APISID`, `SAPISID`, `LOGIN_INFO`, and all `__Secure-*` variants

**Important**: If you have multiple Google accounts, YouTube binds the session cookies to whichever account was logged in first. The account switcher in YouTube's UI doesn't change the underlying session. Always use a fresh browser session with only the member account.

## Key Endpoints Discovered

| Params | Decodes To | Description |
|--------|-----------|-------------|
| `EgVwb3N0c_IGBAoCSgA=` | `posts` | Full members-only posts archive |
| `EgptZW1iZXJzaGlwuAEA...` | `membership` | Membership page (preview, ~5 posts) |
| `EgZ2aWRlb3PyBgQKAjoA` | `videos` | Members-only videos |

## Output Format

```json
{
  "Channel Name": [
    {
      "id": "post_id",
      "date": "3 weeks ago",
      "text": "Post content...",
      "likes": "288",
      "hasImage": true,
      "imageUrls": "https://..." 
    }
  ]
}
```

## Cookie Expiration

Cookies typically expire after a few weeks. Signs of expired cookies:
- Empty results for channels you have membership to
- Authentication errors in response

Refresh by exporting new cookies from a fresh browser session.

## Technical Notes

- Uses `youtubei.js` library with raw API calls (`yt.actions.execute`) to bypass parser limitations
- Recursive post extraction handles varying response structures
- Follows continuation tokens automatically for full archive retrieval
- Member status changes response structure enough to break the library's standard `getChannel()` parser - raw JSON extraction is more reliable

## License

MIT
