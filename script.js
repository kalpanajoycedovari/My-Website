document.addEventListener("DOMContentLoaded", () => {

  const db = firebase.firestore();

  // CHECK LOGIN + LOAD PROFILE
  firebase.auth().onAuthStateChanged(user => {
    if (!user) {
      window.location.href = "profile.html";
    } else {
      loadProfile(user.uid);
    }
  });

  // LOAD PROFILE FROM DATABASE
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
        } else {
          window.location.href = "profile.html";
        }
      });
  }

});