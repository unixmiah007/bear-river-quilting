import {
  IMPROV_QUILT_BASTING_IMAGE,
  IMPROV_QUILTING_010_IMAGE,
  IMPROV_QUILTING_020_IMAGE,
  IMPROV_QUILTING_IMAGE,
  QUILT_STUDIO_IMAGE,
} from './quiltAssets.js';

/** Six quilt photos for the homepage hero backdrop (one chosen per full refresh). */
export const HOME_HERO_BACKGROUNDS = [
  IMPROV_QUILTING_IMAGE,
  IMPROV_QUILTING_010_IMAGE,
  IMPROV_QUILTING_020_IMAGE,
  IMPROV_QUILT_BASTING_IMAGE,
  '/assets/products-hero-quilt-couch.jpg',
  QUILT_STUDIO_IMAGE,
];

export function pickHomeHeroBackground() {
  const pool = HOME_HERO_BACKGROUNDS;
  return pool[Math.floor(Math.random() * pool.length)];
}
