var Header = Backbone.Marionette.ItemView.extend({
  template: "#header-tmpl",

  ui: {
    //heading: '.heading',
    //logo: '.logo'
  },

  events : {
    //'click .logo': 'onLogoClick'
  },

  initialize: function() {
    //Backbone.on("view:change", this.onViewChange, this);
  }
});