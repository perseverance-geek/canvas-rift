# Canvas Rift

[简体中文](README.md) · **English**

**[Live Demo](https://perseverance-geek.github.io/canvas-rift/)**

**Step into the painted streets. Fly beyond the canvas.**

The picture frame is a doorway. Canvas Rift is a 3D art world you can freely explore in your browser: begin at Van Gogh's golden café, glide across the starlight and reflections of the Rhône, then pass through a rift in the sky into a surreal night garden where daylight and darkness coexist.

All three acts are implemented, connected by continuous spaces and camera movement. Walk among café tables, fly above rooftops, weave through sculptural star strokes, or enter an upside-down house to discover spaces that could never exist on a flat canvas. Built with **TypeScript + Three.js + Vite**, the world renders in real time in your browser.

[Watch the video](docs/canvas-rift-demo-compressed.mp4) · [The three acts](#the-three-acts) · [Quick start](#quick-start) · [Controls](#controls)

## Recorded demo

**[▶ Watch the complete three-act journey (MP4, about 63 seconds, 40.7 MB)](docs/canvas-rift-demo-compressed.mp4)**

This recording follows the full journey: click to enter the painting, travel down the street to the riverbank, ascend along the brushstrokes, and cross the rift into the night garden and upside-down house. The link above opens the video file page. If no player is available, use Raw / Download to download it for playback. A repository file link does not guarantee inline playback in the README. Explore the screenshots and scene descriptions below.

## Highlights

- **From viewing a painting to entering it:** the opening preserves a framed composition. Clicking to enter moves the camera forward as lights and brushstrokes awaken, then gives you free control.
- **Free flight through connected spaces:** travel from the streets to the riverbank, star-filled sky, and night garden. Buildings and the ground have collision boundaries; you can fly through the open interiors of the star strokes.
- **Painting becomes space:** procedural canvas textures, flowing pigment on the water, and thick 3D brushstrokes bring together blue and gold, flecks of light, and a painterly surface.
- **Surreal daylight and gravity:** explore a night garden beneath a daytime sky, enter an upside-down house, and approach paradox lamps to see local shifts between day and night.
- **Explore freely or take a guided tour:** desktop and touch controls, an approximately 60-second camera tour, high and lightweight graphics modes, and optional ambient sound.

## The three acts

The journey moves from streets to a river and star-filled sky, then into an original surreal world. These five **1920×1080 screenshots of the complete viewport** capture the main compositions and spatial changes along the way.

### 01 · The Golden Night

Inspired by Van Gogh's *Café Terrace at Night*. A golden awning, deep-blue streets, warm lamps, and olive-green shutters mark the starting point. Tables, buildings, and streetlights occupy a true 3D space, threaded with canvas textures and floating brushstrokes.

Click **「进入画境」 (Enter the painting)** to leave the fixed opening composition and enter the street. Wander between tables, follow the streetlights, or rise above the rooftops to examine strokes drifting beyond the architecture.

![Act I, complete viewport: the café and opening picture frame](docs/readme-first-full.jpg)

### 02 · A Star River Without Shores

Inspired by Van Gogh's *Starry Night Over the Rhône*. The street opens onto a deep-blue riverbank, where warm lights leave broken trails of gold across the water. Skim close to the surface to watch flowing pigment strokes, or turn back toward the streets you have just left.

![Act II, complete viewport: the Rhône riverbank and golden reflections](docs/readme-second-river-full.jpg)

Follow the rising golden strokes into the sky. Distant stars gradually become thick, sculptural brushstrokes. As you gain height, the river surface folds upward into an immense painted space. Fly among the stars and scattered strokes to view the same night from new angles.

![Act II, complete viewport: sculptural star strokes and the folded river surface](docs/readme-second-cosmos-full.jpg)

### 03 · The Dark Side of Daylight

An original surreal world inspired by Magritte's *The Empire of Light*. A thin seam deep in the sky opens into a traversable 3D rift. Beyond it lies a bright daytime sky, while floating gardens, houses, and trees remain cloaked in night. A winding path of lamps leads into the distance.

![Act III, complete viewport: the floating night garden beneath a daytime sky](docs/readme-third-garden-full.jpg)

Ascend to reveal the upside-down house. Find an open doorway, or follow the floating stone path on the left to the rear entrance. Inside, corridors lead to a courtyard where tree canopies grow down from the ceiling, furniture hangs upside down, and a daylight shaft connects the levels above and below.

![Act III, complete viewport: the upside-down house and its entrances](docs/readme-third-house-full.jpg)

Paradox lamps hidden in the garden change the local rules of light. As you approach, daylight emerges beneath your feet while the clouds overhead turn to night. Move away, and the original relationship between day and night returns.

### Exploration route

**Café streets → Rhône riverbank → Sculptural star strokes → Sky rift → Floating night garden → Upside-down house**

Follow the streetlights to the riverbank, then ascend along the golden strokes. Approach the center of the rift at a height of roughly 243 meters and fly through the opening. In the garden, follow the lamps before rising toward a doorway in the house. On-screen route hints change with your location. Retrace your path to return, or click **「返回画框」 (Return to the frame)** to restore the opening view.

## Quick start

You need **Node.js 22.18+**, npm, and a modern browser with **WebGL 2** support.

```sh
npm ci
npm run dev
```

Open the URL shown in your terminal (normally `http://127.0.0.1:5173/`; check the terminal output if that port is in use), then click **「进入画境」 (Enter the painting)** to begin. No API keys or backend services are required.

The interface currently uses Chinese labels; translations for the main controls appear in this guide.

### Guided tour

Append `?tour=1` to the running URL, for example `http://127.0.0.1:5173/?tour=1`. After you click to enter, the camera follows a continuous journey through all three acts for about 60 seconds. The tour uses a 16:9 composition at high quality, hides the controls while keeping the act titles, and holds the final courtyard view when it finishes.

Press `Esc` to pause or resume, `R` to reset and wait for another click, or `Home` to return to the frame. Playback pauses when the page is hidden and resumes when it becomes visible. Before recording, you can play the full tour once to warm up the scenes, then press `R` to return to the opening.

## Controls

| Action | Desktop control |
| --- | --- |
| Move forward/backward or sideways | `W A S D` or arrow keys |
| Ascend / descend | `Space` / `C`, or `E` / `Q` |
| Move faster | Hold `Shift` |
| Look around | Click and drag the scene; double-click to lock the pointer in supported browsers |
| Pause / release the pointer | `Esc` |
| View control hints | Click **「操作指南」 (Controls guide)** |
| Restore the opening view | Click **「返回画框」 (Return to the frame)** |

Movement has inertia, and the direction of travel follows your view. On touchscreens, hold the directional buttons and `＋ / −` buttons at the bottom to move, ascend, or descend; drag the scene to look around. Ambient sound is off by default and can be enabled with the sound button.

**High quality** keeps bloom and richer brushstroke and cloud detail. **Lightweight quality** disables bloom and reduces some detail for a lower rendering load. Narrow screens default to lightweight quality; you can switch modes while exploring.

## Technology and artistic direction

| Component | Implementation |
| --- | --- |
| 3D world | Real-time Three.js rendering with a shared scene, camera, and continuous flight controls |
| Painterly surfaces | Procedural canvas textures, pigment shaders, thick 3D brushstrokes, and canvas post-processing |
| Spatial rift | Renders actual 3D geometry on the other side, allowing the camera to pass continuously through the opening |
| Scene detail | Instanced brushstrokes and vegetation, shared geometry and textures, and two graphics modes |
| Ambient sound | Locally synthesized Web Audio that changes with the region and is enabled on demand |

The first two acts reinterpret the colors and imagery of Van Gogh's paintings in three dimensions. The third develops Magritte's day–night paradox into an original floating night garden and upside-down architecture.

## Known issue

Returning to Act II through the upper part of the rift (roughly 260–263 meters) may cause a position jump. The central route at roughly 243 meters works in both directions. Use the center of the opening when exploring.

## Development

```sh
npm run check    # Type checking
npm test         # Regression tests
npm run build    # Production build
npm run preview  # Preview the production build
```

## Continuous integration

The [CI workflow](.github/workflows/ci.yml) runs dependency installation, type checking, regression tests, and a production build with Node.js 22 on pushes to `release`, pull requests targeting `release`, and manual runs. View run results and logs in the repository's Actions tab.

## License and media

The project's original source code and accompanying code documentation are licensed under the [MIT License](LICENSE). Copyright © 2026 perseverance-geek.

All rights are reserved for the project's original screenshots and demo videos; they are excluded from the MIT license. Except for uses permitted by applicable law, separate permission is required to reuse them. Third-party artworks, assets, and dependencies remain subject to their respective copyrights and licenses; this project's MIT license does not grant rights to that third-party content.
