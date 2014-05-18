#!/usr/bin/env ruby


# file: wapOSCserver.rb
#
# 
# serve osc messages from the touch-osc sample template for testing
# this will eventually be linked with websockets to provide a touchOsc
# hardware interface for web clients
#
#
#
# this version is combined with domain-ping so it does domain requests
# from google and sends data out over web sockets too
#

require 'rubygems'
require 'osc-ruby'
require 'patron'
require 'em-websocket'
require 'json'

#MAX_FREQ = 8000.0
#FREQ_MULT = 20.0
#MAX_GAIN = 10.0
#GAIN_MULT = 0.01

# you can adjust freq_mult and gain_mult here to make the sounds more or less annoying

MAX_FREQ = 8000.0
FREQ_MULT = 70.0
MAX_GAIN = 10.0
GAIN_MULT = 0.4
slider_value = 0.0

#
APIKEY = 'sqhdPxtFo5GXTgyIVE5I4B47LVAcZkxn'   # put your mashape API-KEY here
#

# initialize http: request (patron) 
#
sess = Patron::Session.new
sess.base_url = "https://igor-zachetly-ping-uin.p.mashape.com/pinguin.php"
sess.timeout = 15
sess.headers['X-Mashape-Authorization'] = APIKEY 
sess.enable_debug "./google.debug"

msg_data = 0.0
socket = EM::WebSocket

socket_connected = false;

# initialize OSC
#
@osc_server = OSC::Server.new( 8000 )     # this is where I'm listening
@osc_client = OSC::Client.new( 'localhost', 9000 )  # this is the target, ie a Max patch on this computer


# add methods to server which listens for OSC messages 

# slider value
# can we wild card these?
# @osc_server.add_method '/mod/0/slider/0' do | message |
@osc_server.add_method '/mod/*/*/*' do | message |  
  puts "#{message.ip_address}:#{message.ip_port} -- #{message.address} -- #{message.to_a}"   # for debugging to console
  msg_data = message.to_a[0].to_f
  socket.send("#{message.address} #{msg_data}")
end

# callback for osc message [xping/ n domain] 
# runs http: request with mashape API to get ping data for domain
# send osc message [/time n pingDuration] back to client
#
@osc_server.add_method '/xping' do | message |
  puts "#{message.ip_address}:#{message.ip_port} -- #{message.address} -- #{message.to_a}"   # for debugging to console
  # break out fields
  ndx = message.to_a[0]
  url = message.to_a[1]
  # run http: request
  resp = sess.get("?address=#{url}")
  puts "status: #{resp.status}\n"
  puts resp.body
  # convert to JSON
  js = JSON.parse(resp.body)
  # test result and send osc message to client
  if(js['result'].casecmp("true") == 0)  
     @osc_client.send(OSC::Message.new( "/time", ndx.to_i, js['time'].to_f ))
        ndx = ndx.to_i - 1;
        if(ndx < 10)
          if(ndx < 5) # set freguency 
            freq = js['time'].to_f * FREQ_MULT
            slider_value = freq / MAX_FREQ          
          else 
            gain = js['time'].to_f * GAIN_MULT
            slider_value = gain / (MAX_GAIN + 1)
          end
          if(socket_connected) 
            puts("sending to socket:/mod/#{ndx}/slider/0 #{slider_value} ")
            socket.send("/mod/#{ndx}/slider/0 #{slider_value}")
          end
        end
   else 
     @osc_client.send(OSC::Message.new( "/time", ndx.to_i, 0.0 ))
  
  end
  
end




# fire up the osc server
Thread.new do
  @osc_server.run
end

puts "waiting for Osc messages..."

# ip = '192.168.1.104'
ip = 'localhost'
# now start up websockets server

EM.run {
  EM::WebSocket.run(:host => ip, :port => 1234) do |ws|
    ws.onopen { |handshake|
      puts "WebSocket connection open"
      socket = ws

      # Access properties on the EM::WebSocket::Handshake object, e.g.
      # path, query_string, origin, headers

      # Publish message to the client
      ws.send "Hello Client, you connected to #{handshake.path}"
      socket_connected = true;
    }

    ws.onclose { 
      puts "Connection closed"
      socket_connected = false;            
       }

    ws.onmessage { |msg|
      puts "Recieved message: #{msg}"
      ws.send "Pong: #{msg}"
    }
  end
}


# this program ends will you kill it with ctrl-c
