import {
  IMPROV_QUILTING_IMAGE,
  IMPROV_QUILTING_010_IMAGE,
  IMPROV_QUILTING_020_IMAGE,
  IMPROV_QUILT_BASTING_IMAGE,
  QUILT_CRAFT_DETAIL_IMAGE,
  QUILT_MISTY_IMAGE,
  QUILT_STUDIO_IMAGE,
  SEWING_MACHINE_IMAGE,
} from './quiltAssets.js';

/** @typedef {{ id: string, title: string, paragraphs?: string[], list?: { label?: string, items: string[] }, image?: string, imageAlt?: string }} ServiceSection */

/** @typedef {{ slug: string, path: string, breadcrumbLabel: string, title: string, intro: string, heroImage: string, heroImageAlt: string, sections: ServiceSection[], cta: string, ctaButton: string }} LongArmServiceDetail */

/** @type {Record<string, LongArmServiceDetail>} */
export const LONG_ARM_SERVICE_DETAILS = {
  'edge-to-edge-pantograph-quilting': {
    slug: 'edge-to-edge-pantograph-quilting',
    path: '/edge-to-edge',
    breadcrumbLabel: 'Edge-to-Edge Quilting',
    title: 'Edge-to-edge (pantograph) quilting',
    intro:
      'Edge-to-edge quilting — also called pantograph quilting — is one of the most popular ways to finish a quilt on a long-arm machine. A single repeating pattern is stitched continuously across the entire quilt top, from one edge to the other, giving you beautiful texture and a polished, professional look at a great value.',
    heroImage: IMPROV_QUILTING_IMAGE,
    heroImageAlt: 'Handmade quilt with edge-to-edge long-arm quilting',
    sections: [
      {
        id: 'what-is-it',
        title: 'What is edge-to-edge quilting?',
        paragraphs: [
          'A pantograph is a long paper or digital pattern that guides the long-arm machine head as it moves back and forth across your quilt. The design repeats in rows so the stitching covers the full surface evenly — no custom placement required for each block.',
          'Because the pattern runs continuously, edge-to-edge quilting is faster than custom work, which makes it an excellent choice for bed quilts, lap quilts, charity projects, and gifts when you want a finished look without the premium of fully custom quilting.',
        ],
        image: IMPROV_QUILTING_010_IMAGE,
        imageAlt: 'Close-up of edge-to-edge quilt stitching texture',
      },
      {
        id: 'why-choose',
        title: 'Why choose a pantograph finish?',
        list: {
          label: 'Edge-to-edge quilting works well when you want:',
          items: [
            'Consistent texture across the whole quilt',
            'A faster turnaround than custom or semi-custom quilting',
            'A wide range of pattern styles — from soft loops and meanders to feathers, geometric grids, and modern curves',
            'An economical way to finish multiple quilts or larger bed sizes',
            'Stitching that complements busy prints without competing for attention',
          ],
        },
      },
      {
        id: 'how-it-works',
        title: 'How it works at Bear River Quilting',
        paragraphs: [
          'You send us your quilt top (or start from one of our base quilt options), along with backing and batting if you have them ready. We will help you choose a pantograph pattern and thread color that suit your fabric and the quilt’s intended use.',
          'Your quilt is loaded on our long-arm frame, basted smoothly, and quilted row by row following the pantograph design. We inspect the finished piece, trim and square as needed, and prepare it for binding — or add binding if that is part of your service request.',
        ],
        image: QUILT_CRAFT_DETAIL_IMAGE,
        imageAlt: 'Handcrafted quilt detail showing stitch and fabric work',
      },
      {
        id: 'patterns',
        title: 'Choosing a pantograph pattern',
        paragraphs: [
          'The right pattern depends on your quilt top scale, color palette, and how much texture you want. Smaller, dense designs add more drape and “crinkle” after washing; larger open patterns keep the quilt softer and show off bold prints.',
        ],
        list: {
          label: 'Popular pantograph styles include:',
          items: [
            'Meander and swirl — classic, works on almost any quilt',
            'Loopy loops — soft and casual for everyday quilts',
            'Feather chains — traditional elegance without full custom work',
            'Geometric grids and chevrons — modern and structured',
            'Leaves and vines — great for nature-themed or floral tops',
          ],
        },
      },
      {
        id: 'pricing',
        title: 'Pricing & turnaround',
        paragraphs: [
          'Edge-to-edge quilting is priced by the hour on our long-arm machine. Final cost depends on quilt size, pattern density, and any add-ons such as batting, backing, or binding.',
          'When you submit a service request, you pay a deposit to reserve your spot. We will contact you with a firm quote after reviewing your quilt top and preferences. A secure link for final payment is sent when your quilt is complete.',
        ],
      },
    ],
    cta: 'Ready to finish your quilt with edge-to-edge pantograph quilting? Start a service request and select this service from our list.',
    ctaButton: 'Request edge-to-edge quilting',
  },

  'custom-quilting': {
    slug: 'custom-quilting',
    path: '/custom-quilting',
    breadcrumbLabel: 'Custom Quilting',
    title: 'Custom quilting',
    intro:
      'Custom quilting is the art of designing stitch patterns specifically for your quilt top — highlighting blocks, borders, and focal points with one-of-a-kind motifs, feathers, and detailed work that makes your quilt truly yours.',
    heroImage: QUILT_MISTY_IMAGE,
    heroImageAlt: 'Custom quilted piece with detailed long-arm stitching',
    sections: [
      {
        id: 'overview',
        title: 'What makes quilting “custom”?',
        paragraphs: [
          'Unlike edge-to-edge pantographs that repeat across the whole surface, custom quilting is planned block by block (or section by section). We choose motifs that echo your piecing, draw the eye to a center medallion, or add dense texture in open areas while leaving printed fabric alone.',
          'Custom work takes more time on the machine and in planning, but the result is a show-quality finish — ideal for heirlooms, competition quilts, special gifts, and any project where the quilting is part of the design.',
        ],
      },
      {
        id: 'motifs',
        title: 'Motifs & design options',
        list: {
          label: 'Custom quilting can include:',
          items: [
            'Feather wreaths, borders, and corner treatments',
            'Background fills tailored to each open area',
            'Block-by-block designs that follow piecing lines',
            'Micro-stippling or pebbles in negative space',
            'In-the-ditch outlining to frame patchwork',
            'Personalized elements such as initials or dates (by request)',
          ],
        },
        image: IMPROV_QUILTING_020_IMAGE,
        imageAlt: 'Detailed custom quilting on a patchwork quilt top',
      },
      {
        id: 'process',
        title: 'Our custom quilting process',
        paragraphs: [
          'Share photos of your quilt top and any inspiration you have — we will recommend a density and style that fits your timeline and budget. Before quilting, we confirm thread colors and a general plan for focal areas versus simpler fills.',
          'Your quilt is handled carefully on the long-arm frame with frequent checks for tension, even stitches, and smooth travel between motifs. We treat every custom quilt as a collaboration between your piecing and our finishing.',
        ],
        image: QUILT_CRAFT_DETAIL_IMAGE,
        imageAlt: 'Close-up of custom quilt stitching and fabric',
      },
      {
        id: 'pricing',
        title: 'Pricing & turnaround',
        paragraphs: [
          'Custom quilting is billed at an hourly rate on the long-arm machine. Dense all-over custom work on a large bed quilt will take longer than lighter custom accents on a lap quilt — we will give you a clear estimate after seeing your top.',
          'Submit a service request with a deposit to get on our schedule. We will follow up with questions, a quote, and expected completion window before final quilting begins.',
        ],
      },
    ],
    cta: 'Have a quilt that deserves a one-of-a-kind finish? Request custom quilting and tell us about your project.',
    ctaButton: 'Request custom quilting',
  },

  'semi-custom-quilting': {
    slug: 'semi-custom-quilting',
    path: '/semi-custom-quilting',
    breadcrumbLabel: 'Semi-Custom Quilting',
    title: 'Semi-custom quilting',
    intro:
      'Semi-custom quilting blends the efficiency of edge-to-edge pantograph work with selective custom details — so you get standout areas where it matters and economical all-over stitching everywhere else.',
    heroImage: IMPROV_QUILT_BASTING_IMAGE,
    heroImageAlt: 'Quilt on a long-arm frame ready for semi-custom quilting',
    sections: [
      {
        id: 'overview',
        title: 'The best of both worlds',
        paragraphs: [
          'Many quilters want more personality than a plain pantograph but do not need (or want to pay for) fully custom quilting on every inch. Semi-custom is the middle path: a repeating background pattern across the quilt, plus custom motifs in borders, blocks, or center panels.',
          'This approach keeps costs closer to edge-to-edge while still giving you feathers in the border, special treatment in a medallion, or custom work in signature blocks.',
        ],
      },
      {
        id: 'examples',
        title: 'Common semi-custom layouts',
        list: {
          label: 'Popular combinations include:',
          items: [
            'Pantograph in the center + custom feather border',
            'Custom block centers + light meander in sashing and borders',
            'Edge-to-edge body + dense custom work in outer border only',
            'Simple all-over pattern + highlighted focal block or applique area',
          ],
        },
      },
      {
        id: 'process',
        title: 'How we plan your quilt',
        paragraphs: [
          'When you request semi-custom quilting, tell us which areas you want to emphasize. We will sketch a simple plan — which zones get custom motifs and which get the pantograph — before loading your quilt on the frame.',
          'Semi-custom still requires thoughtful setup, but less total machine time than full custom, which often means a faster turnaround and a lower final bill.',
        ],
        image: IMPROV_QUILTING_010_IMAGE,
        imageAlt: 'Quilt stitching showing blended pantograph and custom areas',
      },
      {
        id: 'pricing',
        title: 'Pricing & turnaround',
        paragraphs: [
          'Semi-custom quilting is priced hourly, typically between edge-to-edge and full custom rates depending on how much custom work is included. We will quote after reviewing your top and your priority areas.',
        ],
      },
    ],
    cta: 'Want custom details without full custom pricing? Select semi-custom quilting on your service request.',
    ctaButton: 'Request semi-custom quilting',
  },

  'quilt-binding': {
    slug: 'quilt-binding',
    path: '/quilt-binding',
    breadcrumbLabel: 'Quilt Binding',
    title: 'Quilt binding',
    intro:
      'Binding is the finishing strip that wraps the raw edges of your quilt — the last step that makes a quilt durable, polished, and ready to use. We offer professional machine binding and hand-finished binding options.',
    heroImage: QUILT_CRAFT_DETAIL_IMAGE,
    heroImageAlt: 'Quilt edge and binding detail',
    sections: [
      {
        id: 'options',
        title: 'Binding options',
        list: {
          label: 'We can finish your quilt with:',
          items: [
            'Machine binding — durable, clean, and faster; great for everyday quilts',
            'Hand binding — invisible stitches on the back; ideal for show quilts and gifts',
            'Double-fold (French) binding — our standard for a sturdy edge',
            'Binding from your fabric or fabric we provide',
            'Binding-only service if your quilt is already quilted',
          ],
        },
      },
      {
        id: 'prep',
        title: 'What we need from you',
        paragraphs: [
          'For the best results, your quilt should be trimmed and squared before binding (we offer trimming as a separate service if needed). If you are supplying binding fabric, include enough yardage for the perimeter plus overlap — we can advise on amount when you request a quote.',
          'Let us know your preferred binding width and whether you want mitered corners or a particular fold on the back. We will confirm details before sewing begins.',
        ],
        image: SEWING_MACHINE_IMAGE,
        imageAlt: 'Sewing machine used for precise quilt binding',
      },
      {
        id: 'pricing',
        title: 'Pricing & turnaround',
        paragraphs: [
          'Binding is priced by the hour. Lap and throw sizes finish quickly; king-size quilts with hand binding take longer. Combine binding with long-arm quilting in one service request for a single pickup or return shipment.',
        ],
      },
    ],
    cta: 'Need a professional finish on your quilt edge? Add quilt binding to your long-arm service request.',
    ctaButton: 'Request quilt binding',
  },

  'batting-and-backing-supplies': {
    slug: 'batting-and-backing-supplies',
    path: '/batting-and-backing',
    breadcrumbLabel: 'Batting & Backing',
    title: 'Batting and backing supplies',
    intro:
      'Not sure what goes inside or behind your quilt? We stock quality batting and backing options and help you choose materials that match how the quilt will be used — from crisp cotton loft to cozy wool and bamboo blends.',
    heroImage: IMPROV_QUILT_BASTING_IMAGE,
    heroImageAlt: 'Quilt basting with batting and backing layers',
    sections: [
      {
        id: 'batting',
        title: 'Choosing batting',
        paragraphs: [
          'Batting affects drape, warmth, and how much quilting texture shows. Cotton battings are flat and traditional; wool adds loft and warmth; blends balance washability and feel.',
        ],
        list: {
          label: 'We can help you select:',
          items: [
            '100% cotton — classic look, great for heirloom and bed quilts',
            'Wool — lightweight warmth with beautiful loft',
            'Bamboo and cotton blends — soft drape with eco-friendly fibers',
            'Polyester — economical, low shrinkage, good for utility quilts',
            'Request-basted or needle-punched styles suited to long-arm quilting',
          ],
        },
      },
      {
        id: 'backing',
        title: 'Backing fabric',
        paragraphs: [
          'Backing should be at least 4–6 inches wider and longer than your quilt top on every side for long-arm loading. Wide backing fabrics reduce seams on large quilts; pieced backs are fine when planned with extra margin.',
          'We carry neutral and basic backing options and can order wider goods for king sizes. Bring your own backing if you prefer — we will inspect it for size and square before quilting.',
        ],
        image: QUILT_STUDIO_IMAGE,
        imageAlt: 'Quilt studio with fabric and supplies',
      },
      {
        id: 'pricing',
        title: 'Pricing',
        paragraphs: [
          'Batting and backing are quoted by material and size — there is no hourly charge for supplies alone. Add this service to your quilting request and we will include material costs in your project estimate.',
        ],
      },
    ],
    cta: 'Need batting or backing for your project? Mention it in your service request and we will recommend options.',
    ctaButton: 'Request batting & backing help',
  },

  'memory-and-t-shirt-quilts': {
    slug: 'memory-and-t-shirt-quilts',
    path: '/memory-and-t-shirt-quilts',
    breadcrumbLabel: 'Memory & T-Shirt Quilts',
    title: 'Memory and T-shirt quilts',
    intro:
      'Memory quilts and T-shirt quilts hold stories — graduation tees, race shirts, baby clothes, and treasured textiles. We quilt them with extra care for stretchy knits, varied thicknesses, and sentimental value.',
    heroImage: QUILT_MISTY_IMAGE,
    heroImageAlt: 'Memory quilt with meaningful fabric squares',
    sections: [
      {
        id: 'care',
        title: 'Special handling for sentimental quilts',
        paragraphs: [
          'T-shirt and memory quilts often mix knits, wovens, and stabilizers. We use appropriate batting, even basting, and quilting patterns that secure layers without distorting logos or photo transfers.',
          'Tell us how the quilt will be used — display, daily snuggling, or gifting — so we can balance durability with a soft hand.',
        ],
        list: {
          label: 'We are experienced with:',
          items: [
            'T-shirt quilts with interfaced or stabilizer-backed blocks',
            'Memory quilts from clothing, ties, and mixed fabrics',
            'Photo-transfer and inkjet-printed panels',
            'Heavy or uneven blocks that need gentle all-over quilting',
            'Sashing and layouts that need careful alignment on the frame',
          ],
        },
      },
      {
        id: 'quilting-styles',
        title: 'Recommended quilting styles',
        paragraphs: [
          'Edge-to-edge or semi-custom pantographs often work well on T-shirt quilts — they secure the layers without dense stitching over printed graphics. For memory quilts with many open areas, a soft meander or loop pattern adds texture while keeping shirts readable.',
          'We avoid overly dense custom work over logos unless you specifically request it. Thread color is usually chosen to blend on shirts and coordinate on sashing.',
        ],
        image: IMPROV_QUILTING_IMAGE,
        imageAlt: 'Finished memory quilt with long-arm quilting',
      },
      {
        id: 'pricing',
        title: 'Pricing & turnaround',
        paragraphs: [
          'Memory and T-shirt quilts are priced hourly, with time depending on size, block count, and quilting style. Share photos of your top when you request a quote so we can flag any thick seams or special areas in advance.',
        ],
      },
    ],
    cta: 'Finishing a T-shirt or memory quilt? Select this service and tell us about the fabrics in your top.',
    ctaButton: 'Request memory quilt quilting',
  },

  'mail-in-quilting-services': {
    slug: 'mail-in-quilting-services',
    path: '/mail-in-quilting',
    breadcrumbLabel: 'Mail-In Quilting',
    title: 'Mail-in quilting services',
    intro:
      'Live far from our studio? Our mail-in program lets you ship your quilt top to Bear River Quilting from anywhere in the U.S. We quilt it on our long-arm and return it to your door with careful packaging.',
    heroImage: QUILT_STUDIO_IMAGE,
    heroImageAlt: 'Bear River Quilting studio ready for mail-in projects',
    sections: [
      {
        id: 'how-it-works',
        title: 'How mail-in quilting works',
        paragraphs: [
          'Start with a service request online and pay your deposit. We will confirm shipping instructions, what to include (top, batting, backing, notes), and your place in the queue.',
          'When you choose “Send us your quilt(s)” we can ship you a box for your top. Pack your quilt securely, insure the package, and send it to our studio address. We will acknowledge receipt and contact you before quilting begins.',
        ],
      },
      {
        id: 'packing',
        title: 'Packing tips',
        list: {
          label: 'For safe shipping:',
          items: [
            'Fold minimally or roll large tops to avoid crease lines',
            'Place fabrics in a plastic bag inside the box in case of weather',
            'Include a printed copy of your request number and contact info',
            'Use batting and backing in separate bags if sending them',
            'Insure the package for replacement value of materials and sentiment',
          ],
        },
        image: IMPROV_QUILT_BASTING_IMAGE,
        imageAlt: 'Quilt materials prepared for shipping',
      },
      {
        id: 'return',
        title: 'Return shipping & turnaround',
        paragraphs: [
          'Finished quilts are folded or rolled with acid-free tissue when appropriate and shipped back via a trackable carrier. Return shipping cost is added to your final invoice or arranged separately based on quilt size and your location.',
          'Turnaround depends on current queue length and quilting complexity — we will give you an estimate when your package arrives.',
        ],
      },
    ],
    cta: 'Ready to mail your quilt? Submit a service request and choose mail-in when we confirm your details.',
    ctaButton: 'Start a mail-in request',
  },

  'thread-color-selection': {
    slug: 'thread-color-selection',
    path: '/thread-color-selection',
    breadcrumbLabel: 'Thread Color Selection',
    title: 'Thread color selection',
    intro:
      'Thread color changes everything — subtle blending lets piecing shine, while contrast thread turns quilting into part of the design. We help you choose colors that work with your top, batting, and backing.',
    heroImage: IMPROV_QUILTING_010_IMAGE,
    heroImageAlt: 'Quilt stitching showing thoughtful thread color choice',
    sections: [
      {
        id: 'approaches',
        title: 'Blend, match, or contrast',
        paragraphs: [
          'There is no single “right” thread color. Blending thread (matching the lightest or most common fabric) gives an even texture without bold lines. Contrasting thread highlights the quilting pattern itself — wonderful on solids and tone-on-tone quilts.',
          'We keep a wide range of polyester and cotton thread colors on hand and can recommend options from photos if you are mailing your quilt in.',
        ],
        list: {
          label: 'Considerations we discuss with you:',
          items: [
            'Overall quilt palette and backing color',
            'Whether you want quilting to show on the back',
            'Pantograph vs custom motifs and how thread will read at scale',
            'Variegated threads for multi-color effects',
            'Same thread top and bobbin vs subtle differences on the back',
          ],
        },
      },
      {
        id: 'process',
        title: 'When thread selection happens',
        paragraphs: [
          'Thread color is confirmed after we receive your quilt (or when you drop off locally) and before quilting starts. If you have a strong preference, note it in your project comments or send reference photos.',
          'For edge-to-edge quilts, a safe default is a neutral that matches your lightest fabric — but we encourage you to ask if you want the stitching to pop.',
        ],
        image: QUILT_CRAFT_DETAIL_IMAGE,
        imageAlt: 'Thread and quilt detail close-up',
      },
    ],
    cta: 'Unsure about thread? Add thread color selection guidance to any long-arm service request — we will walk you through options.',
    ctaButton: 'Request quilting services',
  },

  'quilt-trimming-and-squaring': {
    slug: 'quilt-trimming-and-squaring',
    path: '/quilt-trimming-and-squaring',
    breadcrumbLabel: 'Trimming & Squaring',
    title: 'Quilt trimming and squaring',
    intro:
      'Before binding or display, a quilt needs straight, square edges. We trim excess batting and backing and square the quilt so corners are true 90° angles and opposite sides match — essential for a professional finish.',
    heroImage: IMPROV_QUILTING_020_IMAGE,
    heroImageAlt: 'Quilt being trimmed and squared on a cutting table',
    sections: [
      {
        id: 'why',
        title: 'Why squaring matters',
        paragraphs: [
          'Quilt tops can shift slightly during long-arm quilting. Trimming removes uneven batting and backing “dog ears” and ensures your binding strips fit cleanly without puckers or wavy edges.',
          'A squared quilt hangs straight on a wall, lies flat on a bed, and is easier to bind — especially on large king-size projects.',
        ],
      },
      {
        id: 'service',
        title: 'What we do',
        list: {
          label: 'Our trimming service includes:',
          items: [
            'Squaring corners with a consistent border of quilting inside the trim line',
            'Removing excess batting and backing flush with the quilted top',
            'Checking that opposite sides measure evenly',
            'Preparing the quilt for binding (by us or by you)',
            'Can be combined with long-arm quilting or requested on already-quilted tops',
          ],
        },
        image: QUILT_CRAFT_DETAIL_IMAGE,
        imageAlt: 'Squared quilt edge ready for binding',
      },
      {
        id: 'pricing',
        title: 'Pricing & turnaround',
        paragraphs: [
          'Trimming and squaring is billed hourly and is usually a quick step when done immediately after quilting on our frame. For drop-off or mail-in quilts already quilted elsewhere, contact us with dimensions for a quote.',
        ],
      },
    ],
    cta: 'Need your quilt squared before binding? Add trimming and squaring to your service request.',
    ctaButton: 'Request trimming & squaring',
  },
};

/** @type {Record<string, LongArmServiceDetail>} */
const DETAIL_BY_PATH = Object.fromEntries(
  Object.values(LONG_ARM_SERVICE_DETAILS).map((detail) => [detail.path, detail])
);

export function getLongArmServiceDetailBySlug(slug) {
  return LONG_ARM_SERVICE_DETAILS[slug] ?? null;
}

export function getLongArmServiceDetailByPath(path) {
  return DETAIL_BY_PATH[path] ?? null;
}

export const LONG_ARM_SERVICE_DETAIL_PATHS = Object.fromEntries(
  Object.values(LONG_ARM_SERVICE_DETAILS).map((detail) => [detail.slug, detail.path])
);

export const LONG_ARM_SERVICE_DETAIL_ROUTES = Object.values(LONG_ARM_SERVICE_DETAILS).map(
  (detail) => detail.path
);

export function longArmServiceDetailPath(slug) {
  if (!slug) return null;
  return LONG_ARM_SERVICE_DETAIL_PATHS[slug] ?? null;
}

/** Opens the long-arm request wizard with a service pre-selected. */
export function longArmQuiltingRequestUrl(serviceSlug) {
  if (!serviceSlug) return '/long-arm-quilting';
  return `/long-arm-quilting?service=${encodeURIComponent(serviceSlug)}`;
}
