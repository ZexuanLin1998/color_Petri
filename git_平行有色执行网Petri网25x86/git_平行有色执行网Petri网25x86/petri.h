#pragma once
#include"Policy.h"
#include"ads.h"
#include<time.h>
#include<iostream>
#include<vector>
#include<utility>
#include<string>
#include<memory>
#include<map>
#include"read_class_pt.h"

using namespace std;
using namespace rapidjson;
class Place;
class Transition;
class Timers
{
public:
	clock_t begin, end;
	Timers()
	{
		begin = 0;
		end = 0;
	};
	void start()
	{
		begin = clock();
		cout << "begin timer :" << endl;
	};
	double finish()
	{
		end = clock();
		return(double)(end - begin) / CLOCKS_PER_SEC;
	}
};
class Petri {
public:
	int step = 0;
	map<string, Place*>PlacePointer;//库所类
	map<string, Transition*>TransitionPointer;//变迁类
	vector<string>p_colors;//库所的颜色集
	vector<string>t_colors;//变迁的颜色集
	float* delays;
	float* m_capacity;
	float* num_pre_arcs;
	float* num_pos_arcs;
	myads::Ads* ads;//创建ADS成员
	Policy*policy;
	vector<Timers*>timers;
	vector<float>waiting_time;
	map<string, map<string,int>>m_target;
	vector<string>optimalPath = { "t0","t1","t4","t5","t0","t1" };//给定变迁的激发序列


	Petri():ads(new myads::Ads),policy(nullptr) { ; }
	void js_toPetri(Petri&pn);//JSON转化Petri网
	void play(Petri&pn);//Petri网自动演化
	string stratige();//执行给定变迁的激发序列
	void updata_waitingtime(string t,string color);
	void init();
	~Petri()
	{
		delete ads;
		delete policy;
		delete[] delays;
		for (auto &place : PlacePointer)
			delete place.second;
		for (auto &tran : TransitionPointer)
			delete tran.second;
	}
};

class Place 
{
public:
	float capacity = 0;
	float delay;//库所延时时间
	string id;//库所名称
	vector<string> colors;//当前库所拥有的颜色
	map<string, int>token;//当前带颜色的标记
	float waiting_time = 0;
	Timers*timer;
	map<string, int>m_target;
	map<string, multimap<string, string>>place_pre;//库所的前置变迁
	map<string, multimap<string, string>>place_pos;//库所的后置变迁
	Place(Petri&pn, string n) :id(n) { pn.PlacePointer.emplace(n, this);timer = new Timers; }
	Place(Petri&pn, string n, map<string, int>token) :id(n), token(token) { timer = new Timers; }
	virtual void low_exc(Petri&pn,string c);//写入执行库所的函数
	virtual bool judge_alive(Petri&pn, string c);//读取当前库所是否执行完成
};
class Transition
{
public:
	string id;//当前变迁名称
	vector<string> colors;//当前变迁拥有的颜色
	map<string, map<string, string>>transition_pre;//当前变迁的前置库所
	map<string, map<string, string>>transition_pos;//当前变迁的后置库所
	Transition(Petri&pn) { pn.TransitionPointer.emplace(this->id, this); }
	Transition(Petri&pn, string n) :id(n) { pn.TransitionPointer.emplace(n, this); };
	virtual bool is_enable(Petri &pn, string &c);//找出使能变迁函数
	virtual void fire(Petri &pn, string c);//执行变迁激发
};


