# rehttp
very small overlay on top of node http

# Usage

## hacker-news top 10 stories (ES7)

```js
let rehttp = require('rehttp');
let endpoint = 'https://hacker-news.firebaseio.com/v0';
async function getTop10Stories() {
  try {
    let { body, status } = await rehttp
      .request({ url: `${endpoint}/topstories.json` });
    let ids = [];
    if (status === 200) {
      ids = JSON.parse(body).slice(0, 10);
    }
    let stories = [];
    for (let id of ids) {
      let { body, status } = await rehttp
        .request({ url: `${endpoint}/item/${id}.json` });
      if (status === 200) {
        stories.push(JSON.parse(body));
      }
    }
    return stories;
  } catch (err) {
    // Network error
  }
}
```
