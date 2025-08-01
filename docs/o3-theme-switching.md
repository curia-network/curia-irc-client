Below is everything you can currently drive from the URL when you open a The Lounge instance, followed by the practical ways you can still achieve automatic dark/light switching.

---

## 1 · Documented URL / query‑string parameters

The **only** officially supported query parameters are the *network‑override* helpers that preload the **Connect** dialog in public mode (or in private mode before the first login).
They do **not** affect user settings such as theme, layout, language, etc.

| parameter            | purpose                                                      | example                     |
| -------------------- | ------------------------------------------------------------ | --------------------------- |
| `name`               | Display name of the network in the sidebar (not sent to IRC) | `?name=MyNet`               |
| `host`               | IRC server / bouncer host                                    | `?host=irc.example.net`     |
| `port`               | Port (usually 6667 / 6697)                                   | `?port=6697`                |
| `tls`                | `"true"` or `"false"` – enable TLS                           | `?tls=true`                 |
| `rejectUnauthorized` | Whether to verify the TLS cert                               | `?rejectUnauthorized=false` |
| `nick`               | Initial nick                                                 | `?nick=alice`               |
| `username`           | Ident/username                                               | `?username=alice`           |
| `password`           | Server password or SASL secret                               | `?password=s3cret`          |
| `realname`           | “Real name” (gecos)                                          | `?realname=Alice`           |
| `join` or `channels` | Comma‑separated channel list; bare names get `#` prepended   | `?join=general,random`      |

Source: “Override network defaults in the URL” guide ([The Lounge][1])

> **No other parameters are parsed by the stock client.**
> In particular, there is *no* `theme`, `lang`, `view`, `layout` or similar knob.

---

## 2 · Why you can’t switch theme via URL (and what *does* work)

* **Theme preference is stored client‑side**, per user:

  * In **private mode** it is written to the user’s JSON (`users/<name>.json`) under the `theme` key.
  * In **public mode** it is kept in browser storage.
* The server‑side `config.js` only defines the **default** theme served to new/anonymous users ([The Lounge][2]).

Because that setting is read *after* the SPA has booted, a query‑string toggle is not part of the design.

### 2.1 Immediate work‑around — CSS media query

If your goal is “match Curia’s light/dark scheme automatically”, put both palettes in the same theme and switch with the standard media query:

```css
/* inside your theme.css */
:root {
  /* light palette here */
  --cg-bg: #ffffff;
  --cg-fg: #111827;
  ...
}

@media (prefers-color-scheme: dark) {
  :root {
    /* dark palette overrides */
    --cg-bg: #0f172a;
    --cg-fg: #f9fafb;
  }
}
```

Because The Lounge bundles your CSS verbatim, this *just works*; users never have to change the theme selector.
If you need brand tokens from Curia, expose them as CSS variables on the parent page and fall back in the theme.

### 2.2 Runtime switch via a tiny plugin (postMessage bridge)

If you must keep *two* separate themes (e.g., `cg-light` / `cg-dark`) you can still switch instantly:

```js
// cg-theme-bridge.js – install with `thelounge install cg-theme-bridge`
module.exports = {
  hooks: {
    mounted() {
      window.addEventListener("message", ev => {
        if (ev.data?.type === "cg:set-theme") {
          this.$store.commit("settings/update", {theme: ev.data.name});
          this.$socket.emit("setting:set", {name: "theme", value: ev.data.name});
        }
      });
    }
  }
}
```

Parent iframe usage:

```ts
childFrame.contentWindow.postMessage({type:"cg:set-theme", name:"cg-dark"}, "*");
```

That gives you a **one‑line** toggle with no page reload; the setting persists like any manual change.

---

## 3 · Other integration‑relevant tips

| feature                                         | how to drive it                                                                                                                                                     |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Auto‑joining rooms**                          | Use `?join=room1,room2` when you deep‑link users to your Lounge instance ([The Lounge][1]).                                                                         |
| **Setting the global default theme**            | `config.js → client → theme: "cg-light"` (falls back to `default`) ([The Lounge][2]).                                                                               |
| **Quick stylistic tweaks** without a full theme | Settings → *Advanced* → “Custom Stylesheet” accepts any CSS snippet and is stored per‑user ([The Lounge][3]).                                                       |
| **Detecting OS‑level dark mode**                | Rely on `prefers-color-scheme` in your theme or call `window.matchMedia("(prefers-color-scheme: dark)").matches` in a plugin and switch with the code sample above. |

---

### What to tell your Cursor AI pair‑programmer

1. **No native `?theme=` parameter exists** – all documented params are in the table above.
2. Decide between:

   * *single adaptive theme* (CSS media query) **or**
   * *two distinct themes* + 20‑line plugin listening for `postMessage` from Curia.
3. If you need to pre‑connect users, append the network‑override params (`host`, `nick`, `join`, …).
4. Remember to list your custom theme packages (`thelounge-theme-…`) in your Railway Dockerfile so `thelounge install` runs during build.

That gives you a friction‑free dark/light switch that plays nicely whether the client is running stand‑alone or embedded in Curia.

[1]: https://thelounge.chat/docs/guides/network-overrides "Override network defaults in the URL — The Lounge"
[2]: https://thelounge.chat/docs/configuration "Configuration — The Lounge"
[3]: https://thelounge.chat/docs/guides/custom-css?utm_source=chatgpt.com "Customize The Lounge on-the-fly using CSS"
