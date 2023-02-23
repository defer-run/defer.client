const Cap = 15

const random = Math.random
const floor = Math.floor
const pow = Math.pow
const min = Math.min

const randomBetween = (min: number, max: number) => floor(random() * (max - min + 1)) + min

export const jitter = (n: number) => randomBetween(0, min(Cap, 100 * pow(2, n)));

