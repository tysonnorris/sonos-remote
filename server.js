"use strict"; 

const _ = require('lodash');
const lirc_node = require('lirc_node');
const fs = require('fs');
const SonosDiscovery = require('sonos-discovery');
const logger = require('sonos-discovery/lib/helpers/logger');
//const SonosHttpAPI = require('./lib/sonos-http-api.js');
const nodeStatic = require('node-static');
const settings = require('./settings');

const fileServer = new nodeStatic.Server(settings.webroot);
const discovery = new SonosDiscovery(settings);

//const player = discovery.getAnyPlayer().then((response) => {
//  console.log("player:" + JSON.stringify(response));
//});

/*
const favs = discovery.getFavorites().then((response) => {
console.log("favs:" + JSON.stringify(response));
});
*/
  discovery.on('topology-change', function (topology) {
    //invokeWebhook('topology-change', topology);
    console.log("change:" + JSON.stringify(topology));
    discovery.getFavorites().then((response) => {
      console.log("response:"+JSON.stringify(response));
    });

  });

lirc_node.init();

console.log("remotes:" + lirc_node.remotes);
let currentFav=0;
let favs = [];

let playFav = function(favToPlay){
    console.log("favToPlay:" + favToPlay);
    discovery.getFavorites().then((response) => {
      favs = response;
      let player = discovery.getAnyPlayer();
      let currentTrack = discovery.getAnyPlayer().state.currentTrack;
      if (_.includes(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'], favToPlay)){
        currentFav = favToPlay;
      } else if (favToPlay === "next"){
        currentFav++;
      } else if (favToPlay === "prev"){
        currentFav--;
      }
      console.log("new current fav:" + currentFav); 
      if (currentFav < 0 || currentFav === favs.length){
        currentFav = 0;
      }
      console.log("new current fav:" + currentFav); 

      let nextFav = favs[currentFav];// getNextFav(currentTrack);
      console.log("next fav:"+JSON.stringify(nextFav.title));
      discovery.getAnyPlayer().replaceWithFavorite(nextFav.title).then(()=>{
        player.play();
      });
    });
}
let volume = function(upOrDown){
  if (upOrDown === "up"){
    discovery.getAnyPlayer().setVolume("+10");
  } else if (upOrDown === "down"){
    discovery.getAnyPlayer().setVolume("-10");
  } else {
    console.log("unknown volume command:" + upOrDown);
  }
}
let skip = function(prevOrNext){
  if (prevOrNext === "prev"){
    discovery.getAnyPlayer().previousTrack();
  } else if (prevOrNext === "next"){
    discovery.getAnyPlayer().nextTrack();
  } else {
    console.log("unknown skip command:" + skip);
  }
}
let playPause = function(){
  let player = discovery.getAnyPlayer();
  if(player.coordinator.state.playbackState === 'PLAYING') {
    player.coordinator.pause();
  } else {
    player.coordinator.play();
  }
}

// Listening for commands
var listenerId = lirc_node.addListener(function(data) {
  if (data.repeat === "00"){  

    console.log("Received IR keypress '" + data.key + "'' from remote '" + data.remote +"'  repeat:" + data.repeat );
    if (_.includes(["KEY_0", "KEY_1", "KEY_2", "KEY_3", "KEY_4", "KEY_5", "KEY_6", "KEY_7", "KEY_8", "KEY_9"], data.key)){
      playFav(data.key.substring(4));
    } else if (data.key === "KEY_CHANNELUP"){
      playFav("next");
    } else if (data.key === "KEY_CHANNELDOWN"){
      playFav("prex");
    } else if (data.key === "KEY_VOLUMEUP"){
      volume("up");
    } else if (data.key === "KEY_VOLUMEDOWN"){
      volume("down");
    } else if (data.key === "KEY_NEXT"){
      skip("next");
    } else if (data.key === "KEY_PREVIOUS"){
      skip("prev");
    } else if (data.key === "KEY_PLAYPAUSE"){
      playPause();
    }
  }

});






