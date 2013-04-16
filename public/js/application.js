$(function() {
  if(supportsHtml5Storage()) {
    var appView = new AppView();
    showView(appView);
  } else {
    $("#unsupported").show();
  }
});

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
