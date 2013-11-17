/**
 * The Pinboard API module handles all calls to Pinboard's API. It can
 * validate the api token and make calls following Pinboard's API spec. It 
 * stores the api token and timings for certain calls (to prevent overloading
 * the API) in localstorage.
 */
App.module('PinboardApi', function (Api, App, Backbone) {

  /* Constants */
  var HOST = "/p";
  var POSTS_UPDATE_PATH = "/posts/update";
  var POSTS_ALL_PATH = "/posts/all";

  // We're setting a known key so that we can always retrieve the same data back
  var LOCAL_STORAGE_KEY = "bookmark-manager-for-pinboard";

  // Minimum delay between doing calls to /posts/all (recommended by Pinboard)
  var MIN_DELAY_POSTS_ALL = 5*60*1000;
  //var MIN_DELAY_POSTS_ALL = 1*1*1000;

  /****************************************************************************/

  /**
   * `hasValidated` returns true if there's a apiToken that was set
   */
  Api.hasValidated = function() {
    return !(pinboard.get("apiToken") === null);
  }

  /**
   * `validateToken` takes an apiToken and checks with Pinboard to see if it's 
   * valid. It has a callback with two parameters, a success/failure boolean,
   * and then the second parameter is an error message (upon failure).
   */
  Api.validateToken = function(apiToken, callback) {
    pinboard.save({ "apiToken": apiToken });
    postsUpdate(handleValidation(callback));
  }

  /**
   * `getBookmarks` sets off a chain reaction of api calls and callbacks to 
   * get bookmarks, but only if we either (a) we're calling this for the first
   * time, or (b1) we haven't made a this call in the last 5 minutes and 
   * (b2) there are updated bookmarks from Pinboard to fetch 
   */
  Api.getBookmarks = function(callback) {
    var lastCall = pinboard.get("lastPostsAll");
    var now = new Date().valueOf();
    if(lastCall == null) {
      // never called `postsAll` before, do so immediately
      console.debug("calling postsAll immediately");
      postsAll(callback);
    } else if (lastCall + MIN_DELAY_POSTS_ALL < now) {
      console.debug("it's been 5+ minutes, checking for updates");
      postsUpdate(getBookmarksIfUpdated(callback));
    } else {
      console.debug("it's been less than 5 minutes");
      callback(false, null);
    }
  }

  /**
   * `postsUpdate` gives us the last time a change was made to a user's set of 
   * bookmarks. Since it's lightweight, we also use it for api token validation.
   */
  var postsUpdate = function(callback) {
    callApi(POSTS_UPDATE_PATH, {}, callback);
  }

  /**
   * `postsAll` contains the data for all of a user's bookmarks. It's an 
   * expensive call, so we limit it to no more than once every 5 minutes.
   */
  var postsAll = function(callback, tag) {
    var options = {};
    if(tag) {
      options["tag"] = tag;
    }
    callApi(POSTS_ALL_PATH, options, postsAllWrapper(callback));
  }

  /****************************************************************************/

  /**
   * Small wrapper on the `postsAll` callback to update the `lastPostsAll` value
   * upon a successful response.
   */
  var postsAllWrapper = function(callback) {
    return function(success, data) {
      if(success) {
        pinboard.save({ "lastPostsAll": new Date().valueOf() });
      }
      callback(success, data);
    }
  }

  /**
   * Check for updated bookmarks; if there are new ones, do a `postsAll`, 
   * otherwise return immediately.
   */
  var getBookmarksIfUpdated = function(callback) {
    return function(success, data) {
      if(success) {
        var newBookmarkUpdate = data.update_time;
        var lastBookmarkUpdate = pinboard.get("lastBookmarkUpdate");

        // if the times don't match, it's time to update our bookmarks
        if(newBookmarkUpdate != lastBookmarkUpdate) {
          console.debug("there are newer bookmarks; fetching...");
          // save the updated time
          pinboard.save({ "lastBookmarkUpdate": newBookmarkUpdate });
          // and fetch the bookmarks
          postsAll(callback);
        } else {
          console.debug("there are no new bookmarks");
          // The times are the same; nothing to do. Return unsuccessfully but 
          //  with no error message.
          callback(false, null);
        }
      } else {
        callback(false, getErrorMessageFromData(data));
      }
    }
  }

  /**
   * `handleValidation` is called upon receiving a response from Pinboard after
   * `validateToken`. Upon success it populates the date for the last time the 
   * user's bookmarks were altered and does a success callback. Upon failure, 
   * it clears the invalid `apiToken` and does a callback with an error message.
   */
  var handleValidation = function(callback) {
    return function(success, data) {
      if(success) {
        // onwards and upwards!
        pinboard.save({ "lastBookmarkUpdate": data.update_time });

        callback(true, null);
      } else {
        // clear apiToken
        pinboard.save({ "apiToken": null });

        callback(false, getErrorMessageFromData(data));
      }
    }
  };

  var getErrorMessageFromData = function(data) {
    /* It's possible there could be a different type of error here, but I 
       don't know what that would be yet :) */
    if(data.statusText == "timeout") {
      return "A timeout has occurred.";
    } else if (data.status == 401) {
      return "That API token is invalid.";
    } else {
      return "An unexpected error has occurred.";
    }
  }

  /****************************************************************************/

  /**
   * `callApi` does the ajax call to Pinboard's API. It has a callback that 
   * takes two parameters, a success/failure boolean, and then either the data
   * returned from the call or the error object.
   */
  var callApi = function(path, params, callback) {
    console.debug("[callApi] " + path);
    // useful for triggering the display of a loading indicator
    App.vent.trigger("api:call", true);

    var url = HOST + path;

    params.format = "json";
    params.auth_token = pinboard.get("apiToken");

    $.ajax({
      url: url,
      data: params,
      type: "GET",
      cache: false,
      timeout: 15*1000,
      dataType: "json",
      success: function(data) {
        callback(true, data);
      },
      error: function(error) {
        console.error("[callApi] AJAX Error: " + JSON.stringify(error));
        callback(false, error);
      },
      complete: function() {
        App.vent.trigger("api:call", false);
      }
    });
  }

  /****************************************************************************/

  /**
   * The Pinboard model stores the api token and timings for certain api calls.
   */
  var Pinboard = Backbone.Model.extend({

    localStorage: new Backbone.LocalStorage(LOCAL_STORAGE_KEY), 

    defaults: {
      apiToken: null,
      lastPostsAll: null, // so we only do postsAll once every 5 minutes
      lastBookmarkUpdate: null // last time bookmarks were updated on the server
    }
  });

  // Create an instance of our Pinboard model to save api-related data.
  var pinboard = new Pinboard({id: LOCAL_STORAGE_KEY});

  // Retrieving anything from localstorage that we can...
  pinboard.fetch();

});