#include"Policy.h"
#include"WebSocketServer.h"
#include"htime.h"
#include"EventLoop.h"
#include"myWebsocket.h"
#include<iostream>
#include<vector>
#include<string>
#include<utility>
#include"readTxt.h"
#include"petri.h"
#include"read_class_pt.h"
#include<map>


using namespace hv;
using namespace std;

/*当出现错误 C2872 “std”: 不明确的符号
  解决方案:项目-》属性-》c/c++-》语言-》符合模式 改成否
 */
 /*将字符串进行分解 例如:P22 agv 分解str2=P22,str3=agv,str5=22*/
void analysis(string str, string str1, string &str2, string &str3, string str4, string &str5)//解析字符串
{
	string t = "t";
	string p = "p";
	int posLeft = 0;
	int posX = str.find(str1);
	int posRight = -1;
	str2 = str.substr(posLeft, posX);
	if (posX != -1)
	{
		str3 = str.substr(posX + 1, posRight);
	}

	if (str4 == "p")
	{
		posLeft = str.find(str4);
		str5 = str.substr(posLeft + 1, posX - 1);
	}
	if (str4 == "t")
	{
		posLeft = str.find(str4);
		str5 = str.substr(posLeft + 1, posX - 1);
	}

}

int main() {
	Petri  *pn = new Petri;
	map<int, string>Places_id_string_translate_int;
	map<int, string>Trans_id_string_translate_int;
	map<string, int>Places_id_int_translate_string;
	map<string, int>Trans_id_int_translate_string;
	pn->js_toPetri(*pn);//解析json中的文件 分别将信息存放在库所类与变迁类中
	pn->init();
	//pn.play(pn);
	/*将库所、变迁进行扩大成实际的数量*/
	int num_places = 0;
	for (auto place : pn->PlacePointer)
	{

		for (auto color : pn->p_colors)
		{
			string id1;
			string id2;
			//Places_id_string_translate_int是将真实的库所的id与库所的名字进行绑定，例:Places_id_string_translate_int[1]==p0y;
			Places_id_string_translate_int.emplace(make_pair(num_places, id1.append(place.first).append(" ").append(color)));
			//Places_id_int_translate_string是将真实的库所的id与库所的名字进行绑定，例:Places_id_int_translate_string[p0y]==1;
			Places_id_int_translate_string.emplace(make_pair(id2.append(place.first).append(" ").append(color), num_places));
			num_places++;
		}
	}
	num_places = 0;
	int num_trans = 0;
	for (auto tran : pn->TransitionPointer)
	{
		for (auto color : pn->t_colors)
		{
			string id1;
			string id2;
			//将Trans_id_string_translate_int是将真实变迁的id与变迁的名字进行绑定，例:Trans_id_int_translate_string[1]=t0y;
			Trans_id_string_translate_int.emplace(make_pair(num_trans, id1.append(tran.first).append(" ").append(color)));
			//将Trans_id_string_translate_int是将变迁的名字与真实变迁的id进行绑定，例:Trans_id_int_translate_string[t0y]=1;
			Trans_id_int_translate_string.emplace(make_pair(id2.append(tran.first).append(" ").append(color), num_trans));
			num_trans++;
		}
	}

	while (1)
	{
		auto places = pn->PlacePointer;
		auto trans = pn->TransitionPointer;

		for (auto place : places)
		{
			for (auto color : place.second->colors)
			{
				if (place.second->timer != nullptr && place.second->token[color] != 0)
					place.second->delay = place.second->timer->finish();
			}
		}
		/*******************************************/
		int num_enable_transitions = 0;
		for (auto tran : trans)
		{
			for (auto color : tran.second->colors)
			{
				if (tran.second->is_enable(*(pn), color))
					num_enable_transitions++;
			}
		}
		long long* enable_transitions = new long long[num_enable_transitions + 1];
		int count = 0;
		for (auto tran : trans)
		{
			for (auto color : tran.second->colors)
			{
				if (tran.second->is_enable(*(pn), color))
				{
					string t;
					t.append(tran.first).append(" ").append(color);
					enable_transitions[count] = Trans_id_int_translate_string[t];
					count++;
				}
			}
		}
		/*******************************************/
		vector<string>num_nonempty_places;
		//int num_nonempty_places = 0;
		for (auto place : places)
		{
			for (auto color : place.second->colors)
			{
				if (place.second->token[color] != 0)
					num_nonempty_places.push_back(place.first);
			}
		}
		long long* nonempty_places = new long long[num_nonempty_places.size() + 1];
		long long* real_nonempty_places = new long long[num_nonempty_places.size() + 1];
		float** markings = new float*[pn->p_colors.size()];
		for (int row = 0;row < pn->p_colors.size();row++)
		{
			markings[row] = new float[pn->PlacePointer.size()];
		}

		float* waiting_times = new float[num_nonempty_places.size() + 1];


		count = 0;
		for (int i = 0;i < pn->p_colors.size();i++)
		{
			string place_id;
			string place_color;
			string place_num;
			for (auto place : places)
			{
				analysis(place.second->id, " ", place_id, place_color, "p", place_num);
				if (place.second->token[pn->p_colors[i]] != 0)
				{
					real_nonempty_places[count] = Places_id_int_translate_string[place_id.append(" ").append(pn->p_colors[i])];
					nonempty_places[count++] = atoi(place_num.c_str()) - 1;
					markings[i][atoi(place_num.c_str()) - 1] = place.second->token[pn->p_colors[i]];
					//cout << markings[i][atoi(place_num.c_str()) - 1] <<endl;
					//cout << "markings[" << i << "][" << atoi(place_num.c_str()) - 1 << "]" << place.second->token[pn->p_colors[i]] << endl;
				}
				else
				{
					markings[i][atoi(place_num.c_str()) - 1] = 0;
				}
			}
		}
		/*for (int i = 0;i < 10;i++)
		{
			for (int j = 0;j < pn->PlacePointer.size();j++)
			{
				cout << markings[i][j] << " ";
			}
			cout << endl;
		}*/
		for (int i = 0;i != num_nonempty_places.size();i++)
		{
			//cout << Places_id_string_translate_int[real_nonempty_places[i]] << endl;
			string place_id;
			string str2;
			string str3;
			//cout << num_nonempty_places[i] << endl;
			analysis(Places_id_string_translate_int[real_nonempty_places[i]], " ", place_id, str2, " ", str3);
			//cout << place_id << endl;
			waiting_times[i] = places[place_id]->waiting_time;
			if (waiting_times[i] > places[place_id]->delay)
			{
				waiting_times[i] = places[place_id]->delay;
			}
			//cout << waiting_times[i] << " ";
		}
		auto temp = pn->policy->get_Q(num_enable_transitions, enable_transitions, num_nonempty_places.size(),
			nonempty_places, pn->PlacePointer.size(), markings, waiting_times);
		std::map<float, float>num;
		/*从temp寻找使能变迁*/
		for (int i = 0;i < temp.size();i++)
		{
			string tran_id;
			string tran_color;
			string tran_num;
			analysis(Trans_id_string_translate_int[i], " ", tran_id, tran_color, "t", tran_num);

			if (trans[tran_id]->is_enable(*(pn), tran_color))
			{
				num.insert(make_pair(i, temp[i]));
			}
		}
		/*将找出的使能变迁的Q值进行比较*/
		auto Max_Q = *std::max_element(num.begin(), num.end(), [](const std::pair<float, float>&p1,
			const std::pair<float, float>&p2)
		{ return p1.second < p2.second; });
		num.clear();
		int temp2 = std::find(temp.begin(), temp.end(), Max_Q.second) - temp.begin();
		string next_transition_id;
		string next_transition_color;
		string next_transition_num;
		analysis(Trans_id_string_translate_int[temp2], " ", next_transition_id, next_transition_color, "t", next_transition_num);
		std::cout << "file transition: " << next_transition_id << " " << next_transition_color << "\n";
		if (trans[next_transition_id]->is_enable(*(pn), next_transition_color))
		{
			for (auto place : trans[next_transition_id]->transition_pre)
			{
				while (places[place.first]->judge_alive(*(pn), place.second[next_transition_color]));
			}

			trans[next_transition_id]->fire(*(pn), next_transition_color);
			for (auto place : trans[next_transition_id]->transition_pos)
			{
				cout << "execute " << places[place.first]->id << " " << place.second[next_transition_color] << " ";
				if (places[place.first]->id == "p5")
				{
					int c = 0;
				}
				places[place.first]->low_exc(*(pn), place.second[next_transition_color]);
			}
			cout << endl;
		}

	}
	return 0;
}

