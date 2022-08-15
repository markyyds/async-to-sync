let User = "";
let Duration = "";
let Info = "";

const firebaseConfig = {
  apiKey: "AIzaSyDG-k2DcQweinOlVmwmfPVJz080YgmGVeI",
  authDomain: "chrome-database.firebaseapp.com",
  projectId: "chrome-database",
  databaseURL: "https://chrome-database-default-rtdb.firebaseio.com/",
  storageBucket: "chrome-database.appspot.com",
  messagingSenderId: "271138559447",
  appId: "1:271138559447:web:c709ed5e6167101f52e792",
  measurementId: "G-8Z8FCT10J2"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
console.log(firebase);
//const app = initializeApp(firebaseConfig);
//const app = firebase.initializeApp(firebaseConfig);
const db = app.database();

chrome.runtime.onMessage.addListener((msg) => {
  if(msg.action == "userinfo"){
    User = msg.name;
    console.log(User);
    //localStorage[User] = "";
  }
  /*
  if(msg.action == "videoInfo"){
    Info = msg.info;
  }
  */
  db.ref('user/' + User).set({
    username: User,
    //currentTime: Info
    //videoDuration: 
  });
  /*
  if(msg.action == "videoDuration"){
    Duration = msg.duration;
    console.log(Duration);
  }
  db.ref('user/' + User).set({
    videoDuration: Duration,
    username: User
  });
  */
});

