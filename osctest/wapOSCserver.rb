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

require 'rubygems'
require 'osc-ruby'
# require 'patron'
require 'em-websocket'
require 'json'


msg_data = 0.0
socket = EM::WebSocket

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


# fire up the server
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
    }

    ws.onclose { puts "Connection closed" }

    ws.onmessage { |msg|
      puts "Recieved message: #{msg}"
      ws.send "Pong: #{msg}"
    }
  end
}


# this program ends will you kill it with ctrl-c
