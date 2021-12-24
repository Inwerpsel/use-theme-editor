const toSelectOptions = options => options.map(({ dims, label }) => ({
  label: `${label} (${dims.join(' x ')})`,
  value: dims.join(),
}));

export const simpleScreenOptions = toSelectOptions([
  { dims: [360, 640], label: 'Phone' },
  { dims: [768, 1024], label: 'Tablet Portrait' },
  { dims: [1024, 768], label: 'Tablet Landscape' },
  { dims: [1536, 864], label: 'Laptop Wide' },
]);
export const allScreenOptions = toSelectOptions([
  { dims: [360, 640], label: 'Phone' },
  { dims: [360, 780], label: 'Apple iPhone 12 mini' },
  { dims: [390, 844], label: 'Apple iPhone 12 Pro', },
  { dims: [768, 1024], label: 'Tablet Portrait' },
  { dims: [1024, 768], label: 'Tablet Landscape' },
  { dims: [1366, 768], label: 'Laptop Small' },
  { dims: [1440, 900], label: 'Laptop Medium' },
  { dims: [1536, 864], label: 'Laptop Wide' },
  { dims: [1920, 1080], label: 'Full HD' },
  { dims: [2560, 1080], label: 'Ultrawide HD' },
  { dims: [2560, 1440], label: 'UHD' },
  { dims: [3440, 1440], label: 'Ultrawide UHD' },
  { dims: [3840, 2160], label: '4K' },
]);

