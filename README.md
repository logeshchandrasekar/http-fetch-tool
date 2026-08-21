<div align="center">

# HTTP Fetch Tool 🔍

**Paste the link & See what's actually there.**

* A browser tool that fetches any URL and renders the response as clean, readable text — from JSON, XML, HTML, or plain text.

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black)
<br>
![No Build Step](https://img.shields.io/badge/build_step-none-6fafa0?style=flat-square)
![Dependencies](https://img.shields.io/badge/dependencies-zero-e3a867?style=flat-square)

</div>

---

## - What it does

| Step | Action |
|------|--------|
| 1️⃣ | Paste a URL into the input box and hit **Fetch** |
| 2️⃣ | Your browser makes the request directly (client-side `fetch`) |
| 3️⃣ | The response is auto-detected and converted to readable text |
| 4️⃣ | Status, size, and timing show up in a live badge row |
| 5️⃣ | Copy the raw output with one click |

## - Format handling

| Format | Result |
|--------|--------|
| 🟨 JSON | Pretty-printed + syntax highlighted |
| 🟦 XML / HTML | Indented + tag highlighted |
| ⬜ Plain text | Shown as-is |
| 🟥 Binary (images, PDFs, etc.) | Flagged, not dumped as garbage |

## - Usage

No build step, no dependencies, no `npm install`. Just open `fetch-inspector.html` in a browser.

Try it with URLs that allow cross-origin requests, e.g.:

```
https://jsonplaceholder.typicode.com/todos/1
https://api.github.com/users/octocat
https://httpbin.org/xml
```

## ⚠️ A note on CORS

This tool fetches directly from the browser, so it only works against URLs whose servers explicitly allow cross-origin requests (CORS). Many public sites don't, and the browser blocks the response before this page ever sees it — that's a browser security rule, not a bug here.

> - **Next step idea:** add a small backend proxy (Node/Express or FastAPI) to fetch server-side and route around this limitation.

## - Tech stack

Vanilla **HTML**, **CSS**, and **JavaScript** — self-contained file, no framework or build tooling.

---

<div align="center">
<sub>Built as a personal project · no frameworks harmed in the making of this tool</sub>
</div>
