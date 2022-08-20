// Initialize button with user's preferred color

let user = cookie.get('user');
if (!user) {

  // Ask for the username if there is none set already
  user = prompt('Choose a username:');
  if (!user) {
    alert('We cannot work with you like that!');
  } else {
    // Store it in the cookies for future use
    cookie.set('user', user);
  }
}

const welcomeMessage = document.getElementById("welcome");
welcomeMessage.innerText = "Hello " + user;

chrome.runtime.sendMessage({
  action: "userinfo",
  name: user
}
);
