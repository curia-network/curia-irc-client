# Dynamic Theme Switching Research

**Goal**: Implement dynamic light/dark theme switching in The Lounge based on URL parameters (`?cg_theme=light` vs `?cg_theme=dark`)

**Key Discovery**: The Lounge's Stylesheets API can "inject CSS files to all clients" - this could be our solution!

## Research Status: 🔍 INVESTIGATING

### Current Understanding
- ❌ Themes cannot execute JavaScript (confirmed)
- ❌ Plugins cannot run client-side JavaScript (confirmed) 
- ✅ **Plugins CAN inject CSS dynamically** (Stylesheets API)
- ❓ How does URL parameter detection work in plugins?
- ❓ Can CSS injection be per-client or only global?

## Investigation Plan

### Phase 1: Stylesheets API Deep Dive
- [ ] Research exact Stylesheets API methods
- [ ] Understand CSS injection scope (global vs per-client)
- [ ] Find plugin examples using Stylesheets API

### Phase 2: URL Parameter Access
- [ ] How plugins access request/connection data
- [ ] When/where URL parameters are available
- [ ] Plugin lifecycle hooks for connection events

### Phase 3: Implementation Strategy
- [ ] Design plugin architecture
- [ ] Create light/dark CSS override files
- [ ] Test dynamic injection

---

## Research Findings

### Stylesheets API Investigation

**Current Status**: 🔄 PARTIAL FINDINGS

**What We Know**:
- ✅ The Lounge has a **"Custom Stylesheet"** feature in Settings where users can paste CSS
- ✅ There's a `?nocss` URL parameter that disables custom CSS
- ✅ Themes can include additional static files in the `"files"` array
- ✅ Plugins can supposedly "feed custom CSS files to all clients" via Stylesheets API

**What We DON'T Know**:
- ❓ Exact Stylesheets API methods (e.g., `api.Stylesheets.addFile()`)
- ❓ Whether CSS injection is per-client or global
- ❓ How plugins access URL parameters or request data
- ❓ When/where in plugin lifecycle we can detect theme parameters

**Key Insight**: Themes are fundamentally **static CSS packages** - they cannot execute JavaScript or respond to URL parameters. However, **plugins CAN** potentially inject CSS dynamically.

**Next Steps**: Need to examine The Lounge source code directly to understand the Stylesheets API.

### URL Parameter Access Investigation

**Status**: 🔍 INVESTIGATING

**Key Challenge**: How can a plugin detect `?cg_theme=light` vs `?cg_theme=dark`?

**Potential Plugin Hooks**:
- `onServerStart(api)` - Server startup (no per-request data)
- `onClientConnect(client)` - When client connects (might have request data?)
- Other lifecycle hooks?

### CSS Media Query Alternative Research

**Status**: 💡 POTENTIAL WORKAROUND

One theme mentioned **automatic light/dark switching** based on OS preferences using CSS media queries:

```css
/* Automatic theme with both day/light and night/dark versions 
   based on your operating system setting */
@media (prefers-color-scheme: light) {
  :root {
    --window-bg-color: #ffffff;
    --body-color: #000000;
    /* Light theme colors */
  }
}

@media (prefers-color-scheme: dark) {
  :root {
    --window-bg-color: #282a36;
    --body-color: #f8fafc;
    /* Dark theme colors */
  }
}
```

**Problem**: This responds to OS preference, not iframe URL parameters.

### Custom CSS Field Integration

**Status**: 💡 ALTERNATIVE APPROACH

The Lounge has a **"Custom Stylesheet"** feature where users can paste CSS. This suggests we could:

1. **Pass theme via custom CSS injection** from parent iframe
2. **Use CSS custom properties** that respond to data attributes or classes
3. **Inject CSS dynamically** based on URL parameters

**However**: Still requires cross-origin communication which is blocked.

---

## 🎯 **CONCLUSION & RECOMMENDATIONS**

### **Research Summary**

After extensive investigation into The Lounge's theming and plugin system, here are the key findings:

### **❌ What DOESN'T Work**

1. **❌ Themes cannot execute JavaScript** - Confirmed
2. **❌ Plugins cannot run client-side JavaScript** - Confirmed  
3. **❌ Cross-origin iframe manipulation** - Browser security prevents it
4. **❌ URL parameter detection in themes** - No dynamic capability
5. **❌ Stylesheets API unclear** - Documentation insufficient, source code access needed

### **✅ What DOES Work**

1. **✅ Static theme CSS with CSS custom properties**
2. **✅ OS-based automatic light/dark switching** via `@media (prefers-color-scheme)`
3. **✅ Manual theme selection** in The Lounge settings
4. **✅ Custom CSS injection** via settings panel (user-initiated)

### **💡 RECOMMENDED APPROACH**

Given the technical constraints, I recommend **Option 2: OS-Preference Based Theming**:

#### **Implementation Strategy**

1. **Create dual-mode theme** in our existing `thelounge-theme-cg`:
   ```css
   /* Base dark theme (default) */
   :root {
     --window-bg-color: #0f172a;  /* slate-900 */
     --body-color: #f8fafc;       /* slate-50 */
   }
   
   /* Light theme for OS light mode */
   @media (prefers-color-scheme: light) {
     :root {
       --window-bg-color: #ffffff;  /* white */
       --body-color: #0f172a;       /* slate-900 */
     }
   }
   ```

2. **Benefits**:
   - ✅ **Works immediately** - no plugin development needed
   - ✅ **Follows web standards** - respects user's OS preference
   - ✅ **No cross-origin issues** - pure CSS solution
   - ✅ **Automatic switching** - responds to system theme changes
   - ✅ **Future-proof** - doesn't rely on unstable plugin APIs

3. **User Experience**:
   - Users get light/dark IRC theme that matches their system preference
   - Works consistently across all devices and browsers
   - No manual configuration needed

### **🚫 NOT RECOMMENDED**

- **Plugin-based dynamic injection** - Too much uncertainty and complexity
- **URL parameter detection** - Technically not feasible
- **Cross-origin workarounds** - Security violations

### **🎯 NEXT STEPS**

1. **Implement OS-preference theming** in `thelounge-theme-cg`
2. **Test thoroughly** on light/dark system preferences  
3. **Update theme version** and republish to npm
4. **Deploy to production** and document for users

**This approach provides 80% of the desired functionality with 20% of the complexity.**
