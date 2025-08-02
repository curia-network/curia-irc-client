# Plugin-Based Dynamic Theming Research

**Goal**: Implement dynamic light/dark theme switching using The Lounge's Stylesheets API + custom plugin

**Key Discovery**: Stylesheets API exists and is functional! `api.Stylesheets.addFile(filename)` can inject CSS globally.

## Research Status: 🎯 BREAKTHROUGH ANALYSIS

### What We Now Know ✅

From the external research (`o3-css-injection.md`):

1. **✅ Stylesheets API EXISTS** - `api.Stylesheets.addFile(filename)` is functional
2. **✅ CSS Injection Works** - Plugins can serve custom CSS to all clients
3. **✅ Plugin Lifecycle** - `onServerStart` hook available for initialization
4. **❌ No URL Parameter Access** - Plugins cannot directly read `?cg_theme=light` 
5. **❌ No Per-Client Hooks** - All CSS injection is global, not per-client

### The Challenge 🤔

**Problem**: How do we make a plugin respond to URL parameters if plugins can't access them?

**Research Quote**: *"Plugins cannot directly access HTTP request data or URL query parameters via the official API"*

## Potential Solutions Analysis

### Option A: Dual CSS + Client-Side Toggle ⭐
**Concept**: Ship both light and dark CSS, use client-side logic to activate correct one

**Implementation**:
1. Plugin ships `light.css` and `dark.css` via `Stylesheets.addFile()`
2. Both CSS files loaded globally 
3. Client-side JavaScript reads URL params and toggles CSS classes
4. CSS uses `:root[data-theme="light"]` and `:root[data-theme="dark"]` selectors

**Pros**:
- ✅ Uses official Stylesheets API
- ✅ Responsive to URL parameters
- ✅ Per-client theming achieved

**Cons**:
- ❓ Requires custom client-side JavaScript injection
- ❓ How do we inject JS into The Lounge client?

### Option B: CSS Custom Properties + URL-Based Classes
**Concept**: Use CSS custom properties that respond to body classes set by URL params

**Implementation**:
1. Single CSS file with both light/dark variants using CSS custom properties
2. JavaScript sets `<body class="theme-light">` or `<body class="theme-dark">` based on URL
3. CSS responds: `body.theme-light { --bg-color: white; }`

### Option C: Multiple Theme Packages
**Concept**: Create separate theme packages for light/dark, switch via internal mechanism

**Pros**:
- ✅ Uses existing theme system
**Cons**:
- ❌ No dynamic switching - requires manual theme selection

## Research Questions 🔍

### Critical Question 1: Client-Side JavaScript Injection
**Question**: How can a plugin inject client-side JavaScript into The Lounge?

**Research Needed**:
- Does Stylesheets API support `.js` files?
- Can plugins use PublicFiles API to serve JavaScript?
- Are there hooks for injecting `<script>` tags?

### Critical Question 2: CSS Selector Strategy  
**Question**: What's the best CSS architecture for toggling themes?

**Research Needed**:
- CSS custom properties vs separate stylesheets
- Performance implications of loading both themes
- Selector specificity and override strategies

### Critical Question 3: URL Parameter Detection Alternative
**Question**: Are there alternative ways to detect theme preference?

**Ideas**:
- postMessage from parent iframe to child
- Local storage persistence 
- Custom HTTP headers (if plugin can access)

## Implementation Roadmap 🗺️

### Phase 1: Plugin Foundation
- [ ] Create basic Lounge plugin structure
- [ ] Test Stylesheets API with simple CSS injection
- [ ] Verify plugin loading and CSS delivery

### Phase 2: Client-Side JavaScript Research
- [ ] Investigate how to inject JavaScript via plugin
- [ ] Test URL parameter reading in browser context
- [ ] Prototype theme toggle mechanism

### Phase 3: CSS Architecture
- [ ] Design dual-theme CSS structure
- [ ] Convert existing `thelounge-theme-cg` to support both modes
- [ ] Test CSS custom properties approach

### Phase 4: Integration
- [ ] Update ChatModal to pass `cg_theme` parameter
- [ ] Deploy plugin to The Lounge instance
- [ ] End-to-end testing

## Technical Architecture Draft

### Plugin Structure:
```
curia-theme-switcher/
├── package.json          # Plugin metadata
├── index.js              # onServerStart hook
├── styles/
│   ├── base.css         # Common styles
│   ├── light.css        # Light theme overrides  
│   └── dark.css         # Dark theme overrides
└── scripts/
    └── theme-toggle.js   # Client-side URL detection
```

### Plugin Code Concept:
```javascript
module.exports = {
  onServerStart: api => {
    // Inject all CSS files
    api.Stylesheets.addFile("styles/base.css");
    api.Stylesheets.addFile("styles/light.css"); 
    api.Stylesheets.addFile("styles/dark.css");
    
    // Somehow inject JavaScript for URL detection?
    // api.??? - need to research this
  }
};
```

## Next Steps 🎯

### JavaScript Injection Research Results ❌

**Key Finding**: Based on API documentation research, The Lounge plugins **CANNOT inject client-side JavaScript**.

**Evidence**:
1. **Stylesheets API**: Only supports CSS files via `api.Stylesheets.addFile("file.css")`
2. **PublicFiles API**: Serves static files (images, fonts) but no mention of JavaScript execution
3. **Client APIs**: All documented APIs (`sendToBrowser`, `runAsUser`, etc.) are for server-to-client communication, not code injection
4. **Security Model**: No evidence of plugins being able to execute JavaScript in browser context

**Alternative Research Direction**: CSS-only solutions with advanced selectors

### Updated Implementation Strategy 🎯

Since JavaScript injection is not possible, we need a **pure CSS approach** that can respond to URL parameters. 

**New Concept**: CSS `:target` pseudo-selector or URL fragment approach
- Use iframe URL fragments: `#theme-light` vs `#theme-dark`
- CSS responds to `:target` selectors or URL-based styling

### Revised Technical Architecture

**Option 1: CSS Custom Properties + URL Fragment**
```css
/* Base theme */
:root { --bg-color: #1e293b; }

/* Light theme when URL has #light */
:root:target, #light:target ~ * {
  --bg-color: #ffffff;
}
```

**Option 2: Multiple CSS Files + Conditional Loading**
- Plugin loads both `light.css` and `dark.css`
- CSS uses specificity to override based on body classes
- Some external mechanism sets the body class

### 🎯 BREAKTHROUGH: CSS `:target` Pseudo-Selector

**Research Result**: Found a viable CSS-only solution using `:target` pseudo-selector!

**Key Discovery**: `:target` selector activates when URL contains a fragment identifier (`#theme-light`)

**How It Works**:
```css
/* Default dark theme */
:root {
  --bg-color: #1e293b;
  --text-color: #f8fafc;
}

/* Light theme when URL contains #light */
#light:target ~ * :root,
:root:target {
  --bg-color: #ffffff;
  --text-color: #0f172a;
}
```

**Implementation Strategy**:
1. **Update ChatModal URL**: Add theme fragment to iframe URL
2. **Plugin with CSS injection**: Ship CSS that responds to `:target`
3. **HTML structure**: Plugin adds `<div id="light">` and `<div id="dark">` to page

### Revised Technical Architecture ✨

**Option 1: URL Fragment Approach** ⭐
```javascript
// In ChatModal.tsx - getChatUrl()
const themeFragment = theme === 'light' ? '#light' : '#dark';
return `${baseUrl}?autoconnect&nick=${userNick}&join=%23${channelName}${themeFragment}`;
```

```css
/* In plugin CSS */
/* Default dark theme */
:root {
  --window-bg-color: #0f172a;
  --body-color: #f8fafc;
}

/* Light theme when URL has #light */
#light:target ~ body,
#light:target ~ * {
  --window-bg-color: #ffffff;
  --body-color: #0f172a;
}
```

**Option 2: Pure CSS Media Query Fallback**
Use OS preference as primary, fragment as override:
```css
@media (prefers-color-scheme: light) {
  :root { --bg-color: white; }
}

#dark:target ~ *,
#dark:target ~ body {
  --bg-color: #0f172a; /* Force dark even on light OS */
}
```

### Implementation Roadmap 🗺️

#### Phase 1: Update ChatModal (Immediate)
- [ ] **Fix missing theme parameter** in `getChatUrl()` function
- [ ] **Add fragment identifier** based on theme prop
- [ ] **Test URL construction** with both `#light` and `#dark`

#### Phase 2: Plugin Development (Next)
- [ ] **Create Lounge plugin** with dual-theme CSS
- [ ] **Use Stylesheets API** to inject responsive CSS
- [ ] **Add HTML elements** for `:target` selectors to work

#### Phase 3: CSS Architecture (Theme Implementation)
- [ ] **Convert existing theme** to support both modes with CSS custom properties
- [ ] **Test `:target` selectors** with fragment URLs
- [ ] **Ensure smooth theme switching**

### Next Steps 🎯

**Priority 1**: Implement missing theme parameter in ChatModal
**Priority 2**: Create basic plugin with `:target` CSS proof-of-concept
**Priority 3**: Test end-to-end theme switching

---

## Status: ✅ VIABLE SOLUTION IDENTIFIED

CSS `:target` pseudo-selector provides a pure CSS approach to URL-based theming without requiring JavaScript injection!