var LABEL_CHAR = "~" // character used to identify labels
var PRIVATE_CHAR = "." // character used to identify private tags/labels

////////////////////////////////////////////////////////////////////////////////
// START JQUERY ONLOAD /////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

$(function() {
  if(supports_html5_storage()) {
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

  if(apiToken) {
    var appView = new AppView();
    showView(appView);
  } else {
    var apiTokenView = new ApiTokenView();
    showView(apiTokenView);
  }
}




















/*
  title: Charlie
  id: Alpha/Bravo/Charlie
  tag: .~Alpha/Bravo/Charlie
*/

function createTree(labels) {
  /*var test = [
      {title: "Item 1"},
      {title: "Folder 2", isFolder: true, key: "folder2",
        children: [
          {title: "Sub-item 2.1"},
          {title: "Sub-item 2.2"}
        ]
      },
      {title: "Item 3"}
    ];
  console.log(test);*/

  $("#labels").dynatree({
    onActivate: function(node) {
      // A DynaTreeNode object is passed to the activation handler
      // Note: we also get this event, if persistence is on, and the page is reloaded.
      //console.log(node.data.tag);
      loadBookmarks(node.data.tag);
    },
    children: labels
  });
}

function loadBookmarks(tag) {
  $("#bookmarks").empty();

  // Tag could be blank, e.g. if you have a Alpha/Bravo/Charlie tag with
  // no bookmarks at Alpha/Bravo
  if(tag) {
    $.ajax({
      url: "/p/posts/all",
      data: {
        format: "json",
        auth_token: "XXXX:XXXX",
        tag: tag
      },
      success: function(bookmarks) {
        populateBookmarks(bookmarks);
      }
    });
  }
}

function populateBookmarks(bookmarks) {
  $.each(bookmarks, function(index, bookmark) {
    //console.log(bookmark.description);
    console.log(bookmark);
    var privateClass = bookmark.shared === "yes" ? "" : "private";
    $("#bookmarks").append("<div class='bookmark " + privateClass + "'><a href='" +
      bookmark.href + "'><span class='description'>" + 
      bookmark.description + "</span> <span class='url'>" + bookmark.href + "</span></a></div>" );
  });
}

function loadTags(labels) {
  $.ajax({
    url: "/p/tags/get",
    data: {
      format: "json",
      auth_token: "XXXX:XXXX"
    },
    success: function(tags) {
      // console.log(data);
      $.each(tags, function(tag, count) {
        if(isLabel(tag)) {
          addTagToLabels(labels, tag, removeIdCharacters(tag), removeIdCharacters(tag), isPrivate(tag), count);
          //$("#labels").append("<div>" + tag + " (" + count  +")</div>");
        } else {
          //tags[tag] = count;
          //$("#tags").append("<div>" + tag + " (" + count  +")</div>");
        }
      });
      //console.log(labels);
      createTree(labels);
    }
  });
}

// Add a tag to our map of labels. If the tag contains a slash (/), we'll
// try to recursively find a parent to attach it to (or fail and add it anyway)
function addTagToLabels(labels, tag, id, title, private, count) {
  var label = null;

  if (title.indexOf("/") >= 0) {
    // find a label with a title matching the id before the slash (/)
    label = findLabelByTitle(labels, title.slice(0,title.indexOf('/')));

    // Create a new (empty) label
    if(! label) { 
      // We need to create a id for our label. Adding the index of the title
      // and the slash gets us the length of our new tag.
      // e.g. ~Alpha/Bravo/Charlie with a title of Bravo/Charlie = 8 + 4 = 12 (~Alpha/Bravo)
      var indexOfTitle = id.indexOf(title);
      var indexOfSlash = title.indexOf('/');
      var idLength = indexOfTitle+indexOfSlash;
      // TODO: We might need to start with private: private, and then reset if this tag is later found
      // Also setting a blank tag, because, there's no tag yet
      label = {title: cleanTitle( title.slice(0,indexOfSlash) ), 
        id: id.slice(0,idLength), tag: false, private: false, count: 0};
      //console.log(label);
      labels.push(label);
    }

    // if label doesn't have a children node, add it
    if(! label["children"]) {
      label["children"] = [];
      // label["isFolder"] = true;
    }

    // call addTagToLabels again with children and tag after slash (/)
    var remainder = title.slice(title.indexOf('/')+1);
    addTagToLabels(label["children"], tag, id, remainder, private, count);

  } else {
    label = {title: cleanTitle(title), id: id, tag: tag, private: private, count: count};
    if(private) {
      label["addClass"] = "private";
    }
    
    labels.push(label);

  }
}

// Return a label with a title matching `title`, otherwise return `false`
function findLabelByTitle(labels, title) {
  var foundLabel = false;
  title = cleanTitle(title);
  $.each(labels, function(index, label) {
    if(label["title"] === title) {
      foundLabel = label;
      return false; // break out of loop
    }
  });
  return foundLabel;
}

// Clean up the title (replace underscore with spaces)
function cleanTitle(title) {
  return title.replace(/_/g," ");
}

// Remove identification characters at the beginning of a tag (e.g. .~ )
function removeIdCharacters(tag) {
  if(isPrivate(tag)) {
    tag = tag.slice(1);
  }
  if(isLabel(tag)) {
    tag = tag.slice(1);
  }
  return tag;
}

function isLabel(tag) {
  return tag[0] === LABEL_CHAR || (isPrivate(tag) && tag[1] === LABEL_CHAR);
}

function isPrivate(tag) {
  return  tag[0] === PRIVATE_CHAR;
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

  // scroll to the top of the page
  window.scrollTo(0, 0);
}

Backbone.View.prototype.close = function(){
  this.trigger('close');
  $(this).empty();
  this.undelegateEvents();
  this.off();
}

// Display an error message
showError = function(message) {
  $("#error").text(message).show();
}

// Remove an error message
var clearError = function() {
  $("#error").empty().hide();
}

function supports_html5_storage() {
  try {
    return 'localStorage' in window && window['localStorage'] !== null;
  } catch (e) {
    return false;
  }
}
