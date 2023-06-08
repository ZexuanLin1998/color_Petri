
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
	int num_features_pre_place = 7;
	vector<string> place_id;
	for (auto place : PlacePointer)
	{
		place_id.push_back(place.second->id);
	}
	
	int num_places = PlacePointer.size();//����������
	int m_goals = m_target.size();//Ŀ���ʶ�ĳ���
	int place_color = 0;
	/*�������ɫ����������*/
	for (auto place : PlacePointer)
	{
		for (auto p_color : place.second->colors)
			place_color++;
	}
	int count = 0;
	auto target = new float[place_color];//Ŀ�곤��
	for (int i = 0;i < place_id.size();i++)
	{
		for (int j = 0;j < place_temp[i].second->colors.size();j++) 
		{	
			target[count++] = place_temp[i].second->m_target[place_temp[i].second->colors[j]];
		}
	}
	count = 0;
	/*����Petri������ʱʱ��ռ�*/
	delays = new float[place_color];
	/*������ʱʱ�����Petri����*/
	for (int i = 0;i < place_id.size();i++)
	{
		for(int j = 0;j < place_temp[i].second->colors.size();j++)
			delays[count++] = place_temp[i].second->delay;
		//cout << delays[i] << " ";
	}
	//cout << endl;
	count = 0;
	/*��������*/
	m_capacity = new float[place_color];
	for (int i = 0;i < place_id.size();i++)
	{
		for(int j=0;j< place_temp[i].second->colors.size();j++)
			m_capacity[count++] = place_temp[i].second->capacity;
		//cout << " m_capacity[" << i << "] =" << m_capacity[i] << " ";
		//cout << endl;
	}
	count = 0;
	/*���������ǰ�ñ�Ǩ����*/
	num_pre_arcs = new float[place_color];
	for (int i = 0;i < place_id.size();i++)
	{
		for (int j = 0;j < place_temp[i].second->colors.size();j++)
		{
			int pre_color_num = 0;
			/*if (PlacePointer[place_id[i]]->place_pre.empty())
				continue;*/
			for (auto pre : place_temp[i].second->place_pre)
			{
				for (auto pre_color : place_temp[i].second->place_pre[pre.first])
				{
					if (pre_color.first == place_temp[i].second->colors[j])
						pre_color_num++;
				}
			}	
			num_pre_arcs[count] = pre_color_num;
			//cout << " num_pre_arcs[" << count << "] =" << num_pre_arcs[count] << endl;
			count++;
		}
	}
	count = 0;
	/*��������ĺ��ñ�Ǩ����*/
	num_pos_arcs = new float[place_color];
	for (int i = 0;i < place_id.size();i++)
	{
		for (int j = 0;j < place_temp[i].second->colors.size();j++)
		{
			int pos_color_num = 0;
			/*if (PlacePointer[place_id[i]]->place_pre.empty())
				continue;*/
			for (auto pos : place_temp[i].second->place_pos)
			{
				for (auto pos_color : place_temp[i].second->place_pos[pos.first])
				{
					if (pos_color.first == place_temp[i].second->colors[j])
						pos_color_num++;
				}
			}
			num_pos_arcs[count] = pos_color_num;
			//cout << " num_pos_arcs[" << count << "] =" << num_pos_arcs[count] << endl;
			count++;
		}
	}
	count = 0;
	//��Ǩ������96*10
	int tran_color = 0;
	for (auto tran : TransitionPointer)
	{
		for (auto t_color : tran.second->colors)
			tran_color++;
	}
	int num_transitions = tran_color;

	float max_delay = 130;
	policy = new Policy(0, place_color, num_transitions, num_features_pre_place, delays, max_delay ,target, m_capacity, num_pre_arcs, num_pos_arcs,ModelPath);
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
			auto p = new Place();
			p->id = place.name.GetString();
			//auto p = new Place(pn, place.name.GetString());
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
								temp1.emplace(make_pair(msg.name.GetString(), it.GetString()));
							}
							continue;
						}
						temp1.emplace(make_pair(msg.name.GetString(), msg.value.GetString()));
					}
					string str(pre.name.GetString());
					p->place_pre.emplace(make_pair(pre.name.GetString(), temp1));
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
								temp1.emplace(make_pair(msg.name.GetString(), it.GetString()));
							}
							continue;
						}
						temp1.emplace(make_pair(msg.name.GetString(), msg.value.GetString()));
					}
					p->place_pos.emplace(make_pair(pos.name.GetString(), temp1));
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
			pn.place_temp.push_back(make_pair(place.name.GetString(), p));
			pn.m_target.emplace(make_pair(p->id, p->m_target));
		}
		/*������PlacePointer��һ��DisableCompare<string>�ṹ������ȡ��map���Զ����򣬲���map�Ĳ�����ͷ�壬��Ҫ������������*/
		for (int i = place_temp.size()-1;i >= 0;i--)
		{
			pn.PlacePointer.emplace(place_temp[i].first, place_temp[i].second);
		}
	}
	/*�ж��ļ��е�transitions�Ƿ���ڡ�*/
	if (document.HasMember("transitions") && document["transitions"].IsObject())
	{
		rapidjson::Value&trans_obj = document["transitions"];
		for (auto&trans : trans_obj.GetObject())
		{
			rapidjson::Value&tran = trans_obj[trans.name];
			auto t = new Transition();
			//auto t = new Transition(pn, trans.name.GetString());
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
								temp1.emplace(make_pair(msg.name.GetString(), itm.GetString()));
							}
							temp1.emplace(make_pair(msg.name.GetString(), msg.value.GetString()));
							continue;
						}
						temp.emplace(make_pair(msg.name.GetString(), msg.value.GetString()));
					}
					t->transition_pre.emplace(make_pair(pre.name.GetString(), temp));
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
								temp1.emplace(make_pair(m2.name.GetString(), itm.GetString()));
							}
							temp1.emplace(make_pair(m2.name.GetString(), m2.value.GetString()));
							continue;
						}
						temp.emplace(make_pair(m2.name.GetString(), m2.value.GetString()));
					}
					t->transition_pos.emplace(make_pair(pos.name.GetString(), temp));
				}
			}
			if (tran.HasMember("colors"))
			{
				rapidjson::Value&it_colors_arry = tran["colors"];
				assert(it_colors_arry.IsArray());
				for (rapidjson::SizeType i = 0;i < it_colors_arry.Size();i++)
					t->colors.push_back(it_colors_arry[i].GetString());
			}
			pn.tran_temp.push_back(make_pair(trans.name.GetString(), t));
		}
		
		/*������TransitionPointer��һ��DisableCompare<string>�ṹ������ȡ��map���Զ����򣬲���map�Ĳ�����ͷ�壬��Ҫ������������*/
		for (int i = tran_temp.size() - 1;i > -1;i--)
		{
			pn.TransitionPointer.emplace(tran_temp[i].first, tran_temp[i].second);
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

