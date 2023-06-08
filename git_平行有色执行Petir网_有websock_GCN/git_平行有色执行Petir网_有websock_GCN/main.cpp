#include"Policy.h"
#include"WebSocketServer.h"
#include"htime.h"
#include"EventLoop.h"
#include"myWebsocket.h"
#include<iostream>
#include<vector>
#include<string>
#include<utility>
//#include"readTxt.h"
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
	//map<int, string, Disablecompare<int>>Places_id_string_translate_int;
	//map<int, string, Disablecompare<int>>Trans_id_string_translate_int;
	//map<string, int, Disablecompare<string>>Places_id_int_translate_string;
	//map<string, int, Disablecompare<string>>Trans_id_int_translate_string;
	vector<pair<int, string>>Places_id_string_translate_int;
	vector<pair<int, string>>Trans_id_string_translate_int;
	vector<pair<string, int>>Places_id_int_translate_string;
	vector<pair<string, int>>Trans_id_int_translate_string;
	pn->js_toPetri(*pn);//解析json中的文件 分别将信息存放在库所类与变迁类中
	//pn->init();
	//pn.play(pn);
	/*将库所、变迁进行扩大成实际的数量*/
	int num_places = 0;
	for (auto place : pn->place_temp)
	{

		for (auto color : place.second->colors)
		{
			string id1;
			string id2;
			//Places_id_string_translate_int是将真实的库所的id与库所的名字进行绑定，例:Places_id_string_translate_int[1]==p0y;
			//Places_id_string_translate_int.emplace(make_pair(num_places, id1.append(place.first).append(" ").append(color))); 
			Places_id_string_translate_int.push_back(make_pair(num_places, id1.append(place.first).append(" ").append(color)));
			//Places_id_int_translate_string是将真实的库所的id与库所的名字进行绑定，例:Places_id_int_translate_string[p0y]==1;
			//Places_id_int_translate_string.emplace(make_pair(id2.append(place.first).append(" ").append(color), num_places));
			Places_id_int_translate_string.push_back(make_pair(id2.append(place.first).append(" ").append(color), num_places));
			num_places++;
		}
	}
	//num_places = 0;
	int num_trans = 0;
	for (auto tran : pn->tran_temp)
	{
		for (auto color : tran.second->colors)
		{
			string id1;
			string id2;
			//将Trans_id_string_translate_int是将真实变迁的id与变迁的名字进行绑定，例:Trans_id_int_translate_string[1]=t0y;
			//Trans_id_string_translate_int.emplace(make_pair(num_trans, id1.append(tran.first).append(" ").append(color)));
			Trans_id_string_translate_int.push_back(make_pair(num_trans, id1.append(tran.first).append(" ").append(color)));
			//将Trans_id_string_translate_int是将变迁的名字与真实变迁的id进行绑定，例:Trans_id_int_translate_string[t0y]=1;
			//Trans_id_int_translate_string.emplace(make_pair(id2.append(tran.first).append(" ").append(color), num_trans));
			Trans_id_int_translate_string.push_back(make_pair(id2.append(tran.first).append(" ").append(color), num_trans));
			num_trans++;
		}
	}

	auto Pre = read_csv(C_pre);
	auto Post = read_csv(C_post);
	auto C_delays = read_csv(C_delay);
	int Pre_row = Pre.size();
	int Pre_column = Pre[0].size();
	int Post_row = Post.size();
	int Post_column = Post[0].size();
	std::vector<vector<vector<int>>>c_stack(4, vector<vector<int>>(612, vector<int>(728, 0)));
	for (int i = 0;i < Pre.size();i++)
	{
		for (int j = 0;j < Pre[0].size();j++)
		{
			if (C_delays[i][0] != 0)
				c_stack[0][i][j] = Pre[i][j];
		}
	}
	for (int i = 0;i < Post.size();i++)
	{
		for (int j = 0;j < Post[0].size();j++)
		{
			if (C_delays[i][0] != 0)
				c_stack[1][i][j] = Post[i][j];
		}
	}
	for (int i = 0;i < Pre.size();i++)
	{
		for (int j = 0;j < Pre[0].size();j++)
		{
			if (C_delays[i][0] == 0)
				c_stack[2][i][j] = Pre[i][j];
		}
	}
	for (int i = 0;i < Post.size();i++)
	{
		for (int j = 0;j < Post[0].size();j++)
		{
			if (C_delays[i][0] == 0)
				c_stack[3][i][j] = Post[i][j];
		}
	}
	torch::Tensor C_stack = torch::zeros({ 4, Pre_row, Pre_column }, torch::kFloat);
	for (int i = 0;i < c_stack.size();i++)
	{
		for (int j = 0;j < c_stack[0].size();j++)
		{
			for (int z = 0;z < c_stack[0][0].size();z++)
			{
				C_stack[i][j][z] = c_stack[i][j][z];
			}
		}
	}
	torch::Tensor C_t_stack = C_stack.transpose(1, 2);
	auto C_stack_0 = read_csv(c_stack0);
	for (int i = 0;i < C_stack_0.size();i++)
	{
		for (int j = 0;j < C_stack_0[0].size();j++)
		{
			if (c_stack[0][i][j] != C_stack_0[i][j])
			{
				exit(1);
			}
		}
	}

	int port = 8080;
	myWebsocket *mws = new myWebsocket(pn);
	mws->ws->ping_interval = 1000000;
	//打开websocket端口
	mws->ws->onopen = [&](const WebSocketChannelPtr&channel, const HttpRequestPtr&req)
	{
		for (auto place : mws->petri->PlacePointer)
		{
			for (auto color : place.second->colors)
			{
				if (mws->petri->PlacePointer[place.second->id]->token[color] != 0 && mws->petri->PlacePointer[place.second->id]->delay != 0)
					mws->petri->PlacePointer[place.second->id]->timer->start();
				mws->petri->PlacePointer[place.second->id]->low_exc(*(mws->petri), color);
			}
		}
		mws->petri->init();
		channel->send("connected!");
		std::cout << "websocket connected!" << std::endl;
	};
	//创建回调函数
	mws->ws->onmessage = [&](const WebSocketChannelPtr&channel, const std::string&msg)
	{
		if (msg == "finish" || msg == "admin:123456")
		{
			auto places = mws->petri->place_temp;
			auto trans = mws->petri->tran_temp;
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
					if (tran.second->is_enable(*(mws->petri), color))
						num_enable_transitions++;
				}
			}
			long long* enable_transitions = new long long[num_enable_transitions + 1];
			int count = 0;
			for (auto tran : trans)
			{
				for (auto color : tran.second->colors)
				{
					if (tran.second->is_enable(*(mws->petri), color))
					{
						string t;
						t.append(tran.first).append(" ").append(color);
						for (int i = 0;i < Trans_id_int_translate_string.size();i++)
						{
							if (t == Trans_id_int_translate_string[i].first)
								enable_transitions[count] = i;
						}
						//cout << "enable_transitions[" << count << "]" << enable_transitions[count] << endl;
						count++;
					}
				}
			}
			count = 0;
			/*******************************************/
			//vector<string>num_nonempty_places;
			int num_nonempty_places = 0;
			for (auto place : places)
			{
				for (auto color : place.second->colors)
				{
					if (place.second->token[color] != 0)
						num_nonempty_places++;
				}
			}
			long long* nonempty_places = new long long[num_nonempty_places + 1];
			//long long* real_nonempty_places = new long long[num_nonempty_places.size() + 1];
			float* markings = new float[num_places + 1];
			float* waiting_times = new float[num_nonempty_places + 1];
			count = 0;
			int mark = 0;
			for (auto place : places)
			{
				string place_id;
				string place_color;
				string place_num;
				for (int i = 0;i < place.second->colors.size();i++)
				{
					analysis(place.second->id, " ", place_id, place_color, "p", place_num);
					if (place.second->token[place.second->colors[i]] != 0)
					{
						string str = place_id.append(" ").append(place.second->colors[i]);
						for (int j = 0;j < Places_id_int_translate_string.size();j++)
						{
							if (str == Places_id_int_translate_string[j].first)
							{
								nonempty_places[count] = j;
								//cout << nonempty_places[count] << endl;
								count++;
							}
						}
						markings[mark] = place.second->token[pn->p_colors[i]];
					}
					else
					{
						markings[mark] = 0;
					}
					//cout << markings[mark] << " ";
					mark++;
				}
			}
			mark = 0;
			count = 0;
			/****************************************************************************************/
			for (int i = 0;i != num_nonempty_places;i++)
			{
				//cout << Places_id_string_translate_int[real_nonempty_places[i]] << endl;
				string place_id;
				string place_color;
				string place_num;
				//cout << nonempty_places[i] << endl;
				//cout << Places_id_string_translate_int[nonempty_places[i] - 1].second << endl;
				analysis(Places_id_string_translate_int[nonempty_places[i] - 1].second, " ", place_id, place_color, "p", place_num);
				//cout << place_id << endl;
				waiting_times[i] = places[atoi(place_num.c_str())].second->waiting_time;
				if (waiting_times[i] > places[atoi(place_num.c_str())].second->delay)
				{
					waiting_times[i] = places[atoi(place_num.c_str())].second->delay;
				}
				//cout << waiting_times[i] << " ";
			}
			/**********************************************************************************/
			auto temp = pn->policy->get_Q(num_enable_transitions, enable_transitions, num_nonempty_places,
				nonempty_places, Places_id_string_translate_int.size(), markings, waiting_times, C_stack, C_t_stack);
			std::vector<pair<float, float>>num;
			/*从temp寻找使能变迁*/
			for (int i = 0;i < temp.size();i++)
			{
				string tran_id;
				string tran_color;
				string tran_num;

				analysis(Trans_id_string_translate_int[i].second, " ", tran_id, tran_color, "t", tran_num);

				if (trans[atoi(tran_num.c_str()) - 1].second->is_enable(*(mws->petri), tran_color))
				{
					num.push_back(make_pair(i, temp[i]));
				}
			}
			/********************************************************************/
			//*将找出的使能变迁的Q值进行比较*/
			auto Max_Q = *std::max_element(num.begin(), num.end(), [](const std::pair<float, float>&p1, const std::pair<float, float>&p2)
			{ return p1.second < p2.second; });
			num.clear();
			int temp2 = std::find(temp.begin(), temp.end(), Max_Q.second) - temp.begin();
			string next_transition_id;
			string next_transition_color;
			string next_transition_num;
			analysis(Trans_id_string_translate_int[temp2].second, " ", next_transition_id, next_transition_color, "t", next_transition_num);
			std::cout << "file transition: " << next_transition_id << " " << next_transition_color << "\n";
			if (trans[atoi(next_transition_num.c_str()) - 1].second->is_enable(*(pn), next_transition_color))
			{

				for (auto place : trans[atoi(next_transition_num.c_str()) - 1].second->transition_pre)
				{
					string place_id;
					string place_color;
					string place_num;
					analysis(place.first, " ", place_id, place_color, "p", place_num);
					while (places[atoi(place_num.c_str()) - 1].second->judge_alive(*(mws->petri), place.second[next_transition_color]));
				}


				for (auto place : trans[atoi(next_transition_num.c_str()) - 1].second->transition_pos)
				{
					string place_id;
					string place_color;
					string place_num;
					analysis(place.first, " ", place_id, place_color, "p", place_num);
					cout << "execute " << places[atoi(place_num.c_str()) - 1].second->id << " " << place.second[next_transition_color] << " ";
					places[atoi(place_num.c_str()) - 1].second->low_exc(*(mws->petri), place.second[next_transition_color]);
				}
				cout << endl;
				string tran_id_num = "t";
				tran_id_num.append(to_string(next_transition_num)).append(",").append(to_string(next_transition_color));
				channel->send(tran_id_num);
				trans[atoi(next_transition_num.c_str()) - 1].second->fire(*(mws->petri), next_transition_color);
				std::cout << std::endl;
			}
			else
			{
				std::cout << next_transition_id << " " << next_transition_color << "不是使能变迁" << std::endl;
			}
			int w = 0;
			int q = 0;
			for (auto place : places)
			{
				for (auto place_color : place.second->colors)
				{
					q++;
					if (place.second->token[place_color] == place.second->m_target[place_color])
						w++;
				}
			}
			if (w == places.size()*q)
				exit(1);
			delete[] enable_transitions;
			delete[] nonempty_places;
			//delete[] real_nonempty_places;
			delete[] markings;
			delete[] waiting_times;
		}
	};

	mws->ws->onclose = [](const WebSocketChannelPtr& channel)
	{
		printf("onclose\n");
	};

	HttpService* router = new HttpService;
	router->GET("*", [](HttpRequest* req, HttpResponse* resp) {
		std::string url = req->url;
		std::cout << url.c_str() << std::endl;
		int pos = url.find_last_of("/");
		auto str = url.substr(pos + 1, url.size() - pos - 1);
		std::cout << "request file :" << str.c_str() << std::endl;
		if (str.size() <= 1)
			return resp->File("4.14.html");
		return resp->File(str.c_str());
	});

	router->POST("*", [](const HttpContextPtr& ctx) {
		Json data = ctx->json();
		std::string file_path = ".\\";
		file_path.append("pn");
		file_path += ".json";
		std::ofstream file(file_path.c_str());
		file << hv::to_string(data);
		file.close();
		std::cout << data["title"] << std::endl;
		return 0;
		//return ctx->send(ctx->body(), ctx->type());
	});


	websocket_server_t* server = new websocket_server_t;
	server->port = port;
	server->ws = mws->ws;
	server->service = router;
	/*std::thread t1(websocket_server_run, server, 1);

	t1.join();*/
	websocket_server_run(server);


	return 0;
}

