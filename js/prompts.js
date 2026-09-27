/* Prompt library — every item is bilingual { en, sq }. */

const CATEGORIES = [
  {
    id: 'personal', icon: '🙂', level: 1,
    name: { en: 'About You', sq: 'Rreth teje' },
    words: [
      { en: 'Childhood', sq: 'Fëmijëria' },
      { en: 'Friendship', sq: 'Miqësia' },
      { en: 'Fear', sq: 'Frika' },
      { en: 'Dreams', sq: 'Ëndrrat' },
      { en: 'Music', sq: 'Muzika' },
      { en: 'Family', sq: 'Familja' },
    ],
    questions: [
      { en: 'Introduce yourself in a way nobody would expect.', sq: 'Prezantohu në një mënyrë që askush nuk e pret.' },
      { en: 'What is your happiest childhood memory?', sq: 'Cili është kujtimi yt më i lumtur nga fëmijëria?' },
      { en: 'Describe a fear you have overcome.', sq: 'Përshkruaj një frikë që e ke kapërcyer.' },
      { en: 'What song describes your life right now?', sq: 'Cila këngë e përshkruan jetën tënde tani?' },
      { en: 'Where do you see yourself in five years?', sq: 'Ku e sheh veten pas pesë vjetësh?' },
    ],
  },
  {
    id: 'everyday', icon: '☕', level: 1,
    name: { en: 'Everyday Life', sq: 'Jeta e përditshme' },
    words: [
      { en: 'Morning', sq: 'Mëngjesi' },
      { en: 'Coffee', sq: 'Kafeja' },
      { en: 'Neighbours', sq: 'Fqinjët' },
      { en: 'Weekend', sq: 'Fundjava' },
      { en: 'Mistakes', sq: 'Gabimet' },
      { en: 'Habits', sq: 'Zakonet' },
    ],
    questions: [
      { en: 'What does a perfect Sunday look like for you?', sq: 'Si duket për ty një e diel e përsosur?' },
      { en: 'What small habit changed your life?', sq: 'Cili zakon i vogël ta ndryshoi jetën?' },
      { en: 'Describe the best advice you have ever received.', sq: 'Përshkruaj këshillën më të mirë që ke marrë ndonjëherë.' },
      { en: 'What is something you are grateful for today?', sq: 'Për çfarë ndihesh mirënjohës sot?' },
      { en: 'If you could master one skill overnight, what would it be?', sq: 'Nëse do të mund të zotëroje një aftësi brenda natës, cila do të ishte?' },
    ],
  },
  {
    id: 'food', icon: '🍲', level: 1,
    name: { en: 'Food', sq: 'Ushqimi' },
    words: [
      { en: "Grandma's cooking", sq: 'Gatimi i gjyshes' },
      { en: 'Bread', sq: 'Buka' },
      { en: 'Dessert', sq: 'Ëmbëlsira' },
      { en: 'Spices', sq: 'Erëzat' },
      { en: 'Family dinner', sq: 'Darka familjare' },
      { en: 'Street food', sq: 'Ushqimi i rrugës' },
    ],
    questions: [
      { en: 'What dish reminds you of home?', sq: 'Cila gjellë të kujton shtëpinë?' },
      { en: 'Should everyone learn to cook?', sq: 'A duhet të mësojë çdokush të gatuajë?' },
      { en: 'Describe your favourite meal as if the audience has never tasted food.', sq: 'Përshkruaje gjellën tënde të preferuar sikur publiku nuk ka provuar kurrë ushqim.' },
      { en: 'Is fast food a problem or a convenience?', sq: 'A është ushqimi i shpejtë problem apo lehtësi?' },
      { en: 'What would your last meal be, and why?', sq: 'Cili do të ishte vakti yt i fundit dhe pse?' },
    ],
  },
  {
    id: 'travel', icon: '✈️', level: 1,
    name: { en: 'Travel', sq: 'Udhëtimet' },
    words: [
      { en: 'Airport', sq: 'Aeroporti' },
      { en: 'Mountains', sq: 'Malet' },
      { en: 'The sea', sq: 'Deti' },
      { en: 'Suitcase', sq: 'Valixhja' },
      { en: 'Adventure', sq: 'Aventura' },
      { en: 'Home', sq: 'Shtëpia' },
    ],
    questions: [
      { en: 'Tell us about the most beautiful place you have visited.', sq: 'Na trego për vendin më të bukur që ke vizituar.' },
      { en: 'If you could live in any city in the world, which would you choose?', sq: 'Nëse do të mund të jetoje në çdo qytet të botës, cilin do të zgjidhje?' },
      { en: 'Is it better to travel alone or with friends?', sq: 'A është më mirë të udhëtosh vetëm apo me shokë?' },
      { en: 'What did travelling teach you about yourself?', sq: 'Çfarë të mësoi udhëtimi për veten?' },
      { en: 'Plan the perfect weekend for a tourist visiting your country.', sq: 'Planifiko fundjavën e përsosur për një turist që viziton vendin tënd.' },
    ],
  },
  {
    id: 'imagination', icon: '🐉', level: 2,
    name: { en: 'Imagination & Fun', sq: 'Fantazi dhe argëtim' },
    words: [
      { en: 'Time machine', sq: 'Makina e kohës' },
      { en: 'Superpower', sq: 'Superfuqia' },
      { en: 'Dragons', sq: 'Dragonjtë' },
      { en: 'Invisibility', sq: 'Padukshmëria' },
      { en: 'Aliens', sq: 'Jashtëtokësorët' },
      { en: 'Treasure', sq: 'Thesari' },
    ],
    questions: [
      { en: 'If you could have dinner with anyone in history, who would it be?', sq: 'Nëse do të mund të darkoje me këdo nga historia, kush do të ishte?' },
      { en: 'You wake up as president for one day. What do you do?', sq: 'Zgjohesh president për një ditë. Çfarë bën?' },
      { en: 'Convince us that pineapple belongs on pizza.', sq: 'Na bind se ananasi i përket picës.' },
      { en: 'Describe the world 100 years from now.', sq: 'Përshkruaje botën pas 100 vjetësh.' },
      { en: 'If animals could talk, which one would be the rudest?', sq: 'Nëse kafshët do të flisnin, cila do të ishte më e pasjellshmja?' },
    ],
  },
  {
    id: 'technology', icon: '💻', level: 2,
    name: { en: 'Technology', sq: 'Teknologjia' },
    words: [
      { en: 'Smartphone', sq: 'Telefoni i mençur' },
      { en: 'Artificial intelligence', sq: 'Inteligjenca artificiale' },
      { en: 'Social media', sq: 'Rrjetet sociale' },
      { en: 'Robots', sq: 'Robotët' },
      { en: 'Privacy', sq: 'Privatësia' },
      { en: 'The internet', sq: 'Interneti' },
    ],
    questions: [
      { en: 'Is technology making us more or less connected?', sq: 'A po na afron apo po na largon teknologjia nga njëri-tjetri?' },
      { en: 'Which invention could you not live without?', sq: 'Pa cilën shpikje nuk do të mund të jetoje?' },
      { en: 'How will AI change the job you want to do?', sq: 'Si do ta ndryshojë inteligjenca artificiale punën që dëshiron të bësh?' },
      { en: 'Should children have smartphones?', sq: 'A duhet të kenë fëmijët telefona të mençur?' },
      { en: 'Describe a day with no internet.', sq: 'Përshkruaj një ditë pa internet.' },
    ],
  },
  {
    id: 'education', icon: '📚', level: 2,
    name: { en: 'Education', sq: 'Arsimi' },
    words: [
      { en: 'Teacher', sq: 'Mësuesi' },
      { en: 'Exams', sq: 'Provimet' },
      { en: 'Curiosity', sq: 'Kurioziteti' },
      { en: 'Books', sq: 'Librat' },
      { en: 'Homework', sq: 'Detyrat e shtëpisë' },
      { en: 'Failure', sq: 'Dështimi' },
    ],
    questions: [
      { en: 'Which teacher influenced you most, and why?', sq: 'Cili mësues të ka ndikuar më shumë dhe pse?' },
      { en: "What should every school teach that most don't?", sq: 'Çfarë duhet të mësojë çdo shkollë, që shumica nuk e mësojnë?' },
      { en: 'Is failure a good teacher?', sq: 'A është dështimi një mësues i mirë?' },
      { en: 'Describe a book that changed how you think.', sq: 'Përshkruaj një libër që ndryshoi mënyrën si mendon.' },
      { en: 'Should university be free for everyone?', sq: 'A duhet të jetë universiteti falas për të gjithë?' },
    ],
  },
  {
    id: 'work', icon: '💼', level: 2,
    name: { en: 'Work & Career', sq: 'Puna dhe karriera' },
    words: [
      { en: 'Leadership', sq: 'Udhëheqja' },
      { en: 'Teamwork', sq: 'Puna në ekip' },
      { en: 'Money', sq: 'Paratë' },
      { en: 'Ambition', sq: 'Ambicia' },
      { en: 'Deadlines', sq: 'Afatet' },
      { en: 'Success', sq: 'Suksesi' },
    ],
    questions: [
      { en: 'What does success mean to you?', sq: 'Çfarë do të thotë suksesi për ty?' },
      { en: 'Introduce yourself as if you were at a job interview.', sq: 'Prezantohu sikur të ishe në një intervistë pune.' },
      { en: 'Would you rather have a job you love or a job that pays well?', sq: 'Çfarë do të preferoje: një punë që e do apo një punë që paguhet mirë?' },
      { en: 'What makes a great leader?', sq: 'Çfarë e bën një udhëheqës të shkëlqyer?' },
      { en: 'Pitch your dream business idea.', sq: 'Prezanto idenë e biznesit të ëndrrave të tua.' },
    ],
  },
  {
    id: 'nature', icon: '🌿', level: 2,
    name: { en: 'Nature & Environment', sq: 'Natyra dhe mjedisi' },
    words: [
      { en: 'Climate', sq: 'Klima' },
      { en: 'Forest', sq: 'Pylli' },
      { en: 'Rain', sq: 'Shiu' },
      { en: 'Animals', sq: 'Kafshët' },
      { en: 'Recycling', sq: 'Riciklimi' },
      { en: 'Seasons', sq: 'Stinët' },
    ],
    questions: [
      { en: 'What is your favourite season, and why?', sq: 'Cila është stina jote e preferuar dhe pse?' },
      { en: 'What can one person do to protect the environment?', sq: 'Çfarë mund të bëjë një person i vetëm për të mbrojtur mjedisin?' },
      { en: 'Should cars be banned from city centres?', sq: 'A duhet të ndalohen makinat në qendrat e qyteteve?' },
      { en: 'Describe a moment in nature you will never forget.', sq: 'Përshkruaj një moment në natyrë që nuk do ta harrosh kurrë.' },
      { en: 'Are zoos good or bad for animals?', sq: 'A janë kopshtet zoologjike të mira apo të këqija për kafshët?' },
    ],
  },
  {
    id: 'culture', icon: '🦅', level: 2,
    name: { en: 'Albanian Culture', sq: 'Kultura shqiptare' },
    words: [
      { en: 'Hospitality', sq: 'Mikpritja' },
      { en: 'Besa', sq: 'Besa' },
      { en: 'Language', sq: 'Gjuha' },
      { en: 'Folk music', sq: 'Muzika popullore' },
      { en: 'Diaspora', sq: 'Diaspora' },
      { en: 'Weddings', sq: 'Dasmat' },
    ],
    questions: [
      { en: 'What does "besa" mean to you?', sq: 'Çfarë do të thotë "besa" për ty?' },
      { en: 'Why is hospitality so important in Albanian culture?', sq: 'Pse mikpritja është kaq e rëndësishme në kulturën shqiptare?' },
      { en: 'Recommend one Albanian place every tourist must visit.', sq: 'Rekomando një vend shqiptar që çdo turist duhet ta vizitojë.' },
      { en: 'How can the diaspora stay connected to its roots?', sq: 'Si mund ta ruajë diaspora lidhjen me rrënjët?' },
      { en: 'Which Albanian saying guides your life?', sq: 'Cila thënie shqiptare të udhëheq në jetë?' },
    ],
  },
  {
    id: 'society', icon: '🏙️', level: 3,
    name: { en: 'Society', sq: 'Shoqëria' },
    words: [
      { en: 'Freedom', sq: 'Liria' },
      { en: 'Kindness', sq: 'Mirësia' },
      { en: 'Community', sq: 'Komuniteti' },
      { en: 'Equality', sq: 'Barazia' },
      { en: 'Tradition', sq: 'Tradita' },
      { en: 'Youth', sq: 'Rinia' },
    ],
    questions: [
      { en: 'What is one thing you would change about your city?', sq: 'Cilën gjë do ta ndryshoje në qytetin tënd?' },
      { en: 'Why do young people leave their home countries?', sq: 'Pse të rinjtë largohen nga vendi i tyre?' },
      { en: 'Is it important to vote?', sq: 'A është e rëndësishme të votosh?' },
      { en: 'What does it mean to be a good neighbour?', sq: 'Çfarë do të thotë të jesh fqinj i mirë?' },
      { en: 'Which tradition should never disappear?', sq: 'Cila traditë nuk duhet të zhduket kurrë?' },
    ],
  },
];

const DEBATES = [
  { cat: 'education', en: 'Homework should be banned.', sq: 'Detyrat e shtëpisë duhet të ndalohen.' },
  { cat: 'technology', en: 'Social media does more harm than good.', sq: 'Rrjetet sociale bëjnë më shumë dëm se dobi.' },
  { cat: 'work', en: 'Money can buy happiness.', sq: 'Paratë mund të blejnë lumturinë.' },
  { cat: 'education', en: 'Everyone should learn a second language at school.', sq: 'Të gjithë duhet të mësojnë një gjuhë të dytë në shkollë.' },
  { cat: 'work', en: 'Working from home is better than working in an office.', sq: 'Puna nga shtëpia është më e mirë se puna në zyrë.' },
  { cat: 'technology', en: 'Video games are good for children.', sq: 'Lojërat video janë të mira për fëmijët.' },
  { cat: 'society', en: 'Cities are better places to live than villages.', sq: 'Qytetet janë vende më të mira për të jetuar se fshatrat.' },
  { cat: 'technology', en: 'AI will create more jobs than it destroys.', sq: 'Inteligjenca artificiale do të krijojë më shumë vende pune sesa do të zhdukë.' },
  { cat: 'education', en: 'School uniforms should be mandatory.', sq: 'Uniformat shkollore duhet të jenë të detyrueshme.' },
  { cat: 'personal', en: 'It is better to be honest than polite.', sq: 'Është më mirë të jesh i sinqertë se i sjellshëm.' },
  { cat: 'travel', en: 'Tourism helps a country more than it hurts it.', sq: 'Turizmi e ndihmon një vend më shumë sesa e dëmton.' },
  { cat: 'everyday', en: 'Reading books is better than watching films.', sq: 'Leximi i librave është më i mirë se shikimi i filmave.' },
  { cat: 'nature', en: 'Plastic bags should be banned everywhere.', sq: 'Qeset plastike duhet të ndalohen kudo.' },
  { cat: 'food', en: 'Everyone should eat less meat.', sq: 'Të gjithë duhet të hanë më pak mish.' },
];

/* Speech structures shown during preparation time. */
const FRAMEWORKS = {
  prep: {
    name: { en: 'PREP', sq: 'PREP' },
    steps: {
      en: ['Point: say your main idea', 'Reason: explain why', 'Example: give a story or fact', 'Point: repeat your idea'],
      sq: ['Pika: thuaj idenë kryesore', 'Arsyeja: shpjego pse', 'Shembulli: jep një histori ose fakt', 'Pika: përsërite idenë'],
    },
  },
  ppf: {
    name: { en: 'Past · Present · Future', sq: 'E kaluara · E tashmja · E ardhmja' },
    steps: {
      en: ['Past: a memory or how it used to be', 'Present: how it is today', 'Future: what you hope or expect'],
      sq: ['E kaluara: një kujtim ose si ka qenë', 'E tashmja: si është sot', 'E ardhmja: çfarë shpreson apo pret'],
    },
  },
  debate: {
    name: { en: 'Claim · Reasons · Close', sq: 'Qëndrimi · Arsyet · Mbyllja' },
    steps: {
      en: ['State your side clearly', 'Give two or three reasons', 'Answer one objection', 'Close with a strong sentence'],
      sq: ['Thuaj qartë qëndrimin tënd', 'Jep dy ose tre arsye', 'Përgjigju një kundërshtimi', 'Mbyll me një fjali të fortë'],
    },
  },
  story: {
    name: { en: 'Situation · Struggle · Change', sq: 'Situata · Sfida · Ndryshimi' },
    steps: {
      en: ['Set the scene: who, where, when', 'Something goes wrong', 'How it ends and what changed'],
      sq: ['Krijo skenën: kush, ku, kur', 'Diçka shkon keq', 'Si mbaron dhe çfarë ndryshoi'],
    },
  },
};

const TIPS = [
  { en: 'Nervousness and excitement feel the same in the body. Tell yourself: "I\'m ready!"', sq: 'Nervozizmi dhe emocioni ndihen njësoj në trup. Thuaj vetes: "Jam gati!"' },
  { en: 'Pauses feel long to you, but they sound confident to listeners.', sq: 'Pauzat të duken të gjata ty, por dëgjuesve u tingëllojnë si siguri.' },
  { en: "You don't need to be perfect. You just need to keep going.", sq: 'Nuk ke nevojë të jesh i përsosur. Mjafton të vazhdosh.' },
  { en: 'Start with a story or a question to hook your audience.', sq: 'Fillo me një histori ose një pyetje për të tërhequr vëmendjen.' },
  { en: 'Slow down. Most nervous speakers talk too fast.', sq: 'Ngadalëso. Shumica e folësve nervozë flasin shumë shpejt.' },
  { en: 'Your audience wants you to succeed.', sq: 'Publiku dëshiron që ti të kesh sukses.' },
  { en: 'Lost your thread? Repeat your last point and carry on.', sq: 'E humbe fillin? Përsërit pikën e fundit dhe vazhdo.' },
  { en: 'Breathe out longer than you breathe in. It calms your nervous system.', sq: 'Nxirre frymën më gjatë sesa e merr. Kjo e qetëson sistemin nervor.' },
  { en: 'Replace "um" with a silent pause. Silence is powerful.', sq: 'Zëvendëso "ëë"-në me një pauzë të heshtur. Heshtja ka fuqi.' },
  { en: 'Fear shrinks with repetition. Every session counts.', sq: 'Frika zvogëlohet me përsëritje. Çdo seancë ka rëndësi.' },
];

/* Gentle prompts shown when the speaker goes quiet. */
const NUDGES = {
  en: ['Keep going. Give an example.', 'Why does it matter?', 'Tell a short story about it.', 'How does it make you feel?', 'What would the opposite look like?', 'Describe it with your five senses.', 'Who else is affected by this?'],
  sq: ['Vazhdo. Jep një shembull.', 'Pse ka rëndësi kjo?', 'Trego një histori të shkurtër për këtë.', 'Si të bën të ndihesh?', 'Si do të dukej e kundërta?', 'Përshkruaje me pesë shqisat.', 'Kë tjetër prek kjo?'],
};

/* Common filler words per language (some are fillers only in context). */
const FILLERS = {
  en: ['um', 'umm', 'uh', 'uhm', 'erm', 'hmm', 'like', 'you know', 'basically', 'actually', 'literally', 'i mean', 'kind of', 'sort of'],
  sq: ['ëë', 'ëm', 'eee', 'mmm', 'hmm', 'domethënë', 'dmth', 'pra', 'si të thuash', 'në fakt', 'kështu që', 'ashtu'],
};

const MODES = ['word', 'question', 'debate', 'story'];
const MODE_ICONS = { word: '🔤', question: '❓', debate: '⚖️', story: '📖' };
const MODE_FRAMEWORK = { word: 'ppf', question: 'prep', debate: 'debate', story: 'story' };

const Prompts = {
  categories: CATEGORIES,
  getCategory(id) { return CATEGORIES.find(c => c.id === id); },

  /* Seeded RNG so the daily challenge is the same for everyone on a given day. */
  seeded(seedStr) {
    let h = 1779033703 ^ seedStr.length;
    for (let i = 0; i < seedStr.length; i++) {
      h = Math.imul(h ^ seedStr.charCodeAt(i), 3432918353);
      h = (h << 13) | (h >>> 19);
    }
    let a = h >>> 0;
    return () => {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  },

  pick(arr, rng = Math.random) { return arr[Math.floor(rng() * arr.length)]; },

  make(mode, catId = 'any', rng = Math.random) {
    const cats = catId && catId !== 'any' ? [this.getCategory(catId)].filter(Boolean) : CATEGORIES;
    switch (mode) {
      case 'word': {
        const c = this.pick(cats, rng);
        return { mode, category: c.id, text: this.pick(c.words, rng) };
      }
      case 'debate': {
        const pool = DEBATES.filter(d => cats.some(c => c.id === d.cat));
        const d = this.pick(pool.length ? pool : DEBATES, rng);
        return { mode, category: d.cat, text: { en: d.en, sq: d.sq } };
      }
      case 'story': {
        const pool = cats.flatMap(c => c.words);
        const src = pool.length >= 3 ? pool : CATEGORIES.flatMap(c => c.words);
        const chosen = [];
        while (chosen.length < 3) {
          const w = this.pick(src, rng);
          if (!chosen.includes(w)) chosen.push(w);
        }
        return {
          mode, category: catId !== 'any' ? catId : null,
          text: { en: chosen.map(w => w.en).join(' · '), sq: chosen.map(w => w.sq).join(' · ') },
        };
      }
      case 'question':
      default: {
        const c = this.pick(cats, rng);
        return { mode: 'question', category: c.id, text: this.pick(c.questions, rng) };
      }
    }
  },

  daily(dateKey) {
    const rng = this.seeded('guxo-' + dateKey);
    const mode = MODES[Math.floor(rng() * MODES.length)];
    return this.make(mode, 'any', rng);
  },

  tipOfDay(dateKey) {
    return this.pick(TIPS, this.seeded('tip-' + dateKey));
  },
};
