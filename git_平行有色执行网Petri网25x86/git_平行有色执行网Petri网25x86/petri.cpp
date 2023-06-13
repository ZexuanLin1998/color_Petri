
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
			/*此处是设定目标标识结果*/
			if (count == 3)
				exit(1);
		}
		if (enable_t.size() == 0)
		{
			cout << "无使能变迁" << endl;
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
	/*取出所有库所的id 类型string*/
	int num_features_pre_place = 25;
	vector<string> place_id;
	for (auto place : PlacePointer)
	{
		place_id.push_back(place.first);
	}
	
	int num_places = PlacePointer.size();//库所的数量
	/*申请Petri网的延时时间空间*/
	delays = new float[num_places];
	/*库所延时时间放入Petri网中*/
	for (int i = 0;i < place_id.size();i++)
	{
		delays[i] = PlacePointer[place_id[i]]->delay;
		//cout << delays[i] << " ";
	}
	cout << endl;

	int m_goals = m_target.size();//目标标识的长度
	auto target = new float*[p_colors.size()];//申请目标标识的空间的行
	//申请目标标识的空间的列
	for (int row = 0;row < p_colors.size();row++)
	{
		target[row] = new float[num_places];
	}
	
	//将目标标识存入
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

	/*输入容量*/
	m_capacity = new float[num_places];
	for (int i = 0;i < place_id.size();i++)
	{
		m_capacity[i] = PlacePointer[place_id[i]]->capacity;
		//cout << " m_capacity[" << i << "] =" << m_capacity[i] << " ";
		//cout << endl;
	}
	
	/*输入库所的前置变迁数量*/
	num_pre_arcs = new float[num_places];
	for (int i = 0;i < place_id.size();i++)
	{
		num_pre_arcs[i] = PlacePointer[place_id[i]]->place_pre.size();
		//cout << " num_pre_arcs[" << i << "] =" << num_pre_arcs[i] << endl;
	}
	
	/*输入库所的后置变迁数量*/
	num_pos_arcs = new float[num_places];
	for (int i = 0;i < place_id.size();i++)
	{
		num_pos_arcs[i] = PlacePointer[place_id[i]]->place_pos.size();
		//cout << " num_pos_arcs[" << i << "] =" << num_pos_arcs[i] << endl;
	}
	
	//变迁的数量96*10
	int num_transitions = TransitionPointer.size()*10;

	float max_delay = 130;
	policy = new Policy(0,num_places, num_transitions, num_features_pre_place, delays, max_delay ,
		target, m_capacity, num_pre_arcs, num_pos_arcs,ModelPath);
	waiting_time.resize(num_places, 0.0);
	timers.resize(num_places, new Timers);
}

/*attention！！ 当GetObject误被windows宏替换  需要在rapidjson中添加#undef GetObject 
				之后还会报错跳转到报错的位置 将语句注释掉 */
void Petri::js_toPetri(Petri& pn) {
	auto file = read_json(class_Place);
	rapidjson::Document document;
	document.Parse(file.c_str());
	if (document.IsNull()) {
		cout << "document is null" << endl;
	}
	//assert(document.IsObject());
	/*判断文件中的places是否存在。*/
	if (document.HasMember("places") && document["places"].IsObject())
	{
		rapidjson::Value&places_obj = document["places"];
		for (auto &place : places_obj.GetObject())
		{
			rapidjson::Value&place_obj = places_obj[place.name];
			auto p = new Place(pn, place.name.GetString());
			/*寻找json文件中的token*/
			rapidjson::Value::ConstMemberIterator it_token = place_obj.FindMember("token");
			if (it_token != place_obj.MemberEnd())
			{
				/*寻找json文件中token的value值*/
				rapidjson::Value&it_token_num = place_obj[it_token->name];
				for (auto &token : it_token_num.GetObject())
				{
					p->token.emplace(token.name.GetString(), token.value.GetInt());
				}
			}
			/*寻找json文件中的preVertx*/
			rapidjson::Value::ConstMemberIterator it_pre = place_obj.FindMember("pre_arcs");
			if (it_pre != place_obj.MemberEnd()) {
				rapidjson::Value&it_pre_num = place_obj[it_pre->name];
				for (auto&pre : it_pre_num.GetObject())
				{
					rapidjson::Value&it_pre_num_msg = it_pre_num[pre.name];
					multimap<string, string>temp1;//临时容器
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
			/*寻找json文件中的postVertx*/
			rapidjson::Value::ConstMemberIterator it_pos = place_obj.FindMember("post_arcs");
			if (it_pos != place_obj.MemberEnd()) {
				rapidjson::Value&it_pos_num = place_obj[it_pos->name];
				for (auto&pos : it_pos_num.GetObject())
				{
					rapidjson::Value&it_pos_num_msg = it_pos_num[pos.name];
					multimap<string, string>temp1;//临时容器
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
			/*寻找json文件中的colors*/
			if (place_obj.HasMember("colors"))
			{
				rapidjson::Value&it_colors_arry = place_obj["colors"];
				assert(it_colors_arry.IsArray());
				for (rapidjson::SizeType i = 0;i < it_colors_arry.Size();i++)
					p->colors.push_back(it_colors_arry[i].GetString());
			}
			/*寻找json文件中的delay*/
			rapidjson::Value::ConstMemberIterator it_delay = place_obj.FindMember("delay");
			if (it_delay!= place_obj.MemberEnd())
			{
				p->delay = it_delay->value.GetFloat();
			}
			/*寻找json文件中的capacity*/
			rapidjson::Value::ConstMemberIterator it_capacity = place_obj.FindMember("capacity");
			if (it_capacity != place_obj.MemberEnd())
			{
				p->capacity = it_capacity->value.GetInt();
			}
			/*寻找json文件中的target*/
			rapidjson::Value::ConstMemberIterator it_target = place_obj.FindMember("target");
			if (it_capacity != place_obj.MemberEnd())
			{
				/*寻找json文件中target的value值*/
				rapidjson::Value&it_target_num = place_obj[it_target->name];
				for (auto &target : it_target_num.GetObject())
				{
					p->m_target.emplace(target.name.GetString(), target.value.GetInt());
				}
			}
			/*将库所中的target依次放入Petri网中*/
			pn.m_target.emplace(make_pair(p->id, p->m_target));
		}
	}
	/*判断文件中的transitions是否存在。*/
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
					map<string, string>temp;//临时容器
					multimap<string, string>temp1;//临时容器
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
					map<string, string>temp;//临时容器
					multimap<string, string>temp1;//临时容器
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
	/*判断文件中的t_colors是否存在。*/
	if (document.HasMember("t_colors"))
	{
		rapidjson::Value&obj = document["t_colors"];
		assert(obj.IsArray());
		for (rapidjson::SizeType i = 0;i < obj.Size();i++)
		{
			pn.t_colors.push_back(obj[i].GetString());
		}
	}
	/*判断文件中的p_colors是否存在。*/
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
	pn.ads->write_value_bool(true, str1.data(), str1.size());//将要执行的库所写入Twincat中
	cout << id << "使能" << "token颜色" << color << endl;
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
	result = pn.ads->read_value_bool(str1.data(), str1.size());//读取当前库所状态
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

