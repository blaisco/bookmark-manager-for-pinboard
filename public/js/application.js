var app = app || {};

$(function() {
  app.showView = function(view) {
    if (app.currentView) {
      app.currentView.close();
    }
    app.currentView = view;
    app.currentView.render();
  }

  app.supportsHtml5Storage = function() {
    try {
      return 'localStorage' in window && window['localStorage'] !== null;
    } catch (e) {
      return false;
    }
  }

  // Delete the data in our app
  app.reset = function() {
    app.pinboard.destroy();
    app.rootLabel.destroy();
    app.bookmarks.destroy();
  }

  // Start!
  if(app.supportsHtml5Storage()) {
    app.pinboard.fetch();
    var apiToken = app.pinboard.get("apiToken");

    // TODO: This is broken. It doesn't exit out of the view.
    if(apiToken == undefined) {
      var apiTokenView = new app.ApiTokenView();
      app.showView(apiTokenView);
    } else {
      var appView = new app.AppView();
      app.showView(appView);
    }
  } else {
    $("#unsupported").show();
  }
});

// used by app.showView to close out Backbone views + events
Backbone.View.prototype.close = function(){
  this.trigger('close');
  $(this).empty();
  this.undelegateEvents();
  this.off();
}