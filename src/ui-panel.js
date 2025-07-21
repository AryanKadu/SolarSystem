// UI panel for controlling planet orbital speeds

// These must match the order and names in main.js
const planetNames = [
  'Mercury', 'Venus', 'Earth', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune'
];

// Default orbital speeds (should match those in main.js)
const defaultSpeeds = [4.15, 1.62, 1.0, 0.53, 0.08, 0.03, 0.011, 0.006];

// Expose a global for main.js to read/write
window.planetOrbitSpeeds = [...defaultSpeeds];

const panel = document.getElementById('ui-panel');

planetNames.forEach((name, i) => {
  const label = document.createElement('label');
  label.innerText = name;

  const slider = document.createElement('input');
  slider.type = 'range';
  slider.min = 0.001;
  slider.max = 5;
  slider.step = 0.001;
  slider.value = defaultSpeeds[i];
  slider.style.marginRight = '8px';

  const number = document.createElement('input');
  number.type = 'number';
  number.min = 0.001;
  number.max = 5;
  number.step = 0.001;
  number.value = defaultSpeeds[i];

  // Sync slider and number
  slider.addEventListener('input', () => {
    number.value = slider.value;
    window.planetOrbitSpeeds[i] = parseFloat(slider.value);
  });
  number.addEventListener('input', () => {
    slider.value = number.value;
    window.planetOrbitSpeeds[i] = parseFloat(number.value);
  });

  label.appendChild(slider);
  label.appendChild(number);
  panel.appendChild(label);
}); 