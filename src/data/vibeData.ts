import type {
  AestheticId,
  ConfessionCategory,
  MoodDefinition,
  MoodName,
  ProfileThemeId,
  QuizDefinition,
  ReactionEmoji,
} from '../types';

export const MOODS: MoodDefinition[] = [
  {
    name: 'Happy',
    emoji: '✨',
    vibeTitle: 'Golden Hour Serotonin',
    affirmation: 'Protect this light—good energy looks effortless on you today.',
    soundtrack: 'Upbeat Indie Synth · 118 BPM',
    auraPair: ['#F472B6', '#A78BFA'],
    badgeText: 'Pure Radiance',
    energyPercent: 91,
    chaosPercent: 18,
    softnessPercent: 76,
  },
  {
    name: 'Romantic',
    emoji: '💌',
    vibeTitle: 'Soft Focus Daydream',
    affirmation: 'Everything feels like a handwritten letter waiting to be opened.',
    soundtrack: 'Dream Pop Velvet · 88 BPM',
    auraPair: ['#EC4899', '#C084FC'],
    badgeText: 'Heart On Sleeve',
    energyPercent: 68,
    chaosPercent: 32,
    softnessPercent: 95,
  },
  {
    name: 'Delusional',
    emoji: '🪩',
    vibeTitle: 'Unstoppable Delulu Era',
    affirmation: 'Reality is negotiable when your vision board is this loud.',
    soundtrack: 'Hyperpop Glitter · 132 BPM',
    auraPair: ['#D946EF', '#60A5FA'],
    badgeText: 'Manifesting Hard',
    energyPercent: 88,
    chaosPercent: 84,
    softnessPercent: 45,
  },
  {
    name: 'Productive',
    emoji: '⚡',
    vibeTitle: 'Locked-In Momentum',
    affirmation: 'Iced drink in hand, tabs organized, main-quest energy activated.',
    soundtrack: 'Lo-Fi House Focus · 122 BPM',
    auraPair: ['#7C3AED', '#38BDF8'],
    badgeText: 'Deep Flow',
    energyPercent: 94,
    chaosPercent: 12,
    softnessPercent: 40,
  },
  {
    name: 'Lonely',
    emoji: '🌙',
    vibeTitle: '2AM Window Seat',
    affirmation: 'Quiet nights make room for the people who actually get your frequency.',
    soundtrack: 'Acoustic Midnight · 74 BPM',
    auraPair: ['#6366F1', '#38BDF8'],
    badgeText: 'Tender Static',
    energyPercent: 34,
    chaosPercent: 22,
    softnessPercent: 90,
  },
  {
    name: 'Chaotic',
    emoji: '🌪️',
    vibeTitle: 'Plot Twist Energy',
    affirmation: 'Zero plan, questionable impulse texts, elite storytelling tomorrow.',
    soundtrack: 'Alt Electronic Rush · 140 BPM',
    auraPair: ['#EC4899', '#7C3AED'],
    badgeText: 'No Brakes',
    energyPercent: 92,
    chaosPercent: 97,
    softnessPercent: 28,
  },
  {
    name: 'Unbothered',
    emoji: '🧊',
    vibeTitle: 'Noise-Cancelling Peace',
    affirmation: 'Not your circus, not your timeline. Peace stays expensive and protected.',
    soundtrack: 'Smooth R&B Chill · 92 BPM',
    auraPair: ['#38BDF8', '#A78BFA'],
    badgeText: 'Zero Static',
    energyPercent: 64,
    chaosPercent: 8,
    softnessPercent: 72,
  },
  {
    name: 'Overthinking',
    emoji: '🌀',
    vibeTitle: '47 Open Browser Tabs',
    affirmation: 'Breathe out—half of the scenarios in your head are fan fiction.',
    soundtrack: 'Ambient Rain Piano · 80 BPM',
    auraPair: ['#8B5CF6', '#60A5FA'],
    badgeText: 'Spiral Watch',
    energyPercent: 52,
    chaosPercent: 74,
    softnessPercent: 65,
  },
  {
    name: 'Main Character Energy',
    emoji: '🎬',
    vibeTitle: 'Opening Credits Walk',
    affirmation: 'Headphones on, crosswalk timed to the beat drop, camera tracking you.',
    soundtrack: 'Cinematic Alt Pop · 114 BPM',
    auraPair: ['#7C3AED', '#EC4899'],
    badgeText: 'Center Frame',
    energyPercent: 96,
    chaosPercent: 48,
    softnessPercent: 54,
  },
  {
    name: 'Mentally on Vacation',
    emoji: '🏝️',
    vibeTitle: 'Out of Office Forever',
    affirmation: 'Physically here, spiritually sipping something cold near salt water.',
    soundtrack: 'Bossa Nova Sunset · 98 BPM',
    auraPair: ['#38BDF8', '#F472B6'],
    badgeText: 'Do Not Disturb',
    energyPercent: 58,
    chaosPercent: 19,
    softnessPercent: 88,
  },
];

export const MOOD_MAP: Record<MoodName, MoodDefinition> = MOODS.reduce(
  (acc, item) => {
    acc[item.name] = item;
    return acc;
  },
  {} as Record<MoodName, MoodDefinition>
);

export const CONFESSION_CATEGORIES: ConfessionCategory[] = [
  'Love',
  'Friendship',
  'School',
  'Life',
  'Random',
];

export const REACTION_EMOJIS: ReactionEmoji[] = ['💜', '😭', '🔥', '💀', '🫶'];

export const AESTHETICS: AestheticId[] = [
  'Dreamcore Lavender',
  'Indie Main Character',
  'Y2K Cyber Pop',
  'Soft Minimalist',
  'Midnight Coquette',
  'Solaris Clean',
];

export const AVATAR_PRESETS = [
  { id: 'aurora', label: 'Lavender Prism', from: '#A78BFA', to: '#EC4899', glyph: '✦' },
  { id: 'sky', label: 'Sky Halo', from: '#38BDF8', to: '#8B5CF6', glyph: '◐' },
  { id: 'rose', label: 'Hot Pink Disc', from: '#EC4899', to: '#F43F5E', glyph: '✿' },
  { id: 'violet', label: 'Electric Orb', from: '#7C3AED', to: '#38BDF8', glyph: '◈' },
  { id: 'moon', label: 'Midnight Star', from: '#4F46E5', to: '#C084FC', glyph: '☾' },
  { id: 'cloud', label: 'Soft Cloud', from: '#C4B5FD', to: '#7DD3FC', glyph: '☁' },
];

export const PROFILE_THEMES: {
  id: ProfileThemeId;
  name: string;
  gradient: string;
  accent: string;
}[] = [
  {
    id: 'lavender-haze',
    name: 'Lavender Haze',
    gradient: 'from-violet-500/20 via-fuchsia-400/15 to-sky-400/20',
    accent: '#8B5CF6',
  },
  {
    id: 'electric-violet',
    name: 'Electric Violet',
    gradient: 'from-purple-600/25 via-indigo-500/20 to-pink-500/20',
    accent: '#7C3AED',
  },
  {
    id: 'bubblegum-pop',
    name: 'Bubblegum Pop',
    gradient: 'from-pink-500/25 via-rose-400/15 to-violet-400/20',
    accent: '#EC4899',
  },
  {
    id: 'midnight-sky',
    name: 'Midnight Sky',
    gradient: 'from-sky-500/20 via-blue-500/15 to-violet-500/20',
    accent: '#38BDF8',
  },
];

export const QUIZZES: QuizDefinition[] = [
  {
    id: 'red-flag',
    slug: 'which-red-flag-are-you',
    title: 'Which red flag are you?',
    subtitle: 'Be honest. Nobody in the group chat is surprised anyway.',
    category: 'Self-Awareness',
    durationLabel: '2 min',
    questions: [
      {
        id: 'rf-1',
        prompt: 'Someone sends "we need to talk" at 11:42 PM. Your immediate move?',
        choices: [
          { id: 'a', label: 'Leave it on delivered and put my phone face down', outcomeKey: 'ghost' },
          { id: 'b', label: 'Write a 6-paragraph thesis before they reply', outcomeKey: 'overthinker' },
          { id: 'c', label: 'Assume it is good news and plan our celebration', outcomeKey: 'delulu' },
          { id: 'd', label: 'Reply "omg same" just to flip the plot', outcomeKey: 'chaos' },
        ],
      },
      {
        id: 'rf-2',
        prompt: 'How many browser tabs or Notes app drafts are open right now?',
        choices: [
          { id: 'a', label: '37 unsent texts and 12 grocery lists', outcomeKey: 'overthinker' },
          { id: 'b', label: 'Zero—I cleared everything and disappeared offline', outcomeKey: 'ghost' },
          { id: 'c', label: 'Only Pinterest boards for a life I have not funded yet', outcomeKey: 'delulu' },
          { id: 'd', label: '4 tabs of flights to a random city leaving tomorrow', outcomeKey: 'chaos' },
        ],
      },
      {
        id: 'rf-3',
        prompt: 'Your friend asks if you are ready to leave in 10 minutes.',
        choices: [
          { id: 'a', label: '"Almost there!" while still in a towel', outcomeKey: 'chaos' },
          { id: 'b', label: 'Check the lighting, mirror, and soundtrack first', outcomeKey: 'delulu' },
          { id: 'c', label: 'Cancel smoothly 4 minutes beforehand', outcomeKey: 'ghost' },
          { id: 'd', label: 'Arrive 20 minutes early and overanalyze my outfit', outcomeKey: 'overthinker' },
        ],
      },
      {
        id: 'rf-4',
        prompt: 'What happens after one mildly sweet compliment from your crush?',
        choices: [
          { id: 'a', label: 'Pick out our apartment color palette mentally', outcomeKey: 'delulu' },
          { id: 'b', label: 'Decode the exact punctuation for 45 minutes', outcomeKey: 'overthinker' },
          { id: 'c', label: 'Act completely unfazed and reply 6 hours later', outcomeKey: 'ghost' },
          { id: 'd', label: 'Say something unhinged and laugh too loud', outcomeKey: 'chaos' },
        ],
      },
      {
        id: 'rf-5',
        prompt: 'Sunday night reset looks like:',
        choices: [
          { id: 'a', label: 'Reorganizing my whole life at 1:00 AM', outcomeKey: 'chaos' },
          { id: 'b', label: 'Going full Do Not Disturb until Wednesday', outcomeKey: 'ghost' },
          { id: 'c', label: 'Writing a movie script in my head in the shower', outcomeKey: 'delulu' },
          { id: 'd', label: 'Replaying one awkward sentence from 2021', outcomeKey: 'overthinker' },
        ],
      },
    ],
    outcomes: {
      delulu: {
        key: 'delulu',
        title: 'The Hopeless Delulu Optimist',
        subtitle: 'One eye-contact glance = cinematic trilogy.',
        description:
          'You turn crumbs into a five-course tasting menu. Your optimism is weirdly magnetic, even when reality is still catching up to your storyboard.',
        traits: ['Romanticizes everything', 'Elite playlist curator', 'Zero chill, high charm'],
        matchPercent: 94,
        accentFrom: '#EC4899',
        accentTo: '#A78BFA',
        shareQuote: 'My red flag is turning one polite smile into a three-season arc.',
      },
      ghost: {
        key: 'ghost',
        title: 'The Aesthetic Vanishing Act',
        subtitle: 'Online in spirit, unreachable in practice.',
        description:
          'You love people deeply, just from airplane mode. Whenever social battery hits 14%, you evaporate into a cozy cocoon with zero warning.',
        traits: ['Do Not Disturb icon', '3-business-day replies', 'Protected peace'],
        matchPercent: 89,
        accentFrom: '#6366F1',
        accentTo: '#38BDF8',
        shareQuote: 'My red flag is replying in my head and calling it communication.',
      },
      overthinker: {
        key: 'overthinker',
        title: 'The Notes App Detective',
        subtitle: 'Never misses a subtext, even imaginary ones.',
        description:
          'You have the emotional bandwidth of a supercomputer running 40 background simulations at once. Deeply caring, slightly haunted by tone shifts.',
        traits: ['Screenshot analyst', 'Reads between invisible lines', 'Loyal to a fault'],
        matchPercent: 91,
        accentFrom: '#7C3AED',
        accentTo: '#60A5FA',
        shareQuote: 'My red flag is writing three drafts for a 4-word reply.',
      },
      chaos: {
        key: 'chaos',
        title: 'The Spontaneous Plot-Twister',
        subtitle: 'Turns calm Tuesdays into lore.',
        description:
          'You treat calendars like gentle suggestions. Friends keep you around because every hangout turns into a story they tell for three years.',
        traits: ['2AM haircut impulse', 'Never on time, always iconic', 'High voltage'],
        matchPercent: 96,
        accentFrom: '#F43F5E',
        accentTo: '#8B5CF6',
        shareQuote: 'My red flag is saying "trust me" right before an unforgettable detour.',
      },
    },
  },
  {
    id: 'main-character',
    slug: 'main-character-energy',
    title: 'What is your main character energy?',
    subtitle: 'Find out what genre your life is currently filmed in.',
    category: 'Vibe Archetype',
    durationLabel: '2 min',
    questions: [
      {
        id: 'mc-1',
        prompt: 'Pick your ideal rainy afternoon scene:',
        choices: [
          { id: 'a', label: 'Corner booth at a dimly lit cafe with headphones', outcomeKey: 'indie' },
          { id: 'b', label: 'Dancing around my room while packing for somewhere new', outcomeKey: 'romcom' },
          { id: 'c', label: 'Striding through downtown in a trench coat like I own it', outcomeKey: 'boss' },
          { id: 'd', label: 'Late-night drive with neon reflections on the windshield', outcomeKey: 'noir' },
        ],
      },
      {
        id: 'mc-2',
        prompt: 'What always plays in your personal soundtrack?',
        choices: [
          { id: 'a', label: 'Dreamy indie guitar & warm vinyl crackle', outcomeKey: 'indie' },
          { id: 'b', label: 'Feel-good pop hooks you belt in the car', outcomeKey: 'romcom' },
          { id: 'c', label: 'Bass-heavy electronic confidence tracks', outcomeKey: 'boss' },
          { id: 'd', label: 'Moody midnight R&B and synthwave', outcomeKey: 'noir' },
        ],
      },
      {
        id: 'mc-3',
        prompt: 'How do you handle a sudden plot twist?',
        choices: [
          { id: 'a', label: 'Journal about it dramatically by a window', outcomeKey: 'indie' },
          { id: 'b', label: 'Laugh, call my best friend, make it iconic', outcomeKey: 'romcom' },
          { id: 'c', label: 'Pivot fast and come out ahead by Friday', outcomeKey: 'boss' },
          { id: 'd', label: 'Stay mysteriously calm while everyone else panics', outcomeKey: 'noir' },
        ],
      },
      {
        id: 'mc-4',
        prompt: 'Choose your signature accessory:',
        choices: [
          { id: 'a', label: 'Wired earphones & a worn tote bag', outcomeKey: 'indie' },
          { id: 'b', label: 'Oversized sunglasses & iced matcha', outcomeKey: 'romcom' },
          { id: 'c', label: 'Sharp blazer & zero tolerance for nonsense', outcomeKey: 'boss' },
          { id: 'd', label: 'Silver rings & a vintage leather jacket', outcomeKey: 'noir' },
        ],
      },
    ],
    outcomes: {
      indie: {
        key: 'indie',
        title: 'A24 Coming-of-Age Lead',
        subtitle: 'Golden hour shadows and effortless depth.',
        description:
          'You notice small magic other people walk past. Your life feels shot on 35mm film with soulful pauses and unforgettable side characters.',
        traits: ['Observant poet', 'Cozy chaos', 'Soundtrack perfectionist'],
        matchPercent: 93,
        accentFrom: '#A78BFA',
        accentTo: '#38BDF8',
        shareQuote: 'Currently starring in an A24 coming-of-age film with elite lighting.',
      },
      romcom: {
        key: 'romcom',
        title: '2000s Rom-Com Icon',
        subtitle: 'Charming mishaps and unstoppable warmth.',
        description:
          'You bring high-wattage joy into every room. Even when things go sideways, you somehow turn the detour into everyone’s favorite memory.',
        traits: ['Radiant warmth', 'Montage-ready', 'Best-friend energy'],
        matchPercent: 95,
        accentFrom: '#EC4899',
        accentTo: '#F472B6',
        shareQuote: 'Running late with an iced coffee and 2000s rom-com main character energy.',
      },
      boss: {
        key: 'boss',
        title: 'Powerhouse Season Finale',
        subtitle: 'Walks in like the opening beat drop.',
        description:
          'Focused, magnetic, and allergy-free to mediocrity. People ask you for advice because your standards quietly raise the whole room.',
        traits: ['Visionary pace', 'Unbothered aura', 'Gets things done'],
        matchPercent: 92,
        accentFrom: '#7C3AED',
        accentTo: '#EC4899',
        shareQuote: 'No filler episodes—pure season-finale main character energy.',
      },
      noir: {
        key: 'noir',
        title: 'Midnight Neon Anti-Hero',
        subtitle: 'Cool exterior, razor-sharp intuition.',
        description:
          'You keep your cards close and your taste immaculate. You thrive after sunset and always know what is really going on beneath the surface.',
        traits: ['Mysterious calm', '2AM clarity', 'Magnetic presence'],
        matchPercent: 90,
        accentFrom: '#4F46E5',
        accentTo: '#C084FC',
        shareQuote: 'Thriving after midnight with effortless anti-hero composure.',
      },
    },
  },
  {
    id: 'fictional-character',
    slug: 'which-fictional-character-matches-your-personality',
    title: 'Which fictional character matches your personality?',
    subtitle: 'Your unscripted alter ego across iconic universes.',
    category: 'Pop Culture',
    durationLabel: '2 min',
    questions: [
      {
        id: 'fc-1',
        prompt: 'In the friend group crisis, who are you?',
        choices: [
          { id: 'a', label: 'The mastermind with a three-step backup plan', outcomeKey: 'strategist' },
          { id: 'b', label: 'The heart who rallies everyone together', outcomeKey: 'sunshine' },
          { id: 'c', label: 'The dry-humor realist with one-liners', outcomeKey: 'wit' },
          { id: 'd', label: 'The wildcard who pulls off the impossible stunt', outcomeKey: 'rebel' },
        ],
      },
      {
        id: 'fc-2',
        prompt: 'What motivates you most?',
        choices: [
          { id: 'a', label: 'Proving everyone wrong quietly', outcomeKey: 'strategist' },
          { id: 'b', label: 'Protecting the people I love', outcomeKey: 'sunshine' },
          { id: 'c', label: 'Freedom and never being bored', outcomeKey: 'rebel' },
          { id: 'd', label: 'Truth, curiosity, and sharp banter', outcomeKey: 'wit' },
        ],
      },
      {
        id: 'fc-3',
        prompt: 'Your ideal weekend basecamp:',
        choices: [
          { id: 'a', label: 'A sunlit loft full of books and espresso', outcomeKey: 'wit' },
          { id: 'b', label: 'A rooftop string-light hangout with friends', outcomeKey: 'sunshine' },
          { id: 'c', label: 'A sleek midnight studio plotting big moves', outcomeKey: 'strategist' },
          { id: 'd', label: 'Anywhere with open highway and zero itinerary', outcomeKey: 'rebel' },
        ],
      },
      {
        id: 'fc-4',
        prompt: 'Pick a quote that hits closest:',
        choices: [
          { id: 'a', label: '"Already handled it twenty minutes ago."', outcomeKey: 'strategist' },
          { id: 'b', label: '"Wait, I actually have a crazy idea."', outcomeKey: 'rebel' },
          { id: 'c', label: '"I brought snacks and emotional support."', outcomeKey: 'sunshine' },
          { id: 'd', label: '"I am not cynical, I just read the room."', outcomeKey: 'wit' },
        ],
      },
    ],
    outcomes: {
      strategist: {
        key: 'strategist',
        title: 'The Velvet Mastermind',
        subtitle: 'Think Kaz Brekker meets Amy Dunne’s planner.',
        description:
          'You stay three steps ahead without breaking a sweat. Beneath your composed exterior is fierce loyalty for the few who earn your trust.',
        traits: ['Tactical mind', 'Immaculate timing', 'Quietly unstoppable'],
        matchPercent: 93,
        accentFrom: '#7C3AED',
        accentTo: '#38BDF8',
        shareQuote: 'Matched with The Velvet Mastermind: always three moves ahead.',
      },
      sunshine: {
        key: 'sunshine',
        title: 'The Golden Protector',
        subtitle: 'Pure heart with unexpected steel.',
        description:
          'Warm, brave, and the glue of every circle. People underestimate your kindness until they realize you have the strongest spine in the room.',
        traits: ['Fiercely loyal', 'Warm presence', 'Courageous heart'],
        matchPercent: 95,
        accentFrom: '#EC4899',
        accentTo: '#A78BFA',
        shareQuote: 'Matched with The Golden Protector: soft heart, unbreakable backbone.',
      },
      wit: {
        key: 'wit',
        title: 'The Deadpan Genius',
        subtitle: 'Sharp tongue, secret softie.',
        description:
          'You deliver devastatingly accurate observations with zero effort, yet you are the first person awake at 3 AM when a friend needs help.',
        traits: ['Elite sarcasm', 'Hyper-observant', 'Secretly sentimental'],
        matchPercent: 91,
        accentFrom: '#60A5FA',
        accentTo: '#C084FC',
        shareQuote: 'Matched with The Deadpan Genius: dry humor, elite intuition.',
      },
      rebel: {
        key: 'rebel',
        title: 'The Kinetic Wildcard',
        subtitle: 'Rules are optional, loyalty is sacred.',
        description:
          'Electric, fearless, and allergic to stagnation. Every story gets better the second you walk into the frame.',
        traits: ['Fearless instinct', 'High charisma', 'Unfiltered energy'],
        matchPercent: 94,
        accentFrom: '#F43F5E',
        accentTo: '#7C3AED',
        shareQuote: 'Matched with The Kinetic Wildcard: zero script, maximum momentum.',
      },
    },
  },
  {
    id: 'relationship-personality',
    slug: 'relationship-personality',
    title: 'What is your relationship personality?',
    subtitle: 'How you love, text, and show up when feelings get real.',
    category: 'Love & Connections',
    durationLabel: '2 min',
    questions: [
      {
        id: 'rp-1',
        prompt: 'Your signature way of saying "I care about you" without words:',
        choices: [
          { id: 'a', label: 'Making a hyper-specific playlist for their commute', outcomeKey: 'curator' },
          { id: 'b', label: 'Showing up with their favorite snack unannounced', outcomeKey: 'caretaker' },
          { id: 'c', label: 'Playfully roasting them every 12 minutes', outcomeKey: 'banter' },
          { id: 'd', label: 'Giving them peaceful space while staying 100% solid', outcomeKey: 'anchor' },
        ],
      },
      {
        id: 'rp-2',
        prompt: 'Ideal Saturday date:',
        choices: [
          { id: 'a', label: 'Record store browsing and sunset walk', outcomeKey: 'curator' },
          { id: 'b', label: 'Cooking dinner together while laughing too hard', outcomeKey: 'caretaker' },
          { id: 'c', label: 'Arcade competition or chaotic thrift challenge', outcomeKey: 'banter' },
          { id: 'd', label: 'Quiet museum morning and long unhurried talk', outcomeKey: 'anchor' },
        ],
      },
      {
        id: 'rp-3',
        prompt: 'When conflict pops up, you:',
        choices: [
          { id: 'a', label: 'Reflect first, then send an honest voice note', outcomeKey: 'curator' },
          { id: 'b', label: 'Want to talk it out gently right away', outcomeKey: 'caretaker' },
          { id: 'c', label: 'Break the tension with humor, then get real', outcomeKey: 'banter' },
          { id: 'd', label: 'Stay grounded and listen without defensiveness', outcomeKey: 'anchor' },
        ],
      },
      {
        id: 'rp-4',
        prompt: 'What gives you instant butterflies?',
        choices: [
          { id: 'a', label: 'Someone remembering tiny details I mentioned weeks ago', outcomeKey: 'curator' },
          { id: 'b', label: 'Effortless thoughtfulness and warm hugs', outcomeKey: 'caretaker' },
          { id: 'c', label: 'Quick wit and eye-contact smiles across the room', outcomeKey: 'banter' },
          { id: 'd', label: 'Emotional consistency that actually feels safe', outcomeKey: 'anchor' },
        ],
      },
    ],
    outcomes: {
      curator: {
        key: 'curator',
        title: 'The Sentimental Curator',
        subtitle: 'Love through details, playlists, and memory.',
        description:
          'You love poetically. You notice small preferences, keep ticket stubs, and turn everyday moments into keepsakes.',
        traits: ['Detail-obsessed lover', 'Thoughtful playlists', 'Deep romantic'],
        matchPercent: 95,
        accentFrom: '#EC4899',
        accentTo: '#A78BFA',
        shareQuote: 'Relationship style: The Sentimental Curator—fluent in tiny details.',
      },
      caretaker: {
        key: 'caretaker',
        title: 'The Warm Safe-Harbor',
        subtitle: 'Softness, snacks, and genuine presence.',
        description:
          'Loving you feels like taking a deep breath. You check if people got home safe and turn stressful weeks into cozy relief.',
        traits: ['Nurturing warmth', 'Always checks in', 'Golden-retriever loyalty'],
        matchPercent: 93,
        accentFrom: '#F472B6',
        accentTo: '#60A5FA',
        shareQuote: 'Relationship style: The Warm Safe-Harbor—pure comfort & devotion.',
      },
      banter: {
        key: 'banter',
        title: 'The Electric Best-Friend',
        subtitle: 'Flirting via jokes and endless chemistry.',
        description:
          'You need sparks, laughter, and playful teasing. Your ideal partner feels like your favorite person to roast and conquer life with.',
        traits: ['Elite banter', 'Playful spark', 'Never boring'],
        matchPercent: 92,
        accentFrom: '#7C3AED',
        accentTo: '#EC4899',
        shareQuote: 'Relationship style: The Electric Best-Friend—humor is my love language.',
      },
      anchor: {
        key: 'anchor',
        title: 'The Grounded Anchor',
        subtitle: 'Calm devotion, zero mind games.',
        description:
          'You bring rare peace to modern dating. Steady, emotionally intelligent, and transparent—you make closeness feel effortless.',
        traits: ['Zero games', 'Secure energy', 'Deep listener'],
        matchPercent: 94,
        accentFrom: '#38BDF8',
        accentTo: '#7C3AED',
        shareQuote: 'Relationship style: The Grounded Anchor—calm clarity, zero games.',
      },
    },
  },
  {
    id: 'brain-chaos',
    slug: 'how-chaotic-is-your-brain',
    title: 'How chaotic is your brain?',
    subtitle: 'Measuring your mental browser tabs per square inch.',
    category: 'Brain Chemistry',
    durationLabel: '2 min',
    questions: [
      {
        id: 'bc-1',
        prompt: 'You walk into the kitchen for water. What happens?',
        choices: [
          { id: 'a', label: 'Drink water, rinse glass, leave. Normal.', outcomeKey: 'zen' },
          { id: 'b', label: 'Check the fridge twice and forget why I stood up', outcomeKey: 'breezy' },
          { id: 'c', label: 'Reorganize the spice rack and start making iced matcha', outcomeKey: 'spark' },
          { id: 'd', label: 'End up researching 14th-century architecture on the counter', outcomeKey: 'feral' },
        ],
      },
      {
        id: 'bc-2',
        prompt: 'What does your camera roll look like?',
        choices: [
          { id: 'a', label: 'Curated albums sorted by month', outcomeKey: 'zen' },
          { id: 'b', label: 'Mostly sunsets, friends, and cute dogs', outcomeKey: 'breezy' },
          { id: 'c', label: '600 screenshots of memes, outfits, and recipes', outcomeKey: 'spark' },
          { id: 'd', label: 'Blurry 0.5x selfies next to parking spot reminders', outcomeKey: 'feral' },
        ],
      },
      {
        id: 'bc-3',
        prompt: 'Mid-conversation, a random memory hits. You:',
        choices: [
          { id: 'a', label: 'Save it for a natural pause later', outcomeKey: 'zen' },
          { id: 'b', label: 'Smile and mention it when the topic shifts', outcomeKey: 'breezy' },
          { id: 'c', label: 'Say "wait totally unrelated" and pivot fast', outcomeKey: 'spark' },
          { id: 'd', label: 'Blurted it out three seconds ago mid-sentence', outcomeKey: 'feral' },
        ],
      },
      {
        id: 'bc-4',
        prompt: 'Your sleep schedule this week:',
        choices: [
          { id: 'a', label: 'Asleep by 11 PM, hydrated, thriving', outcomeKey: 'zen' },
          { id: 'b', label: 'Mostly regular with one late Friday', outcomeKey: 'breezy' },
          { id: 'c', label: 'Depends entirely on what rabbit hole I found', outcomeKey: 'spark' },
          { id: 'd', label: 'Time is a flat circle powered by iced espresso', outcomeKey: 'feral' },
        ],
      },
    ],
    outcomes: {
      zen: {
        key: 'zen',
        title: '12% Chaos — Silk Monorail',
        subtitle: 'Suspiciously composed. Teach us your ways.',
        description:
          'Your brain actually finishes one thought before launching the next. Friends rely on you to remember where everyone parked.',
        traits: ['Clean desktop', 'Calm focus', 'Always has charger'],
        matchPercent: 12,
        accentFrom: '#38BDF8',
        accentTo: '#A78BFA',
        shareQuote: 'Brain Chaos Score: 12%—suspiciously calm and hydrated.',
      },
      breezy: {
        key: 'breezy',
        title: '44% Chaos — Pleasant Daydream',
        subtitle: 'Functional with occasional side quests.',
        description:
          'You stay mostly on track, except when a good song comes on or a sunny cafe distracts you for an hour.',
        traits: ['Balanced whimsy', 'Good instincts', 'Cozy distractibility'],
        matchPercent: 44,
        accentFrom: '#A78BFA',
        accentTo: '#F472B6',
        shareQuote: 'Brain Chaos Score: 44%—mostly thriving, occasionally daydreaming.',
      },
      spark: {
        key: 'spark',
        title: '78% Chaos — Disco Ball Brain',
        subtitle: 'Ideas bouncing in 14 directions at once.',
        description:
          'Your mind is a sparkling pinball machine of creativity, jokes, and sudden hyperfixations. Exhausting sometimes, brilliant always.',
        traits: ['100 ideas/minute', 'Creative dynamo', '50 open tabs'],
        matchPercent: 78,
        accentFrom: '#EC4899',
        accentTo: '#7C3AED',
        shareQuote: 'Brain Chaos Score: 78%—powered by disco-ball impulses & 50 tabs.',
      },
      feral: {
        key: 'feral',
        title: '98% Chaos — Unfiltered WiFi Signal',
        subtitle: 'Pure kinetic lore and 3AM epiphanies.',
        description:
          'Linear thinking never stood a chance. Somehow your chaotic brilliance always lands on its feet right before the deadline.',
        traits: ['Zero filter', 'Maximum lore', 'Elite improviser'],
        matchPercent: 98,
        accentFrom: '#F43F5E',
        accentTo: '#60A5FA',
        shareQuote: 'Brain Chaos Score: 98%—pure kinetic lore, zero brakes.',
      },
    },
  },
  {
    id: 'aesthetic-match',
    slug: 'what-aesthetic-represents-you',
    title: 'What aesthetic represents you?',
    subtitle: 'Your visual universe distilled into colors, textures, and mood.',
    category: 'Style & Culture',
    durationLabel: '2 min',
    questions: [
      {
        id: 'ae-1',
        prompt: 'Pick the texture you gravitate toward most:',
        choices: [
          { id: 'a', label: 'Sheer iridescent silk & frosted glass', outcomeKey: 'dreamcore' },
          { id: 'b', label: 'Chrome hardware, translucent acrylic & neon', outcomeKey: 'y2k' },
          { id: 'c', label: 'Warm 35mm film grain & worn denim', outcomeKey: 'indie' },
          { id: 'd', label: 'Crisp matte linen & sculptural ceramics', outcomeKey: 'minimal' },
        ],
      },
      {
        id: 'ae-2',
        prompt: 'Your ideal desktop wallpaper:',
        choices: [
          { id: 'a', label: 'Pastel lavender sky above soft clouds', outcomeKey: 'dreamcore' },
          { id: 'b', label: 'Metallic liquid 3D shapes in electric blue', outcomeKey: 'y2k' },
          { id: 'c', label: 'Blurry concert photo or rooftop sunset', outcomeKey: 'indie' },
          { id: 'd', label: 'Monochrome architectural shadows', outcomeKey: 'minimal' },
        ],
      },
      {
        id: 'ae-3',
        prompt: 'Favorite lighting in any room:',
        choices: [
          { id: 'a', label: 'Sunset prism rainbow across the wall', outcomeKey: 'dreamcore' },
          { id: 'b', label: 'Vibrant purple-pink LED glow', outcomeKey: 'y2k' },
          { id: 'c', label: 'Warm vintage amber lamp & string lights', outcomeKey: 'indie' },
          { id: 'd', label: 'Clean natural morning daylight', outcomeKey: 'minimal' },
        ],
      },
      {
        id: 'ae-4',
        prompt: 'Pick your go-to drink order:',
        choices: [
          { id: 'a', label: 'Iced lavender oat latte', outcomeKey: 'dreamcore' },
          { id: 'b', label: 'Sparkling berry refresher', outcomeKey: 'y2k' },
          { id: 'c', label: 'Iced americano with extra atmosphere', outcomeKey: 'indie' },
          { id: 'd', label: 'Ceremonial matcha, unsweetened', outcomeKey: 'minimal' },
        ],
      },
    ],
    outcomes: {
      dreamcore: {
        key: 'dreamcore',
        title: 'Dreamcore Lavender',
        subtitle: 'Poetic haze, twilight skies, soft optimism.',
        description:
          'You move through life like a dreamy sunset prism—gentle, imaginative, and endlessly drawn to beauty in quiet moments.',
        traits: ['Soft violet aura', 'Daydreamer', 'Romantic gaze'],
        matchPercent: 96,
        accentFrom: '#C084FC',
        accentTo: '#7DD3FC',
        shareQuote: 'My aesthetic: Dreamcore Lavender—twilight skies & soft prisms.',
      },
      y2k: {
        key: 'y2k',
        title: 'Y2K Cyber Pop',
        subtitle: 'High-gloss electric violet, chrome & confidence.',
        description:
          'Bold, playful, and unapologetically fun. You mix retro-futuristic flair with sharp modern internet taste.',
        traits: ['Electric palette', 'Trendsetter', 'High-contrast charm'],
        matchPercent: 94,
        accentFrom: '#EC4899',
        accentTo: '#38BDF8',
        shareQuote: 'My aesthetic: Y2K Cyber Pop—chrome shimmer & electric purple.',
      },
      indie: {
        key: 'indie',
        title: 'Indie Main Character',
        subtitle: 'Analog film grain, late trains & heartfelt playlists.',
        description:
          'Effortlessly cool without trying too hard. Everything around you feels candid, soulful, and deeply authentic.',
        traits: ['35mm nostalgia', 'Midnight poet', 'Soulful taste'],
        matchPercent: 92,
        accentFrom: '#8B5CF6',
        accentTo: '#F472B6',
        shareQuote: 'My aesthetic: Indie Main Character—35mm film grain & golden hour.',
      },
      minimal: {
        key: 'minimal',
        title: 'Soft Minimalist',
        subtitle: 'Clean lines, calm mind, intentional warmth.',
        description:
          'You curate rather than clutter. Every choice you make feels crisp, breathable, and quietly elevated.',
        traits: ['Refined taste', 'Calm clarity', 'Intentional edit'],
        matchPercent: 90,
        accentFrom: '#A78BFA',
        accentTo: '#60A5FA',
        shareQuote: 'My aesthetic: Soft Minimalist—clean space, quiet luxury.',
      },
    },
  },
];
