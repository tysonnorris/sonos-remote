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

// Listening for commands
var listenerId = lirc_node.addListener(function(data) {
  if (data.repeat === "00"){  

  console.log("Received IR keypress '" + data.key + "'' from remote '" + data.remote +"'  repeat:" + data.repeat );
    discovery.getFavorites().then((response) => {
      favs = response; 
      let player = discovery.getAnyPlayer(); 
      let currentTrack = discovery.getAnyPlayer().state.currentTrack; 
      if (currentFav == favs.length-1){
        currentFav = 0;
      } else {
        currentFav++;
      }
 
      let nextFav = favs[currentFav];// getNextFav(currentTrack);
      console.log("next fav:"+JSON.stringify(nextFav.title));
      discovery.getAnyPlayer().replaceWithFavorite(nextFav.title).then(()=>{
        player.play();
      });
    });
  }

});

function getNextFav(currentTrack) {
  let nextFav = favs[0]; 
  _.forEach(favs, function(value, key){
    console.log("checcking current:" + JSON.stringify(currentTrack) + "  and fav:"+ value.uri);
    if (value.uri === currentTrack.uri) {
      nextFav = ( key == favs.length-1 ? favs[0] : favs [key+1] );
    }
  });
  return nextFav;
}


console.log("last line");




//process.stdin.resume();
