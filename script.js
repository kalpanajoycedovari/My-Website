document.addEventListener("DOMContentLoaded", () => {

  const db = firebase.firestore();

  // AUTH CHECK
  firebase.auth().onAuthStateChanged(user => {
    if (!user) {
      window.location.href = "profile.html";
    } else {
      loadProfile(user.uid);
    }
  });

  function loadProfile(uid) {
    db.collection("users").doc(uid).get()
      .then(doc => {
        if (doc.exists) {
          const data = doc.data();

          document.getElementById("profileBox").innerHTML = `
            <div class="profile">
              <img src="${data.avatar || 'https://via.placeholder.com/80'}">
              <h3>${data.name}</h3>
              <p>${data.bio}</p>
            </div>
          `;
        }
      });
  }

  // ❤️ SAVE TO FIREBASE
  document.querySelectorAll(".card button").forEach(btn => {

    if (!btn.classList.contains("toggle-btn")) {

      btn.addEventListener("click", () => {

        const user = firebase.auth().currentUser;

        if (!user) return;

        const card = btn.closest(".card");

        const cardData = {
          title: card.querySelector("h3").innerText,
          text: card.querySelector("p").innerText,
          image: card.querySelector("img") ? card.querySelector("img").src : ""
        };

        db.collection("users")
          .doc(user.uid)
          .collection("saved")
          .add(cardData)
          .then(() => {
            btn.innerText = "❤️ saved";
          });

      });

    }

  });

});