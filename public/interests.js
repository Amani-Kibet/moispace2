let container1 = document.getElementById("CONTACTS-BODY2");
let container2 = document.getElementById("CONTACTS-BODY1");
const sentBtn = document.getElementById("sentBtn");
const receivedBtn = document.getElementById("receivedBtn");
let mainUser = JSON.parse(localStorage.getItem("mainUser"));
let page = io();
sentBtn.addEventListener("click", () => {
  container1.classList.remove("HIDE-BODY");
  container2.classList.add("HIDE-BODY");
});
receivedBtn.addEventListener("click", () => {
  container1.classList.add("HIDE-BODY");
  container2.classList.remove("HIDE-BODY");
});
console.log("Hello ther eeveryone");

let received = {};
let sent = {};

let data = async () => {
  let interestsData = await fetch("/interests", {
    method: "POST",
    headers: { "Content-type": "application/json" },
    body: JSON.stringify({
      mainUser: mainUser,
    }),
  });

  let dataReceived = await interestsData.json();
  received = dataReceived.received;
  sent = dataReceived.sent;
  renderSent();
  renderReceived();
};

let renderSent = () => {
  if (!sent || sent.length === 0) {
    let defaultM = document.createElement("div");
    defaultM.classList.add("CONTACTS");
    defaultM.classList.add("defaultBlank");
    defaultM.innerHTML = `<p>Interest you show to others will appear here</p>`;
    container1.appendChild(defaultM);
    return;
  }

  sent.forEach(async (u) => {
    await fetch("/interest/info/sent", {
      method: "POST",
      headers: { "Content-type": "application/json" },
      body: JSON.stringify({ username: u.to }),
    })
      .then((res) => res.json())
      .then((data1) => {
        data1.info.forEach((v) => {
          let contact = document.createElement("div");
          contact.classList.add("CONTACTS");

          let contactPic = document.createElement("div");
          contactPic.classList.add("CONTACTS-PROFILEPIC");
          contactPic.style.backgroundImage = `url('${
            v.profileLink || "/mediafiles/africanGirl.jpg"
          }')`;

          let contactInfo = document.createElement("div");
          contactInfo.classList.add("CONTACTS-INFO");

          let h3 = document.createElement("h3");
          h3.classList.add("CONTACTS-USERNAME");
          h3.textContent = v.username;

          let interestStatus = document.createElement("div");
          interestStatus.classList.add("INTERESTS-STATUS");
          if (u.status == "pending") {
            interestStatus.classList.add("Pending");
          } else if (u.status == "interested") {
            interestStatus.classList.add("Interested");
          } else {
            interestStatus.classList.add("notInterested");
          }

          interestStatus.innerHTML = `<h3>Status: ${u.status}</h3>`;

          contactPic.addEventListener("click", () => {
            let form = document.createElement("form");
            form.method = "POST";
            form.action = "/user";

            let input = document.createElement("input");
            input.type = "hidden";
            input.name = "username";
            input.value = v.username;

            form.appendChild(input);
            contactPic.appendChild(form);
            form.submit();
          });

          contactInfo.appendChild(h3);
          contactInfo.appendChild(interestStatus);
          contact.appendChild(contactPic);
          contact.appendChild(contactInfo);
          container1.appendChild(contact);
        });
      });
  });
};

let renderReceived = () => {
  if (!received || received.length === 0) {
    let defaultM = document.createElement("div");
    defaultM.classList.add("CONTACTS");
    defaultM.classList.add("defaultBlank");
    defaultM.innerHTML = `<p>No one has shown an interest on you yet</p>`;
    container2.appendChild(defaultM);
    return;
  }
  received.forEach(async (u) => {
    await fetch("/interest/info/received", {
      method: "POST",
      headers: { "Content-type": "application/json" },
      body: JSON.stringify({ username: u.from }),
    })
      .then((res) => res.json())
      .then((data1) => {
        data1.info.forEach((v) => {
          let contact = document.createElement("div");
          contact.classList.add("CONTACTS");

          let contactPic = document.createElement("div");
          contactPic.classList.add("CONTACTS-PROFILEPIC");
          contactPic.addEventListener("click", () => {
            let form = document.createElement("form");
            form.method = "POST";
            form.action = "/user";

            let input = document.createElement("input");
            input.type = "hidden";
            input.name = "username";
            input.value = v.username;

            form.appendChild(input);
            contactPic.appendChild(form);
            form.submit();
          });
          contactPic.style.backgroundImage = `url('${
            v.profileLink || "/mediafiles/africanGirl.jpg"
          }')`;

          let contactInfo = document.createElement("div");
          contactInfo.classList.add("CONTACTS-INFO");

          let h3 = document.createElement("h3");
          h3.classList.add("CONTACTS-USERNAME");
          h3.textContent = v.username;

          let interestBtnContainer = document.createElement("div");
          interestBtnContainer.classList.add("INTERESTS-BTN-CONTAINER");
          let interestedBtn = document.createElement("Button");
          interestedBtn.className = "InterestedBtn";
          interestedBtn.innerHTML = "Interested";
          interestedBtn.classList.add("INTERESTS-BTN");
          let declinedBtn = document.createElement("Button");
          declinedBtn.className = "Decline";
          declinedBtn.innerHTML = "Ignore";
          declinedBtn.classList.add("INTERESTS-BTN");

          interestedBtn.addEventListener("click", () => {
            if (!sent[0]) {
            } else {
              sent[0].from;
            }
            fetch("/interests/accept", {
              method: "POST",
              headers: { "Content-type": "application/json" },
              body: JSON.stringify({ from: v.username, to: mainUser }),
            })
              .then((res) => res.json())
              .then((data) => {
                if (data.status) {
                  page.emit("message", {
                    from: mainUser,
                    to: v.username,
                    text: `Hey ${v.username} 👋, I'm also interested in you, lets now chat.`,
                  });
                  interestBtnContainer.innerHTML = "✅ Interested";
                } else {
                  return;
                }
              });
          });

          declinedBtn.addEventListener("click", () => {
            fetch("/interests/decline", {
              method: "POST",
              headers: { "Content-type": "application/json" },
              body: JSON.stringify({ from: v.username, to: mainUser }),
            })
              .then((res) => res.json())
              .then((data) => {
                if (data.status) {
                  interestBtnContainer.innerHTML =
                    "❌ You ignored this contact.";
                } else {
                  return;
                }
              });
          });

          contactInfo.appendChild(h3);
          contactInfo.appendChild(interestBtnContainer);

          if (u.status == "interested") {
            interestBtnContainer.innerHTML = "✅ Interested";
          } else if (u.status == "declined") {
            interestBtnContainer.innerHTML = "❌ You ignored this contact.";
          } else {
            interestBtnContainer.appendChild(interestedBtn);
            interestBtnContainer.appendChild(declinedBtn);
          }

          contact.appendChild(contactPic);
          contact.appendChild(contactInfo);
          container2.appendChild(contact);
        });
      });
  });
};

data();
