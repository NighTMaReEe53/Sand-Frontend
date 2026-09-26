import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

/*
  Single GSAP registration point (Implementation_plan_EN.md §11).
  Import gsap/ScrollTrigger from here — never register the plugin elsewhere.
  Vite is client-only, so no SSR dynamic-import guard is required.
*/
gsap.registerPlugin(ScrollTrigger);

export { gsap, ScrollTrigger };
