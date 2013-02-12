var PinboardApi = function(apiToken) {
  this.HOST = "/p";
  this.UPDATE_PATH = "/posts/update";

  this.apiToken = apiToken;

  this.callApi = function(path, params, callback) {

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

  this.posts_update = function(callback) {
    this.callApi(this.UPDATE_PATH, {}, callback);
  }

};