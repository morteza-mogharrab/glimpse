/**
 * Sample content for the demo. All people, captions and comments are invented.
 * Photos come from a free sample collection (Pixabay-derived, see README).
 */
import type {
  AppNotification, Comment, Conversation, Database, Highlight, MediaItem, Post, Story, User,
} from '../types';
import { MEDIA_ASPECT } from './mediaManifest';

export const SEED_VERSION = 4;

// ---------- helpers ----------
const MIN = 60_000;
const ago = (minutes: number) => new Date(Date.now() - minutes * MIN).toISOString();
const H = 60;
const D = 24 * H;

/** Deterministic PRNG so the seed looks the same on every load. */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}
const rand = rng(20261122);
const pick = <T,>(arr: T[]) => arr[Math.floor(rand() * arr.length)];

export const photo = (n: number, alt = ''): MediaItem => ({
  src: `media/p/${n}.jpg`,
  thumb: `media/t/${n}.jpg`,
  alt,
});
const avatar = (n: number) => `media/a/${n}.jpg`;

// ---------- users ----------
type UserSeed = [
  id: string, fullName: string, avatarN: number, followers: number, following: number,
  bio: string, extra?: Partial<User>,
];

const userSeeds: UserSeed[] = [
  ['jordan.ellis', 'Jordan Ellis', 152, 1284, 412,
    'Chasing trains, light and long roads 🚆\nWeekend photographer · Calgary → anywhere',
    { website: 'jordanellis.photo', category: 'Photographer' }],
  ['sofia.wanders', 'Sofia Marchetti', 193, 248_000, 811,
    'Slow travel, small towns, big views 🇮🇹\nCurrently: somewhere on the Ligurian coast\nCollabs → hello@sofiawanders.co',
    { verified: true, website: 'sofiawanders.co', category: 'Travel blogger', followsMe: true }],
  ['theo.outdoors', 'Theo Lindqvist', 166, 86_400, 530,
    'Mountains first, coffee second ⛰️\nAlpine lakes · long hikes · film + digital',
    { website: 'theo-outdoors.com', category: 'Outdoor & sporting goods', followsMe: true }],
  ['wild.lens', 'Wild Lens Collective', 143, 1_240_000, 96,
    'Wildlife from patient people 🦉\nTag #wildlenscollective to be featured\nNo baiting, no drones near nests.',
    { verified: true, website: 'wildlens.org', category: 'Nonprofit organization' }],
  ['hana.blooms', 'Hana Okada', 240, 52_300, 377,
    'Florist & seasonal arrangements 🌷\nStudio open Thu–Sat · weddings by request',
    { website: 'hanablooms.studio', category: 'Florist', followsMe: true }],
  ['fresh.market', 'Fresh Market Co.', 34, 318_000, 214,
    'Eat the season 🍊\nRecipes, market hauls & good produce\nNew recipe every Sunday',
    { verified: true, website: 'freshmarket.co', category: 'Grocery store' }],
  ['pop.parlor', 'Pop Parlor', 356, 19_800, 140,
    'Small-batch ice pops 🍭\nFruit-first. No artificial colours.\n📍 Kensington, open till 9',
    { website: 'popparlor.ca', category: 'Dessert shop' }],
  ['happy.paws', 'Happy Paws', 64, 702_000, 58,
    'Good dogs only. Which is all of them 🐾\nDM your pup for a feature',
    { verified: true, category: 'Pet', followsMe: false }],
  ['bruno.the.aussie', 'Bruno 🐶', 287, 33_100, 210,
    'Australian shepherd · professional stick collector\nRuns on treats and zoomies',
    { category: 'Pet', followsMe: true }],
  ['miso.the.cat', 'Miso', 184, 128_000, 12,
    'Calico. Judging you politely.\n🐟 Sponsored by the fridge',
    { category: 'Pet' }],
  ['analog.club', 'Analog Club', 178, 64_900, 320,
    'Film never died 🎞️\nMedium format, street & everyday\nSubmissions open monthly',
    { website: 'analogclub.community', category: 'Community' }],
  ['noor.portraits', 'Noor Haddad', 2, 41_200, 698,
    'Portraits in natural light 📷\nBooking spring sessions — link below',
    { website: 'noorhaddad.com', category: 'Photographer', followsMe: true }],
  ['mia.sullivan', 'Mia Sullivan', 38, 9_870, 1_120,
    'coffee, chaos, and good playlists ☕️\ncurly hair, don’t care',
    { followsMe: true }],
  ['chloe.atelier', 'Chloé Bernard', 98, 187_000, 402,
    'Paris ↔ Lisbon · personal style & tailoring\nWearing what I love, not what’s trending',
    { verified: true, website: 'chloeatelier.fr', category: 'Fashion' }],
  ['amara.moves', 'Amara Osei', 136, 75_500, 880,
    'Dancer & movement coach 💃🏾\nClasses every Tuesday · Toronto',
    { website: 'amaramoves.com', category: 'Dancer', followsMe: true }],
  ['lena.nightlights', 'Lena Hoffmann', 262, 22_400, 455,
    'After-dark photographer 🌙\nCity lights, candles and long exposures',
    { category: 'Artist' }],
  ['yuna.kim', 'Yuna Kim', 324, 412_000, 230,
    'soft mornings 🌸\nbeauty · skincare · slow living',
    { verified: true, category: 'Digital creator' }],
  ['meiling.studio', 'Mei Ling', 377, 15_600, 310,
    'Pressed flowers & watercolor 🎨\nCommissions open',
    { website: 'meiling.studio', category: 'Artist', followsMe: true }],
  ['kai.mindful', 'Kai Nakamura', 181, 58_700, 189,
    'Breathe in. Breathe out. 🧘\nSunsets, stillness, and 10-minute meditations',
    { category: 'Wellness' }],
  ['coastal.diaries', 'Coastal Diaries', 185, 96_100, 401,
    'Life by the water 🌊\nBoats · beaches · reefs\nShot something salty? Tag us.',
    { category: 'Travel company' }],
  ['macro.world', 'Ravi Menon', 56, 27_300, 260,
    'The tiny world, up close 🐞\n100mm macro · patience required',
    { category: 'Photographer' }],
];

const users: Record<string, User> = {};
for (const [id, fullName, av, followers, following, bio, extra] of userSeeds) {
  users[id] = {
    id, username: id, fullName, avatar: avatar(av), bio,
    followerCount: followers, followingCount: following, highlights: [], ...extra,
  };
}

const hl = (id: string, title: string, nums: number[]): Highlight => ({
  id, title, cover: photo(nums[0]), items: nums.map((n) => photo(n)),
});
users['sofia.wanders'].highlights = [
  hl('h-sofia-1', 'Italia', [185, 236, 341]),
  hl('h-sofia-2', 'Alps', [104, 365]),
  hl('h-sofia-3', 'Beaches', [372, 20, 387]),
  hl('h-sofia-4', 'Q&A', [336]),
];
users['theo.outdoors'].highlights = [
  hl('h-theo-1', 'Lakes', [170, 238, 364]),
  hl('h-theo-2', 'Summits', [127, 215, 142]),
  hl('h-theo-3', 'Gear', [120]),
];
users['wild.lens'].highlights = [
  hl('h-wl-1', 'Birds', [92, 129, 347, 315]),
  hl('h-wl-2', 'Safari', [322, 335, 270]),
  hl('h-wl-3', 'Mammals', [223, 219, 88]),
];
users['jordan.ellis'].highlights = [
  hl('h-me-1', 'Rails', [109, 249]),
  hl('h-me-2', 'Iceland', [105, 312]),
  hl('h-me-3', 'City', [261]),
];
users['hana.blooms'].highlights = [
  hl('h-hana-1', 'Weddings', [303, 9]),
  hl('h-hana-2', 'Spring', [35, 58, 141]),
];
users['fresh.market'].highlights = [
  hl('h-fm-1', 'Recipes', [57, 134, 76]),
  hl('h-fm-2', 'Market', [131, 34]),
];

// ---------- comments ----------
const commentPool: Record<string, string[]> = {
  travel: ['Adding this to my list immediately 😍', 'The colours here are unreal', 'Okay I need to go back', 'Where did you stay?? 🙏', 'This is the dream', 'Such a good find!', 'That light though 🔥', 'Saving this for summer'],
  nature: ['Incredible shot 👏', 'How long did you wait for this?', 'Nature is showing off again', 'Wow. Just wow.', 'The detail!! 😮', 'Frame-worthy', 'This made my morning'],
  food: ['Recipe please 🙏', 'I can almost taste it', 'Making this tonight!', 'Looks so fresh 😋', 'Need this in my life'],
  pets: ['THAT FACE 😭', 'Protect at all costs', 'Biggest good boy energy', 'I would die for them', 'Look at those eyes 🥺', 'Give them a treat from me'],
  people: ['Stunning 😍', 'Obsessed with this', 'Main character energy ✨', 'You look amazing!', 'This vibe 🔥', 'Iconic'],
  city: ['Moody in the best way', 'Love the composition', 'This city never misses', 'Cinematic 🎬', 'Great eye!'],
};
const commenters = Object.keys(users).filter((u) => u !== 'jordan.ellis');
let commentSeq = 0;
function makeComments(theme: keyof typeof commentPool, author: string, count: number, maxAge: number): Comment[] {
  const out: Comment[] = [];
  const used = new Set<string>();
  for (let i = 0; i < count; i++) {
    let who = pick(commenters);
    let guard = 0;
    while ((who === author || used.has(who)) && guard++ < 20) who = pick(commenters);
    used.add(who);
    out.push({
      id: `c${++commentSeq}`,
      authorId: who,
      text: pick(commentPool[theme]),
      createdAt: ago(Math.floor(rand() * maxAge * 0.9) + 2),
      likeCount: Math.floor(rand() * 40),
      likedByMe: false,
    });
  }
  return out.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

// ---------- posts ----------
interface PostSeed {
  author: string;
  imgs: number[];
  caption: string;
  minutesAgo: number;
  likes: number;
  theme: keyof typeof commentPool;
  location?: string;
  comments?: number;
  reel?: boolean;
  audio?: string;
  tagged?: string[];
}

const postSeeds: PostSeed[] = [
  // --- me ---
  { author: 'jordan.ellis', imgs: [109], caption: 'Caught the 5:42 crossing the bridge just as the leaves turned. Third morning in a row trying for this one 🍂🚆', minutesAgo: 3 * D, likes: 342, theme: 'city', location: 'Berlin, Germany' },
  { author: 'jordan.ellis', imgs: [105, 312], caption: 'Iceland, part one: fire and then nothing but sand for an hour. Swipe for the quiet bit →', minutesAgo: 12 * D, likes: 518, theme: 'travel', location: 'Reykjanes Peninsula, Iceland' },
  { author: 'jordan.ellis', imgs: [261], caption: 'Looking up more often.', minutesAgo: 20 * D, likes: 201, theme: 'city', location: 'Frankfurt, Germany' },
  { author: 'jordan.ellis', imgs: [332], caption: 'Rush hour, long exposure, very cold fingers.', minutesAgo: 34 * D, likes: 287, theme: 'city' },
  { author: 'jordan.ellis', imgs: [243], caption: 'Bends in the river 🏞️', minutesAgo: 48 * D, likes: 264, theme: 'travel', location: 'Moselle Valley' },
  { author: 'jordan.ellis', imgs: [249], caption: 'Old covered bridge, very loud water.', minutesAgo: 61 * D, likes: 190, theme: 'travel' },
  { author: 'jordan.ellis', imgs: [159], caption: 'Yellow season 💛', minutesAgo: 75 * D, likes: 233, theme: 'nature' },
  { author: 'jordan.ellis', imgs: [237], caption: 'Airshow day. Ears still ringing ✈️', minutesAgo: 90 * D, likes: 176, theme: 'city', reel: true, audio: 'jordan.ellis · Original audio' },

  // --- feed ---
  { author: 'sofia.wanders', imgs: [185, 387, 336], caption: 'Five villages, one very tired pair of legs 🍋 Walked the coastal trail from end to end and stopped for focaccia in every single town. No regrets.\n\nTip: start before 8am and you’ll have the trail almost to yourself.', minutesAgo: 38, likes: 18_402, theme: 'travel', location: 'Cinque Terre, Italy', comments: 6, tagged: ['theo.outdoors'] },
  { author: 'wild.lens', imgs: [143], caption: 'Ural owl, photographed by a member after 4 days in a hide. Quiet patience pays off 🦉\n\n#wildlenscollective #owl', minutesAgo: 95, likes: 64_120, theme: 'nature', location: 'Bavarian Forest National Park', comments: 5 },
  { author: 'theo.outdoors', imgs: [170], caption: 'Mirror morning. Not a breath of wind until 9am, then gone. ⛰️💧', minutesAgo: 2 * H + 10, likes: 7_903, theme: 'nature', location: 'Lago di Braies', comments: 4 },
  { author: 'hana.blooms', imgs: [9, 35], caption: 'This week’s studio bunch: dahlias that refuse to calm down and the last of the parrot tulips 🌷', minutesAgo: 3 * H + 40, likes: 3_280, theme: 'nature', location: 'Hana Blooms Studio', comments: 4 },
  { author: 'fresh.market', imgs: [34], caption: 'Citrus is HERE 🍊🍋 Blood oranges, Meyer lemons and limes landed in store this morning. Sunday’s recipe uses all three — guesses?', minutesAgo: 5 * H, likes: 12_877, theme: 'food', comments: 5 },
  { author: 'happy.paws', imgs: [64], caption: 'Shake it off 🐕💨 (submitted by a very wet golden)', minutesAgo: 6 * H, likes: 98_010, theme: 'pets', comments: 6, reel: true, audio: 'happy.paws · Original audio' },
  { author: 'chloe.atelier', imgs: [98], caption: 'Camel coat season has officially begun. Wearing it with everything until April.', minutesAgo: 8 * H, likes: 21_430, theme: 'people', location: 'Lisbon, Portugal', comments: 4 },
  { author: 'noor.portraits', imgs: [136], caption: 'Golden hour with @amara.moves — she doesn’t stop moving, so neither did I 📷✨', minutesAgo: 10 * H, likes: 4_118, theme: 'people', comments: 4, tagged: ['amara.moves'] },
  { author: 'miso.the.cat', imgs: [184], caption: 'first snow. I have filed a complaint.', minutesAgo: 13 * H, likes: 22_090, theme: 'pets', comments: 5 },
  { author: 'analog.club', imgs: [180], caption: 'Submission of the week: Lisbon tram, Ilford HP5 pushed to 1600. Grain for days 🎞️', minutesAgo: 16 * H, likes: 5_604, theme: 'city', location: 'Lisbon, Portugal', comments: 3 },
  { author: 'kai.mindful', imgs: [6], caption: 'Today’s reminder: you don’t have to fix everything before sunset. 🌅', minutesAgo: 20 * H, likes: 6_771, theme: 'nature', comments: 3 },
  { author: 'bruno.the.aussie', imgs: [287], caption: 'Was told this is my “blue steel”. Will accept payment in cheese.', minutesAgo: 23 * H, likes: 4_002, theme: 'pets', comments: 4 },
  { author: 'yuna.kim', imgs: [324], caption: 'Sunday reset: a long bath, no phone (except this one 🤫), and a very slow skincare routine 🌸', minutesAgo: 26 * H, likes: 38_118, theme: 'people', comments: 5 },
  { author: 'coastal.diaries', imgs: [128], caption: 'Manta ray drifting over the divers like it owns the place. It does. 🌊', minutesAgo: 30 * H, likes: 11_402, theme: 'nature', location: 'Nusa Penida, Indonesia', comments: 4, reel: true, audio: 'coastal.diaries · Ocean sounds' },
  { author: 'lena.nightlights', imgs: [262, 182], caption: 'Christmas markets are back and I’ve already spent too much on candles ✨🕯️', minutesAgo: 34 * H, likes: 2_877, theme: 'city', location: 'Nuremberg, Germany', comments: 3 },
  { author: 'macro.world', imgs: [56], caption: 'Rose chafer up close — that metallic shell is structural colour, not pigment 💚', minutesAgo: 40 * H, likes: 3_119, theme: 'nature', comments: 3 },
  { author: 'mia.sullivan', imgs: [38], caption: 'new hair who dis 💇‍♀️', minutesAgo: 45 * H, likes: 1_204, theme: 'people', comments: 6 },
  { author: 'sofia.wanders', imgs: [236], caption: 'Got lost on purpose. Found three bakeries and this canal. Venice in November is a different city entirely.', minutesAgo: 2 * D + 3 * H, likes: 21_093, theme: 'travel', location: 'Venice, Italy', comments: 4 },
  { author: 'theo.outdoors', imgs: [127, 215, 142], caption: 'Three summits in three days. My knees have opinions. ⛰️⛰️⛰️', minutesAgo: 2 * D + 9 * H, likes: 9_388, theme: 'nature', location: 'Dolomites, Italy', comments: 4 },
  { author: 'wild.lens', imgs: [223], caption: 'Red fox, early December. Thick winter coat already in 🦊', minutesAgo: 3 * D, likes: 88_221, theme: 'nature', comments: 5 },
  { author: 'pop.parlor', imgs: [356], caption: 'Holiday flavours drop Friday 🍭 Cranberry-orange, spiced pear and a mystery green one.', minutesAgo: 3 * D + 6 * H, likes: 1_802, theme: 'food', location: 'Pop Parlor', comments: 3 },
  { author: 'amara.moves', imgs: [136], caption: 'Movement is the most honest language I know 💛 New class schedule in bio.', minutesAgo: 3 * D + 12 * H, likes: 8_990, theme: 'people', comments: 4, reel: true, audio: 'amara.moves · Afro-house mix' },
  { author: 'hana.blooms', imgs: [303], caption: 'Market basket for a very lucky bride-to-be 💐', minutesAgo: 4 * D, likes: 2_431, theme: 'nature', comments: 3 },
  { author: 'happy.paws', imgs: [66], caption: 'This chocolate lab has never done anything wrong in his life 🍫', minutesAgo: 4 * D + 8 * H, likes: 76_400, theme: 'pets', comments: 5 },
  { author: 'fresh.market', imgs: [57], caption: 'Perfectly ripe avocado: rare, beautiful, gone in 4 hours. 🥑', minutesAgo: 5 * D, likes: 9_004, theme: 'food', comments: 4 },
  { author: 'chloe.atelier', imgs: [334], caption: 'Lines.', minutesAgo: 5 * D + 6 * H, likes: 17_660, theme: 'people', location: 'Frankfurt, Germany', comments: 3 },
  { author: 'wild.lens', imgs: [13], caption: 'Dusky lorikeets sharing gossip 🦜', minutesAgo: 6 * D, likes: 54_090, theme: 'nature', comments: 4 },
  { author: 'coastal.diaries', imgs: [289], caption: 'Somewhere between blue and bluer.', minutesAgo: 6 * D + 10 * H, likes: 7_701, theme: 'travel', comments: 3 },
  { author: 'meiling.studio', imgs: [377], caption: 'Gathering baby’s breath for this month’s pressed flower kits 🌼', minutesAgo: 7 * D, likes: 1_988, theme: 'people', comments: 3 },
  { author: 'kai.mindful', imgs: [39], caption: 'Long exposure, longer exhale.', minutesAgo: 8 * D, likes: 4_320, theme: 'nature', comments: 2 },

  // --- explore / profile depth ---
  { author: 'sofia.wanders', imgs: [341], caption: 'Arrived at opening, left with 400 photos of arches.', minutesAgo: 9 * D, likes: 15_404, theme: 'travel', location: 'Colosseum, Rome', comments: 3 },
  { author: 'sofia.wanders', imgs: [104], caption: 'Snow globe village ❄️', minutesAgo: 14 * D, likes: 19_002, theme: 'travel', location: 'Cortina d’Ampezzo', comments: 3 },
  { author: 'sofia.wanders', imgs: [372, 20], caption: 'Off-season beach days are the best beach days 🏖️', minutesAgo: 21 * D, likes: 22_871, theme: 'travel', comments: 3 },
  { author: 'sofia.wanders', imgs: [365], caption: 'Two chairs, one river, zero plans.', minutesAgo: 30 * D, likes: 12_310, theme: 'travel', location: 'Basel, Switzerland', comments: 2 },
  { author: 'theo.outdoors', imgs: [238], caption: 'Rowed out before the crowds. Worth the 4:30 alarm.', minutesAgo: 10 * D, likes: 11_220, theme: 'nature', location: 'Lago di Braies', comments: 3 },
  { author: 'theo.outdoors', imgs: [364], caption: 'Lake days ✨', minutesAgo: 15 * D, likes: 8_772, theme: 'nature', location: 'Lake Wānaka, New Zealand', comments: 2 },
  { author: 'theo.outdoors', imgs: [155], caption: 'Autumn switchbacks 🍁', minutesAgo: 22 * D, likes: 10_116, theme: 'nature', comments: 3 },
  { author: 'theo.outdoors', imgs: [308], caption: 'Above it all.', minutesAgo: 27 * D, likes: 13_550, theme: 'nature', comments: 2 },
  { author: 'theo.outdoors', imgs: [369], caption: 'Rainbow in the spray 🌈', minutesAgo: 33 * D, likes: 9_840, theme: 'nature', location: 'Iceland', comments: 2, reel: true, audio: 'theo.outdoors · Original audio' },
  { author: 'theo.outdoors', imgs: [222], caption: 'Frozen falls, 14 °C below.', minutesAgo: 40 * D, likes: 7_002, theme: 'nature', comments: 2 },
  { author: 'wild.lens', imgs: [347], caption: 'Roseate spoonbill: the bird that looks hand-painted 🩷', minutesAgo: 9 * D, likes: 61_220, theme: 'nature', comments: 3 },
  { author: 'wild.lens', imgs: [322], caption: 'Giraffe on the ridge line.', minutesAgo: 11 * D, likes: 49_301, theme: 'nature', location: 'Maasai Mara, Kenya', comments: 3 },
  { author: 'wild.lens', imgs: [335], caption: 'Family walk 🐘', minutesAgo: 13 * D, likes: 72_884, theme: 'nature', location: 'Amboseli, Kenya', comments: 3 },
  { author: 'wild.lens', imgs: [92], caption: 'Blue jay checking us out.', minutesAgo: 16 * D, likes: 40_118, theme: 'nature', comments: 2 },
  { author: 'wild.lens', imgs: [129], caption: 'Blue tit in the blossom 🌸', minutesAgo: 19 * D, likes: 44_902, theme: 'nature', comments: 2 },
  { author: 'wild.lens', imgs: [270], caption: 'Mother and calf, protected 24/7 by rangers.', minutesAgo: 24 * D, likes: 90_552, theme: 'nature', comments: 3 },
  { author: 'wild.lens', imgs: [88], caption: 'First snow, still hungry.', minutesAgo: 28 * D, likes: 70_140, theme: 'nature', comments: 2 },
  { author: 'wild.lens', imgs: [219], caption: 'Roe deer at first light.', minutesAgo: 31 * D, likes: 38_870, theme: 'nature', comments: 2 },
  { author: 'hana.blooms', imgs: [58], caption: 'Blush tulips for a gloomy Monday.', minutesAgo: 10 * D, likes: 2_010, theme: 'nature', comments: 2 },
  { author: 'hana.blooms', imgs: [141], caption: 'Lupine field trip 💜', minutesAgo: 18 * D, likes: 3_002, theme: 'nature', comments: 2 },
  { author: 'hana.blooms', imgs: [212, 216, 378], caption: 'Daisy week. Swipe for more daisies. Then some more.', minutesAgo: 25 * D, likes: 2_788, theme: 'nature', comments: 2 },
  { author: 'hana.blooms', imgs: [90], caption: 'Dyed roses: yes or no?', minutesAgo: 35 * D, likes: 1_640, theme: 'nature', comments: 3 },
  { author: 'fresh.market', imgs: [134], caption: 'Cherry + lemon. Trust us.', minutesAgo: 12 * D, likes: 7_440, theme: 'food', comments: 2 },
  { author: 'fresh.market', imgs: [76], caption: 'Fresh-squeezed Friday 🧡', minutesAgo: 19 * D, likes: 5_120, theme: 'food', comments: 2 },
  { author: 'fresh.market', imgs: [131], caption: 'Market morning with our favourite growers.', minutesAgo: 26 * D, likes: 8_330, theme: 'food', location: 'Jaipur, India', comments: 2 },
  { author: 'fresh.market', imgs: [234], caption: 'Cookie tin season has started 🍪', minutesAgo: 33 * D, likes: 6_014, theme: 'food', comments: 2 },
  { author: 'happy.paws', imgs: [82], caption: 'Cloud in dog form ☁️', minutesAgo: 9 * D, likes: 81_337, theme: 'pets', comments: 3 },
  { author: 'happy.paws', imgs: [203], caption: 'Portrait mode, activated.', minutesAgo: 14 * D, likes: 66_002, theme: 'pets', comments: 2 },
  { author: 'happy.paws', imgs: [258, 268], caption: 'Irish setter appreciation post 🧡', minutesAgo: 20 * D, likes: 59_810, theme: 'pets', comments: 2 },
  { author: 'bruno.the.aussie', imgs: [392], caption: 'Spring zoomies in the crocus field 🌸', minutesAgo: 6 * D, likes: 3_118, theme: 'pets', comments: 2 },
  { author: 'miso.the.cat', imgs: [188], caption: 'blep.', minutesAgo: 5 * D, likes: 18_801, theme: 'pets', comments: 2 },
  { author: 'miso.the.cat', imgs: [226], caption: 'my agent says this is my best side', minutesAgo: 15 * D, likes: 16_200, theme: 'pets', comments: 2 },
  { author: 'analog.club', imgs: [178], caption: 'Twin-lens family reunion 🎞️', minutesAgo: 4 * D, likes: 4_410, theme: 'city', comments: 2 },
  { author: 'analog.club', imgs: [172], caption: 'Arches, Portra 400.', minutesAgo: 11 * D, likes: 3_901, theme: 'city', comments: 2 },
  { author: 'analog.club', imgs: [96], caption: 'Kirkjufell on Tri-X. Weather: yes.', minutesAgo: 17 * D, likes: 6_660, theme: 'nature', comments: 2 },
  { author: 'analog.club', imgs: [83], caption: 'Dashboard dreamcatcher.', minutesAgo: 24 * D, likes: 3_120, theme: 'city', comments: 2 },
  { author: 'analog.club', imgs: [213], caption: 'Flea market finds.', minutesAgo: 30 * D, likes: 2_877, theme: 'city', comments: 2 },
  { author: 'noor.portraits', imgs: [352], caption: 'Backlit.', minutesAgo: 6 * D, likes: 3_330, theme: 'people', comments: 2 },
  { author: 'noor.portraits', imgs: [2], caption: 'Self-portrait, for once.', minutesAgo: 16 * D, likes: 5_902, theme: 'people', comments: 3 },
  { author: 'lena.nightlights', imgs: [108], caption: 'Crescent over the harbour 🌙', minutesAgo: 7 * D, likes: 1_990, theme: 'city', comments: 2 },
  { author: 'lena.nightlights', imgs: [78], caption: 'Lantern season 🏮', minutesAgo: 12 * D, likes: 2_330, theme: 'city', comments: 2 },
  { author: 'lena.nightlights', imgs: [211], caption: 'The last ferry.', minutesAgo: 19 * D, likes: 1_744, theme: 'city', comments: 2 },
  { author: 'lena.nightlights', imgs: [253], caption: 'Light a candle for someone today.', minutesAgo: 27 * D, likes: 2_100, theme: 'city', comments: 2 },
  { author: 'yuna.kim', imgs: [381], caption: 'cherry blossom diaries 🌸', minutesAgo: 9 * D, likes: 29_001, theme: 'nature', comments: 2 },
  { author: 'kai.mindful', imgs: [154], caption: 'Stillness.', minutesAgo: 13 * D, likes: 5_008, theme: 'nature', comments: 2 },
  { author: 'kai.mindful', imgs: [63], caption: 'Pier at dusk 🌆', minutesAgo: 20 * D, likes: 4_770, theme: 'nature', comments: 2 },
  { author: 'coastal.diaries', imgs: [290], caption: 'Storm swell 🌊', minutesAgo: 9 * D, likes: 6_440, theme: 'nature', comments: 2, reel: true, audio: 'coastal.diaries · Ocean sounds' },
  { author: 'coastal.diaries', imgs: [89], caption: 'Reef shark, calm as anything.', minutesAgo: 14 * D, likes: 9_980, theme: 'nature', comments: 2 },
  { author: 'coastal.diaries', imgs: [106], caption: 'Ferry to the islands ⛴️', minutesAgo: 21 * D, likes: 4_120, theme: 'travel', comments: 2 },
  { author: 'coastal.diaries', imgs: [284], caption: 'Swan lake (literally).', minutesAgo: 28 * D, likes: 3_880, theme: 'nature', comments: 2 },
  { author: 'macro.world', imgs: [14], caption: 'Ladybird on a dahlia, 1:1 macro.', minutesAgo: 6 * D, likes: 2_660, theme: 'nature', comments: 2 },
  { author: 'macro.world', imgs: [111], caption: 'Busy bee 🐝', minutesAgo: 10 * D, likes: 2_990, theme: 'nature', comments: 2 },
  { author: 'macro.world', imgs: [99], caption: 'Banded demoiselle.', minutesAgo: 17 * D, likes: 1_870, theme: 'nature', comments: 2 },
  { author: 'macro.world', imgs: [346, 121], caption: 'Leaves after rain 💧', minutesAgo: 23 * D, likes: 2_340, theme: 'nature', comments: 2 },
  { author: 'macro.world', imgs: [201], caption: 'Slow and steady.', minutesAgo: 29 * D, likes: 1_602, theme: 'nature', comments: 2 },
  { author: 'amara.moves', imgs: [352], caption: 'Studio light hits different.', minutesAgo: 12 * D, likes: 5_210, theme: 'people', comments: 2 },
  { author: 'mia.sullivan', imgs: [345], caption: 'bubbles > problems', minutesAgo: 8 * D, likes: 802, theme: 'people', comments: 2, reel: true, audio: 'mia.sullivan · Original audio' },
  { author: 'meiling.studio', imgs: [133, 139], caption: 'Colour study: yellow + violet.', minutesAgo: 14 * D, likes: 1_220, theme: 'nature', comments: 2 },
  { author: 'pop.parlor', imgs: [330], caption: 'Party platter orders now open 🎉', minutesAgo: 10 * D, likes: 1_120, theme: 'food', comments: 2 },
  { author: 'sofia.wanders', imgs: [21], caption: 'Domes and bougainvillea.', minutesAgo: 40 * D, likes: 14_090, theme: 'travel', location: 'Cyprus', comments: 2 },
  { author: 'theo.outdoors', imgs: [120], caption: 'Cabin weekend.', minutesAgo: 45 * D, likes: 6_630, theme: 'nature', comments: 2 },
  { author: 'wild.lens', imgs: [41], caption: 'Sunbird among the poppies.', minutesAgo: 36 * D, likes: 47_002, theme: 'nature', comments: 2 },
  { author: 'wild.lens', imgs: [272, 292], caption: 'Goslings and ducklings: a fluffy week.', minutesAgo: 41 * D, likes: 52_330, theme: 'nature', comments: 2 },
  { author: 'kai.mindful', imgs: [118], caption: 'Be like the acacia: deep roots, wide shade.', minutesAgo: 30 * D, likes: 3_904, theme: 'nature', comments: 2 },
];

const posts: Record<string, Post> = {};
postSeeds.forEach((s, i) => {
  const id = `p${i + 1}`;
  const shown = s.comments ?? 2;
  const comments = makeComments(s.theme, s.author, shown, s.minutesAgo);
  const likerPool = commenters.filter((u) => u !== s.author && u !== 'jordan.ellis');
  posts[id] = {
    id,
    authorId: s.author,
    media: s.imgs.map((n) => photo(n)),
    aspect: s.reel ? '4:5' : MEDIA_ASPECT[s.imgs[0]] ?? '1:1',
    caption: s.caption,
    location: s.location,
    createdAt: ago(s.minutesAgo),
    likeCount: s.likes,
    likedByMe: i % 7 === 3,
    savedByMe: i % 11 === 5,
    likedByPreviewId: pick(likerPool),
    comments,
    commentCount: shown + Math.floor(s.likes / 180),
    isReel: s.reel,
    audio: s.audio,
    taggedUserIds: s.tagged,
  };
});

// ---------- stories ----------
const storySeeds: [string, number[], number][] = [
  ['sofia.wanders', [387, 336, 185], 3],
  ['theo.outdoors', [241, 308], 5],
  ['hana.blooms', [381, 216], 6],
  ['wild.lens', [164, 315, 319], 7],
  ['fresh.market', [134, 76], 9],
  ['bruno.the.aussie', [392], 10],
  ['noor.portraits', [2, 352], 12],
  ['analog.club', [107, 186], 13],
  ['kai.mindful', [154, 6], 15],
  ['miso.the.cat', [174], 16],
  ['coastal.diaries', [289, 290], 18],
  ['yuna.kim', [58], 19],
  ['macro.world', [295, 355], 21],
];
const stories: Story[] = storySeeds.map(([userId, imgs, hrs], i) => ({
  id: `s${i + 1}`,
  userId,
  seenUpTo: i >= 9 ? imgs.length : 0,
  items: imgs.map((n, j) => ({ id: `s${i + 1}-${j}`, media: photo(n), createdAt: ago(hrs * H - j * 20) })),
}));

// ---------- following ----------
const followingIds = [
  'sofia.wanders', 'theo.outdoors', 'wild.lens', 'hana.blooms', 'fresh.market', 'happy.paws',
  'chloe.atelier', 'noor.portraits', 'miso.the.cat', 'analog.club', 'kai.mindful', 'bruno.the.aussie',
  'yuna.kim', 'coastal.diaries', 'lena.nightlights', 'macro.world', 'mia.sullivan', 'meiling.studio',
  'pop.parlor', 'amara.moves',
];
// Not followed (appear in suggestions): none of the above.  Add a few unfollowed users:
for (const u of ['pop.parlor', 'amara.moves', 'meiling.studio']) followingIds.splice(followingIds.indexOf(u), 1);

// ---------- messages ----------
let msgSeq = 0;
const m = (senderId: string, text: string, minutesAgo: number, postId?: string) => ({
  id: `m${++msgSeq}`, senderId, text, createdAt: ago(minutesAgo), postId,
});
const conversations: Conversation[] = [
  { id: 'dm1', participantId: 'sofia.wanders', unread: true, messages: [
    m('jordan.ellis', 'Your Cinque Terre post is unreal. Which village would you stay in?', 3 * H),
    m('sofia.wanders', 'Thank you!! Honestly Vernazza if you want the postcard view', 2 * H + 30),
    m('sofia.wanders', 'Manarola if you want it quieter at night 🌙', 2 * H + 28),
    m('sofia.wanders', 'Are you finally going in spring?', 25),
  ] },
  { id: 'dm2', participantId: 'theo.outdoors', unread: true, messages: [
    m('theo.outdoors', 'Still up for the Lake Louise sunrise hike Saturday?', 5 * H),
    m('jordan.ellis', 'Yes! What time are we leaving?', 4 * H + 50),
    m('theo.outdoors', '4:15 from mine. Bring the wide lens 📸', 70),
  ] },
  { id: 'dm3', participantId: 'mia.sullivan', unread: false, messages: [
    m('mia.sullivan', 'did you see this', 1 * D, 'p1'),
    m('mia.sullivan', 'the bridge one is my new wallpaper btw', 1 * D),
    m('jordan.ellis', 'haha that’s my own post 😂 but thank you', 23 * H),
    m('mia.sullivan', 'I KNOW. supporting the arts', 22 * H),
  ] },
  { id: 'dm4', participantId: 'noor.portraits', unread: false, messages: [
    m('noor.portraits', 'Hey! Would you be up for a portrait swap shoot sometime?', 3 * D),
    m('jordan.ellis', 'Absolutely, I’ve wanted to learn your lighting setup', 3 * D - 30),
    m('noor.portraits', 'Deal. I’ll send some dates 🙌', 2 * D + 20 * H),
  ] },
  { id: 'dm5', participantId: 'bruno.the.aussie', unread: false, messages: [
    m('bruno.the.aussie', '🐾🐾🐾', 5 * D),
    m('jordan.ellis', 'Tell Bruno he’s a very good boy', 5 * D - 10),
  ] },
  { id: 'dm6', participantId: 'analog.club', unread: false, messages: [
    m('analog.club', 'Hi Jordan! We’d love to feature your tram shot in next month’s round-up. Was it shot on film?', 8 * D),
    m('jordan.ellis', 'Digital unfortunately! But happy to send a film one 🎞️', 8 * D - 60),
  ] },
];

// ---------- notifications ----------
let nSeq = 0;
const n = (type: AppNotification['type'], userId: string, minutesAgo: number, postId?: string, text?: string, read = true): AppNotification => ({
  id: `n${++nSeq}`, type, userId, postId, text, createdAt: ago(minutesAgo), read,
});
const notifications: AppNotification[] = [
  n('like', 'sofia.wanders', 22, 'p1', undefined, false),
  n('comment', 'mia.sullivan', 48, 'p1', 'the colours!! 🍂', false),
  n('follow', 'amara.moves', 2 * H, undefined, undefined, false),
  n('like', 'theo.outdoors', 4 * H, 'p2'),
  n('mention', 'noor.portraits', 9 * H, 'p2', '@jordan.ellis you have to see this light'),
  n('follow', 'meiling.studio', 1 * D + 2 * H),
  n('comment_like', 'hana.blooms', 2 * D, 'p1', 'Third morning in a row trying for this one'),
  n('like', 'chloe.atelier', 3 * D, 'p3'),
  n('follow', 'pop.parlor', 4 * D),
  n('like', 'wild.lens', 6 * D, 'p4'),
  n('comment', 'kai.mindful', 9 * D, 'p5', 'This is so calming 🌊'),
  n('like', 'yuna.kim', 14 * D, 'p6'),
  n('follow', 'macro.world', 18 * D),
  n('like', 'analog.club', 25 * D, 'p7'),
  n('comment', 'coastal.diaries', 33 * D, 'p6', 'Gorgeous spot'),
];

export function createSeedDatabase(): Database {
  return structuredClone({
    version: SEED_VERSION,
    meId: 'jordan.ellis',
    users,
    followingIds,
    posts,
    stories,
    conversations,
    notifications,
    recentSearchIds: ['sofia.wanders', 'wild.lens', 'hana.blooms'],
  });
}

/** Sample photos offered in the Create dialog for people without a file handy. */
export const SAMPLE_UPLOADS: MediaItem[] = [193, 166, 81, 160, 394, 328, 85, 49, 333, 246, 36, 240].map((x) => photo(x));

/** Neutral silhouette used when someone removes their profile photo. */
export const DEFAULT_AVATAR = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="#dbdbdb"/><circle cx="32" cy="25" r="12" fill="#fff"/><path d="M10 60c2-12 11-18 22-18s20 6 22 18z" fill="#fff"/></svg>',
)}`;
