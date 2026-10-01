/* Chooses the artwork for each face by its kind. */
import { wallArt } from './facades/index.js';
import {
  awningArt,
  bladeArt,
  canopyBottomArt,
  canopyFaceArt,
  chimneyArt,
  columnArt,
  fasciaArt,
  mechArt,
  porchDeckArt,
  porchSkirtArt,
  postArt,
  pumpArt,
  railingArt,
  sawGlassArt,
  signFaceArt,
  trimPlainArt
} from './parts.js';
import { sceneryArt, sceneryArt2 } from './scenery/objects.js';
import { sceneryArt3 } from './scenery/stone-and-rail.js';
import { baseArt, deckArt, padArt, roofArt } from './textures.js';
import { poly } from '../lib/draw.js';

export const SC3 = {
  pond: 1,
  rock: 1,
  stoneWall: 1,
  stoneTop: 1,
  trainFrame: 1,
  trainEnd: 1,
  trainDeck: 1,
  trainBody: 1
};

export const SC2 = {
  lattice: 1,
  deckBoards: 1,
  railing: 1,
  tent: 1,
  tentEnd: 1,
  tentRoof: 1,
  valance: 1,
  bedSide: 1,
  bedSoil: 1,
  flag: 1
};

export const SC_KINDS = {
  treeSil: 1,
  leafFlat: 1,
  pineSide: 1,
  trunk: 1,
  lampPost: 1,
  leafBox: 1,
  fence: 1,
  ground: 1,
  lantern: 1,
  hydrant: 1,
  hydrantCap: 1,
  mailbox: 1,
  mailboxEnd: 1,
  carBody: 1,
  carGlass: 1,
  carRoof: 1
};

export function artFor(f) {
  if (SC3[f.art.kind]) return sceneryArt3(f);
  if (SC2[f.art.kind]) return sceneryArt2(f);
  if (SC_KINDS[f.art.kind]) return sceneryArt(f);
  switch (f.art.kind) {
    case 'wall':
      return wallArt(f);
    case 'roof':
      return roofArt(f);
    case 'deck':
      return deckArt(f);
    case 'base':
      return baseArt(f);
    case 'pad':
      return padArt(f);
    case 'awning':
      return awningArt(f);
    case 'awnSide':
      return [poly(f.l2, { fill: f.art.pal.accent, stroke: f.art.pal.accentLine, w: 0.3 })];
    case 'fascia':
      return fasciaArt(f);
    case 'chimney':
      return chimneyArt(f);
    case 'chimTop':
      return [poly(f.l2, { fill: f.art.pal.L ? '#ffffff' : '#3a3a3a', stroke: '#222222', w: 0.3 })];
    case 'canopyFace':
      return canopyFaceArt(f);
    case 'blade':
      return bladeArt(f);
    case 'signFace':
      return signFaceArt(f);
    case 'porchDeck':
      return porchDeckArt(f);
    case 'deckRail':
      return railingArt(f);
    case 'trimPlain':
      return trimPlainArt(f);
    case 'porchSkirt':
      return porchSkirtArt(f);
    case 'column':
      return columnArt(f);
    case 'sawGlass':
      return sawGlassArt(f);
    case 'canopyFlat':
      return [poly(f.l2, { fill: f.art.pal.L ? '#ffffff' : '#b9bec1', stroke: f.art.pal.metalLine, w: 0.3 })];
    case 'mech':
      return mechArt(f);
    case 'canopyBottom':
      return canopyBottomArt(f);
    case 'post':
      return postArt(f);
    case 'pump':
      return pumpArt(f);
  }
  return [poly(f.l2, { fill: '#ffffff' })];
}
