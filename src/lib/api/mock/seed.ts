/**
 * Demo content for the frontend while the backend doesn't exist yet.
 * The first 15 prompts are the ones in the reference design, in the same order.
 * Photos are cropped from that design (public/mock/*); replace them with real uploads later.
 */
import type { CreatorProfile, Prompt, PromptImage, PromptType } from '../types'
import { extractVariables, slugify } from '../../prompt-utils'

const HOUR = 3_600_000
const at = (hoursAgo: number) => new Date(Date.now() - hoursAgo * HOUR).toISOString()
const daysAgo = (days: number) => at(days * 24)

const photo = (name: string, alt: string, width = 534, height = 386, role: PromptImage['role'] = 'result'): PromptImage => ({
  url: `/mock/${name}.webp`,
  width,
  height,
  role,
  alt,
})

export const SEED_CREATORS: CreatorProfile[] = [
  { handle: 'lena.makes', displayName: 'Lena Park', bio: 'Travel photographer turned prompt nerd. Golden hour or bust.', links: ['https://example.com/lena'], joinedAt: daysAgo(210) },
  { handle: 'archivisual', displayName: 'Archi Visual', bio: 'Architectural renders and calm spaces.', links: [], joinedAt: daysAgo(180) },
  { handle: 'productivy', displayName: 'Jordan Reyes', bio: 'B2B sales emails that actually get replies.', links: ['https://example.com/jordan'], joinedAt: daysAgo(160) },
  { handle: 'foodframes', displayName: 'Food Frames', bio: 'Food photography prompts. Hungry yet?', links: [], joinedAt: daysAgo(150) },
  { handle: 'naturepixels', displayName: 'Nature Pixels', bio: 'Mountains, light and patience.', links: [], joinedAt: daysAgo(140) },
  { handle: 'devwithmike', displayName: 'Mike Chen', bio: 'TypeScript, Python and prompts that ship code.', links: ['https://example.com/mike'], joinedAt: daysAgo(130) },
  { handle: 'studiosam', displayName: 'Sam Ortiz', bio: 'Interiors and cozy workspaces.', links: [], joinedAt: daysAgo(120) },
  { handle: 'artbykai', displayName: 'Kai', bio: 'Illustration and character design.', links: ['https://example.com/kai'], joinedAt: daysAgo(115) },
  { handle: 'pixelcraft', displayName: 'Pixel Craft', bio: 'Photo restoration and enhancement.', links: [], joinedAt: daysAgo(100) },
  { handle: 'brandpixels', displayName: 'Brand Pixels', bio: 'Studio product shots for small brands.', links: [], joinedAt: daysAgo(95) },
  { handle: 'learnwithsara', displayName: 'Sara Malik', bio: 'Learning plans and study prompts.', links: ['https://example.com/sara'], joinedAt: daysAgo(90) },
  { handle: 'droneviews', displayName: 'Drone Views', bio: 'Aerial shots, real and generated.', links: [], joinedAt: daysAgo(80) },
  { handle: 'datavizdan', displayName: 'Dan Weller', bio: 'Dashboards and data viz.', links: ['https://example.com/dan'], joinedAt: daysAgo(70) },
  { handle: 'pawsandpixels', displayName: 'Paws & Pixels', bio: 'Pet portraits with feeling.', links: [], joinedAt: daysAgo(60) },
  { handle: 'moodframes', displayName: 'Mood Frames', bio: 'Cozy, moody scenes.', links: [], joinedAt: daysAgo(55) },
  { handle: 'tunesmith', displayName: 'Tune Smith', bio: 'Music prompts for Suno and Udio.', links: [], joinedAt: daysAgo(45) },
  { handle: 'notetaker', displayName: 'Nina Brooks', bio: 'Productivity prompts for busy teams.', links: [], joinedAt: daysAgo(40) },
  { handle: 'questcraft', displayName: 'Quest Craft', bio: 'Text adventures and roleplay games.', links: [], joinedAt: daysAgo(35) },
  { handle: 'copyhouse', displayName: 'Copy House', bio: 'Landing pages and ad copy.', links: [], joinedAt: daysAgo(30) },
  { handle: 'sqlsensei', displayName: 'Ravi Kumar', bio: 'Databases, SQL and performance.', links: [], joinedAt: daysAgo(25) },
  { handle: 'researchrae', displayName: 'Rae Thompson', bio: 'Research workflows that respect sources.', links: [], joinedAt: daysAgo(20) },
]

const NAMES = Object.fromEntries(SEED_CREATORS.map((c) => [c.handle, c.displayName]))

interface SeedInput {
  id: string
  title: string
  type: PromptType
  handle: string
  whatItDoes: string
  body: string
  tools: string[]
  tags: string[]
  images?: PromptImage[]
  sampleOutput?: string
  tips?: string
  settings?: string
  videoUrl?: string
  publishedAt: string
  stats: [likes: number, copies: number, views: number]
}

function seed(input: SeedInput): Prompt {
  const [likes, copies, views] = input.stats
  return {
    id: input.id,
    slug: slugify(input.title),
    title: input.title,
    type: input.type,
    whatItDoes: input.whatItDoes,
    body: input.body,
    variables: extractVariables(input.body),
    tools: input.tools,
    tags: input.tags,
    images: input.images ?? [],
    sampleOutput: input.sampleOutput,
    tips: input.tips,
    settings: input.settings,
    videoUrl: input.videoUrl,
    author: { handle: input.handle, displayName: NAMES[input.handle] ?? input.handle },
    publishedAt: input.publishedAt,
    stats: { likes, copies, views },
  }
}

export const SEED_PROMPTS: Prompt[] = [
  seed({
    id: 'k7Qp2xRm4T',
    title: 'Cinematic travel portrait',
    type: 'image',
    handle: 'lena.makes',
    whatItDoes: 'Turns any person and place into a warm, editorial travel portrait.',
    body: 'Cinematic travel portrait of {{subject}} standing on {{location}} at golden hour, wind in their hair, wearing {{outfit}}. Shot on an 85mm lens at f/1.4, shallow depth of field, warm rim light, soft film grain, muted earthy palette, editorial magazine look.',
    tools: ['Midjourney', 'Flux'],
    tags: ['portrait', 'travel', 'cinematic'],
    images: [photo('cinematic-portrait', 'Woman with windswept hair and a rust scarf at golden hour', 534, 384)],
    settings: '--ar 4:5 --style raw --stylize 200',
    tips: 'Name a real place for {{location}} ("a cliff above Lisbon") and the light behaves much more naturally.',
    publishedAt: at(5),
    stats: [1840, 1190, 21400],
  }),
  seed({
    id: 'B3nW8vLq1Z',
    title: 'Modern minimal house render',
    type: 'image',
    handle: 'archivisual',
    whatItDoes: 'A photoreal render of a glass house at dusk, ready for a portfolio.',
    body: 'Architectural visualization of a modern minimal {{building}} on the edge of a {{landscape}} at dusk. Floor-to-ceiling glass, warm interior lighting, cantilevered wooden deck, black steel frame, calm water reflections, tall pine trees, soft fog. Photorealistic, 24mm lens, eye level, high dynamic range.',
    tools: ['Midjourney', 'GPT Image'],
    tags: ['architecture', '3d-render', 'interior'],
    images: [photo('minimal-house', 'Glass house with warm lights beside a lake at dusk', 532, 386)],
    settings: '--ar 16:9 --stylize 150',
    publishedAt: at(7),
    stats: [1710, 1100, 19800],
  }),
  seed({
    id: 'Rt5Hy9cJ2a',
    title: 'Re-engagement email (B2B)',
    type: 'writing',
    handle: 'productivy',
    whatItDoes: 'Writes a short, friendly email that wakes up a lead who went quiet.',
    body: `You are a senior B2B account executive. Write a short re-engagement email to {{name}}, a {{role}} at {{company}} we last spoke with {{time since}} ago.

Rules:
- Under 120 words, friendly, zero guilt-tripping
- Open with something genuinely new: {{update}}
- One clear, low-effort call to action (a yes/no question)
- No buzzwords like "circle back" or "touch base"

Give me 2 subject lines and the email body.`,
    tools: ['ChatGPT', 'Claude'],
    tags: ['email', 'sales', 'b2b'],
    sampleOutput: `# Email to re-engage a cold lead
Hi Alex,

It's been a while since we last connected. I wanted to share a quick update on what's new on our side: we just launched automated reporting, which cuts month-end prep from days to about an hour.

Given what you mentioned about your team's reporting load, would a 15-minute look next week be useful?

Either way, hope Q3 is treating you well.
Jordan`,
    publishedAt: at(9),
    stats: [1590, 1150, 17600],
  }),
  seed({
    id: 'Ms4Kd7Pq8e',
    title: 'Restaurant-style food photo',
    type: 'image',
    handle: 'foodframes',
    whatItDoes: 'Makes any dish look like it came out of a Michelin-starred kitchen.',
    body: 'Professional food photography of {{dish}} plated in a fine-dining restaurant. 45-degree angle, dark slate background, soft window light from the left, shallow depth of field, glistening textures, fresh herbs and microgreens, a few crumbs for realism. Shot on a 100mm macro lens, Michelin-guide style.',
    tools: ['Midjourney', 'Flux'],
    tags: ['food', 'photography', 'product'],
    images: [photo('salmon-plate', 'Seared salmon with herbs and cherry tomatoes on a dark plate', 534, 388)],
    settings: '--ar 4:3 --style raw',
    publishedAt: at(11),
    stats: [1480, 980, 18900],
  }),
  seed({
    id: 'Xg2Lw6Nb3u',
    title: 'Golden hour mountain landscape',
    type: 'image',
    handle: 'naturepixels',
    whatItDoes: "An epic alpine landscape with alpenglow, the kind you'd print and frame.",
    body: 'Epic landscape photo of a snow-covered {{mountain}} at golden hour. Alpenglow on the ridges, long shadows, wispy clouds catching pink light, crisp cold air, ultra-detailed rock textures. Wide-angle 16mm lens at f/11, National Geographic style.',
    tools: ['Midjourney', 'Flux', 'GPT Image'],
    tags: ['landscape', 'nature', 'mountains'],
    images: [photo('golden-mountain', 'Snowy mountain peak glowing in golden light', 534, 384)],
    settings: '--ar 3:2',
    publishedAt: at(13),
    stats: [1400, 900, 16200],
  }),
  seed({
    id: 'Ty8Vr3Fk5m',
    title: 'Summarize text with TypeScript',
    type: 'coding',
    handle: 'devwithmike',
    whatItDoes: 'Generates a typed, error-safe summarize function you can paste straight into a project.',
    body: `Write a TypeScript function \`generateSummary(text: string): Promise<string>\` that summarizes {{content type}} using the OpenAI SDK.

Requirements:
- Use async/await and proper types
- Keep summaries under {{max words}} words
- Handle API errors and empty input gracefully
- Add a short JSDoc comment

Return only the code.`,
    tools: ['ChatGPT', 'Claude'],
    tags: ['typescript', 'openai', 'api'],
    sampleOutput: `\`\`\`ts generateSummary.ts
export async function
 generateSummary(text: string) {
  const res = await openai.chat.
   completions.create({
    model: "gpt-4o-mini",
    messages: [
    { role: "user", content: text }
    ]
  });
  return res.choices[0].message.content;
}
\`\`\``,
    tips: 'Swap in your own model name. The structure works with any chat-completions style SDK.',
    publishedAt: at(16),
    stats: [1330, 930, 14800],
  }),
  seed({
    id: 'Hc6Zp1Qs9d',
    title: 'Productive workspace setup',
    type: 'image',
    handle: 'studiosam',
    whatItDoes: 'A calm, sunlit home-office scene for blog headers and wallpapers.',
    body: 'Interior photo of a calm, productive home-office corner: {{desk material}} desk facing a large window, open laptop, brass desk lamp glowing, a few plants, neatly stacked books, morning light with soft shadows. Minimal clutter, warm neutral tones, 35mm lens, lifestyle magazine style.',
    tools: ['Midjourney', 'GPT Image'],
    tags: ['interior', 'workspace', 'lifestyle'],
    images: [photo('workspace', 'Wooden desk with laptop and lamp by a bright window', 532, 386)],
    publishedAt: at(19),
    stats: [1240, 800, 15500],
  }),
  seed({
    id: 'Pn3Jx7Wt2g',
    title: 'Stylized character illustration',
    type: 'image',
    handle: 'artbykai',
    whatItDoes: 'Painterly neon-city character art with cinematic rim lighting.',
    body: 'Stylized digital illustration of {{character}} in a rainy neon city at night, wearing glowing headphones, looking up at the sky. Painterly brush strokes, cyan and orange rim lighting, bokeh city lights, light rain streaks, semi-realistic anime style, highly detailed face.',
    tools: ['Midjourney'],
    tags: ['character', 'illustration', 'neon'],
    images: [photo('neon-character', 'Illustrated woman with glowing headphones in a rainy neon city', 534, 392)],
    settings: '--ar 4:5 --niji 6',
    publishedAt: at(22),
    stats: [1170, 760, 13900],
  }),
  seed({
    id: 'Fq9Ld4Mz6r',
    title: 'Photo enhancement (before/after)',
    type: 'image',
    handle: 'pixelcraft',
    whatItDoes: 'Cleans up noisy, grainy portraits while keeping real skin texture.',
    body: `Enhance this portrait photo:
- remove noise and grain
- even out skin tone but keep natural texture (pores, freckles)
- fix the white balance
- recover detail in the eyes and hair

Don't change the face shape, expression or background. Keep the same framing.`,
    tools: ['GPT Image', 'Gemini'],
    tags: ['retouching', 'portrait', 'restoration'],
    images: [
      photo('enhance-before', 'Grainy, noisy close-up portrait before enhancement', 516, 302, 'input'),
      photo('enhance-after', 'The same portrait after enhancement, clean and natural', 516, 302, 'result'),
    ],
    tips: 'Upload the original photo with this prompt. Ask for "the same framing" or the model may crop it.',
    publishedAt: at(25),
    stats: [1090, 790, 14100],
  }),
  seed({
    id: 'Wb5Yt2Kc8n',
    title: 'Studio product shot',
    type: 'image',
    handle: 'brandpixels',
    whatItDoes: 'A premium, dark studio product photo for e-commerce and ads.',
    body: 'Premium studio product shot of {{product}} on a dark seamless background. Single softbox from above right, subtle rim light, deep shadows, glossy reflections on the surface below, ultra-sharp details, minimalist luxury advertising style. 100mm lens at f/8.',
    tools: ['Midjourney', 'Flux'],
    tags: ['product', 'studio', 'ecommerce'],
    images: [photo('studio-headphones', 'Black over-ear headphones on a dark studio background', 534, 386)],
    settings: '--ar 1:1 --style raw',
    publishedAt: at(28),
    stats: [1020, 700, 12600],
  }),
  seed({
    id: 'Jd7Hs3Vp4x',
    title: '30-day skill learning plan',
    type: 'learning',
    handle: 'learnwithsara',
    whatItDoes: 'Builds a week-by-week plan to learn any skill, starting from where you are now.',
    body: `Act as an expert coach. Build me a 30-day plan to learn {{skill}}, starting from {{current level}}. I can practice {{hours per day}} hours a day.

For each week give: the goal, 3–5 daily tasks, one mini-project, and how I'll know I'm on track. End with the 5 best free resources.`,
    tools: ['ChatGPT', 'Claude', 'Gemini'],
    tags: ['learning', 'planning', 'study'],
    sampleOutput: `# 30-day skill learning plan
- [x] Week 1: Foundations & setup
- [x] Week 2: Guided practice
- [x] Week 3: Real project
- [x] Week 4: Polish & next steps`,
    publishedAt: at(31),
    stats: [960, 720, 11800],
  }),
  seed({
    id: 'Gm2Rc8Xw5k',
    title: 'Aerial travel shot',
    type: 'image',
    handle: 'droneviews',
    whatItDoes: 'A top-down drone photo of a dramatic coastline in vivid, natural color.',
    body: 'Aerial drone photograph of a dramatic {{coastline}}: turquoise water, white surf against sandstone sea stacks, a winding cliff path, golden afternoon light. Top-down 45° angle, crisp details, vivid but natural colors.',
    tools: ['Midjourney', 'Flux'],
    tags: ['aerial', 'travel', 'coast'],
    images: [photo('aerial-coast', 'Aerial view of turquoise sea and sandstone sea stacks', 532, 368)],
    settings: '--ar 4:3',
    publishedAt: at(35),
    stats: [900, 620, 11900],
  }),
  seed({
    id: 'Nz4Tb6Lq1y',
    title: 'Clean analytics dashboard',
    type: 'coding',
    handle: 'datavizdan',
    whatItDoes: 'Generates a polished React + Tailwind metric card with a hand-drawn SVG chart.',
    body: `Build a single-file React + Tailwind component for a clean, dark analytics card showing {{metric}}.

Include: the current value, the % change vs last month (green if up, red if down), and a smooth area chart of the last 12 months. Neutral dark palette with one accent color, 16px radius, generous spacing. No chart libraries: draw the chart with SVG.`,
    tools: ['Claude', 'ChatGPT'],
    tags: ['react', 'tailwind', 'dashboard'],
    images: [{ url: '/mock/analytics-dashboard.svg', width: 550, height: 400, role: 'result', alt: 'Dark dashboard card: monthly revenue $128,420, up 12.4%, with a green area chart' }],
    publishedAt: at(39),
    stats: [840, 640, 10400],
  }),
  seed({
    id: 'Ev8Kp5Gs3h',
    title: 'Pet portrait, natural light',
    type: 'image',
    handle: 'pawsandpixels',
    whatItDoes: 'Warm, joyful pet portraits with real fur detail.',
    body: 'Portrait of a {{breed}} sitting in tall grass at golden hour, tongue out and happy, looking at the camera. Natural backlight, warm tones, creamy bokeh background, sharp fur detail, catchlights in the eyes. 85mm lens at f/1.8.',
    tools: ['Midjourney', 'GPT Image'],
    tags: ['pets', 'portrait', 'golden-hour'],
    images: [photo('golden-retriever', 'Happy golden retriever in warm evening light', 534, 370)],
    publishedAt: at(43),
    stats: [790, 560, 9800],
  }),
  seed({
    id: 'Qa3Mw9Dn7f',
    title: 'Cozy rainy day scene',
    type: 'image',
    handle: 'moodframes',
    whatItDoes: 'A cozy rainy-window still life for wallpapers and mood boards.',
    body: 'Cozy rainy-day still life: a steaming {{drink}} in a ceramic mug on a wooden windowsill, raindrops on the glass, warm lamp glow, blurred city lights outside, soft moody tones, shallow depth of field. Calm and cinematic.',
    tools: ['Midjourney', 'Flux'],
    tags: ['cozy', 'moody', 'still-life'],
    images: [photo('rainy-window', 'Mugs by a rainy window with a warm lamp glowing', 534, 366)],
    publishedAt: at(47),
    stats: [740, 540, 9300],
  }),

  /* ---- more demo prompts (not in the reference image) ---- */
  seed({
    id: 'Uk6Fr2Hz8b',
    title: 'Drone fly-through of a coastal town',
    type: 'video',
    handle: 'droneviews',
    whatItDoes: 'An 8-second cinematic drone reveal of a seaside town at sunrise.',
    body: 'Cinematic drone shot slowly flying over {{place}} at sunrise. Start high above the sea, glide toward the cliffs, then tilt down to reveal the town. Smooth, stable motion, natural colors, gentle waves, birds in the distance. 8 seconds, no text, no people close to the camera.',
    tools: ['Sora', 'Veo', 'Runway'],
    tags: ['drone', 'cinematic', 'travel'],
    publishedAt: at(2),
    stats: [9, 14, 140],
  }),
  seed({
    id: 'Lc9Xn4Pt6w',
    title: 'Lo-fi study beat with rain',
    type: 'audio',
    handle: 'tunesmith',
    whatItDoes: 'An instrumental lo-fi track that loops cleanly for focus sessions.',
    body: 'Create an instrumental lo-fi hip hop track for {{activity}}. 70–75 BPM, minor key, warm Rhodes piano, dusty vinyl crackle, soft brushed drums, mellow bassline, light rain ambience. No vocals. Calm, focused, slightly nostalgic. Make it loop cleanly.',
    tools: ['Suno', 'Udio'],
    tags: ['lofi', 'study', 'instrumental'],
    sampleOutput: `# Track: "Window Seat"
Lo-fi hip hop · 72 BPM · F minor

Dusty vinyl crackle, warm Rhodes chords, soft brushed drums, a mellow bassline and distant rain. Instrumental, 2:30, loops cleanly.`,
    publishedAt: at(3.5),
    stats: [6, 11, 95],
  }),
  seed({
    id: 'Sy2Dg7Jm5q',
    title: 'Meeting notes to action items',
    type: 'productivity',
    handle: 'notetaker',
    whatItDoes: 'Turns messy meeting notes into decisions, owners and deadlines.',
    body: `Here are raw notes from a meeting about {{topic}}:

{{paste notes}}

Turn them into:
1. A 3-sentence summary
2. Decisions made
3. Action items as a checklist: owner, task, deadline
4. Open questions

If an owner or deadline is missing, write "TBD" instead of guessing.`,
    tools: ['ChatGPT', 'Claude', 'Any chatbot'],
    tags: ['meetings', 'notes', 'teamwork'],
    sampleOutput: `# Action items
- [x] Priya: send the revised budget (Fri)
- [x] Dev team: fix the checkout bug (Wed)
- [x] Sam: book the offsite venue (TBD)
- [x] Everyone: review the Q3 roadmap (Mon)`,
    publishedAt: daysAgo(9),
    stats: [310, 690, 2100],
  }),
  seed({
    id: 'Oh5Wk8Rb3v',
    title: 'Interactive dungeon master',
    type: 'fun',
    handle: 'questcraft',
    whatItDoes: 'Runs a text adventure that remembers your health, items and choices.',
    body: `You are the game master of a text adventure set in {{world}}. I'm a {{character class}}.

Rules: describe each scene in under 100 words, always end with 3 numbered choices plus "something else", track my health and inventory in a short status line, and let my choices really change the story. Never decide what my character does. Start in a tense moment.`,
    tools: ['Claude', 'ChatGPT'],
    tags: ['roleplay', 'game', 'story'],
    sampleOutput: `# The Sunken Library
You wake on cold marble. Water drips from a ceiling lost in darkness, and somewhere below, pages are turning by themselves.

1. Follow the sound
2. Search the shelves
3. Light your last torch

HP 10/10 · Bag: rope, rusty key`,
    publishedAt: daysAgo(6),
    stats: [240, 210, 1300],
  }),
  seed({
    id: 'Cz7Ns1Fy4j',
    title: 'Landing page hero copy',
    type: 'business',
    handle: 'copyhouse',
    whatItDoes: 'Five sharp hero sections for any product, each from a different angle.',
    body: `Write 5 hero sections for the landing page of {{product}}, a tool for {{audience}}.

Each one needs a headline under 8 words, a subheadline under 20 words, and a button label. Make them specific and benefit-led, avoid buzzwords ("revolutionize", "seamless", "unlock"), and vary the angle: speed, money, status, fear of missing out, simplicity.`,
    tools: ['ChatGPT', 'Claude'],
    tags: ['copywriting', 'landing-page', 'marketing'],
    sampleOutput: `# Hero: the speed angle
Ship your side project this weekend.

Auth, payments and emails already wired up, so you only build the part that matters.

[ Start building free ]`,
    publishedAt: daysAgo(12),
    stats: [180, 260, 2600],
  }),
  seed({
    id: 'Ir4Bq6Tx9l',
    title: 'Speed up a slow SQL query',
    type: 'coding',
    handle: 'sqlsensei',
    whatItDoes: 'Finds why a PostgreSQL query is slow and hands back the fix and the index.',
    body: `You are a PostgreSQL performance expert. Here's a slow query and its EXPLAIN ANALYZE output:

{{query}}

{{explain output}}

Find the bottleneck and explain it in one paragraph, then give me the rewritten query and the exact indexes to add. Mention any trade-offs (write cost, disk space).`,
    tools: ['ChatGPT', 'Claude'],
    tags: ['sql', 'postgres', 'performance'],
    sampleOutput: `\`\`\`sql optimized.sql
-- Before: 2.4 s (sequential scan)
-- After: 18 ms (index scan)
CREATE INDEX CONCURRENTLY
  idx_orders_user_created
  ON orders (user_id, created_at DESC);

SELECT id, total, created_at
FROM orders
WHERE user_id = $1
ORDER BY created_at DESC
LIMIT 20;
\`\`\``,
    publishedAt: daysAgo(4),
    stats: [140, 330, 620],
  }),
  seed({
    id: 'Yp8Gd3Kw2s',
    title: 'Literature review in 10 minutes',
    type: 'learning',
    handle: 'researchrae',
    whatItDoes: 'A fast, honest map of the research on any topic, with the open questions.',
    body: `I'm researching {{topic}}. Act as a careful research assistant.

1. List the 10 most cited papers or sources from the last {{years}} years, with one line on each finding
2. Group them by approach and note where they disagree
3. Point out 3 open questions nobody has answered well

Only cite sources you're confident exist, and mark anything you're unsure about.`,
    tools: ['Claude', 'ChatGPT', 'Perplexity'],
    tags: ['research', 'papers', 'study'],
    sampleOutput: `# Review outline
- [x] 10 key sources, one-line findings
- [x] Grouped by method: surveys, trials, models
- [x] Where the evidence disagrees
- [x] 3 open questions worth studying`,
    publishedAt: daysAgo(15),
    stats: [95, 170, 480],
  }),
  seed({
    id: 'Dm1Vh5Lc7o',
    title: 'Rename photos by date with Python',
    type: 'coding',
    handle: 'devwithmike',
    whatItDoes: 'A safe script that renames photos to the date they were taken.',
    body: 'Write a Python 3 script that renames every photo in {{folder}} to its capture date from EXIF, like 2024-07-21_18-32-05.jpg. Keep the original extension, handle duplicates by adding _1, _2, skip files without EXIF, and support a --dry-run flag that only prints what would change. Standard library + Pillow only.',
    tools: ['ChatGPT', 'Claude', 'Any chatbot'],
    tags: ['python', 'automation', 'photos'],
    sampleOutput: `\`\`\`py rename_photos.py
from pathlib import Path
from PIL import Image

def taken_at(path: Path) -> str | None:
    exif = Image.open(path).getexif()
    raw = exif.get_ifd(0x8769).get(36867) or exif.get(306)
    if not raw:
        return None
    # "2024:07:21 18:32:05" -> "2024-07-21_18-32-05"
    return raw.replace(":", "-").replace(" ", "_")
\`\`\``,
    publishedAt: at(1),
    stats: [2, 3, 25],
  }),
  seed({
    id: 'Zt6Qj9Ra4e',
    title: "Cold DM that doesn't feel cold",
    type: 'writing',
    handle: 'productivy',
    whatItDoes: 'Three short LinkedIn DMs that get replies without the cringe.',
    body: `Write a LinkedIn DM to {{person}}, who {{what they did}}. I want to {{goal}}.

Keep it under 60 words, mention one specific detail about their work, make the ask small and easy to say yes to, and don't use flattery or "hope this finds you well". Give me 3 versions: casual, professional and bold.`,
    tools: ['ChatGPT', 'Claude'],
    tags: ['outreach', 'linkedin', 'networking'],
    sampleOutput: `# Casual version
Hey Maya, your teardown of the Duolingo onboarding was the clearest thing I read this month. I'm redesigning ours and have one question about streak timing. Mind if I send it over? No call needed.`,
    publishedAt: daysAgo(20),
    stats: [420, 380, 5100],
  }),
]
