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
	map<string, Place*>PlacePointer;//������
	map<string, Transition*>TransitionPointer;//��Ǩ��
	vector<string>p_colors;//��������ɫ��
	vector<string>t_colors;//��Ǩ����ɫ��
	float* delays;
	float* m_capacity;
	float* num_pre_arcs;
	float* num_pos_arcs;
	myads::Ads* ads;//����ADS��Ա
	Policy*policy;
	vector<Timers*>timers;
	vector<float>waiting_time;
	map<string, map<string,int>>m_target;
	vector<string>optimalPath = { "t0","t1","t4","t5","t0","t1" };//������Ǩ�ļ�������


	Petri():ads(new myads::Ads),policy(nullptr) { ; }
	void js_toPetri(Petri&pn);//JSONת��Petri��
	void play(Petri&pn);//Petri���Զ��ݻ�
	string stratige();//ִ�и�����Ǩ�ļ�������
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
	float delay;//������ʱʱ��
	string id;//��������
	vector<string> colors;//��ǰ����ӵ�е���ɫ
	map<string, int>token;//��ǰ����ɫ�ı��
	float waiting_time = 0;
	Timers*timer;
	map<string, int>m_target;
	map<string, multimap<string, string>>place_pre;//������ǰ�ñ�Ǩ
	map<string, multimap<string, string>>place_pos;//�����ĺ��ñ�Ǩ
	Place(Petri&pn, string n) :id(n) { pn.PlacePointer.emplace(n, this);timer = new Timers; }
	Place(Petri&pn, string n, map<string, int>token) :id(n), token(token) { timer = new Timers; }
	virtual void low_exc(Petri&pn,string c);//д��ִ�п����ĺ���
	virtual bool judge_alive(Petri&pn, string c);//��ȡ��ǰ�����Ƿ�ִ�����
};
class Transition
{
public:
	string id;//��ǰ��Ǩ����
	vector<string> colors;//��ǰ��Ǩӵ�е���ɫ
	map<string, map<string, string>>transition_pre;//��ǰ��Ǩ��ǰ�ÿ���
	map<string, map<string, string>>transition_pos;//��ǰ��Ǩ�ĺ��ÿ���
	Transition(Petri&pn) { pn.TransitionPointer.emplace(this->id, this); }
	Transition(Petri&pn, string n) :id(n) { pn.TransitionPointer.emplace(n, this); };
	virtual bool is_enable(Petri &pn, string &c);//�ҳ�ʹ�ܱ�Ǩ����
	virtual void fire(Petri &pn, string c);//ִ�б�Ǩ����
};


