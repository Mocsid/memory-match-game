// Returns a random lowercase "color_fruit" username
const colors = ["red", "blue", "green", "yellow", "purple", "orange", "pink", "cyan", "lime", "teal", "brown", "gray", "black", "white"];
const fruits = ["banana", "apple", "mango", "grape", "melon", "berry", "peach", "cherry", "kiwi", "lemon", "papaya", "orange", "fig", "plum"];

export function generateUsername() {
  const color = colors[Math.floor(Math.random() * colors.length)];
  const fruit = fruits[Math.floor(Math.random() * fruits.length)];
  return `${color}_${fruit}`;
}
