#pragma once
#include"petri.h"
#include"WebSocketServer.h"
#include"EventLoop.h"
class myWebsocket {
public:
	WebSocketService* ws;
	Petri*petri;
	myWebsocket(Petri*pn) :petri(pn), ws(new WebSocketService) {};
private:
	myWebsocket() :petri(nullptr) {};

};
