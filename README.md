# @reddigital/quickstart

> **Bring interactive Svelte, React, Vue, or Preact components into your AdonisJS server-rendered pages — no SPA complexity required.**

**@reddigital/quickstart** is an AdonisJS plugin that lets you drop modern frontend components directly into your regular server-side templates.  
They’re **server-rendered to HTML for SEO & performance** — and then **hydrated on the client** for interactivity.

It's **progressive enhancement** while still being able to use your favorite frontend frameworks without the SPA bloat. Focusing on what they're actually great at: DOM manipulation and managing ui state.

---

**quickstart** is perfect if you want to:

- 🏝 **Add interactivity where it matters** — counters, forms, menus, charts, etc.
- ⚡ **Serve pages instantly** — initial HTML is rendered on the server
- 📦 **Load less JavaScript** — only hydrate what’s on the page
- 📱 **Targeted loading** — lazy-load by scroll position or media query
- 🍄 **Progressive enhancement** — keep working even if JS fails

---

## Get Started

Install & configure:

```bash
npm install @reddigital/quickstart
node ace configure @reddigital/quickstart
```

Here's an example using Svelte.

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
@quick('counter', { initialCount: 5 })
```

Build & serve:

```bash
npm run build
node ace serve --watch
```

You now have a fully server-rendered page with a hydrated interactive counter.

## Passing Props

You can pass data from your server-side templates to your components:

```
@quick('counter', { initialCount: 5 })
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

## Testing

See TESTING.md for how to write and run tests with Japa, including coverage and CLI flags.
