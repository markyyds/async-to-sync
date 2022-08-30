/*
 * Looper for YouTube
 * http://www.alvinhkh.com/looperforyoutube
 * Copyright (c) 2011-2020, AlvinHKH
 * http://alvinhkh.com
 * All rights reserved.
 */

var chromePage = "";
var chromeInIncognito = false;
if (chrome.extension) {
  chromePage = chrome.runtime.getURL('');
  chromeInIncognito = chrome.extension.inIncognitoContext;
}

// Check whether new version is installed
if (typeof(chrome.runtime) == 'object') {
  var thisVersion = chrome.runtime.getManifest().version;
  if (localStorage['yt-loop-show-changelog'] == "true" && localStorage['yt-loop-version'] && localStorage['yt-loop-version'] != thisVersion.toString()) {
    // check version number, if they are different, show changelog
    var changelog_url = "https://www.alvinhkh.com/looperforyoutube/changelog/updated";
    window.open(changelog_url, "changelogWindow");
  }
  // save current extension version
  localStorage['yt-loop-version'] = thisVersion;
}

function inject(func) {
  var script = document.createElement('script');
  script.setAttribute('type', 'text/javascript');
  script.appendChild(document.createTextNode("var locationSearch = \"" + window.location.search.substring(1) + "\";\n"));
  script.appendChild(document.createTextNode("var chromePage = \"" + chromePage + "\";\n"));
  script.appendChild(document.createTextNode("var inIncognito = " + chromeInIncognito + ";\n"));
  script.appendChild(document.createTextNode("var player_reference;\n"));
  script.appendChild(document.createTextNode("if (typeof onYouTubePlayerReady != 'function'){onYouTubePlayerReady = function (player){player_reference = player;}}\n"));
  script.appendChild(document.createTextNode("(" + func + ")();"));
  document.addEventListener("DOMContentLoaded", function(event) {
      document.body.appendChild(script);
  });
}

inject(function() {

var MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver;
var clog = console.log;
var cinfo = console.log;

function getCookieValue(a, b) {
  b = document.cookie.match('(^|;)\\s*' + a + '\\s*=\\s*([^;]+)');
  return b ? b.pop() : '';
}

ytl = {
  
logging: [],
log: function() {
  var input = '';
  for (var i = 0; i < arguments.length; i++)
    input += arguments[i] + " ";
  if (ytl.isDebug) {
    clog.apply(console, ["[LOOPER FOR YOUTUBE]", input]);
    ytl.logging.push(input);
  }
},
info: function() {
  var input = '';
  for (var i = 0; i < arguments.length; i++)
    input += arguments[i] + " ";
  cinfo.apply(console, ["[LOOPER FOR YOUTUBE]", input]);
  ytl.logging.push(input);
},

isDebug: (localStorage['yt-loop-debug'] == 'true' ? true : false),
setDebug: function(bool) {
  if (bool == true) {
    localStorage['yt-loop-debug'] = true;
  } else {
    localStorage['yt-loop-debug'] = false;
    localStorage.removeItem('yt-loop-debug');
  }
  window.location.reload();
},

setVisitorCookies: function(value, reload) {
  ytl.log('Set YouTube Visitor as', (value == '' ? undefined : value));
  document.cookie="VISITOR_INFO1_LIVE=" + value + "; path=/; domain=.youtube.com";
  if (reload == true) {
    window.location.reload();
  }
},

/*
 * Initialise variables holders
 */
initialiseVariables: function() {
  ytl.log('Initialise Variables');

  // Static Variables
  ytl.layout = '';
  ytl.optionPage = chromePage ? chromePage + 'options.html' : null;
  ytl.qualityLevels = ["highres", "hd2880", "hd2160", "hd1440", "hd1080", "hd720", "large", "medium", "small", "tiny"];
  ytl.session = sessionStorage;
  ytl.storage = localStorage;
  
  // Element Holders
  ytl.button = null;
  ytl.buttonContainer = null;
  ytl.buttonicon = null;
  ytl.buttoncontent = null;
  ytl.likebutton = null;
  ytl.sharebutton = null;
  ytl.panel = null;
  ytl.panelContainer = null;
  ytl.player = null;
  //ytl.slider = null;
  ytl.sliderBar = null;
  ytl.sliderArray = [];
  ytl.marginArray = [];
  ytl.InfoList = {};
  ytl.sliderList = {};
  ytl.userList = [];
  ytl.chromeId = "gflcdpghmoockmhpfadcabjkhbmjopba";
  // Event Holder
  ytl.getReadyTimes = 0;
  ytl.playAction = null;
  ytl.displayMessage = "";
  ytl.currentUser = "";
  ytl.newUser = "";
  
  // Event Boolean
  ytl.autoPlayListenerAttach = false;
  ytl.setLoopEventloaded = false;
  ytl.urlChecked = false;
  ytl.windowResized = false;

  // Session Variables
  ytl.session['yt-duration'] = 0;
  ytl.session['yt-player-size'] = 'normal';
  ytl.session['yt-player-size-initial'] = 'normal';
  ytl.session['yt-loop'] = false;
  ytl.session['yt-loop-attached'] = false;
  ytl.session['yt-loop-autoclick'] = false;
  ytl.session['yt-loop-count'] = 10;
  ytl.session['yt-loop-th'] = 0;
  ytl.session['yt-loop-time'] = 0;
  ytl.session['yt-loop-timer'] = 10;
  ytl.session['yt-loop-incount'] = false;
  ytl.session['yt-loop-inportion'] = false;
  ytl.session['yt-loop-intimer'] = false;
  ytl.session['yt-loop-playlist-endplay'] = false;
  ytl.session['yt-loop-portion'] = JSON.stringify([]);
},

/*
 * Function to get locale strings from each message.json file
 * Limitation: Cannot idenfity placeholder in message.json
 */
localeFetch: function (locale, prefix) {
  locale = locale.replace("-", "_");
  var file = chromePage + "_locales/" + locale + "/messages.json";
  prefix = prefix ? prefix + "_" : "script_";
  var return_message = {};
  var xhr = new XMLHttpRequest();
  xhr.open("GET", file, false);
  xhr.onreadystatechange = function() {
    if(this.status == 200 && this.readyState == 4 && this.responseText != "") {
      var messages = JSON.parse(this.responseText);
      var return_array = {};
      for (var name in messages) {
        var regex = new RegExp("^" + prefix + "(.*)$", "g");
        if (name.match(regex)) {
          var attr = name.replace(regex, "$1");
          if (attr && messages[name] && messages[name].message != null) {
            return_array[attr] = messages[name].message;
          }
        }
      }
      return_message = return_array;
    }
  };
  try {
    xhr.send();
  }
  catch (e) {
  }
  return return_message;
},

/*
 * Corrent lang to the right locale
 */
getCorrectLocale: function (lang) {
  lang = lang.replace(/-/g,'_');
  switch (lang) {
  case "fr_CA":
    return "fr";
  case "pt":
  case "pt_PT":
    return "pt_BR";
  case "zh_Hans_CN":
    return "zh_CN";
  case "zh_Hant_HK":
    return "zh_HK";
  case "zh_Hant_TW":
    return "zh_TW";
  case "en_GB":
  case "en_US":
    return "en";
  case "id_ID":
    return "id";
  default:
    return lang;
  }
},

/*
 * Get translated text
 */
i18n: function (s) {
  // Initialise i18n Variables
  if (ytl.i18n == undefined)
    ytl.i18n = {};
  if (ytl.i18n['en'] == undefined)
    ytl.i18n['en'] = {};
  if (Object.keys(ytl.i18n['en']).length < 1)
    ytl.i18n['en'] = ytl.localeFetch("en");
  if (ytl.lang != undefined) {
    if (ytl.i18n[ytl.lang] == undefined)
      ytl.i18n[ytl.lang] = {};
    if (ytl.lang && Object.keys(ytl.i18n[ytl.lang]).length < 1)
      ytl.i18n[ytl.lang] = ytl.localeFetch(ytl.lang);
  }
  // Translate
  var r = '';
  if (r = ytl.i18n[ytl.lang][s]) {
    return r;
  } else if (ytl.i18n[ytl.lang][s] == '') {
    return '';
  } else if (r = ytl.i18n['en'][s]) {
    return r;
  } else {
    return '';
  }
},

/*
 * set all event listeners
 */
setEventListener: function () {
  window.removeEventListener('message', ytl.messageAction, false);
  window.addEventListener('message', ytl.messageAction, false);
  
  document.removeEventListener('keydown', ytl.keydownAction, false);
  document.addEventListener('keydown', ytl.keydownAction, false);
  
  if (ytl.playerObserver) ytl.playerObserver.disconnect();
  ytl.playerObserver = new MutationObserver(function (mutations) {
    mutations.forEach(ytl.observePlayerSize);
  });
  
  if (document.getElementsByTagName('ytd-app').length > 0) {
    ytl.playerObserver.observe(document.getElementsByTagName('ytd-app')[0], { attributes: true, subtree: false });
  } else if (document.getElementsByTagName('ytg-watch-page').length > 0) {
    ytl.playerObserver.observe(document.getElementsByTagName('ytg-watch-page')[0], { attributes: true, subtree: false });
  } else if (document.getElementById('page')) {
    ytl.playerObserver.observe(document.getElementById('page'), { attributes: true, subtree: false });
  } else if (document.getElementById('app')) {
    ytl.playerObserver.observe(document.getElementById('app'), { attributes: true, subtree: false });
  } else if (ytl.isDebug) {
    console.log('[LOOPER FOR YOUTUBE]', 'fail to find dom to observe player size change.');
  }
},

/*
 * set all variables related to elements
 */
setVariables: function () {
try {  
  ytl.lang = (
    document.documentElement.getAttribute("lang")
    || yt.config_.HL_LOCALE
    || yt.config_.HL
    || getCookieValue('PREF').replace(/^.*&?hl=([^&]*)&?.*$/i, '$1')
  ).replace(/-/g,'_');
  ytl.lang = ytl.getCorrectLocale(ytl.lang);
  ytl.player = ytl.getVariable('player');
  ytl.likebutton = document.getElementById('watch-like');
  ytl.layout = '2015';
  if (document.querySelector('#content ytd-video-primary-info-renderer')) {
    // 2017
    ytl.layout = '2017';
    ytl.buttonContainer = document.querySelector('#content ytd-video-primary-info-renderer');
    if (ytl.buttonContainer.getElementsByTagName('ytd-menu-renderer').length > 0) {
      ytl.buttonContainer = ytl.buttonContainer.getElementsByTagName('ytd-menu-renderer')[0];
    }
    if (document.querySelector('#content ytd-video-primary-info-renderer #top-level-buttons')) {
      ytl.buttonContainer = document.querySelector('#content ytd-video-primary-info-renderer #top-level-buttons')
    }
    if (document.querySelector('#content ytd-video-primary-info-renderer #top-level-buttons-computed')) {
      ytl.buttonContainer = document.querySelector('#content ytd-video-primary-info-renderer #top-level-buttons-computed')
    }
    ytl.panelContainer = document.getElementsByTagName('ytd-video-secondary-info-renderer')[0].parentNode;
  } else if (document.getElementsByTagName('ytg-watch-footer').length > 0) {
    // 2016 Gaming
    ytl.layout = '2016';
    ytl.buttonContainer = document.getElementsByTagName('ytg-watch-footer')[0];
    if (ytl.buttonContainer.getElementsByClassName('actions').length > 0) {
      ytl.buttonContainer = ytl.buttonContainer.getElementsByClassName('actions')[0];
    }
    ytl.panelContainer = document.getElementsByTagName('ytg-watch-footer')[0];
  } else {
    // 2015
    ytl.buttonContainer = document.getElementById('watch8-secondary-actions');
    ytl.panelContainer = document.getElementById('watch8-action-panels') || document.getElementById('watch-action-panels');
    if (ytl.buttonContainer != null && ytl.buttonContainer.getElementsByClassName('action-panel-trigger-share').length > 0) {
      ytl.sharebutton = ytl.buttonContainer.getElementsByClassName('action-panel-trigger-share')[0];
    }
  }
} catch (e) {
  if(ytl.isDebug) console.debug('[LOOPER FOR YOUTUBE]', 'Error: '+e.message);
} finally {
  if (document.body != null) {
    document.body.className = document.body.className.replace(/( )?(ytl-201\d)/g, '');
    document.body.className += " ytl-" + ytl.layout;
  }
  ytl.setEventListener();
}
},

getUrlVars: function(name) {
  var vars = [], hash;
  var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
  for(var i = 0; i < hashes.length; i++) {
    hash = hashes[i].split('=');
    hash[1] = unescape(hash[1]);
    vars.push(hash[0]);
    vars[hash[0]] = decodeURIComponent(hash[1]);
  }
  if (vars.indexOf(name) >= 0) {
    return vars[name];
  } else {
    return null;
  }
},

getUrlVarsInit: function(name) {
  var vars = [], hash;
  var hashes = locationSearch.split('&');
  for(var i = 0; i < hashes.length; i++) {
    hash = hashes[i].split('=');
    hash[1] = unescape(hash[1]);
    vars.push(hash[0]);
    vars[hash[0]] = decodeURIComponent(hash[1]);
  }
  if (vars.indexOf(name) >= 0) {
    return vars[name];
  } else {
    return null;
  }
},

replaceUrlVar: function (s, value) {
  if (value==null || value == undefined || value == 'undefined') {
    window.history.replaceState(null, null, 
      window.location.href.replace(/([?&])+([^=&?]+)=?([^&]*)?/gi, function(o,m,k,e) { 
        if(k==s) if(m=='?') return m; else return ''; 
        else return m+k+'='+(e || ''); 
      })
    );
    return;
  }
  if (ytl.getUrlVars(s)) {
    window.history.replaceState(null, null, 
      window.location.href.replace(/([?&])+([^=&?]+)=?([^&]*)?/gi, function(o,m,k,e) { 
        if(k==s) return m+k+'='+(value || ''); 
        else return m+k+'='+(e || ''); 
      })
    );
  } else {
    window.history.replaceState(null, null, window.location.href+'&'+s+'='+(value || '')); 
  }
},

checkIf: function (c) {
  switch (c) {
    case 'inloop': return (ytl.session['yt-loop'] == 'true');
    case 'inloopPrevious': return (ytl.storage['yt-loop'] == 'true');
    case 'incount': return (ytl.session['yt-loop-incount'] == 'true' && ytl.getVariable('loopCount') > 0);
    case 'intimer': return (ytl.session['yt-loop-intimer'] == 'true' && ytl.getVariable('loopTimer') > 0);
    case 'inportion': return (ytl.session['yt-loop-inportion'] == 'true');
    case 'in-playlist-endplay': return (ytl.session['yt-loop-playlist-endplay'] == 'true');
    case 'loopdisplay': return ( (ytl.player!=null) && (ytl.button!=null) && (ytl.panel!=null) && (ytl.player.addEventListener!=null) && (document.getElementById('loop-button')!=null) && (document.getElementById('action-panel-loop')!=null) );
    case 'buttonDisable': if(ytl.likebutton) return (ytl.likebutton.getAttribute('disabled') && ytl.likebutton.getAttribute('disabled').toLowerCase() == 'true' && ytl.likebutton != 'null'); else return false;
    case 'playerSizeInitial': return ytl.session['yt-player-size-initial'];
    case 'playlistExist': {
      return ytl.getVariable('playlistId') != null;
    }
    /*
    case 'autoPlay': {
      if (ytl.ytAutoPlay() != null)
        return ytl.ytAutoPlay().checked;
      return false;
    }
    */
    case 'autoPlayInitial': return (ytl.session['yt-autoplay-initial'] == 'true');
    case 'playlist-queue':
      var list = document.getElementsByClassName('watch-queue-items-list')[0];
      if (list) {
        return (list.childNodes.length > 0);
      }
      return false;
    case 'playlist-endplay': {
      return ytl.getVariable('loop-playlist')[ytl.getVariable('playlistId')] !== undefined;
    }
    case 'playlist-incount': {
      return ytl.getVariable('playlist-count') > 0;
    }
    case 'playlist-intimer': {
      return ytl.getVariable('playlist-timer') > 0;
    }
    case 'url-loop': return (ytl.getUrlVarsInit('v') == ytl.getUrlVars('v') && ytl.getUrlVarsInit('loop') == 0) ? true : ytl.getUrlVars('loop') == 0 ? true : false;
    case 'url-loopCount': return (ytl.getUrlVarsInit('v') == ytl.getUrlVars('v') && ytl.getUrlVarsInit('loop') > 0) ? true : ytl.getUrlVars('loop') > 0 ? true : false;
    case 'url-loopTimer': return (ytl.getUrlVarsInit('v') == ytl.getUrlVars('v') && ytl.getUrlVarsInit('timer') > 0) ? true : ytl.getUrlVars('timer') ? true : false;
    case 'url-starttime': return (ytl.getUrlVarsInit('v') == ytl.getUrlVars('v') && ytl.getUrlVarsInit('start')) ? true : ytl.getUrlVars('start') ? true : false;
    case 'url-endtime': return (ytl.getUrlVarsInit('v') == ytl.getUrlVars('v') && ytl.getUrlVarsInit('end')) ? true : ytl.getUrlVars('end') ? true : false;
    case 'check-always': return false;
    case 'check-usually':
      return ytl.checkIf('check-always') || 
      ytl.checkIf('inportion') || 
      document.getElementsByClassName('video-stream').length > 0;
  }
},
getOption: function (o) {
  switch (o) {
  case 'autoLoop': 
    return (ytl.storage['yt-auto-loop'] == 'true');
  case 'buttonIcon':
    switch (ytl.storage['yt-loop-button']) {
      case 'all':
      case 'icon':
        return true;
      case 'text':
        return false;
        break;
    }
    return true;
    return (ytl.storage['yt-loop-icon'] == 'true');
  case 'buttonText':
    switch (ytl.storage['yt-loop-button']) {
      case 'all':
      case 'text':
        return true;
      case 'icon':
        return false;
        break;
    }
    return true;
  case 'defaultShowPanel':
    return ytl.getOption('showPanel');
  case 'playerSize':
    return (ytl.storage['yt-player-size'] ? ytl.storage['yt-player-size'] : 'normal');
  case 'playerSizeEnable':
    return (ytl.storage['yt-player-resize'] == 'true');
  case 'quality':
    switch (ytl.storage['yt-quality']) {
      case 'highres':
      case 'hd2880':
      case 'hd2160':
      case 'hd1440':
      case 'hd1080':
      case 'hd720':
      case 'large':
      case 'medium':
      case 'small':
      case 'tiny':
        return ytl.storage['yt-quality'];
    }
    return 'default';
  case 'saveStateLoop':
    return (ytl.storage['yt-auto-loop'] == 'saveState');
  case 'shortcut':
    return (ytl.storage['yt-loop-shortcut'] == 'true');
  case 'showPanel':
    return (ytl.storage['yt-loop-options'] == 'true');
  }
},
getVariable: function (c, i) {
  switch (c) {
    case 'player':
      if (typeof player_reference === 'object' && typeof player_reference.getDuration == 'function') {
        if (ytl.isDebug) ytl.log('Player Object', 'player_reference from onYouTubePlayerReady');
        return player_reference;
      } else if (typeof window.yt.config_.PLAYER_REFERENCE === 'object') {
        if (ytl.isDebug) ytl.log('Player Object', 'yt.config_.PLAYER_REFERENCE');
        return window.yt.config_.PLAYER_REFERENCE;
      } else if (document.getElementById('movie_player') != null) {
        if (ytl.getReadyTimes > 10) {
          if (ytl.isDebug) ytl.log('Player Object', 'movie_player');
          return document.getElementById('movie_player');
        }
        return;
      } else if (typeof document.getElementsByClassName('html5-video-player')[0] === 'object') {
        if (ytl.isDebug) ytl.log('Player Object', 'html5-video-player');
        return document.getElementsByClassName('html5-video-player')[0];
      }
      return;
    case 'loopCount':
      return Number(ytl.session['yt-loop-count']);
    case 'loopCounter':
      return Number(ytl.session['yt-loop-th']);
    case 'loop-playlist': {
      try {
        return JSON.parse(ytl.storage['yt-loop-playlist']);
      } catch (e) {
      }
      return {};
    }
    case 'loopTime':
      return Number(ytl.session['yt-loop-time']);
    case 'loopTimer':
      return Number(ytl.session['yt-loop-timer']);
    case 'starttime':
      var i = i == null || i <= 0 ? 0 : i;
      var data = JSON.parse(ytl.session['yt-loop-portion']);
      if (data.length > i && data[i].start) {
        return parseFloat(data[i].start);
      }
      return 0;
    case 'endtime':
      var i = i == null || i <= 0 ? 0 : i;
      var data = JSON.parse(ytl.session['yt-loop-portion']);
      if (data.length > i && data[i].end) {
        return parseFloat(data[i].end);
      }
      return 0;
    case 'input-starttime':
      var starttime = document.getElementById('loop-start-time-0');
      return ytl.getSeconds(starttime.value);
    case 'input-endtime':
      var endtime = document.getElementById('loop-end-time-0');
      return ytl.getSeconds(endtime.value);
    case 'currenttime':
      return (ytl.player.getCurrentTime != undefined) ? ytl.player.getCurrentTime() : false;
    case 'duration':
      return (ytl.player && ytl.player.getDuration != undefined) ? ytl.player.getDuration() : false;
    case 'playerstate':
      return (ytl.player && ytl.player.getPlayerState != undefined) ? ytl.player.getPlayerState() : false;
    case 'playlistId':
      return ytl.getUrlVars('list');
    case 'playlist-count': {
      if (ytl.checkIf('playlistExist')) {
        const playlistOptions = ytl.getVariable('loop-playlist')[ytl.getVariable('playlistId')];
        if (playlistOptions !== undefined) {
          return Number(playlistOptions.count);
        }
      }
      return -1;
    }
    case 'playlist-timer': {
      if (ytl.checkIf('playlistExist')) {
        const playlistOptions = ytl.getVariable('loop-playlist')[ytl.getVariable('playlistId')];
        if (playlistOptions !== undefined) {
          return Number(playlistOptions.timer);
        }
      }
      return -1;
    }
    case 'url-loopCount': {
      return (ytl.getUrlVarsInit('v') == ytl.getUrlVars('v') && ytl.getUrlVarsInit('loop') > 0) ? 
        Number(ytl.getUrlVarsInit('loop')) : 
        (ytl.getUrlVars('loop') > 0 ? Number(ytl.getUrlVars('loop')) : Number(false));
    }
    case 'url-loopTimer': {
      return (ytl.getUrlVarsInit('v') == ytl.getUrlVars('v') && ytl.getUrlVarsInit('timer') > 0) ? 
        Number(ytl.getUrlVarsInit('timer')) : 
        (ytl.getUrlVars('timer') > 0 ? Number(ytl.getUrlVars('timer')) : Number(false));
    }
    case 'url-starttime': {
      return (ytl.getUrlVarsInit('v') == ytl.getUrlVars('v') && ytl.getUrlVarsInit('start')) ? 
      Math.floor(ytl.getSeconds(ytl.getUrlVarsInit('start'))): 
        (ytl.checkIf('url-starttime') ? Math.floor(ytl.getSeconds(ytl.getUrlVars('start'))) : Number(false));
    }
    case 'url-endtime':  {
      return (ytl.getUrlVarsInit('v') == ytl.getUrlVars('v') && ytl.getUrlVarsInit('end')) ? 
      Math.floor(ytl.getSeconds(ytl.getUrlVarsInit('end'))) : 
        (ytl.checkIf('url-endtime') ? Math.floor(ytl.getSeconds(ytl.getUrlVars('end'))) : Number(false));
    }
    case 'quality':
      return (ytl.player && ytl.player.getPlaybackQuality != undefined && ytl.qualityLevels.indexOf(ytl.player.getPlaybackQuality()) > 0) ? ytl.player.getPlaybackQuality() : false;
    case 'qualitySet':
      return ytl.session['yt-quality-set'];
    case 'availableQuality':
      return (ytl.player && ytl.player.getAvailableQualityLevels != undefined && ytl.player.getAvailableQualityLevels() != '') ? ytl.player.getAvailableQualityLevels() : [];
    case 'highestQuality':
      return (ytl.player && ytl.player.getAvailableQualityLevels != undefined && ytl.player.getAvailableQualityLevels() != '') ? ytl.player.getAvailableQualityLevels()[0] : false;
    case 'lowestQuality':
      return (ytl.player && ytl.player.getAvailableQualityLevels != undefined && ytl.player.getAvailableQualityLevels() != '') ? ytl.player.getAvailableQualityLevels()[ytl.player.getAvailableQualityLevels().length-2] : false;
  }
},
    
setVariable: function (variable, index, value) {
  switch (variable) {
    case 'starttime': {
      var i = index == null || index <= 0 ? 0 : index;
      var portion = JSON.parse(ytl.session['yt-loop-portion']);
      if (portion.length > i && portion[i].start) {
        portion[i].start = value;
      } else {
        portion = [{start: value, end: ytl.getVariable('endtime', i)}];
      }
      ytl.session['yt-loop-portion'] = JSON.stringify(portion);
      break;
    }
    case 'endtime': {
      var i = index == null || index <= 0 ? 0 : index;
      var portion = JSON.parse(ytl.session['yt-loop-portion']);
      if (portion.length > i && portion[i].end) {
        portion[i].end = value;
      } else {
        portion = [{start: ytl.getVariable('starttime', i), end: value}];
      }
      ytl.session['yt-loop-portion'] = JSON.stringify(portion);
      break;
    }
  }
},

addPlaylistIdAutoLoop: function () {
  if (!ytl.checkIf('inloop') || (!ytl.checkIf('intimer') && !ytl.checkIf('incount'))) {
    return;
  }
  const playlistId = ytl.getVariable('playlistId');
  let record = ytl.getVariable('loop-playlist');
  if (record[playlistId] === undefined) {
    // not recorded
    if (typeof(record) != "object" || Object.keys(record).length > 1000) {
      record = {};
    }
  }
  record[playlistId] = {};
  if (ytl.checkIf('incount')) {
    record[playlistId].count = ytl.getVariable('loopCount');
  }
  if (ytl.checkIf('intimer')) {
    record[playlistId].timer = ytl.getVariable('loopTimer');
  }
  ytl.storage['yt-loop-playlist'] = JSON.stringify(record);
},

removePlaylistIdAutoLoop: function () {
  const playlistId = ytl.getVariable('playlistId');
  let record = ytl.getVariable('loop-playlist');
  if (record[playlistId] != undefined) {
    delete record[playlistId];
    ytl.storage['yt-loop-playlist'] = JSON.stringify(record);
  }
},

getTime: function (i) {
  var num = Math.abs(i).toFixed(2).toString().split('.');
  var digit = (num.length > 1 && Number(num[1]) != 0) ? num[1] : '';
  i = Math.floor(i);
  var s = Math.floor(i % 60).toFixed(),
    m = Math.floor(i % (60 * 60) / 60).toFixed(),
    h = Math.floor(i / (60 * 60)).toFixed();
  s = (s < 10 ? '0' : '') + s;
  m = (m < 10 ? '0' : '') + m;
  h = (h == 0 ? '' : (h < 10 ? '0' : '') + h);
  return (h!='' ? h+':' : '') + m + ':' + s + (digit!='' ? '.'+digit : '');
},
getSeconds: function (t) {
  t = t.split(':');
  if (t.length>3||t.length<1) return 0;
  if (t.length == 3) {
    h = Number(t[0]); m = Number(t[1]); s = Number(t[2]);
  } else if (t.length == 2) {
    h = 0; m = Number(t[0]); s = Number(t[1]);
  } else {
    h = 0; m = 0; s = Number(t[0]);
  }
  return (h * 60 * 60) + (m * 60) + s;
},

updateButton: function() {
  var button = document.createElement('a');
  button.setAttribute('is', 'yt-endpoint')
  button.setAttribute('class', 'style-scope ytd-button-renderer');
  var iconButton = document.createElement('yt-icon-button');
  iconButton.setAttribute('id', 'button');
  iconButton.setAttribute('class', 'style-scope ytd-button-renderer style-default size-default');
  if (ytl.getOption('buttonIcon')) {
    var iconContainer = document.createElement('button');
    iconContainer.setAttribute('id', 'button');
    iconContainer.setAttribute('class', 'icon-container style-scope yt-icon-button');
    iconContainer.setAttribute('aria-label', ytl.i18n('button_text'));
    var icon = document.createElement('div');
    icon.setAttribute('class', 'yt-icon-container yt-icon style-scope ytd-button-renderer');
    //icon.innerHTML = '<svg viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" class="style-scope yt-icon" style="pointer-events: none; display: block; width: 100%; height: 100%;"><g class="style-scope yt-icon"><path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z" class="style-scope yt-icon"></path></g></svg>';
    icon.innerHTML = '<svg viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" class="style-scope yt-icon" style="pointer-events: none; display: block; width: 100%; height: 100%;"><g class="style-scope yt-icon"> <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z" class="style-scope yt-icon"></path> </g></svg>';
    var labelContainer = document.createElement('span');
    labelContainer.setAttribute('class', 'label-container');
    var label_auto = document.createElement('label');
    var label_disabled = document.createElement('label');
    var label_enabled = document.createElement('label');
    label_auto.className = 'auto';
    label_auto.innerText = 'A';
    labelContainer.appendChild(label_auto);
    label_disabled.className = 'disabled';
    label_disabled.innerText = '';
    labelContainer.appendChild(label_disabled);
    label_enabled.className = 'enabled';
    label_enabled.innerText = 'x';
    labelContainer.appendChild(label_enabled);
    
    iconContainer.appendChild(labelContainer);
    iconContainer.appendChild(icon);

    while (iconButton.firstChild) {
      iconButton.removeChild(iconButton.firstChild);
    }
    iconButton.appendChild(iconContainer);
    button.appendChild(iconButton);
  }

  // button text for "loop"
  if (ytl.getOption('buttonText')) {
    var text = document.createElement('div');
    text.setAttribute('id', 'text');
    text.setAttribute('class', 'style-scope ytd-button-renderer style-default size-default');
    text.setAttribute('aria-label', ytl.i18n('button_text'));
    text.innerText = ytl.i18n('button_text');
    button.appendChild(text);
  }
  return button;
},

setButton: function() {
  if(ytl.button && document.getElementById('loop-button')) return;
  if(ytl.buttonContainer == null) return;
  if (document.getElementById('loop-button')) {
    document.getElementById('loop-button').remove();
  }
  
  if (ytl.layout == '2017' || ytl.layout == '2016') {
    var renderer = document.createElement('ytd-button-renderer');
    renderer.setAttribute('id', 'loop-button');
    renderer.setAttribute('style-action-button', '');
    renderer.setAttribute('is-icon-button', '');
    renderer.setAttribute('class', 'loop-button style-scope ytd-menu-renderer force-icon-button style-default size-default');
    renderer.appendChild(ytl.updateButton());
   
    /*
    const iconID = "icon" + ytl.currentUser;
    ytl.sliderArray.push(document.getElementById(iconID));
    */
    
    renderer.addEventListener ('click', ytl.buttonAction);

    while (document.getElementById('loop-button')) {
      document.getElementById('loop-button').remove();
    }
    ytl.buttonContainer.appendChild(renderer);
    ytl.button = document.getElementById('loop-button');
    
  } 
  /*
  else {
    var button = document.createElement('button'), 
    icon_wrapper = document.createElement('span'),
    icon = document.createElement('span'),
    icon_valign = document.createElement('span'), 
    label_auto = document.createElement('label'),
    label_disabled = document.createElement('label'),
    label_enabled = document.createElement('label'),
    buttonContent = document.createElement('span'),
      buttonClassName = '';
      var disable = ytl.checkIf('buttonDisable');
    if (ytl.sharebutton != null)
      buttonClassName = ytl.sharebutton.getAttribute('class').replace('action-panel-trigger-share', '').replace('yt-uix-button-has-icon', '').replace('no-icon-markup', '').replace('pause-resume-autoplay', '');
    button.setAttribute('id', 'loop-button');
    button.setAttribute('class', 'loop-button ' + buttonClassName);
    button.setAttribute('type','button');
    if(!disable) button.setAttribute('title', ytl.i18n('button_hover'));
    button.setAttribute('onclick', ';return false;');
    button.setAttribute('data-trigger-for', 'action-panel-loop');
    button.setAttribute('data-button-toggle', 'true');
    button.setAttribute('role','button');
    if(disable) button.setAttribute('disabled', disable);
    icon_wrapper.className = 'yt-uix-button-icon-wrapper';
    icon.setAttribute('id', 'loop-button-icon');
    icon.className = 'yt-uix-button-icon yt-sprite';
    label_auto.className = 'auto';
    label_auto.innerText = 'A';
    icon.appendChild(label_auto);
    label_disabled.className = 'disabled';
    label_disabled.innerText = 'X';
    icon.appendChild(label_disabled);
    label_enabled.className = 'enabled';
    label_enabled.innerText = '✔';
    icon.appendChild(label_enabled);
    icon_wrapper.appendChild(icon);
    button.appendChild(icon_wrapper);
    buttonContent.id = 'loop-button-content';
    buttonContent.className = 'yt-uix-button-content';
    buttonContent.innerText = ytl.i18n('button_text');
    button.appendChild(buttonContent);
    button.addEventListener ('click', ytl.buttonAction);
    while (document.getElementById('loop-button')) {
      document.getElementById('loop-button').remove();
    }
    ytl.buttonContainer.insertBefore(button, ytl.buttonContainer.childNodes.length > 2 ? ytl.buttonContainer.childNodes[2] : ytl.buttonContainer.firstChild);
    
    ytl.button = document.getElementById('loop-button');
    ytl.buttonicon = document.getElementById('loop-button-icon');
    ytl.buttoncontent = document.getElementById('loop-button-content');
  }
  */
},

buttonClick: function (s) { ytl.log('Button Click - Done'); if(ytl.button) return ytl.button.click(); },

setUserProgress: function(userName){
  var startPoint = document.createElement('div');
  startPoint.className = 'loop-slider-pointer slider-start';
  startPoint.id = 'icon' + userName;
  var br = document.createElement('br');

  // Set dropdown menu
  var dropdown = document.createElement('div');
  dropdown.id = 'myDropdown' + userName;
  dropdown.className = 'dropdown-content';
  var dropdown_message = document.createElement('button');
  //dropdown_message.href = "#message";
  dropdown_message.innerText = "Message " + userName;
  dropdown_message.className = "chat-btn";
  
  var dropdown_speaker = document.createElement('button');
  dropdown_speaker.href = "#speak";
  dropdown_speaker.innerText = "Speak to " + userName;
  var dropdown_note = document.createElement('button');
  dropdown_note.href = "#notes";
  dropdown_note.innerText = "See " + userName + "'s notes";

  var chatBox = document.createElement('div');
  chatBox.className = "chat-popup";
  chatBox.id = "chat";
  var chatTitle = document.createElement('div');
  chatTitle.className = "chat-title";
  chatTitle.innerText = userName;
  var chatClose = document.createElement('button');
  chatClose.className = "btn cancel";
  chatClose.type = "button";
  chatClose.innerText = "Close";
  chatClose.style = "float: right;";
  chatClose.onclick = function closeForm(){
    document.getElementById("chat").style.display = "none";
  };
  chatTitle.appendChild(chatClose);

  // chat display
  var msgDisplay = document.createElement('div');
  msgDisplay.className = "msg-display";
  var msgContainer = document.createElement('ul');
  msgContainer.className = "msg-container";
  msgContainer.id = "chat-messages";
  msgDisplay.appendChild(msgContainer);

  // chat form
  var formContainer = document.createElement('form');
  formContainer.className = "form-container";
  var msgInput = document.createElement('input');
  msgInput.className = "msg-input";
  msgInput.type = "text";
  msgInput.id = "message-input";
  var msgButton = document.createElement('button');
  msgButton.className = "msg-button";
  msgButton.innerText = "Send";
  msgButton.id = "message-btn";
  msgButton.onclick = ytl.sendMessage;
  //document.getElementById("message-btn").addEventListener("click", sendMessage);

  formContainer.appendChild(msgInput);
  formContainer.appendChild(msgButton);

  chatBox.appendChild(chatTitle);
  chatBox.appendChild(br);
  chatBox.appendChild(br);
  chatBox.appendChild(msgDisplay);
  chatBox.appendChild(formContainer);

  dropdown_message.onclick = function myFunction() {
    document.getElementById("chat").style.display = "block";
  }
  dropdown.appendChild(dropdown_message);
  dropdown.appendChild(dropdown_speaker);
  dropdown.appendChild(dropdown_note);
  startPoint.appendChild(br);
  startPoint.appendChild(br);
  startPoint.appendChild(br);
  startPoint.appendChild(dropdown);
  startPoint.appendChild(chatBox);

  startPoint.onclick = function myFunction() {
    dropdown.classList.toggle("show");
  }
  return startPoint;
},

sendMessage(e) {
  e.preventDefault();

  // get values to be submitted
  const timestamp = Date.now();
  const messageInput = document.getElementById("message-input");
  const message = messageInput.value;

  alert("timestamp: " + timestamp);
  alert("message: " + message);
  // clear the input box
  messageInput.value = "";

  //auto scroll to bottom
  document
  .getElementById("messages")
  .scrollIntoView({ behavior: "smooth", block: "end", inline: "nearest" });

  // create db collection and send in the data
  chrome.runtime.sendMessage(ytl.chromeId, {userMessage: timestamp + '|' + message}, function(response){
    ytl.displayMessage = response.display;
    alert("reponse from background: " + response.display);
    document.getElementById("chat-messages").innerHTML += ytl.displayMessage;
  });
},

setMenuPanel: function (panel) {
  // Set Slider
  var slider = document.createElement('div');
  slider.id = 'loop-slider-0';
  slider.className = 'loop-slider';
  var padding = document.createElement('div');
  padding.id = 'loop-slider-padding-0';
  padding.className = 'loop-slider-padding';
  var startPoint = document.createElement('div');
  startPoint.className = 'loop-slider-pointer slider-start';
  var br = document.createElement('br');

  // Set dropdown menu
  var dropdown = document.createElement('div');
  dropdown.id = 'myDropdown';
  dropdown.className = 'dropdown-content';
  var dropdown_message = document.createElement('button');
  dropdown_message.innerText = "Message Mark";
  dropdown_message.className = "chat-btn";
  dropdown_message.onclick = function openForm() {
    document.getElementById("chat").style.display = "block";
  }
  var dropdown_speaker = document.createElement('button');
  dropdown_speaker.innerText = "Speak to Mark";
  var dropdown_note = document.createElement('button');
  dropdown_note.innerText = "See Mark's notes";

  var chatBox = document.createElement('div');
  chatBox.className = "chat-popup";
  chatBox.id = "chat";
  var chatTitle = document.createElement('div');
  chatTitle.className = "chat-title";
  chatTitle.innerText = "Chat";
  var chatClose = document.createElement('button');
  chatClose.className = "btn cancel";
  chatClose.type = "button";
  chatClose.innerText = "Close";
  chatClose.style = "float: right;";
  chatClose.onclick = function closeForm(){
    document.getElementById("chat").style.display = "none";
  };
  chatTitle.appendChild(chatClose);

  // chat display
  var msgDisplay = document.createElement('div');
  msgDisplay.className = "msg-display";
  var msgContainer = document.createElement('ul');
  msgContainer.className = "msg-container";
  msgContainer.id = "chat-messages";
  msgDisplay.appendChild(msgContainer);

  // chat form
  var formContainer = document.createElement('form');
  formContainer.className = "form-container";
  var msgInput = document.createElement('input');
  msgInput.className = "msg-input";
  msgInput.type = "text";
  msgInput.id = "message-input";
  var msgButton = document.createElement('button');
  msgButton.className = "msg-button";
  msgButton.innerText = "Send";
  msgButton.id = "message-btn";
  msgButton.onclick = ytl.sendMessage;
  //document.getElementById("message-btn").addEventListener("click", sendMessage);

  formContainer.appendChild(msgInput);
  formContainer.appendChild(msgButton);

  chatBox.appendChild(chatTitle);
  chatBox.appendChild(br);
  chatBox.appendChild(br);
  chatBox.appendChild(msgDisplay);
  chatBox.appendChild(formContainer);

  dropdown.appendChild(dropdown_message);
  dropdown.appendChild(dropdown_speaker);
  dropdown.appendChild(dropdown_note);

  /*
  startPoint.appendChild(br);
  startPoint.appendChild(br);
  startPoint.appendChild(br);
  startPoint.appendChild(dropdown);
  //startPoint.appendChild(chatBox);

  startPoint.onclick = function myFunction() {
    document.getElementById("myDropdown").classList.toggle("show");
  }
  */

  chrome.runtime.sendMessage(ytl.chromeId, {command: "getCurrentUser"}, function(response){
    ytl.currentUser = response.currentusername;
    //alert("username response from set: " + ytl.currentUser);
    startPoint.title = ytl.currentUser + " is watching";
    const iconID = "icon" + ytl.currentUser;
    startPoint.id = iconID;
    ytl.sliderList[ytl.currentUser] = document.getElementById(iconID);
    ytl.sliderArray.push(document.getElementById(iconID));
  });

  padding.appendChild(startPoint);
  // add new user icon here
  slider.appendChild(padding);
  slider.appendChild(chatBox);
  
  var sliderContainer = document.createElement('div');
  sliderContainer.id = sliderContainer.className = 'loop-panel-slider-container';
  sliderContainer.appendChild(slider);

  // Add to Panel
  if (panel) {
    panel.appendChild(sliderContainer); 
  } else return false;
},
// set interval for updating real-time user progress on the progress bar

setPanel: function() {
  if(ytl.panel && document.getElementById('action-panel-loop')) return;
  if(ytl.panelContainer==null) return;
  if (document.getElementById('action-panel-loop')) {
    document.getElementById('action-panel-loop').remove();
  }
  var content = document.createElement('div');
  content.setAttribute('id', 'action-panel-loop');
  var panelInsert = ytl.panelContainer.childNodes[0];
  if (ytl.layout == '2017' || ytl.layout == '2016') {
    content.setAttribute('class', 'loop-panel');
  } else {
    content.setAttribute('class', 'action-panel-content hid');
    content.setAttribute('data-panel-loaded', 'true');
  }
    
  if(document.getElementById('watch-like'))
    document.getElementById('watch-like').addEventListener('click', function(e){
      if (e.which==2) return;
      ytl.panelDisplay('isfalse');
    });
  if (document.getElementById('action-panel-dismiss'))
    document.getElementById('action-panel-dismiss').addEventListener('click', function(e){
      if (e.which==2) return;
      ytl.panelDisplay('isfalse');
    });
  
    
  // Set menu panel here  
  ytl.setMenuPanel(content);

  if (ytl.layout == '2017') {
    panelInsert.insertBefore(content, panelInsert.firstChild);
  } else if (ytl.layout == '2016') {
    panelInsert.parentNode.insertBefore(content, panelInsert.parentNode.childNodes.length > 1 ? panelInsert.parentNode.childNodes[1] : panelInsert.parentNode.firstChild);
  } else {
    panelInsert.parentNode.appendChild(content);
  }

  ytl.panel = document.getElementById('action-panel-loop');
  ytl.slider = document.getElementById('loop-slider-0');
  //ytl.sliderBar = document.getElementById('icon');
},


observePlayerSize: function (mutation) {
  if (mutation && mutation.target && mutation.target.getAttribute('id') == 'page') {
        var _player = document.getElementById('player-legacy') || document.getElementById('player');
        var _currentSize;
        if (mutation.target.className.match('watch-non-stage-mode') != null) {
            _currentSize = 'normal';
        } else {
        if (_player.className.match('watch-small') != null) {
          _currentSize = 'normal';
        } else if (_player.className.match('watch-full') != null) {
          _currentSize = 'fullsize';
        } else if (_player.className.match('watch-medium') != null) {
          _currentSize = 'wide';
        } else {
          _currentSize = 'normal';
        }
        }
        if (ytl.session['yt-player-size'] != _currentSize) {
            //setTimeout(ytl.setFullWindowPlayerContent, 100);
            ytl.log('Player resized.');
        }
    ytl.session['yt-player-size'] = _currentSize;
  }
},

setLoopEvent: function () {
  if(ytl.isDebug) console.log('[LOOPER FOR YOUTUBE]', 'Attach loop action event to the button and Request options setting.');
  try {
    if (ytl.player==null || ytl.player != ytl.getVariable('player')) ytl.player = ytl.getVariable('player');
    if (ytl.player == player_reference || ytl.player == window.yt.config_.PLAYER_REFERENCE) {
      ytl.setLoopEventloaded = true;
      if (ytl.player == player_reference) {
        if (ytl.isDebug) ytl.log('REFERENCE PLAYER: onYouTubePlayerReady');
      }
    } else {
      ytl.log('Cannot find REFERENCE PLAYER', '(usually cause by using other youtube extensions at the same time)');
      return;
    }
  } catch (e) {
    if (ytl.isDebug) console.error('[LOOPER FOR YOUTUBE]', e);
    ytl.setLoopEventloaded = false;
    return;
  } finally {
    window.postMessage({type: 'loopActionDone'}, '*'); 
    window.postMessage({type: 'requestMessage'}, '*');
  }
},

panelDisplay: function (display) {
  if(!ytl.panel||!ytl.button) return false;
  
  ytl.button.className = ytl.button.className.replace(/( )?action-panel-trigger/g, '');
  
  if(ytl.getOption('showPanel') && !ytl.button.className.match('action-panel-trigger')) 
    ytl.button.className += ' action-panel-trigger';
    
  if( display == true || display == "action-panel-loop" ){
    var panelButtons = null;
    if (ytl.buttonContainer != null) {
      panelButtons = ytl.buttonContainer.getElementsByClassName('yt-uix-button-toggled');
    }
    for(i=0;i<panelButtons.length;i++)
      panelButtons[i].className = panelButtons[i].className.replace(/( )?yt-uix-button-toggled/g,'');
    setTimeout(function(){
      var panelContent = ytl.panelContainer.getElementsByClassName('action-panel-content');
      for(i=0;i<panelContent.length;i++) {
        if(panelContent[i].className.match('hid') == null) panelContent[i].className += ' hid';
        panelContent[i].style.display = 'none';
      }
      ytl.panel.className = ytl.panel.className.replace(/( )?hid/g, '');
      ytl.panel.style.display = 'block';
      if (ytl.panelContainer != null) {
        ytl.panelContainer.className = ytl.panelContainer.className.replace(/( )?hid/g, '');
        ytl.panelContainer.style.display = 'block';
      }
    }, 100);
  } else if (display == false) {
    ytl.panel.style.display = '';
    if (!ytl.panel.className.match('hid')) ytl.panel.className += ' hid';
    if (document.getElementById('action-panel-dismiss') != null)
      setTimeout(function(){document.getElementById('action-panel-dismiss').click();}, 100);
  } else {
    if (!ytl.panel.className.match('hid')) ytl.panel.className += ' hid';
    ytl.panel.style.display = 'none';
        var buttons = [];
    if (ytl.buttonContainer != null) {
      buttons = ytl.buttonContainer.getElementsByTagName('button');
    }
    for (i=0; i<buttons.length; i++) {
      if (buttons[i].getAttribute('data-trigger-for') == display) {
        buttons[i].click();
      }
    }
  }
},

buttonDisplay: function () {
  if (!ytl.button) return false;
  // button
  ytl.button.className = ytl.checkIf('inloop') ? ( ytl.button.className.match('yt-uix-button-toggled') ? ytl.button.className : ytl.button.className.replace('yt-uix-button yt','yt-uix-button yt-uix-button-toggled yt')) : ytl.button.className.replace(/( )?yt-uix-button-toggled/g,'');
  // button icon
  ytl.button.className = ytl.button.className.replace(/( )?button-show-icon/g,'');
  ytl.button.className += ytl.getOption('buttonIcon') ? ' button-show-icon' : '';
  // button text
  ytl.button.className = ytl.button.className.replace(/( )?button-show-text/g,'');
  ytl.button.className += ytl.getOption('buttonText') ? ' button-show-text' : '';
  // button icon label
  ytl.button.className = ytl.button.className.replace(/( )?loop-auto/g,'');
  ytl.button.className = ytl.button.className.replace(/( )?loop-enabled/g,'');
  ytl.button.className = ytl.button.className.replace(/( )?loop-disabled/g,'');
  if (ytl.getOption('autoLoop')) {
    ytl.button.className += ' loop-auto';
  }
  ytl.button.className += ytl.checkIf('inloop') ? ' loop-enabled' : ' loop-disabled';
},

buttonAction: function (e) {
  var pad = document.getElementById('loop-slider-padding-0');
  if( e != null && e.which == 2 ) return;
  if (ytl.getOption('showPanel') == false) ytl.panelDisplay(false);
  if (ytl.panel != null && ytl.panel.className.match('hid') != null) {
    ytl.panelDisplay(true);

    //
    setInterval(function(){
    chrome.runtime.sendMessage(ytl.chromeId, {command: "request real-time margin"}, function(response) {
      var responseInfo = response.message;
      var field = responseInfo.split('|');
      var username = field[0];
      var margin = field[1];
      ytl.InfoList[username] = margin;
      if(username != ytl.currentUser){
        if(!ytl.userList.includes(username)){
          ytl.userList.push(username);
          document.getElementById('loop-slider-padding-0').appendChild(ytl.setUserProgress(username));
          ytl.sliderList[username] = document.getElementById("icon" + username);
        }
      }
      console.log(" username: " + username + " margin: " + margin);
    })}, 100);

    setInterval(function(){
      chrome.runtime.sendMessage(ytl.chromeId, {marginInfo: ((Math.round((ytl.player.getCurrentTime() / ytl.player.getDuration()) * 100)).toString() + "%")});
    }, 100);

    /*
    setInterval(function () {
      var i = 0;
      for(var key in ytl.InfoList){
        ytl.sliderArray[i].style.marginLeft = ytl.InfoList[key];
        i++;
    }}, 100);
    */

    setInterval(function () {
      var i = 0;
      for(var key in ytl.InfoList){
        ytl.sliderList[key].style.marginLeft = ytl.InfoList[key];
        i++;
    }}, 100);
  } 
  else if (ytl.panel != null && ytl.panel.className.match('hid') == null) {
    ytl.panelDisplay(false);
  }
},

playlistInit: null,

playlistRepeat: null,

ytAutoPlay: function() {
  if (ytl.layout == '2017' || ytl.layout == '2016') {
    if (document.getElementsByTagName('ytd-compact-autoplay-renderer').length > 0) {
      if (document.getElementsByTagName('ytd-compact-autoplay-renderer')[0].getElementsByTagName('paper-toggle-button').length > 0) {
        return document.getElementsByTagName('ytd-compact-autoplay-renderer')[0].getElementsByTagName('paper-toggle-button')[0];
      }
    }
  } else {
    return document.getElementById('autoplay-checkbox');
  }
  return null;
},

checkAutoPlay: function () {
  // Suggested AutoPlay
  if (ytl.ytAutoPlay() != null) {
    if (!ytl.checkIf('inloop') && ytl.checkIf('autoPlayInitial')) {
      ytl.ytAutoPlay().checked = true;
    } else {
      ytl.ytAutoPlay().checked = false;
    }
  }
},

getReady: function () {
  try {
    ytl.setVariables();
    ytl.getReadyTimes += 1;
    if (
      ytl.player == null ||
      ytl.player.addEventListener == null ||
      ytl.player != ytl.getVariable('player')
    )
      ytl.player = ytl.getVariable('player');
    
    if (ytl.panel==null || document.getElementById('action-panel-loop')==null) ytl.setPanel();
    if (ytl.button==null || document.getElementById('loop-button')==null) ytl.setButton(); else if (ytl.button) ytl.button.disabled = true;
    
  
    if (ytl.getVariable('starttime', 0) != 0) {
      ytl.setVariable('starttime', 0, 0);
    }
    if (ytl.getVariable('endtime', 0) == 0 && ytl.getVariable('duration')) {
      ytl.setVariable('endtime', 0, Math.floor(ytl.getVariable('duration')).toFixed(0));
    }
    if (ytl.session['yt-duration'] == '0' && ytl.getVariable('duration')) ytl.session['yt-duration'] = ytl.getVariable('duration');
    
    ytl.session['yt-player-size-initial'] = ytl.getOption('playerSize');
    
    // Suggested AutoPlay
    if (ytl.ytAutoPlay() != null) {
      // Check auto-play button click action
      if ( ytl.autoPlayListenerAttach == false ) {
        ytl.ytAutoPlay().addEventListener('change', function() {
          if( ytl.checkIf('inloop') ) ytl.buttonClick();
        });
        ytl.autoPlayListenerAttach = true;
      }
    }
  } catch (e) {
    ytl.log('getReady - Error:', e.message);
  } finally {
    if (ytl.getReadyTimes > 100) {
      ytl.log('Unable to get Ready');
      if (ytl.button) ytl.button.disabled = true;
      return;
    }
    if ( ytl.checkIf('loopdisplay') ) {
      if (ytl.player.addEventListener == null) {
        ytl.log('getReady - Restart'+' (ytl.player not set properly)');
        setTimeout(ytl.getReady, 100);
        return;
      }
      if( ytl.getVariable('endtime', 0) == 0 || Number(ytl.session['yt-duration']) == 0 ) { 
        ytl.log('getReady - Restart'+' (session of endtime / duration not set)');
        if(ytl.checkIf('buttonDisable')) {
          ytl.log('No Video on the page (Button Disabled)');
        } else {
          setTimeout(ytl.getReady, 100);
        }
      } else {
        ytl.log('getReady - Done');
        if (ytl.button) ytl.button.disabled = false;
        if(ytl.setLoopEventloaded == false) ytl.setLoopEvent();
      }
    } else {
      ytl.log('getReady - Restart'+' (Button not Display)');
      if(ytl.checkIf('buttonDisable')) {
        ytl.log('No Video on the page'+' (Button Disabled)');
      } else {
        setTimeout(ytl.getReady, 100);
      }
    }
  }
  return;
},

keydownAction: function (e) {
  if (ytl == null) return;
  if (!ytl.getOption('shortcut')) return;
  if (e.shiftKey || e.altKey || e.ctrlKey || e.metaKey) return;
  if (e.srcElement || e.target)
  if (e.target.localName=='input' || e.target.localName=='textarea' || e.srcElement.localName=='input' || e.srcElement.localName=='textarea') return;
  if (e.target.hasAttribute('contenteditable')) return;
  if (e.target.getAttribute('role') == 'textbox') return;
  if (!ytl.getOption('shortcut') && (e.keyCode == 80 || e.keyCode == 82)) return;
  switch(e.keyCode) {
    case 80: // p
    case 82: // r
      ytl.buttonClick(); break;
  }
},

messageAction: function(e) {
  if (e.data.type)
  if (e.data.type == 'optionsMsg') {
    if (ytl.isDebug) console.debug(e);
    if ( (e.origin !== 'https://www.youtube.com') && (e.origin !== 'http://www.youtube.com') && (e.origin !== 'https://gaming.youtube.com') ) return;
    if (e.data.key!=undefined) {
      ytl.storage['yt-loop-shortcut'] = (e.data['key'] == true) ? 'true' : 'false';
    }
    if (e.data.button!=undefined) {
      switch(e.data['button']) {
        case 'all':
        case 'icon':
        case 'text':
          ytl.storage['yt-loop-button'] = e.data['button']; 
          break;
        default: 
          ytl.storage['yt-loop-button'] = 'all'; 
          break;
      }
      ytl.buttonDisplay();
      if (ytl.layout == '2017' || ytl.layout == '2016') {
        if (ytl.button != null) {
          while (ytl.button.firstChild) {
            ytl.button.removeChild(ytl.button.firstChild);
          }
          ytl.button.appendChild(ytl.updateButton());
        }
      }
    }
  } else if (e.data.type == 'loopActionDone') {
    if(ytl.isDebug) console.debug(e.data);
    //ytl.setPlayerSize();
    //ytl.setQuality();
    //ytl.setAutoLoop();
    //ytl.setUrlLoop();
    ytl.buttonDisplay();
  }
}
};

//
ytl.initiate = function () {
  ytl.logging = [];
  ytl.info('Debug Mode:', (localStorage['yt-loop-debug'] == 'true' ? true : false));
  ytl.info('Browser is in Incognito window: ' + inIncognito);

  ytl.initialiseVariables();
  ytl.setVariables();
  if (ytl.getReadyTimes == 0) {
    ytl.getReady();
  }
}
/*
 * monitoring document.body
 */
if (ytl.bodyObserver) ytl.bodyObserver.disconnect();
ytl.bodyObserver = new MutationObserver(function (mutations) {
  mutations.forEach(function (mutation) {
    if (mutation.attributeName && mutation.attributeName == 'class') {
      var host = document.location.host;
      var isYouTube_host = (host.substr(host.length - 11) == 'youtube.com' && host != 'm.youtube.com');
      var isYouTube_target = ((mutation.target.baseURI).match("youtube.com") != null);
      if (mutation && mutation.target && isYouTube_host && isYouTube_target) {
        if ((mutation.target.baseURI).match("watch\\?") != null) {
          if (mutation.target.className.match('page-loaded') != null) {
            if (sessionStorage['yt-body-class'] == undefined || sessionStorage['yt-body-class'].match('page-loaded') == null) {
              ytl.getReadyTimes = 0;
              ytl.initiate();
            }
          }
          sessionStorage['yt-body-class'] = mutation.target.className;
        } else {
          ytl.logging = [];
          ytl.log('This is not a video page');
          if(ytl.player) ytl.player.stopVideo();
          ytl.getReadyTimes = 1000;
        }
      } else {
        ytl.logging = [];
        ytl.log('NOT IN YOUTUBE.COM');
      }
    }
  });
});
ytl.bodyObserver.observe(document.body, { attributes: true, subtree: false });

/*
 * monitoring title
 */

if (ytl.titleObserver) ytl.titleObserver.disconnect();
ytl.titleObserver = new MutationObserver(function (mutations) {
  mutations.forEach(function (mutation) {
      var host = document.location.host;
      var isYouTube_host = (host.substr(host.length - 11) == 'youtube.com' && host != 'm.youtube.com');
      var isYouTube_target = ((mutation.target.baseURI).match("youtube.com") != null);
      if (document.querySelector('ytd-watch') || document.querySelector('ytd-watch-flexy') || document.querySelector('ytg-app')) {
        if (mutation && mutation.target && isYouTube_host && isYouTube_target) {
          if ((mutation.target.baseURI).match("watch\\?") != null) {
            if (document.querySelector('ytd-app')) {
              var videoId = (document.querySelector('ytd-watch') || document.querySelector('ytd-watch-flexy')).getAttribute('video-id');
              if (videoId != sessionStorage['yt-video-id']) {
                ytl.getReadyTimes = 0;
                ytl.initiate();
              }
              sessionStorage['yt-video-id'] = videoId;
              chrome.runtime.sendMessage("gflcdpghmoockmhpfadcabjkhbmjopba", {videoID: videoId});
              //alert(videoId);
            } else if (document.querySelector('ytg-app')) {
              var title = mutation.target.text;
              if (title != sessionStorage['yt-title']) {
                ytl.getReadyTimes = 0;
                ytl.initiate();
              }
              sessionStorage['yt-title'] = title;
            }
          } else {
            ytl.logging = [];
            ytl.log('This is not a video page');
            if(ytl.player) ytl.player.stopVideo();
            ytl.getReadyTimes = 1000;
          }
        } else {
          ytl.logging = [];
          ytl.log('NOT IN YOUTUBE.COM');
        }
      }
  });
});

ytl.titleObserver.observe(document.querySelector('head > title') || document.querySelector('title'), { subtree: true, characterData: true, childList: true });
setTimeout(function() {
  ytl.initiate();
}, 1000)
});

function getMessageFromChromeSync () {
  if ( !chrome.storage ) {
    console.info('[LOOPER FOR YOUTUBE]', 'BROWSER YOU ARE USING DO NOT SUPPORT CHROME.STORAGE API, OPTIONS IS NOT AVAILABLE IN THIS CASE');
    window.postMessage({
      type: 'optionsMsg',
      auto: false,
      button: 'all',
      key: true,
      panel: true,
      playersizeEnable: false,
      playersize: 'normal',
      quality: 'default',
      show_changelog: true,
      oldchrome: true
    }, '*');
    return false;
  }
  chrome.storage.sync.get(null, function(value){ 
    window.postMessage({
      type: 'optionsMsg',
      auto: value['ytAutoLoop'] ? value['ytAutoLoop'] : false,
      button: value['option_button'] ? value['option_button'] : 'all',
      key: value['ytShortcut'] ? ( value['ytShortcut']=='false' ? false : true ) : true,
      panel: value['ytLoopPanel'] ? ( value['ytLoopPanel']=='false' ? false : true ) : true,
      playersizeEnable: value['ytPlayerSizeEnable'] ? ( value['ytPlayerSizeEnable']=='true' ? true : false ) : false,
      playersize: value['ytPlayerSize'] ? value['ytPlayerSize'] : 'normal',
      quality: value['ytQuality'] ? value['ytQuality'] : 'default',
      show_changelog: value['option_show_changelog'] ? ( value['option_show_changelog']=='false' ? false : true ) : true,
    }, '*');
  });
}

try {
  getMessageFromChromeSync();
} catch (e) {
}

window.addEventListener('message', function (e) {
  if (e.data.type)
  if (e.data.type == 'requestMessage') {
    getMessageFromChromeSync();
  }
}, false);

