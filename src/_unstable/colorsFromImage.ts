import { toOk } from "../components/properties/OklchColorControl";

// Based on https://github.com/luukdv/color.js/
type Args = {
  amount: number;
  format: string;
  group: number;
  sample: number;
  minHue: number;
  maxHue: number;
}

const getArgs = ({
  amount = 3,
  format = 'array',
  group = 20,
  sample = 10,
  minHue = 0,
  maxHue = 360,
} = {}): Args => ({ amount, format, group, sample, minHue, maxHue })

type Data = Uint8ClampedArray

type Hex = string

type Input = (Hex | Rgb)[]

type Item = Url | HTMLImageElement

type Output = Hex | Rgb | (Hex | Rgb)[]

type Rgb = [r: number, g: number, b: number]

type Url = string

const getSrc = (item: Item): string =>
  typeof item === 'string' ? item : item.src

const format = (input: Input, args: Args): Output => {
  const list = input.map((val) => {
    const [r, g, b] = Array.isArray(val) ? val : val.split(',').map(Number) as Rgb

    return `color(display-p3 ${r / 255} ${g / 255} ${b / 255})`;
  })

  return args.amount === 1 ? list[0] : list
}

const group = (number: number, grouping: number): number => {
  const grouped = Math.round(number / grouping) * grouping

  return Math.min(grouped, 255)
}

const cache = new Map();

const getImageData = (src: Url): Promise<Data> => {
  if (cache.has(src)) {
    return Promise.resolve(cache.get(src));
  }
  return new Promise((resolve, reject) => {
    const canvas = new OffscreenCanvas(0, 0);
    const context = canvas.getContext('2d', { colorSpace: 'display-p3' })
    const img = new Image();

    img.onload = () => {
      canvas.height = img.height
      canvas.width = img.width

      context.drawImage(img, 0, 0)

      const { data } = context.getImageData(0, 0, img.width, img.height, { colorSpace: "display-p3" });

      cache.set(src, data);
      resolve(data)
    }
    img.onerror = (e) => {
      console.log(e);
      return reject(Error('Image loading failed.'));
    }
    img.crossOrigin = ''
    img.src = src
  })
}

const getAverage = (data: Data, args: Args): Output => {
  const gap = 4 * args.sample
  const amount = data.length / gap
  let r = 0, g = 0, b = 0

  for (let i = 0; i < data.length; i += gap) {
    // Ignore fully transparent pixels.
    if (data[i + 3] === 0) continue;
    r += data[i]
    g += data[i + 1]
    b += data[i + 2]
  }

  return format([[
    Math.round(r / amount),
    Math.round(g / amount),
    Math.round(b / amount)
  ]], args)
}

const getProminent = (data: Data, args: Args): Output => {
  const gap = 4 * args.sample
  const colors: { [key: string]: number } = {}

  for (let i = 0; i < data.length; i += gap) {
    const rgb = [
      group(data[i], args.group),
      group(data[i + 1], args.group),
      group(data[i + 2], args.group),
    ].join()

    colors[rgb] = colors[rgb] ? colors[rgb] + 1 : 1
  }

  const isWrappedMin = args.minHue < 0;
  const isWrappedMax = args.maxHue > 360;
  // Cannot use modulo here because it's broken in JS for negative numbers.
  const minHue = isWrappedMin ? (360 + args.minHue) : args.minHue;
  const maxHue = args.maxHue % 360;

  function hueIsInBounds(h) {
    if (isWrappedMin) {
      return h >= minHue || h <= maxHue;
    }
    if (isWrappedMax) {
      return h <= maxHue || h >= minHue;
    }

    return h >= minHue && h <= maxHue;
  }


  return format(
    Object.entries(colors)
      .filter(([, amount]) => amount > 1) 
      .map(([color, amount]) => {
        const [r,g,b] = color.split(',');
        return [color, amount, toOk(`color(display-p3 ${r / 255} ${g / 255} ${b / 255})`)];
      })
      .filter(([,,{h}]) => hueIsInBounds(h))
      .sort(([, ,a], [, ,b]) => a.c > b.c ? -1 : 1)
      // .sort(([, a], [, b]) => a - b)
      .slice(0, args.amount)
      .map(([color]) => color),
    args
  )
}

async function average(item: Item, args?: Partial<Args>) {
  const data = await getImageData(getSrc(item));

  return getAverage(data, getArgs(args));
}

async function prominent(item: Item, args?: Partial<Args>) {
  const data = await getImageData(getSrc(item));

  return getProminent(data, getArgs(args));
}

export { average, prominent }