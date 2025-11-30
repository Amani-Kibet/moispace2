let mainUser;
async function loadContacts() {
    try {       
        const response = await fetch("/chats/contacts");
        const userInfo = await response.json();
        let contBody = document.getElementById("CONTACTS-BODY");
        const info = userInfo.userData.contacts
        const unRead = userInfo.count
        info.forEach((u) => {
        let unseen = undefined;
        let noOfUnread = undefined;
        const unreadDetails = (unRead[u.username])
        if (unreadDetails){
           noOfUnread = (unreadDetails.value)
           unseen = (unreadDetails.message)
        }
    let cont = document.createElement("div");
    cont.className = "CONTACTS";

    let imgCont = document.createElement("div");
    imgCont.classList.add("CONTACTS-PROFILEPIC");
    imgCont.style.background = `url(${u.profileLink })`;
    imgCont.style.backgroundSize = 'cover'
    
    imgCont.addEventListener('click',()=>{
    let form = document.createElement("form");
    form.method = "POST";
    form.action = "/user";
    
    let input = document.createElement("input");
    input.type = "hidden";
    input.name = "username";
    input.value = u.username;

    form.appendChild(input);
    imgCont.appendChild(form)
    form.submit(); 
    })

    let infoCont = document.createElement("div");
    infoCont.classList.add("CONTACTS-INFO");

    let pageTexts = document.createElement("div");
    pageTexts.classList.add("pageTexts");

    let topItems = document.createElement("div");
    topItems.classList.add("topItems");

    let nameCont = document.createElement("h3");
    nameCont.classList.add("CONTACTS-USERNAME");
    nameCont.textContent = u.username;


    topItems.appendChild(nameCont);
    pageTexts.appendChild(topItems);
    
    if (noOfUnread) {
    let msgCont = document.createElement("h4");
    msgCont.textContent = unseen;

    let badge = document.createElement("span");
    badge.classList.add("BADGE");
    badge.textContent = noOfUnread +' new';
    pageTexts.appendChild(msgCont);
    topItems.appendChild(badge);
    }

    let noteCont = document.createElement("div");
    noteCont.classList.add("CONTACTS-NOTE");
    noteCont.textContent = u.slogan || "";

    infoCont.appendChild(pageTexts);
    infoCont.appendChild(noteCont);
    cont.appendChild(imgCont);
    cont.appendChild(infoCont);
    contBody.appendChild(cont);

    infoCont.addEventListener("click", () => {
        localStorage.setItem("chatInfo2", JSON.stringify(u));
        window.location.href = "/chatspage";
    });
});

} catch (err) {
    console.error("Error loading contacts:", err);
}
}

// Call the function
loadContacts();
