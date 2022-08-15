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

/*
const remove = document.getElementById("changeColor");
remove.onclick = function(){
  cookie.remove('user', user);
};
*/

const welcomeMessage = document.getElementById("welcome");
welcomeMessage.innerText = "Hello " + user;

// Import the functions you need from the SDKs you nee
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional

chrome.runtime.sendMessage({
  action: "userinfo",
  name: user
}
);

/*
chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
  chrome.tabs.sendMessage(tabs[0].id, {username: user});
});
*/