import { useSyncExternalStore } from "react";
import { MQ } from "./gsap";

const query = () => window.matchMedia(MQ.motion);
const subscribe = (cb: () => void) => {
  const mq = query();
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};

/** false when the visitor asked for reduced motion: WebGL backgrounds are not rendered at all. */
export function useMotionOK() {
  return useSyncExternalStore(subscribe, () => query().matches, () => false);
}
