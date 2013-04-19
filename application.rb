require 'rubygems'
require 'sinatra'
require 'sinatra/reloader' if development?
require 'net/https'
require 'cgi' # for parsing query_string
require 'json' # for parsing update_time
require 'time' # for rfc2822

PINBOARD_URL = "https://api.pinboard.in/v1/"
# UPDATE_PATH = "posts/update"

set :public_folder, 'public'

get '/' do
  send_file File.join(settings.public_folder, 'index.html')
end

# Any request to /p/* gets redirected to Pinboard, but first we fetch the 
# update time to set our last modified date for caching.
get '/p/*' do |path|
  # sleep(1) # for testing ajax loading indicator
  url = PINBOARD_URL + path + "?" + request.query_string
  qs = CGI::parse(request.query_string)
  if qs.nil? || !qs.has_key?("auth_token")
    puts "Missing auth_token"
    return
  else
    # auth_token = qs["auth_token"].first
    # last_modified = fetchUpdateTime(auth_token)

    request = makeRequest(url)

    # # response.headers['Cache-Control'] = 'private, max-age=5' # cache for 5 seconds
    # if last_modified
    #   response.headers['Last-Modified'] = last_modified.rfc2822
    # end
    content_type :json
    status request.code
    body request.body
  end
end

# # Fetch the last time that a user's bookmarks were updated
# def fetchUpdateTime(auth_token)
#   url = PINBOARD_URL + UPDATE_PATH + "?format=json&auth_token=" + auth_token
#   # puts "fetchUpdateTime.url = " + url
#   uptimeTimeJson = makeRequest(url)
#   if uptimeTimeJson
#     json = JSON(uptimeTimeJson)
#     return Time.parse(json["update_time"])
#   else 
#     return nil
#   end
# end

# Make a request to a url and return the body (or nil, if it fails)
def makeRequest(url)
  uri = URI.parse(url)
  http = Net::HTTP.new(uri.host, uri.port)
  http.use_ssl = true
  request = Net::HTTP::Get.new(uri.request_uri)

  #begin
    r = http.request(request)
    return r

  #   if r.code[0].chr == "2" # i.e. 200, 201, etc.
  #     return r.body
  #   else
  #     puts "Bad Request | url=" + url +
  #       " | response.code=" + r.code +
  #       " | response.body=" + r.body
  #     ''
  #   end
  # rescue => e
  #   puts "Failed Request | url=" + url
  #   puts e
  #   ''
  # end
  # return nil
end
