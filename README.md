# text-spoiler

React component that conceals text behind animated particles and reveals it like a spoiler. The text is rendered to a canvas, sampled into particles that drift like sand, and assembles into readable glyphs when revealed.

**Zero runtime dependencies** — the package ships no dependencies at all, only `react`/`react-dom` as peer dependencies.

[Live demo](https://fulcanellee.github.io/text-spoiler)

## Install

```bash
npm install text-spoiler
```

React 18 or 19 is required as a peer dependency.

## Usage

```tsx
import { useState } from "react";
import { TextSpoiler } from "text-spoiler";

export function Secret() {
    const [revealed, setRevealed] = useState(false);

    return (
        <div onClick={() => setRevealed((v) => !v)}>
            <TextSpoiler in={revealed} color="#8b5cf6">
                The secret is hidden in the dots
            </TextSpoiler>
        </div>
    );
}
```

The component imports its own stylesheet. It is a CSS module, so class names are scoped and will not collide with your app's styles. If your setup does not process CSS imports from dependencies, import it manually:

```ts
import "text-spoiler/styles.css";
```

## Props

| Prop         | Type         | Default   | Description                                        |
| ------------ | ------------ | --------- | -------------------------------------------------- |
| `in`         | `boolean`    | —         | `true` assembles the text, `false` scatters it back into particles |
| `color`      | `string`     | `#b8e0d8` | Particle and text color (any CSS color)            |
| `children`   | `string`     | —         | Plain text to conceal/reveal                       |
| `onRevealed` | `() => void` | —         | Called when the reveal animation settles           |
| `onHidden`   | `() => void` | —         | Called when the conceal animation settles          |

When the user prefers reduced motion (`prefers-reduced-motion: reduce`), the animation is skipped and the text is shown or hidden instantly.

## Demo

The repository contains a demo app:

```bash
npm install
npm start
```

## Releasing

Releases are published automatically from CI using [npm trusted publishing](https://docs.npmjs.com/trusted-publishers/) (OIDC, no tokens):

1. Bump `version` in `package.json` (e.g. `npm version patch --no-git-tag-version`) and merge the PR into `master`.
2. The [Publish workflow](./.github/workflows/publish.yml) builds the library, publishes it with provenance, pushes a `vX.Y.Z` git tag and creates a GitHub Release with auto-generated notes.

If the version in `package.json` already exists in the registry, the workflow skips publishing.

## License

[MIT](./LICENSE)
