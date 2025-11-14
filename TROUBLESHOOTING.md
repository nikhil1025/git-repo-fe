# Troubleshooting

## "Disallowed MIME type" when navigating to `/data`

The Angular router lazy-loads the Data View feature. When the dev server restarts or its cache is cleared, the generated chunk file name changes (for example `chunk-ALGXLEXZ.js`). Browsers that still hold on to an older `main.js` try to fetch the previous chunk (`chunk-5XKUISDB.js` in the error message). The request falls back to `index.html`, which is served as `text/html`, so the browser blocks the module load.

### Fix locally

1. Stop every running dev server on port 4200:
   ```bash
   lsof -i :4200
   kill -9 <PID>
   ```
2. Clear cached build artifacts and restart the dev server:
   ```bash
   npm run clean
   npm start
   ```
3. Hard refresh the browser (or clear the application cache/Service Workers) so a fresh `main.js` is downloaded.

### Verify

You can confirm the chunk exists with curl:

```bash
curl -I http://localhost:4200/chunk-ALGXLEXZ.js  # replace with your current chunk name
```

A `200 OK` with `Content-Type: text/javascript` confirms the module is being served correctly.
