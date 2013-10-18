var Bookmark = Backbone.Model.extend({

  defaults: {
    href: null,
    description: null, 
    extended: null,
    tags: null,
    time: null,
    shared: null
  },

  idAttribute: "href", // href uniquely identifies a bookmark

  // Deprivatize tags and return as an array
  getTagArray: function() {
    var tags = this.get("tags").split(' ');
    tags = _.map(tags, function(tag){
      return Tag.deprivatize(tag);
    });
    return tags;
  }
});