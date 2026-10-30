const paths = {
  offering:'M12 21V10m0 5C7 15 4 11 4 7c5 0 8 3 8 8Zm0 3c5 0 8-4 8-8-5 0-8 3-8 8ZM12 3v3',
  temple:'m3 10 9-7 9 7M4 10h16M6 10v9m6-9v9m6-9v9M3 21h18',
  video:'M3 5h12v14H3V5Zm12 5 6-4v12l-6-4',
  booking:'M5 3h14v18H5V3Zm3 5h8m-8 4h8m-8 4h5',
  pin:'M12 22s8-8 8-14A8 8 0 0 0 4 8c0 6 8 14 8 14Zm0-11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
  calendar:'M4 5h16v16H4V5Zm3-3v6m10-6v6M4 10h16',
  shield:'m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Zm-4 9 3 3 5-6',
};
export const sevaIcon = kind => `<svg class="seva-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[kind] ? `<path d="${paths[kind]}"/>` : `<path d="${paths.offering}"/>`}</svg>`;
