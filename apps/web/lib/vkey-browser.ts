import { Buffer } from "buffer";
import vk from "./vk.json";

const hb = (h: string) => Buffer.from(h, "hex");

export const verifyingKey = {
  alpha: hb(vk.alpha),
  beta: hb(vk.beta),
  gamma: hb(vk.gamma),
  delta: hb(vk.delta),
  ic: vk.ic.map(hb),
};
