document.addEventListener("DOMContentLoaded", () => {

  // RANDOM VIBE BUTTON
  const vibes = ["rainy day", "soft morning", "nostalgic", "city lights", "cozy"];

  document.getElementById("randomBtn").onclick = () => {
    const random = vibes[Math.floor(Math.random() * vibes.length)];
    alert("✨ Try this vibe: " + random);
  };

  // FILTER BUTTONS
  document.querySelectorAll(".filters button").forEach(btn => {
    btn.onclick = () => {
      alert("🌿 Mood selected: " + btn.innerText);
    };
  });

});