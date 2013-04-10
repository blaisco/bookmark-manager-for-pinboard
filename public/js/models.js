/** 
 * All labels are tags. Not all tags are labels.
 */
Tag = Backbone.RelationalModel.extend({
  relations: [{
    type: 'HasMany',
    key: 'children',
    relatedModel: 'Tag',
    reverseRelation: {
      key: 'parent',
      includeInJSON: false
    }
  }],

  defaults: {
    tag: null, // .~Alpha/Bravo/Charlie (original Pinboard tag)
    bookmarkCount: 0
  },

  initialize: function() {
    this.on("change:tag", this._setupTag, this);
  },

  getToken: function() {
    var token = this.get("tag");
    if(this.isPrivate()) {
      token = token.slice(1);
    }
    if(this.isLabel()) {
      token = token.slice(1);
    }
    return token;
  },

  getTitle: function() {
    var token = this.getToken();
    var reversedToken = token.split("").reverse().join("");
    var indexOfSlash = reversedToken.indexOf('/');
    if(indexOfSlash != -1) {
      token = token.slice(token.length - indexOfSlash, token.length);
    }
    return token.replace(/_/g," ");
  },

  isPrivate: function() {
    return Tag.isPrivate(this.get("tag"));
  },

  isLabel: function() {
    return Tag.isLabel(this.get("tag"));
  },

  // TODO: All of the following stuff can probably just be functions instead of attributes to be set.

  // /** 
  //  * Set all of the derived values of a tag: token, title, isPrivate, isLabel
  //  */
  // _setupTag: function(self) {
  //   var tag = self.get("tag");
  //   self._setIsPrivate(tag);
  //   self._setIsLabel(tag);
  //   // only set token and title if this is a label
  //   // if(self.get("isLabel")) {
  //   //   self._setToken(tag);
  //   //   var token = self.get("token");
  //   //   //self._setTitle(token);
  //   // }
  // },

  // *
  //  * Tag is private if the first character is a . 
   
  // _setIsPrivate: function(tag) {
  //   var isPrivate = tag[0] === PRIVATE_CHAR;
  //   this.set("isPrivate", isPrivate);
  // },

  // /**
  //  * Tag is a label if the first char is a ~ OR if isPrivate and second 
  //  * character is a ~
  //  */ 
  // _setIsLabel: function(tag) {
  //   var isLabel = tag[0] === LABEL_CHAR || (this.get("isPrivate") && tag[1] === LABEL_CHAR);
  //   this.set("isLabel", isLabel);
  // },
  
});

////////////////////////////////////////////////////////////////////////////////

Tag.LABEL_CHAR = "~"; // character used to identify labels
Tag.PRIVATE_CHAR = "."; // character used to identify private tags/labels

Tag.tokenify = function(tag) {
  if(Tag.isPrivate(tag)) {
    tag = tag.slice(1);
  }
  if(Tag.isLabel(tag)) {
    tag = tag.slice(1);
  }
  return tag;
};

Tag.isLabel = function(tag) {
  return tag[0] === Tag.LABEL_CHAR || (isPrivate(tag) && tag[1] === LABEL_CHAR);
};

Tag.isPrivate = function(tag) {
  return tag[0] === PRIVATE_CHAR;
};

Tag.deprivatize = function(tag) {
  if(Tag.isPrivate(tag)) {
    tag = tag.slice(1);
  }
  return tag;
}

////////////////////////////////////////////////////////////////////////////////

TagCollection = Backbone.Collection.extend({
  model: Tag,

  /**
   * Sort by the tag text (same sort order as Pinboard provides it to us)
   */
  comparator: function(tag) {
    return tag.get("tag");
  }
});