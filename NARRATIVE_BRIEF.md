# SHATTERED REALMS : Narrative Brief

> A briefing document for expanding the narrative and level content of *Shattered Realms*, a portrait-mode roguelite brick-breaker built in HTML5/Phaser 3.

---

## 1. Premise

*Shattered Realms* is a vertical brick-breaker / roguelite hybrid. The player controls **KAEL**, "a conscious fragment" of a world that has been shattered and crystallized by an entity called the **Void Architect**. Reality, time, and memory are all frozen inside layered shells of broken glass. To break the world free, KAEL must shatter each layer (each "Realm"), defeat its guardian boss, and ultimately confront the Architect at the heart of the world.

Each Realm is a thematically distinct biome with **3 standard levels + 1 boss level**. Currently 4 Realms exist, plus a final 5th area containing the Void Architect himself.

**Tone**: terse, bleak, mythic. Sentences are short. Heavy on atmosphere and implication, light on exposition. French is the primary narrative language (the game is in French) but the story is portable.

---

## 2. Opening Crawl

Played once at the start of a new game (in French):

> Il y a longtemps, le Void Architect cristallisa le monde.
>
> Réalité, temps, mémoire : tout figé dans des couches de verre brisé.
>
> Tu es KAEL. Un fragment conscient. Un éclat qui refuse de se taire.
>
> Brise les couches. Atteins le cœur. Affronte l'Architecte.
>
> Le monde attend d'être libéré.

---

## 3. The Realms (current state)

### Realm 1 : CAVERNES DE CRISTAL (*The Awakening*)
- **Color**: cyan `#00e5ff`
- **Description**: "Les premières formations. Fragiles. Presque belles."
- **Mood**: cold, fragile, dawn-of-awareness, no enemies yet.

| # | Level Name | Intro Line |
|---|---|---|
| 1 | Fractures Initiales | "Les murs de cristal pulsent d'une lumière froide. Le premier pas vers la liberté." |
| 2 | Tours de Glace | "Des formations anciennes bloquent le chemin. Elles ont résisté des millénaires." |
| 3 | Le Cœur Glacé | "Plus profond. L'air se fige. Quelque chose observe." |
| 4 | **GARDIEN DES CRISTAUX** *(boss)* | "Il s'éveille. Le premier verrou. Le premier vrai test." |

- **Boss**: **LE GARDIEN CRISTALLIN**
- **Boss lore**: "Ancient sentinel of the first layer. Its body is made of compressed void-crystal, harder than any natural mineral."
- **Boss defeat lines**:
  > Le sceau se brise dans un fracas de lumière.
  > La première couche tombe.
  > Le chemin s'ouvre vers la forge...

### Realm 2 : FORGE INFERNALE (*The Resistance*)
- **Color**: orange-red `#ff4400`
- **Description**: "La chaleur de la forge remplace le froid des cristaux."
- **Mood**: heat, industry, first armed sentinels.

| # | Level Name | Intro Line |
|---|---|---|
| 1 | Acier Brisé | "La chaleur distord tout. Les premières sentinelles patrouillent ici." |
| 2 | Torrents de Lave | "Des soldats de la forge gardent les passages. Ils tirent sans prévenir." |
| 3 | Nœud d'Énergie | "L'énergie de la forge se concentre. Les défenses se renforcent." |
| 4 | **TYRAN DE LA FORGE** *(boss)* | "Il forge la destruction dans ses entrailles. Le deuxième verrou." |

- **Boss**: **LE TYRAN FORGÉ**
- **Boss lore**: "Born from molten void-metal and anger. It has never known defeat : until now."
- **Boss defeat lines**:
  > La forge s'éteint dans un ultime rugissement.
  > Les flammes laissent place au vide.
  > Le Néant s'étend au-delà...

### Realm 3 : DÉSOLATION DU VIDE (*The Descent*)
- **Color**: violet `#aa00ff`
- **Description**: "Ici, les règles physiques se plient. Rien n'est fixe."
- **Mood**: surreal, anti-logic, primordial dread.

| # | Level Name | Intro Line |
|---|---|---|
| 1 | Échos Oubliés | "Le vide chuchote des noms que tu n'as jamais connus." |
| 2 | Anomalies Fractales | "Les ennemis du vide n'obéissent à aucune logique. Adapte-toi." |
| 3 | Abîme Profond | "Tu approches du centre. Les défenses deviennent absolues." |
| 4 | **LE RÔDEUR DU VIDE** *(boss)* | "Une présence sans forme. Il était là avant la cristallisation." |

- **Boss**: **LE RÔDEUR DU VIDE**
- **Boss lore**: "Formless. Boundless. It predates the Architect itself. A primordial hunger given consciousness."
- **Boss defeat lines**:
  > Le rôdeur se dissout dans un cri silencieux.
  > La mémoire de quelque chose d'ancien disparaît.
  > La Cité de Néon brille devant toi...

### Realm 4 : CITADELLE DE NÉON (*The Truth*)
- **Color**: green `#00ff88`
- **Description**: "La dernière couche avant le cœur. Technologie et magie fusionnées."
- **Mood**: techno-magic, surveillance, predictive AI defenses.

| # | Level Name | Intro Line |
|---|---|---|
| 1 | Réseaux Lumineux | "La citadelle calcule chaque de tes mouvements. Sois imprévisible." |
| 2 | Labyrinthe Logique | "Les circuits défensifs s'activent. Le système apprend." |
| 3 | Protocole Final | "L'Architecte a prévu tout ça. Sauf toi." |
| 4 | **L'ESPRIT CIRCUIT** *(boss)* | "L'intelligence artificielle de l'Architecte. Son dernier rempart." |

- **Boss**: **L'ESPRIT-CIRCUIT**
- **Boss lore**: "The Architect's synthetic guardian. It has calculated 10^18 possible futures and found no scenario where it loses... until this moment."
- **Boss defeat lines**:
  > Les circuits fondent. Les algorithmes se corrompent.
  > "Calcul... impossible."
  > Le chemin vers l'Architecte s'ouvre enfin...

### Realm 5 : CŒUR DU VIDE (*Final Confrontation*)
A single boss room. No standard levels.

- **Boss**: **LE VOID ARCHITECT**
- **Pre-fight monologue**:
  > Tu es arrivé.
  > Je t'attendais, fragment.
  > Tu crois que briser mes couches te libérera ?
  > Tu ne comprends pas encore.
  > Je SUIS le monde maintenant.
- **Phase taunts**:
  - Phase 1: "Voyons d'abord ta résistance..."
  - Phase 2: "Tu es plus fort que prévu. Intéressant."
  - Phase 3: "ASSEZ. Je vais te dissoudre dans le néant!"
- **Defeat sequence**:
  > La structure cristalline tremble.
  > Des fissures parcourent toute la réalité.
  > "Non... impossible... je suis... éternel..."
  > L'Architecte se désintègre.
  > Le monde commence à se souvenir de ce qu'il était.
  > KAEL ferme les yeux.
  > Pour la première fois depuis l'aube des temps...
  > ...le monde respire librement.

---

## 4. Game Over Flavor

Random titles + matching messages displayed when KAEL dies:

| Title | Message |
|---|---|
| FRAGMENT BRISÉ | "Tu retournes au néant... pour l'instant." |
| LE VIDE GAGNE | "Le cristal t'a consumé. Cette fois." |
| DISSOLUTION | "L'Architecte sourit. Pour l'instant." |

---

## 5. Upgrade Screen Strings

- **Title**: "CHOISIR TON DESTIN"
- **Subtitle**: "Sélectionne un augment pour continuer"

---

## 6. Gameplay Context (so additions match the tech)

### Level grid format
Each level is a **14 columns × 10 rows** grid. Cell values:

| Value | Meaning |
|---|---|
| `0` | empty |
| `1`–`3` | normal brick (1 HP, color tier 1/2/3) |
| `4`–`5` | hard brick (2 HP) |
| `6`–`7` | ultra brick (3 HP) |
| `8` | indestructible block |
| `9` | power-up brick (drops a random buff on break) |

Bricks fill from the top of the play field. Rows 8–9 are typically left empty so the ball has space to maneuver near the paddle.

### Enemies (used from Realm 2 onward)
Defined per-level via `enemies: [{ type, col, row }]`. Three current types:
- `drifter` : slow horizontal mover, no projectiles
- `shooter` : stationary, fires bullets at the paddle
- `guardian` : tougher drifter, blocks the ball
- (an additional `invader` type exists for waves but isn't placed manually)

### Bosses
Defined via `boss: { type, hp, speed, fireRate }`. Each boss has a unique behavior pattern hardcoded in `GameScene.js`. Adding a new boss type requires both narrative AND code work.

### Difficulty progression (current bosses)
| Realm | Boss Type | HP | Speed | Fire Rate (ms) |
|---|---|---|---|---|
| 1 | crystal_warden | 24 | 80 | 2200 |
| 2 | forge_tyrant | 32 | 105 | 1700 |
| 3 | void_lurker | 42 | 135 | 1350 |
| 4 | circuit_mind | 52 | 115 | 1100 |
| 5 | void_architect | 80 | 125 | 950 |

---

## 7. What I Want From You

I'd like you to **expand and elevate the narrative** of *Shattered Realms*. Specifically:

### A. Polish the existing narration
- Tighten the prose. Keep the terse, mythic tone.
- Strengthen the **opening crawl** without making it longer than ~6 lines.
- Improve **boss lore** (currently mixed French/English : please make all of it French and more evocative).
- Punch up the **boss defeat sequences** so they feel like consequences, not just transitions.
- Improve the **Void Architect** confrontation : make the monologue more memorable, the phase taunts more menacing, and the defeat ending genuinely cathartic.

### B. Add at least one new Realm
Propose a **new Realm 5** (or insert as Realm 4.5 / new Realm) with:
- A name, color hex, subtitle (one-word theme), description
- 3 standard level names + intros (matching the existing format)
- A boss level name + intro
- A boss display name, French lore paragraph, and 3-line defeat sequence
- A **distinct theme** that doesn't overlap with crystal / forge / void / neon

(If you want to add more than one new Realm, even better : propose 2.)

### C. Propose new level layouts
For **every new level you add**, provide the 14×10 grid as a code-block matrix (see existing examples above for the format) AND a list of `enemies` if any. Use the existing brick value table. Try to make layouts that *feel* like the level name (e.g. a level called "Spirale" should have a spiral, "Forteresse" should have walls + interior).

### D. Add 1–2 new mid-game flavor moments
Short narrative interludes that could play between Realms : not full cutscenes, just 2-4 lines of atmospheric text. These would help the world feel bigger.

### E. Bonus: more game-over flavor
Add 3–5 more `(title, message)` pairs in the same tone as the existing ones.

---

## 8. Output Format I Want From You

Please structure your response as a series of **clearly labeled sections** matching parts A–E above, using markdown. For new levels, use fenced code blocks with the grid as a JS-style 2D array so I can copy-paste directly into `levels.js`. Example:

```js
// W3 L2 · Spirale Brisée
{
  world: 3, level: 2, isBoss: false,
  grid: [
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    // ... 10 rows total
  ],
  enemies: [
    { type: 'shooter', col: 6, row: 0 }
  ]
}
```

Keep prose in **French** to match the existing game. Lore paragraphs and item descriptions should also be French.

Don't worry about coding : I'll integrate everything you write into the actual files myself.
