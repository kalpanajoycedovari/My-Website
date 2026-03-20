function toggleDarkMode() {
  document.body.classList.toggle("dark-mode");
}
// RANDOM VIBE BUTTON
const vibes = ["rainy day", "soft morning", "nostalgic", "city lights", "cozy"];

document.getElementById("randomBtn").onclick = () => {
  const random = vibes[Math.floor(Math.random() * vibes.length)];
  alert("✨ Try this vibe: " + random);
};