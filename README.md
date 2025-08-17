# @reddigital/quickstart

> **Bring interactive Svelte, Preact, or Vue components into your AdonisJS server-rendered pages — no SPA complexity required.**

**@reddigital/quickstart** is an EdgeJS plugin for AdonisJS that lets you drop interactive islands/frontend components directly into your regular server-side templates.  
They’re **server-rendered to HTML for SEO & performance** - and **hydrated on the client** for interactivity.

---

**quickstart** is perfect if you want to:

- 🏝 **Add interactivity where it matters** — counters, forms, menus, charts, etc.
- ⚡ **Serve pages instantly** — initial HTML is rendered on the server
- 📦 **Load less JavaScript** — only hydrate what’s on the page
- 📱 **Targeted loading** — lazy-load by scroll position or media query
- 🍄 **Progressive enhancement** — keep working even if JS fails

---

## Install

Install & configure:

```bash
npm install @reddigital/quickstart
node ace configure @reddigital/quickstart
```

Follow the instructions in your terminal to install and configure AdonisJS/Edge with your selected frontend framework.

---

## Getting started

In this example we will use Svelte, but you can adapt the code for your chosen frontend framework.

Create a component in resources/components/counter.svelte:

```js
<script>
  export let initialCount = 0
  let count = initialCount
</script>

<div>
  <p>Count: {count}</p>
  <button on:click={() => count++}>+</button>
</div>
```

Use it in an Edge template:

```html
@vite(['resources/css/app.css', 'resources/js/app.ts'])

<h1>Welcome!</h1>
@!quick('counter')
```

Build & serve:

```bash
$ npm run dev
// or
$ npm run build
```

You now have a fully server-rendered page with a hydrated interactive counter.

## Passing Props

You can pass data from your server-side templates to your components:

```
@!quick('counter', { initialCount: 5 })
```

## Lazy Loading and Media Queries

Components can be conditionally loaded based on if they are visible in the viewport or based on screen size:

```js
<!-- Load when visible -->
@quick('footer-widget', {}, { lazy: true })

<!-- Load based on media query -->
@quick('mobile-menu', {}, { media: '(max-width: 768px)' })

<!-- Or combine them -->
@quick('heavy-chart', { data: chartData }, { lazy: true, media: '(min-width: 768px)' })
```

## How it works

### 1. Server-Side Rendering (SSR)

When you use `@quick('counter', { initialCount: 5 })` in your Edge template:

1. **Component Resolution**: The server dynamically imports your component from the default path (`resources/components`).
2. **SSR Execution**: Your component is rendered to HTML string using the framework's server renderer.
3. **HTML Injection**: The rendered HTML is passed to your EdgeJS page template
4. **Web Component**: On the client side your component is wrapped by a native web-component which loads your script and hydrates the HTML.

### 2. Client-Side Hydration

On the client side:

2. **Selective Loading**: Only the JavaScript for components actually on the page is downloaded
3. **Progressive Hydration**: Each component is hydrated independently as it becomes needed

### 3. Build Process

Quickstart uses Vite's **multi-build system** to create optimized bundles:

**Client Build**: Creates small, framework-specific bundles for each component. Only loads what's needed.

**SSR Build**: Creates a Node.js-compatible bundle that your AdonisJS server uses to render components to HTML strings.

### 4. Framework Integration

The plugin automatically configures Vite based on your chosen framework

### 5. Development vs Production

**Development**:

- Uses Vite's dev server with HMR for instant component updates
- Components are transformed on-demand

**Production**:

- Pre-built optimized bundles
- Tree-shaking removes unused code
- Components are cached and served efficiently

This architecture gives you:

- **Fast initial page loads** (server-rendered HTML)
- **Small JavaScript payloads** (only active components)
- **Framework flexibility** (use React, Vue, Svelte, or Preact)
- **Progressive enhancement** (works without JavaScript)

## Enhancing to SPA-like Navigation

If you want your server-rendered app to feel like a single-page application — smooth transitions, no full page reloads — you don’t need to rewrite your entire app.

Two great options that work seamlessly with quickstart:

- Turbo Drive

- Barba.js

Both approaches:

- Work with AdonisJS + Edge templates

- Keep Quickstart islands hydrated between navigations

- Let you progressively enhance navigation without rewriting your app

### Example with Turbo Drive:

```html
<!-- Add this to your <head> tag -->
<script type="module" src="https://cdn.jsdelivr.net/npm/@hotwired/turbo@latest/dist/turbo.es2017-esm.min.js">
<meta name="view-transition" content="same-origin" />
<meta name="turbo-refresh-method" content="morph" />
```

For more information on Turbo you can visit https://turbo.hotwired.dev/

### Example with Barba.js:

```js
import barba from '@barba/core'

barba.init({
  transitions: [
    {
      leave({ current }) {
        // Animate out
      },
      enter({ next }) {
        // Animate in
      },
    },
  ],
})
```

For more information on how to install and use Barba.js, visit https://barba.js.org
