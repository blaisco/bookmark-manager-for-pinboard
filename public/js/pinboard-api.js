var app = app || {};

$(function() {

  app.PinboardApi = function(apiToken) {
    this.HOST = "/p";
    this.POSTS_UPDATE_PATH = "/posts/update";
    this.TAGS_GET_PATH = "/tags/get";
    this.POSTS_ALL_PATH = "/posts/all";

    this.apiToken = apiToken;

    this.callApi = function(path, params, callback) {
      console.log("[callApi] " + path);

      var url = this.HOST + path;

      params.format = "json";
      params.auth_token = this.apiToken;

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
          console.log("[callApi] AJAX Error: " + JSON.stringify(error));

          if(error.statusText == "timeout") {
            callback(false, "A timeout has occurred.");
          } else {
            callback(false, "An unexpected error has occurred.");
          }
        }
      });
    }

    this.postsUpdate = function(callback) {
      this.callApi(this.POSTS_UPDATE_PATH, {}, callback);
    }

    this.tagsGet = function(callback) {
      this.callApi(this.TAGS_GET_PATH, {}, callback);
    }

    this.postsAll = function(callback, tag) {
      var options = {};
      if(tag) {
        options["tag"] = tag;
      }
      this.callApi(this.POSTS_ALL_PATH, options, callback);
    }
  };

});