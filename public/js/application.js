////////////////////////////////////////////////////////////////////////////////
// START JQUERY ONLOAD /////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

$(function() {
  if(supportsHtml5Storage()) {
    start();
  } else {
    $("#unsupported").show();
  }
  
  // var url = "https://api.pinboard.in/v1/tags/get?format=json&auth_token=XXXX:XXXX";
  // //var tags = {};
  // var labels = [];

  // loadTags(labels);
});

////////////////////////////////////////////////////////////////////////////////
// END JQUERY ONLOAD ///////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/**
 * 
 */
var start = function() {
  //localStorage.removeItem("apiToken");
  var apiToken = localStorage["apiToken"];

  if(apiToken != undefined) {
    var appView = new AppView();
    showView(appView);
  } else {
    var apiTokenView = new ApiTokenView();
    showView(apiTokenView);
  }
}

////////////////////////////////////////////////////////////////////////////////
// UTILITY FUNCTIONS ///////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

var showView = function(view) {
  if (window.currentView) {
    window.currentView.close();
  }
  window.currentView = view;
  window.currentView.render();
}

Backbone.View.prototype.close = function(){
  this.trigger('close');
  $(this).empty();
  this.undelegateEvents();
  this.off();
}

function supportsHtml5Storage() {
  try {
    return 'localStorage' in window && window['localStorage'] !== null;
  } catch (e) {
    return false;
  }
}
