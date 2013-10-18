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
  var TAGS_GET_PATH = "/tags/get";
  var POSTS_ALL_PATH = "/posts/all";

  // We're setting a known key so that we can always retrieve the same data back
  var LOCAL_STORAGE_KEY = "bookmark-manager-for-pinboard";

  // Minimum delay between doing calls to /posts/all (recommended by Pinboard)
  var MIN_DELAY_POSTS_ALL = 5*60*1000;

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
    pinboard.save({
      "apiToken": apiToken
    });
    Api.postsUpdate(handleValidation(callback));
  }

  // TODO: get rid of me
  Api.getLastBookmarkUpdate = function() {
    return pinboard.get("lastBookmarkUpdate");
  }

  // TODO: get rid of me
  Api.getLastPostsAll = function() {
    return pinboard.get("lastPostsAll");
  }

  /**
   * Creating an easy method of reseting the api key. Mainly for debugging.
   */
  Api.destroy = function() {
    pinboard.destroy();
  }

  /**
   * `postsUpdate` gives us the last time a change was made to a user's set of 
   * bookmarks. Since it's lightweight, we also use it for api token validation.
   */
  Api.postsUpdate = function(callback) {
    callApi(POSTS_UPDATE_PATH, {}, callback);
  }

  /**
   * `tagsGet` just gets a list of the user's tags. We're not presently using it 
   * because we can derieve all of the same data from `postsAll`.
   */
  Api.tagsGet = function(callback) {
    callApi(TAGS_GET_PATH, {}, callback);
  }

  /**
   * `postsAll` contains the data for all of a user's bookmarks. It's an 
   * intensive call, so we limit it to no more than once every 5 minutes.
   */
  Api.postsAll = function(callback, tag) {
    var options = {};
    if(tag) {
      options["tag"] = tag;
    }
    callApi(POSTS_ALL_PATH, options, callback);
  }

  /****************************************************************************/

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
        pinboard.save({
          "lastBookmarkUpdate": data.update_time
        });

        callback(true, null);
      } else {
        // clear apiToken
        pinboard.save({
          "apiToken": null
        });

        /* It's possible there could be a different type of error here, but I 
           don't know what that would be yet :) */
        if(data.statusText == "timeout") {
          callback(false, "A timeout has occurred.");
        } else if (data.status == 401) {
          callback(false, "That API token is invalid.");
        } else {
          callback(false, "An unexpected error has occurred.");
        }
      }
    }
  };

  /****************************************************************************/

  /**
   * `callApi` does the ajax call to Pinboard's API. It has a callback that 
   * takes two parameters, a success/failure boolean, and then either the data
   * returned from the call or the error object.
   */
  var callApi = function(path, params, callback) {
    console.debug("[callApi] " + path);

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
      lastBookmarkUpdate: null // last time bookmarks were updated locally
    }
  });

  // Create an instance of our Pinboard model to save api-related data.
  var pinboard = new Pinboard({id: LOCAL_STORAGE_KEY});

  // Retrieving anything from localstorage that we can...
  pinboard.fetch();

});