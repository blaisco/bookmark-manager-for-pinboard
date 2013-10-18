var App = new Backbone.Marionette.Application();

App.addRegions({
  header : '#header',
  main   : '#main'
});

App.addInitializer(function(){
  //App.PinboardApi.destroy();
  App.header.show(new Header());

  if(supportsHtml5Storage()) {
    if(App.PinboardApi.hasValidated()) {
      App.main.show(new AppLayout());
    } else {
      App.main.show(new ApiTokenView());
    }
  } else {
    $("#unsupported").show();
  }
});

// When we've validated the api token, startup the app
App.vent.on("api:validated", function(){
  App.main.show(new AppLayout());
});