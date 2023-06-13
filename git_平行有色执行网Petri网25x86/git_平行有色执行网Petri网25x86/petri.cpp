
#include"petri.h"
#include<stdlib.h>
void Petri::play(Petri&pn)
{	
	while (1)
	{
		vector<string>enable_t;
		for (auto tran : pn.TransitionPointer)
		{
			for (auto color : tran.second->colors)
			{
				if (tran.second->is_enable(pn, color))
				{
					enable_t.push_back(tran.first);
					tran.second->fire(pn, color);
					cout << tran.first << color << ":";
					for (auto place : pn.PlacePointer)
						cout << place.second->token[color] << " ";
					cout << endl;
				}
			}
		}
		int count = 0;
		for (auto place : pn.PlacePointer)
		{
			for (auto color : place.second->colors)
			{
				//auto w = pn.goal_m[p.first];
				if (pn.m_target[place.first].size() ==0)
					continue;
				if (place.second->token[color] == pn.m_target[place.first].at(color))
					count++;
			}
			/*�˴����趨Ŀ���ʶ���*/
			if (count == 3)
				exit(1);
		}
		if (enable_t.size() == 0)
		{
			cout << "��ʹ�ܱ�Ǩ" << endl;
			exit(1);
		}
		enable_t.clear();
	}	
}

string Petri::stratige()
{
	if (step > optimalPath.size())
		step = 0;
	return this->optimalPath[step++];
}

void Petri::updata_waitingtime(string t,string color)
{
	auto tran = TransitionPointer[t];
	int need_waitingtime = 0;
	for (auto &place : tran->transition_pre)
	{
		if (PlacePointer[place.first]->delay != 0)
		{
			PlacePointer[place.first]->timer->begin = 0;
			PlacePointer[place.first]->timer->end = 0;
		}
	}
	for (auto&place : tran->transition_pos)
	{
		if (PlacePointer[place.first]->delay != 0)
			PlacePointer[place.first]->timer->begin = 0;
	}
}

void Petri::init()
{
	/*ȡ�����п�����id ����string*/
	int num_features_pre_place = 25;
	vector<string> place_id;
	for (auto place : PlacePointer)
	{
		place_id.push_back(place.first);
	}
	
	int num_places = PlacePointer.size();//����������
	/*����Petri������ʱʱ��ռ�*/
	delays = new float[num_places];
	/*������ʱʱ�����Petri����*/
	for (int i = 0;i < place_id.size();i++)
	{
		delays[i] = PlacePointer[place_id[i]]->delay;
		//cout << delays[i] << " ";
	}
	cout << endl;

	int m_goals = m_target.size();//Ŀ���ʶ�ĳ���
	auto target = new float*[p_colors.size()];//����Ŀ���ʶ�Ŀռ����
	//����Ŀ���ʶ�Ŀռ����
	for (int row = 0;row < p_colors.size();row++)
	{
		target[row] = new float[num_places];
	}
	
	//��Ŀ���ʶ����
	for (int row = 0;row < p_colors.size();row++)
	{
		auto it_place_id = place_id.begin();
		for (int column = 0;column < num_places;column++)
		{
			auto goals = m_target[it_place_id->data()];
			target[row][column] = goals[p_colors[row]];
			//cout << target[row][column] << " ";
			it_place_id++;
		}
		//cout << endl;
		
	}

	/*��������*/
	m_capacity = new float[num_places];
	for (int i = 0;i < place_id.size();i++)
	{
		m_capacity[i] = PlacePointer[place_id[i]]->capacity;
		//cout << " m_capacity[" << i << "] =" << m_capacity[i] << " ";
		//cout << endl;
	}
	
	/*���������ǰ�ñ�Ǩ����*/
	num_pre_arcs = new float[num_places];
	for (int i = 0;i < place_id.size();i++)
	{
		num_pre_arcs[i] = PlacePointer[place_id[i]]->place_pre.size();
		//cout << " num_pre_arcs[" << i << "] =" << num_pre_arcs[i] << endl;
	}
	
	/*��������ĺ��ñ�Ǩ����*/
	num_pos_arcs = new float[num_places];
	for (int i = 0;i < place_id.size();i++)
	{
		num_pos_arcs[i] = PlacePointer[place_id[i]]->place_pos.size();
		//cout << " num_pos_arcs[" << i << "] =" << num_pos_arcs[i] << endl;
	}
	
	//��Ǩ������96*10
	int num_transitions = TransitionPointer.size()*10;

	float max_delay = 130;
	policy = new Policy(0,num_places, num_transitions, num_features_pre_place, delays, max_delay ,
		target, m_capacity, num_pre_arcs, num_pos_arcs,ModelPath);
	waiting_time.resize(num_places, 0.0);
	timers.resize(num_places, new Timers);
}

/*attention���� ��GetObject��windows���滻  ��Ҫ��rapidjson�����#undef GetObject 
				֮�󻹻ᱨ����ת�������λ�� �����ע�͵� */
void Petri::js_toPetri(Petri& pn) {
	auto file = read_json(class_Place);
	rapidjson::Document document;
	document.Parse(file.c_str());
	if (document.IsNull()) {
		cout << "document is null" << endl;
	}
	//assert(document.IsObject());
	/*�ж��ļ��е�places�Ƿ���ڡ�*/
	if (document.HasMember("places") && document["places"].IsObject())
	{
		rapidjson::Value&places_obj = document["places"];
		for (auto &place : places_obj.GetObject())
		{
			rapidjson::Value&place_obj = places_obj[place.name];
			auto p = new Place(pn, place.name.GetString());
			/*Ѱ��json�ļ��е�token*/
			rapidjson::Value::ConstMemberIterator it_token = place_obj.FindMember("token");
			if (it_token != place_obj.MemberEnd())
			{
				/*Ѱ��json�ļ���token��valueֵ*/
				rapidjson::Value&it_token_num = place_obj[it_token->name];
				for (auto &token : it_token_num.GetObject())
				{
					p->token.emplace(token.name.GetString(), token.value.GetInt());
				}
			}
			/*Ѱ��json�ļ��е�preVertx*/
			rapidjson::Value::ConstMemberIterator it_pre = place_obj.FindMember("pre_arcs");
			if (it_pre != place_obj.MemberEnd()) {
				rapidjson::Value&it_pre_num = place_obj[it_pre->name];
				for (auto&pre : it_pre_num.GetObject())
				{
					rapidjson::Value&it_pre_num_msg = it_pre_num[pre.name];
					multimap<string, string>temp1;//��ʱ����
					for (auto&msg : it_pre_num_msg.GetObject())
					{
						if (msg.value.IsArray())
						{
							for (auto&it : msg.value.GetArray())
							{	
								temp1.insert(make_pair(msg.name.GetString(), it.GetString()));
							}
							continue;
						}
						temp1.insert(make_pair(msg.name.GetString(), msg.value.GetString()));
					}
					string str(pre.name.GetString());
					p->place_pre.insert(make_pair(pre.name.GetString(), temp1));
				}
			}
			/*Ѱ��json�ļ��е�postVertx*/
			rapidjson::Value::ConstMemberIterator it_pos = place_obj.FindMember("post_arcs");
			if (it_pos != place_obj.MemberEnd()) {
				rapidjson::Value&it_pos_num = place_obj[it_pos->name];
				for (auto&pos : it_pos_num.GetObject())
				{
					rapidjson::Value&it_pos_num_msg = it_pos_num[pos.name];
					multimap<string, string>temp1;//��ʱ����
					for (auto&msg : it_pos_num_msg.GetObject())
					{
						if (msg.value.IsArray())
						{
							for (auto&it : msg.value.GetArray()) {
								temp1.insert(make_pair(msg.name.GetString(), it.GetString()));
							}
							continue;
						}
						temp1.insert(make_pair(msg.name.GetString(), msg.value.GetString()));
					}
					p->place_pos.insert(make_pair(pos.name.GetString(), temp1));
				}
			}
			/*Ѱ��json�ļ��е�colors*/
			if (place_obj.HasMember("colors"))
			{
				rapidjson::Value&it_colors_arry = place_obj["colors"];
				assert(it_colors_arry.IsArray());
				for (rapidjson::SizeType i = 0;i < it_colors_arry.Size();i++)
					p->colors.push_back(it_colors_arry[i].GetString());
			}
			/*Ѱ��json�ļ��е�delay*/
			rapidjson::Value::ConstMemberIterator it_delay = place_obj.FindMember("delay");
			if (it_delay!= place_obj.MemberEnd())
			{
				p->delay = it_delay->value.GetFloat();
			}
			/*Ѱ��json�ļ��е�capacity*/
			rapidjson::Value::ConstMemberIterator it_capacity = place_obj.FindMember("capacity");
			if (it_capacity != place_obj.MemberEnd())
			{
				p->capacity = it_capacity->value.GetInt();
			}
			/*Ѱ��json�ļ��е�target*/
			rapidjson::Value::ConstMemberIterator it_target = place_obj.FindMember("target");
			if (it_capacity != place_obj.MemberEnd())
			{
				/*Ѱ��json�ļ���target��valueֵ*/
				rapidjson::Value&it_target_num = place_obj[it_target->name];
				for (auto &target : it_target_num.GetObject())
				{
					p->m_target.emplace(target.name.GetString(), target.value.GetInt());
				}
			}
			/*�������е�target���η���Petri����*/
			pn.m_target.emplace(make_pair(p->id, p->m_target));
		}
	}
	/*�ж��ļ��е�transitions�Ƿ���ڡ�*/
	if (document.HasMember("transitions") && document["transitions"].IsObject())
	{
		rapidjson::Value&trans_obj = document["transitions"];
		for (auto&trans : trans_obj.GetObject())
		{
			rapidjson::Value&tran = trans_obj[trans.name];
			auto t = new Transition(pn, trans.name.GetString());
			rapidjson::Value::ConstMemberIterator it_pre = tran.FindMember("pre_arcs");
			if (it_pre != tran.MemberEnd())
			{
				rapidjson::Value&it_pre_num = tran[it_pre->name];
				for (auto&pre : it_pre_num.GetObject())
				{
					rapidjson::Value&it_pre_num_msg = it_pre_num[pre.name];
					map<string, string>temp;//��ʱ����
					multimap<string, string>temp1;//��ʱ����
					for (auto&msg : it_pre_num_msg.GetObject())
					{
						if (msg.value.IsArray())
						{
							for (auto&itm : msg.value.GetArray()) {
								temp1.insert(make_pair(msg.name.GetString(), itm.GetString()));
							}
							temp1.insert(make_pair(msg.name.GetString(), msg.value.GetString()));
							continue;
						}
						temp.insert(make_pair(msg.name.GetString(), msg.value.GetString()));
					}
					t->transition_pre.insert(make_pair(pre.name.GetString(), temp));
				}
			}
			rapidjson::Value::ConstMemberIterator it_pos = tran.FindMember("post_arcs");
			if (it_pos != tran.MemberEnd())
			{
				rapidjson::Value&it_pos_num = tran[it_pos->name];
				for (auto&pos : it_pos_num.GetObject())
				{
					rapidjson::Value&it_pos_num_msg = it_pos_num[pos.name];
					map<string, string>temp;//��ʱ����
					multimap<string, string>temp1;//��ʱ����
					for (auto&m2 : it_pos_num_msg.GetObject())
					{
						if (m2.value.IsArray())
						{
							for (auto&itm : m2.value.GetArray()) {
								temp1.insert(make_pair(m2.name.GetString(), itm.GetString()));
							}
							temp1.insert(make_pair(m2.name.GetString(), m2.value.GetString()));
							continue;
						}
						temp.insert(make_pair(m2.name.GetString(), m2.value.GetString()));
					}
					t->transition_pos.insert(make_pair(pos.name.GetString(), temp));
				}
			}
			if (tran.HasMember("colors"))
			{
				rapidjson::Value&it_colors_arry = tran["colors"];
				assert(it_colors_arry.IsArray());
				for (rapidjson::SizeType i = 0;i < it_colors_arry.Size();i++)
					t->colors.push_back(it_colors_arry[i].GetString());
			}

		}
	}
	/*�ж��ļ��е�t_colors�Ƿ���ڡ�*/
	if (document.HasMember("t_colors"))
	{
		rapidjson::Value&obj = document["t_colors"];
		assert(obj.IsArray());
		for (rapidjson::SizeType i = 0;i < obj.Size();i++)
		{
			pn.t_colors.push_back(obj[i].GetString());
		}
	}
	/*�ж��ļ��е�p_colors�Ƿ���ڡ�*/
	if (document.HasMember("p_colors"))
	{
		rapidjson::Value&obj = document["p_colors"];
		assert(obj.IsArray());
		for (rapidjson::SizeType i = 0;i < obj.Size();i++)
		{
			pn.p_colors.push_back(obj[i].GetString());
		}
	}
}

void Place::low_exc(Petri & pn,string color)
{
	return;
	if (this->delay - 0 < 0.1)
		return;
	string str1 = "MAIN.";
	str1.append(id);
	str1 += color;
	pn.ads->write_value_bool(true, str1.data(), str1.size());//��Ҫִ�еĿ���д��Twincat��
	cout << id << "ʹ��" << "token��ɫ" << color << endl;
	return;

}

bool Place::judge_alive(Petri & pn, string color)
{
	return false;
	if (this->delay - 0 < 0.1)
		return false;
	bool result;
	string str1 = "MAIN.";
	str1.append(id).append(color);
	result = pn.ads->read_value_bool(str1.data(), str1.size());//��ȡ��ǰ����״̬
	return result;
}

bool Transition::is_enable(Petri & pn, string & color)
{
	if (transition_pre.size() == 0)
		return false;
	for (auto place : transition_pre)
	{
		if (pn.PlacePointer[place.first]->token[place.second[color]] <= 0)
			return false;
	}
	return true;
}

void Transition::fire(Petri & pn, string color)
{
	if (is_enable(pn, color))
	{
		for (auto place : transition_pre)
		{
			pn.PlacePointer[place.first]->token[place.second[color]] -= 1;
			if (pn.PlacePointer[place.first]->token[place.second[color]] < 0)
				pn.PlacePointer[place.first]->token[place.second[color]] = 0;
		}
		for (auto place : transition_pos)
		{
			pn.PlacePointer[place.first]->token[place.second[color]] += 1;
		}
	}
}

