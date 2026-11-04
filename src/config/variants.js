/* Catalog variants: named buildings that reuse a building type but change its roof, facade or shape.
   A preset picks one with `variant`; the facade art lives in src/art/facades/variants.js and any extra
   3D parts in src/model/specials.js.
   - roof: the roof this variant always uses (overrides the type's usual roof)
   - freePitch: industrial variants that keep the pitch from the panel instead of a low metal roof
   - towers: which castle corner towers to build ('front' = the two front corners only, 'none' = no towers) */
export const VARIANTS = {
  school: { roof: 'gable' },
  townhall: { roof: 'hip' },
  courthouse: { roof: 'flat' },
  hospital: { roof: 'flat' },
  leanto: { roof: 'shed' },
  mill: { freePitch: true },
  brewery: { freePitch: true },
  lumber: { freePitch: true },
  shop: { freePitch: true },
  depot: { freePitch: true },
  elevator: { freePitch: true },
  manor: { roof: 'gable', towers: 'front' },
  motte: { roof: 'gable', towers: 'none' },
  gatehouse: { towers: 'front' },
  rink: { roof: 'barrel' },
  quonset: { roof: 'barrel' }
};

export const variantOf = v => (v && VARIANTS[v]) || {};
