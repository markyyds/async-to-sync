let User = "";
let Info = "";
let VideoID = "";
let CurrentTime = "";
let Duration = "";
let marginpercent = "";
let currentVideoID = "";

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


chrome.runtime.onMessage.addListener((msg, sendResponse) => {
  if(msg.action == "userinfo"){
    User = msg.name;
    console.log(User);
  }
});

/*
db.ref('videoID/' + VideoID + "/" + User).orderByKey().on("child_added", function(data){
  console.log("data key" + data.val());
  sendResponse({farewell: data.key});
})
*/

chrome.runtime.onMessageExternal.addListener(
  function(request, sender, sendResponse) {
    if (request.command == "request a list of user names"){
      db.ref('videoID/' + VideoID + '/').on("child_changed", function(data){
        var newUser = data.val();
        //console.log("data key: " + data.key);
        //console.log("marginPercent: " + newUser.marginPercent);
        sendResponse({farewell: data.key + "|" + newUser.marginPercent});
      })
    }  
    if (request.command == "request margin"){
      db.ref('videoID/' + VideoID + '/').on("child_changed", function(data){
        var newUser = data.val();
        console.log("marginPercent from request margin: " + newUser.marginPercent);
        sendResponse({message: data.key + "|" + newUser.marginPercent});
      })
    }  
  }
);

chrome.runtime.onMessageExternal.addListener((request, sendResponse) => {
  if(request.marginInfo){
    console.log(request.marginInfo);
    marginpercent = request.marginInfo;
  }
  if(request.videoID){
    //console.log(request.videoID);
    VideoID = request.videoID;
  }
  if(User != ""){
    db.ref('videoID/' + VideoID + '/' + User).set({
      marginPercent: marginpercent
    });
  }
});

