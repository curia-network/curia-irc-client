Thanks! I’ll investigate the Stylesheets API in The Lounge IRC client repository and across the broader web, focusing on the latest stable version. I’ll look into whether the API exists, its methods, plugin lifecycle hooks, per-client CSS injection capabilities, URL parameter access, and real-world examples. I’ll update you with a structured report shortly.


## Stylesheets API Findings

### API Existence: YES

The Lounge does implement a **Stylesheets API** for plugins. It was introduced around version 2.7.0 as the first plugin API feature, allowing custom CSS injection. In the current stable version, the Stylesheets API **exists and is functional**. Its purpose is to let plugins feed custom CSS files to all clients of a Lounge instance. The official documentation confirms this and provides an example usage in a plugin’s code. The implementation in The Lounge’s source shows a `Stylesheets` object in the plugin API with a method to register CSS files (see below).

### API Methods Found:

* **`thelounge.Stylesheets.addFile(filename)`** – Registers a CSS file (by name/path) to be served to clients. When called (typically during plugin initialization), The Lounge will include the contents of that CSS file for **all connected clients**. Internally, calling `Stylesheets.addFile("file.css")` adds the file to a list of static files to serve, using the plugin’s package name as a prefix. There do not appear to be other Stylesheets API methods; **`addFile` is the primary method** for injecting custom styles.

* *(Related APIs for completeness)*: The plugin system also provides a `PublicFiles` API (`add()` method) to serve static files (images, etc.), and other server APIs like `Commands.add()`, `Config.getConfig()`, `Logger.debug()` etc., as seen in the plugin API object construction. However, these are not directly for CSS, except that theme packages use `PublicFiles.add` under the hood to serve theme CSS files.

### Plugin Lifecycle Hooks:

The Lounge’s plugin architecture is **limited in lifecycle hooks**. The primary (and currently only) lifecycle hook for plugins is `onServerStart`. When The Lounge server starts up (or when a plugin is hot-loaded), it calls the plugin’s exported `onServerStart` function, passing in the Lounge API object. There is **no built-in `onClientConnect` or per-client hook** available in the stable API. The source code confirms that after loading a plugin module, The Lounge simply calls `packageFile.onServerStart(api)` if that function exists. This happens once at server start (or plugin load time), not on every client connection.

In practice, plugin code is structured as:

```js
module.exports = {
  onServerStart: api => {
    // e.g. register commands or styles here
    api.Stylesheets.addFile("custom.css");
    // other plugin setup...
  }
};
```

There are **no documented hooks for client connection events or per-request initialization** in the current plugin API. All plugins share the single global context provided in `onServerStart`. (For example, the Commands API example above uses onServerStart to register a `/helloworld` command.)

### URL Parameter Access:

**Plugins cannot directly access HTTP request data or URL query parameters via the official API.** The Lounge does accept certain URL parameters in public mode (e.g. `?join=` to auto-join channels) as a built-in feature, but these are handled internally by the client/server and are limited to network connection settings. There is **no plugin hook** to intercept arbitrary query parameters in the page request or WebSocket handshake. The `onServerStart` hook does not receive any request context – it only receives the Lounge API object. Likewise, there is no `onClientConnect` where one could inspect `req` or headers.

In other words, a plugin cannot natively detect `?cg_theme=light` vs `?cg_theme=dark` on a per-client basis through the provided API. The Lounge’s server code that serves the index page ignores query parameters by default (the `indexRequest` simply serves the template with config, not aware of custom queries). All plugin-provided CSS files are included globally for all clients, with no conditional logic per request in the standard implementation.

**Workarounds:** In theory, one could attempt a custom modification or use the Public Client API to send a signal to the browser, but the client would need custom code to act on it. The Public Client API (`sendToBrowser`, etc.) is not designed for altering CSS or theme on the fly – it’s more for sending messages or simulating commands. Without modifying The Lounge’s client code, a plugin cannot apply different CSS based on a URL param out of the box.

### Working Examples:

* **Official Stylesheets API Example:** The documentation provides a simple example plugin that uses `thelounge.Stylesheets.addFile("file.css")` in `onServerStart`. This would load *file.css* (which must be included in the plugin package) and apply it to all clients on the server. The CSS is served at runtime via a built-in route (`/packages/<pluginName>/<file.css>`) and injected into the client’s HTML. Internally, The Lounge collects all plugin stylesheet files and adds corresponding `<link>` tags in the page template for all users.

* **Theme Packages:** Themes in The Lounge are a special type of “package”. They don’t use `onServerStart` but declare their CSS file in the package metadata. For example, a theme package’s `package.json` might include `"thelounge": { "type": "theme", "files": ["theme.css"], "name": "MyTheme" }`. The Lounge core detects theme packages and automatically registers their CSS file to be served (using the same mechanism as Stylesheets API). Users can then select the theme in their client settings (which causes the client to load that CSS). This is a **global setting per user, not via URL param**, but it demonstrates the use of the Stylesheets/PublicFiles system.

* **Other Plugins:** Most existing The Lounge plugins are focused on adding commands or functionality (for example, a shortcuts/aliases plugin or a GIF retrieval plugin) and do not inject custom CSS. In our research, we did not find publicly available plugins that dynamically switch themes based on URL parameters – likely because the API doesn’t directly support per-client customization. The Lounge’s “Customize on-the-fly using CSS” guide instead suggests users manually paste CSS in their settings for custom tweaks, underscoring that dynamic runtime theming isn’t a built-in feature.

### Conclusion:

**Dynamic CSS injection per client (e.g. light vs dark based on a URL query) is not natively supported by The Lounge’s current plugin API.** The Stylesheets API can only inject global CSS that applies to all clients. There is no official mechanism to target specific users or sessions with different styles. Plugins also cannot read URL parameters or request headers to make decisions on a per-client basis under the standard API.

For the use case of switching themes via `?cg_theme=...` in the URL, this means a plugin alone is insufficient to achieve true dynamic theming for each client. All clients would receive any CSS added through `Stylesheets.addFile`. Implementing the desired behavior would require a workaround. Possible approaches could be: shipping two CSS files (light/dark) and using client-side logic to toggle one off (for example, adding a CSS class to `<body>` via a custom client script), or extending The Lounge source itself to handle the parameter (not trivial). Without changes to The Lounge core, **any CSS file added through the plugin will be delivered to all users uniformly**.

In summary, the Stylesheets API confirms we *can* inject custom CSS globally, but **cannot conditionally apply it per client with the official tools available**. This limitation should be considered when deciding how to implement theme switching. A plugin might allow **manual** theme toggling (e.g. via a command or setting), but doing it purely by URL param would likely require core modifications or a custom client-side script injection, which falls outside the supported plugin capabilities.
